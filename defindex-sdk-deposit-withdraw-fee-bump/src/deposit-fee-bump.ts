import  {
  DefindexSDK,
  DepositToVaultParams,
  SupportedNetworks,
} from "@defindex/sdk";
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

/**
 * Example: Fee Bump Deposit to Vault
 *
 * This script demonstrates how to deposit assets into a DeFindex vault
 * using a fee bump transaction. A fee bump transaction allows a sponsor
 * account to pay the transaction fees on behalf of the caller.
 *
 * Flow:
 * 1. Create an unsigned deposit transaction via the Defindex SDK
 * 2. Sign the inner transaction with the caller's keypair
 * 3. Create a fee bump transaction with the sponsor's keypair
 * 4. Sign the fee bump transaction with the sponsor's keypair
 * 5. Submit the fee bump transaction to the network
 */
async function main() {
  // Sponsor pays the transaction fees
  const sponsorKeypair = Keypair.fromSecret(
    process.env.SPONSOR_SECRET as string
  );

  // Caller executes the deposit operation
  const callerKeypair = Keypair.fromSecret(process.env.CALLER_SECRET as string);

  // Initialize Defindex SDK
  const defindexSdk = new DefindexSDK({
    apiKey: process.env.DEFINDEX_API_KEY as string,
    baseUrl: process.env.DEFINDEX_API_URL as string,
  });

  // Vault address to deposit into
  const vaultAddress = process.env.VAULT_ADDRESS as string;

  // Deposit parameters
  const depositData: DepositToVaultParams = {
    amounts: [50000000], // Amount in stroops (5 XLM = 50,000,000 stroops)
    invest: true, // Auto-invest after deposit
    caller: callerKeypair.publicKey(),
  };

  console.log("🚀 Starting fee bump deposit example...");
  console.log("📍 Vault Address:", vaultAddress);
  console.log("👤 Caller:", callerKeypair.publicKey());
  console.log("💰 Sponsor:", sponsorKeypair.publicKey());
  console.log("💵 Amount:", depositData.amounts[0], "stroops");
  console.log("");

  // Step 1: Get unsigned deposit transaction from Defindex API
  console.log("📝 Getting unsigned deposit transaction...");
  const depositResponse = await withRateLimit(() =>
    defindexSdk.depositToVault(
      vaultAddress,
      depositData,
      SupportedNetworks.TESTNET
    )
  );
  console.log("✅ Received XDR from API");
  console.log("");

  // Step 2: Build transaction from XDR and sign with caller
  console.log("✍️  Signing inner transaction with caller...");
  const transaction = TransactionBuilder.fromXDR(
    depositResponse.xdr,
    Networks.TESTNET
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
    Networks.TESTNET
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
        SupportedNetworks.TESTNET
      )
    );
    console.log("✅ Transaction successful!");
    console.log("📊 Response:", JSON.stringify(response, null, 2));
    console.log("");
    console.log("🔍 View transaction on Stellar Expert:");
    console.log(`   https://stellar.expert/explorer/testnet/tx/${response.txHash}`);
  } catch (error) {
    console.error("❌ Error sending transaction:", error);
    throw error;
  }
}

main().catch(console.error);
