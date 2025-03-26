# 📊 Defindex Vault Deployment System  

📋 **Table of Contents**  
1. [📜 Overview](#-overview)  
2. [⚙️ Requirements](#️-requirements)  
3. [🚀 How to Run the Script](#-how-to-run-the-script)  
4. [📂 Configuration File (`configs.json`)](#-configuration-file-configsjson)  
   - [Structure & Fields](#structure--fields)  
   - [Example](#example)  
5. [🛠️ Troubleshooting](#️-troubleshooting)  

---

## 📜 Overview  
This project automates the deployment of a **Defindex Vault** on the Stellar testnet using Soroban smart contracts. It includes:  
- **Network setup** for Stellar testnet  
- **Key management** (auto-generates and funds a test account if needed)  
- **Vault deployment** with customizable roles, fees, and strategies  
- **Output** saves the vault address to `vault_address.json`  

---

## ⚙️ Requirements  
- [`stellar-cli`](https://soroban.stellar.org/docs) (Soroban CLI)  
- [`jq`](https://stedolan.github.io/jq/) (JSON processor)  
- **Bash** (Unix shell)  

---

## 🚀 How to Run the Script  
1. **Ensure `configs.json` exists** (see [configuration](#-configuration-file-configsjson)).  
2. **Run the script**:  
   ```bash
   bash deploy-vault.sh
   ```  
3. **Successful output**:  
   ```
   🟢 Vault deployed successfully:  
   <vault_address_here>  
   Vault address saved to vault_address.json.  
   ```  

---

## 📂 Configuration File (`configs.json`)  
### **Structure & Fields**  
| Field                | Type            | Description                                                                 |
|----------------------|-----------------|-----------------------------------------------------------------------------|
| `factory_address`    | `String`        | Factory contract address that deploys the vault.                            |
| `roles`              | `Object`        | **Addresses for vault management**:<br>• `emergency_manager`<br>• `vault_fee_receiver`<br>• `manager`<br>• `rebalance_manager` |  
| `vault_fee`          | `Integer`       | Fee percentage **in BPS (1 BPS = 0.01%)**. Example: `10` = 0.1%, `100` = 1%, `1000` = 10%. |  
| `assets.xlm`         | `String`        | Stellar asset ID for XLM.                                                  |  
| `strategies.address` | `String`        | Contract address of the strategy (e.g., "Hodl XLM").                       |  
| `soroswap_router`    | `String`        | Soroswap router address for swaps.                                         |  
| `vault_name`         | `String`        | Name of the vault (e.g., `"Test Vault"`).                                  |  
| `vault_symbol`       | `String`        | Symbol for vault shares (e.g., `"DFXPV"`).                                 |  
| `upgradable`         | `Boolean`       | Set `true` to allow upgrades, `false` for immutable contracts.             |  

### **Example**  
```json
{
  "factory_address": "CCU...NHE",
  "roles": {
    "emergency_manager": "GCA...UDL",
    "vault_fee_receiver": "GCA...UDL",
    "manager": "GCA...UDL",
    "rebalance_manager": "GCA...UDL"
  },
  "vault_fee": 10,
  "assets": {
    "xlm": "CDL...YSC"
  },
  "strategies": {
    "address": "CD5...624",
    "name": "Hodl XLM",
    "paused": false
  },
  "soroswap_router": "CAC...UVD",
  "vault_name": "Test Vault",
  "vault_symbol": "DFXPV",
  "upgradable": true
}
```

---

## 🛠️ Troubleshooting  
| Error Message                          | Solution                                                                 |
|----------------------------------------|--------------------------------------------------------------------------|
| `stellar-cli is not installed`         | Install [Soroban CLI](https://soroban.stellar.org/docs/getting-started). |
| `configs.json file not found`          | Ensure the file exists in the same directory as the script.              |
| Network errors                         | Check internet connection or Stellar testnet status.                     |  

--- 

** Made with ❤️ by PaltaLabs🥑 **