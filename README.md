# **Examples**

## .NET SDK on `C#`

### Pre-requisites

- [.NET SDK](https://dotnet.microsoft.com/download) installed on your machine.

#### Running the demo

To run the demo application, navigate into the project directory using:

```bash
cd Defindex-Dotnet-SDK
```

Then, run the following command:

```bash
dotnet run
```

---

## Deploy vault with bash

### Pre-requisites

- [`stellar-cli`](https://soroban.stellar.org/docs) (Soroban CLI)  
- [`jq`](https://stedolan.github.io/jq/) (JSON processor)  
- **Bash** (Unix shell)  

### Running the script

1. **Navigate to the `Stellar-CLI` directory:**

   ```bash
   cd Stellar-CLI
   ```

2. **Ensure `configs.json` exists** (see [configuration](#-configuration-file-configsjson)).
3. **Run the script**:

   ```bash
   bash deploy-vault.sh
   ```

4. **Successful output**:

   ```bash
    🟢 Vault deployed successfully:
    <vault_address_here>
    Vault address saved to vault_address.json.
   ```

---

Made with ❤️ by **palta**labs🥑
