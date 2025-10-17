import * as StellarSdk from '@stellar/stellar-sdk';
import { StellarRouterSdk, InvocationV0 } from '@creit-tech/stellar-router-sdk';

// DeFindex Vault Contract Address
const VAULT_CONTRACT_ID = 'CD4JGS6BB5NZVSNKRNI43GUC6E3OBYLCLBQZJVTZLDVHQ5KDAOHVOIQF';

// Stellar RPC endpoint (mainnet)
const RPC_URL = 'https://soroban-rpc.creit.tech';

/**
 * Helper function to serialize BigInts to strings in JSON
 */
function stringifyWithBigInt(obj) {
  return JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2);
}

/**
 * Main function: Call get_manager(), then report() and lock_fees() atomically
 * 
 * Flow:
 * 1. First simulation: Get the manager address from the vault
 * 2. Second simulation: Execute report() + lock_fees() atomically with manager auth
 */
async function main() {
    console.log('🚀 DeFindex Vault Router V0: Dynamic Manager + Atomic Operations\n');
    console.log('📍 Vault Contract:', VAULT_CONTRACT_ID);
    console.log('🌐 Network: Mainnet');
    console.log('🔗 RPC URL:', RPC_URL);
    console.log('\n' + '='.repeat(80) + '\n');
  
  try {
    // Initialize the SDK
    console.log('📦 Initializing Stellar Router SDK...');
    const sdk = new StellarRouterSdk({ 
      rpcUrl: RPC_URL
    });
    console.log('✅ SDK initialized!\n');
    
    // ========================================================================
    // SIMULATION 1: Get the manager address
    // ========================================================================
    console.log('🔍 SIMULATION 1: Getting vault manager address...');
    console.log('  📞 Calling: get_manager()\n');
    
    const getManagerInvocation = [
      new InvocationV0({
        contract: VAULT_CONTRACT_ID,
        method: 'get_manager',
        args: []
      })
    ];
    
    const managerResult = await sdk.simResult(getManagerInvocation);
    console.log('✅ Manager retrieved:', managerResult[0]);
    
    const MANAGER_ACCOUNT = managerResult[0];
    console.log('👤 Manager Account:', MANAGER_ACCOUNT);
    console.log('\n' + '='.repeat(80) + '\n');
    
    // ========================================================================
    // SIMULATION 2: Atomic report() + lock_fees() with manager authorization
    // ========================================================================
    console.log('🔍 SIMULATION 2: Atomic operations with manager authorization...');
    console.log('📋 Creating atomic invocations using InvocationV0:');
    console.log('  1️⃣ report() - Get strategy performance reports');
    console.log('  2️⃣ lock_fees(None) - Lock fees with manager authorization\n');
    
    // Create invocations using InvocationV0 class
    const invocations = [
      new InvocationV0({
        contract: VAULT_CONTRACT_ID,
        method: 'report',
        args: []
      }),
      new InvocationV0({
        contract: VAULT_CONTRACT_ID,
        method: 'lock_fees',
        args: [StellarSdk.xdr.ScVal.scvVoid()] // None option
      })
    ];
    
    console.log('🎯 Router V0 with Manager Authorization:');
    console.log('  ✓ Atomic execution - both succeed or both fail');
    console.log('  ✓ Single transaction - reduced fees');
    console.log('  ✓ Manager set as both caller and source\n');
    
    console.log('🔄 Executing atomic simulation via Router SDK...');
    console.log('  📝 Using simResult with caller and source options\n');
    
    // Use the SDK's simResult method with caller and source options
    const results = await sdk.simResult(invocations, {
      caller: MANAGER_ACCOUNT,
      source: MANAGER_ACCOUNT
    });
    console.log("🚀 ~ main ~ results:", results)
    
    console.log('✅ ROUTER SIMULATION SUCCESSFUL!\n');
    console.log('🎉 Both functions executed atomically with manager authorization!\n');
    console.log('=' + '='.repeat(80) + '\n');
    
    // Display report() results
    console.log('📊 Result 1: report() (Strategy Performance)\n');
    console.log(stringifyWithBigInt(results[0]));
    
    if (Array.isArray(results[0])) {
      console.log('\n📈 Strategy Analysis:');
      results[0].forEach((report, index) => {
        const gains = BigInt(report.gains_or_losses || 0);
        const balance = BigInt(report.prev_balance || 0);
        const lockedFee = BigInt(report.locked_fee || 0);
        
        console.log(`\n  Strategy ${index + 1}:`);
        console.log(`    Current Balance: ${balance.toLocaleString()} tokens`);
        console.log(`    Gains/Losses: ${gains >= 0 ? '+' : ''}${gains.toLocaleString()} tokens`);
        console.log(`    Locked Fees: ${lockedFee.toLocaleString()} tokens`);
        console.log(`    Performance: ${gains > 0 ? '📈 Profitable' : gains < 0 ? '📉 Loss' : '➖ Break-even'}`);
      });
      
      // Calculate total
      const totalGains = results[0].reduce((sum, report) => 
        sum + BigInt(report.gains_or_losses || 0), 0n);
      console.log(`\n  🎯 Total Gains: ${totalGains >= 0 ? '+' : ''}${totalGains.toLocaleString()} tokens`);
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Display lock_fees() results
    console.log('📊 Result 2: lock_fees(None) (Fee Lock Status)\n');
    console.log(stringifyWithBigInt(results[1]));
    
    if (Array.isArray(results[1])) {
      console.log('\n🔒 Fee Lock Analysis:');
      results[1].forEach((report, index) => {
        const gains = BigInt(report.gains_or_losses || 0);
        const balance = BigInt(report.prev_balance || 0);
        const lockedFee = BigInt(report.locked_fee || 0);
        
        console.log(`\n  Report ${index + 1}:`);
        console.log(`    Previous Balance: ${balance.toLocaleString()} tokens`);
        console.log(`    Gains/Losses: ${gains.toLocaleString()} tokens`);
        console.log(`    Fees Locked: ${lockedFee.toLocaleString()} tokens`);
        console.log(`    Status: ${lockedFee > 0 ? '🔒 Fees Locked' : '🔓 No Fees Locked'}`);
      });
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    console.log('🎊 SUCCESS! All operations completed!\n');
    console.log('📝 Summary:');
    console.log('  ✅ Simulation 1: Retrieved manager address dynamically');
    console.log('  ✅ Simulation 2: Executed report() + lock_fees() atomically');
    console.log('  ✅ Both operations in single atomic transaction');
    console.log('  ✅ Manager authentication provided via options\n');
    console.log('📊 Total Simulations: 2');
    console.log('  1️⃣ get_manager() - Get vault manager');
    console.log('  2️⃣ report() + lock_fees() - Atomic execution\n');
    
    console.log('🔗 Powered by: https://github.com/Creit-Tech/Stellar-Router-SDK');
    console.log('\n🎉 Demo completed successfully!');
    
  } catch (error) {
    console.log("🚀 ~ main ~ error:", error)
    console.error('\n❌ Error occurred:');
    console.error('Message:', error?.message || 'Unknown error');
    
    const errorString = error.toString();
    
    if (errorString.includes('Auth, InvalidAction')) {
      console.log('\n⚠️  Still requires authentication - simulation limitations');
      console.log('\n📋 Note:');
      console.log('  • Setting sourceAccount helps identify the caller');
      console.log('  • But simulation mode cannot actually sign transactions');
      console.log('  • Full execution requires actual signing with manager private key');
      console.log('  • This is expected behavior for security');
      
      // Try to extract report data from error
      const reportMatch = errorString.match(/gains_or_losses: (\d+).*?prev_balance: (\d+)/g);
      if (reportMatch) {
        console.log('\n📊 report() data (from event log):');
        reportMatch.forEach((match, idx) => {
          const gains = match.match(/gains_or_losses: (\d+)/)?.[1];
          const balance = match.match(/prev_balance: (\d+)/)?.[1];
          console.log(`  Strategy ${idx + 1}: Balance ${BigInt(balance || 0).toLocaleString()}, Gains +${BigInt(gains || 0).toLocaleString()}`);
        });
      }
    } else {
      console.error('Full error:', error);
    }
    
    if (error?.stack) {
      console.error('\nStack trace:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
  }
}

// Run the main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

