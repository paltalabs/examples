import  {
  DefindexSDK,
  DepositToVaultParams,
  SupportedNetworks,
} from "@defindex/sdk";
// add on top with your other stellar imports

import {
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
  console.log(`🌐 Network: ${network.toUpperCase()}`);
  console.log("");

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
    amounts: [10], // Amount in stroops (1 XLM = 10,000,000 stroops)
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
    defindexSdk.depositToVault(vaultAddress, depositData, supportedNetwork)
  );
  console.log("📦 Deposit response received");
  console.log("✅ Received XDR from API");
  console.log("");

  
  // Step 2: Build transaction from XDR and sign with caller
  console.log("✍️  Signing inner transaction with caller...");
  const transaction = TransactionBuilder.fromXDR(
    depositResponse.xdr,
    stellarNetwork
  ) as Transaction;
  transaction.sign(callerKeypair);
  console.log("✅ Inner transaction signed");
  console.log("");

  // Step 4: Create and sign fee bump transaction with sponsor
  console.log("🔄 Creating fee bump transaction...");

    
  // The API creates the transaction with a Simulated Resource Fee and a Correct Inclusion Fee.
  // Create the fee bump transaction with at least the same total fee as the original transaction.
  // Ref: https://discord.com/channels/897514728459468821/1432786430739877929/1432786430739877929 
  
  const innerTxFee = parseInt(transaction.fee);

  const feeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
    sponsorKeypair,
    innerTxFee.toString(),
    transaction,
    stellarNetwork
  );

  console.log("🔄 Fee bump transaction created");
  console.log("");

  feeBumpTx.sign(sponsorKeypair);
  console.log("✅ Fee bump transaction created and signed by sponsor");
  console.log("");

  // Step 5: Get fee bump XDR and submit to network
  const feeBumpXdr = feeBumpTx.toXDR();
  console.log("📡 Submitting fee bump transaction to network...");

  try {
    const response = await withRateLimit(() =>
      defindexSdk.sendTransaction(feeBumpXdr, supportedNetwork)
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
