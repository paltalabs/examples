using Newtonsoft.Json;
using StellarDotnetSdk;
using StellarDotnetSdk.Soroban;
using StellarDotnetSdk.Accounts;
using DeFindex.Sdk.Services;
using StellarDotnetSdk.Responses.SorobanRpc;

public class Example
{
    public static async Task Main(string[] args)
    {

        /* ---------------------------------------------------- Set up project ---------------------------------------------------- */

        // Lets start by defining the network we will be using, set up the soroban server and create a keypair for demonstration
        // As we are funding the account in the demo, we will use the testnet network, set up the horizon server and friendbot
        
        Network.UseTestNetwork();

        var horizonServer = new Server("https://horizon-testnet.stellar.org");
        var friendbot = horizonServer.TestNetFriendBot;

        var sorobanServer = new SorobanServer("https://soroban-testnet.stellar.org/");
        var keyPair = KeyPair.Random();

        var vaultAddress = "CBHREBXNXH2ES2SFIIR576BJJET5NBXSH3DIEJXTT356SFOYCTPBKABA";

        // Fund the account
        try {
            var response = await friendbot.FundAccount(keyPair.AccountId).Execute();
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine(response.Hash);
            Console.ResetColor();
        } catch (Exception ex) {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.Error.WriteLine("Error while funding account: " + ex.Message);
            Console.ResetColor();
        }

        // View account balances
        var account = await horizonServer.Accounts.Account(keyPair.AccountId);
        if(account.Balances[0].BalanceString != "10000.0000000"){
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("Account not funded");
            Console.ResetColor();
        } else {
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("Ok.");
            Console.ResetColor();
        }

        // Create a new instance of a specific vault using defindex-sdk, passing the vault address and the soroban server
        var vaultInstance = new DefindexSdk(vaultAddress, sorobanServer); 
      

        /* --------------------------------------------- Creating deposit transaction --------------------------------------------- */

        // First we need to define the amounts desired and the amounts min
        var amountsDesired = new List<ulong> { 10000000 };
        var amountsMin = new List<ulong> { 10000000 };
        // Then we need to define the account from which the transaction will be sent
        var from = keyPair.AccountId;

        // Create the deposit transaction
        var depositTx = await vaultInstance.CreateDepositTransaction(amountsDesired, amountsMin, from, false);
        // Simulate the transaction to get the estimated: soroban transaction data, soroban authorization and the minimum resource fee
        var simulatedTx = await sorobanServer.SimulateTransaction(depositTx);
        if(simulatedTx.SorobanTransactionData == null || simulatedTx.SorobanAuthorization == null || simulatedTx.MinResourceFee == null){
            Console.WriteLine("Simulated transaction data is null.");
            return;
        }


        /* ------------------------------------------ Set up deposit transaction configs ------------------------------------------ */

        // Add the resource fee, soroban authorization and soroban transaction data to the transaction, then sign the transaction
        depositTx.SetSorobanTransactionData(simulatedTx.SorobanTransactionData);
        depositTx.SetSorobanAuthorization(simulatedTx.SorobanAuthorization);
        depositTx.AddResourceFee(simulatedTx.MinResourceFee.Value + 100000);


        /* ------------------------------------------- Sign & send deposit transaction -------------------------------------------- */

        // Sign the transaction using the account that will transfer the assets
        depositTx.Sign(keyPair);

        // Once signed, send the transaction to the Soroban server
        var submittedTx = await sorobanServer.SendTransaction(depositTx);


        /* --------------------------------------------- Validate deposit transaction --------------------------------------------- */

        // Check the transaction status until it is successful or failed
        GetTransactionResponse? checkedTx = null;
        Console.WriteLine("Checking transaction...");
        while (true)
        {
            checkedTx = await sorobanServer.GetTransaction(submittedTx.Hash);
            if (checkedTx.Status.ToString() == "FAILED" || checkedTx.Status.ToString() == "ERROR")
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"\nTransaction status: {checkedTx.Status}");
                Console.WriteLine($"Transaction hash: {submittedTx.Hash}");
                throw new Exception("Transaction failed.");
            }
            else if (checkedTx.Status.ToString() == "SUCCESS")
            {
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine($"\nTransaction Status: {checkedTx.Status}");
                Console.WriteLine($"Transaction hash: {submittedTx.Hash}");
                Console.ResetColor();
                if (checkedTx.ResultValue == null) throw new Exception("Transaction result value is null.");
                break;
            }
            else
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                var timeout = 50;
                Console.Write($".");
                await Task.Delay(timeout);
            }
        }


        /* ---------------------------------------------- Parse transaction response ---------------------------------------------- */

        // Parse the transaction response
        var parsedtx = vaultInstance.ParseTransactionResponse(checkedTx);

        // Now you can print the results using:
        Console.WriteLine($"Parsed transaction: {JsonConvert.SerializeObject(parsedtx, Formatting.Indented)}");
    }
}
