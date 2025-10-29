import { DefindexSDK, WithdrawParams, SupportedNetworks } from "@defindex/sdk";
import {
  BASE_FEE,
  Keypair,
  Networks,
  Transaction,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { config } from "dotenv";
import { withRateLimit } from "./rate-limiter";

config();

// Get network from environment variable
const network = process.env.NETWORK?.toLowerCase() || "testnet";
const isMainnet = network === "mainnet";

// Map network to Stellar SDK networks and DeFindex SDK supported networks
const stellarNetwork = isMainnet ? Networks.PUBLIC : Networks.TESTNET;
const supportedNetwork = isMainnet
  ? SupportedNetworks.MAINNET
  : SupportedNetworks.TESTNET;

/**
 * Example: Fee Bump Withdraw from Vault
 *
 * This script demonstrates how to withdraw assets from a DeFindex vault
 * using a fee bump transaction. A fee bump transaction allows a sponsor
 * account to pay the transaction fees on behalf of the caller.
 *
 * Key difference from deposit:
 * - Uses withdrawFromVault() instead of depositToVault()
 * - Withdraws specific asset amounts from the vault
 * - Can specify slippage tolerance for the withdrawal
 *
 * Flow:
 * 1. Create an unsigned withdrawal transaction via the Defindex SDK
 * 2. Sign the inner transaction with the caller's keypair
 * 3. Create a fee bump transaction with the sponsor's keypair
 * 4. Sign the fee bump transaction with the sponsor's keypair
 * 5. Submit the fee bump transaction to the network
 */
async function main() {
  console.log(`🌐 Network: ${network.toUpperCase()}`);
  console.log("");
  // Sponsor pays the transaction fees
  const sponsorKeypair = Keypair.fromSecret(
    process.env.SPONSOR_SECRET as string
  );

  // Caller executes the withdraw operation
  const callerKeypair = Keypair.fromSecret(process.env.CALLER_SECRET as string);

  // Initialize Defindex SDK
  const defindexSdk = new DefindexSDK({
    apiKey: process.env.DEFINDEX_API_KEY as string,
    baseUrl: process.env.DEFINDEX_API_URL as string,
  });

  // Vault address to withdraw from
  const vaultAddress = process.env.VAULT_ADDRESS as string;

  // Withdraw parameters
  const withdrawData: WithdrawParams = {
    amounts: [25000000], // Amount to withdraw in stroops (2.5 XLM = 25,000,000 stroops)
    caller: callerKeypair.publicKey(),
    slippageBps: 100, // 1% slippage tolerance (100 basis points)
  };

  console.log("🚀 Starting fee bump withdraw example...");
  console.log("📍 Vault Address:", vaultAddress);
  console.log("👤 Caller:", callerKeypair.publicKey());
  console.log("💰 Sponsor:", sponsorKeypair.publicKey());
  console.log("💵 Amount:", withdrawData.amounts[0], "stroops");
  console.log("📊 Slippage:", withdrawData.slippageBps, "bps (basis points)");
  console.log("");

  // Step 1: Get unsigned withdrawal transaction from Defindex API
  console.log("📝 Getting unsigned withdrawal transaction...");
  const withdrawResponse = await withRateLimit(() =>
    defindexSdk.withdrawFromVault(
      vaultAddress,
      withdrawData,
      supportedNetwork
    )
  );
  console.log("✅ Received XDR from API");
  console.log("");

  // Step 2: Build transaction from XDR and sign with caller
  console.log("✍️  Signing inner transaction with caller...");
  const transaction = TransactionBuilder.fromXDR(
    withdrawResponse.xdr,
    stellarNetwork
  ) as Transaction;
  transaction.sign(callerKeypair);
  console.log("✅ Inner transaction signed");
  console.log("");

  // Step 3: Calculate dynamic fee for fee bump transaction
  // Fee bump must be greater than the inner transaction fee
  console.log("💸 Calculating dynamic fee...");
  const innerTxFee = parseInt(transaction.fee);
  const baseFee = parseInt(BASE_FEE);
  const operationCount = transaction.operations.length;
  const networkMultiplier = 10; // Adjust based on network congestion

  // Fee bump fee must be at least innerTxFee + (baseFee * operations)
  const minFeeBumpFee = innerTxFee + baseFee * operationCount;
  const dynamicFee = Math.max(
    minFeeBumpFee,
    innerTxFee * networkMultiplier
  );

  console.log("   Inner transaction fee:", innerTxFee, "stroops");
  console.log("   Base fee:", baseFee);
  console.log("   Operations:", operationCount);
  console.log("   Network multiplier:", networkMultiplier);
  console.log("   Calculated fee bump fee:", dynamicFee, "stroops");
  console.log("");

  // Step 4: Create and sign fee bump transaction with sponsor
  console.log("🔄 Creating fee bump transaction...");
  const feeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
    sponsorKeypair,
    dynamicFee.toString(),
    transaction,
    stellarNetwork
  );
  feeBumpTx.sign(sponsorKeypair);
  console.log("✅ Fee bump transaction created and signed by sponsor");
  console.log("");

  // Step 5: Get fee bump XDR and submit to network
  const feeBumpXdr = feeBumpTx.toXDR();
  console.log("📡 Submitting fee bump transaction to network...");

  try {
    const response = await withRateLimit(() =>
      defindexSdk.sendTransaction(
        feeBumpXdr,
        supportedNetwork
      )
    );
    console.log("✅ Transaction successful!");
    console.log("📊 Response:", JSON.stringify(response, null, 2));
    console.log("");
    const explorerNetwork = isMainnet ? "public" : "testnet";
    console.log("🔍 View transaction on Stellar Expert:");
    console.log(
      `   https://stellar.expert/explorer/${explorerNetwork}/tx/${response.txHash}`
    );
  } catch (error) {
    console.error("❌ Error sending transaction:", error);
    throw error;
  }
}

main().catch(console.error);
