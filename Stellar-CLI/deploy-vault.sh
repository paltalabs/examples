#!/bin/bash
set -euo pipefail

if ! command -v stellar &> /dev/null; then
    echo "Error: stellar-cli is not installed or not in PATH."
    exit 1
fi

CONFIG_FILE="$(dirname "$0")/configs.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: configs.json file not found."
    exit 1
fi

factory_address=$(jq -r '.factory_address' "$CONFIG_FILE")
emergency_manager=$(jq -r '.roles.emergency_manager' "$CONFIG_FILE")
vault_fee_receiver=$(jq -r '.roles.vault_fee_receiver' "$CONFIG_FILE")
vault_manager=$(jq -r '.roles.manager' "$CONFIG_FILE")
rebalance_manager=$(jq -r '.roles.rebalance_manager' "$CONFIG_FILE")
soroswap_router=$(jq -r '.soroswap_router' "$CONFIG_FILE")
xlm_address=$(jq -r '.assets.xlm' "$CONFIG_FILE")
hodl_strategy=$(jq -r '.strategies.address' "$CONFIG_FILE")
fee_amount=$(jq -r '.vault_fee' "$CONFIG_FILE")
vault_name=$(jq -r '.vault_name' "$CONFIG_FILE")
vault_symbol=$(jq -r '.vault_symbol' "$CONFIG_FILE")
upgradable=$(jq -r '.upgradable' "$CONFIG_FILE")

if [ ! -d "$(dirname "$0")/.stellar/network" ]; then
  stellar network add \
    --rpc-url "https://soroban-testnet.stellar.org" \
    --network-passphrase "Test SDF Network ; September 2015" \
    testnet
fi

stellar network use testnet

keys_output=$(stellar keys ls)

if [[ -z "$keys_output" || "$keys_output" == "No keys found" ]]; then
  echo "no keys found, creating new user"
  stellar keys generate \
   --global \
   user \
   --overwrite \
   --fund true
  keys_output=$(stellar keys ls)
  echo "New user created and funded."
fi

vault_roles=$(jq -n \
  --arg e_manager "$emergency_manager" \
  --arg v_f_receiver "$vault_fee_receiver" \
  --arg manager "$vault_manager" \
  --arg rebalance_manager "$rebalance_manager" \
  '{
    "0": $e_manager,
    "1": $v_f_receiver,
    "2": $manager,
    "3": $rebalance_manager
  }'
)

assets=$(jq -n \
  --arg xlm "$xlm_address" \
  --arg hodl "$hodl_strategy" \
 '[
    {
      "address": $xlm,
      "strategies": 
      [
        {
          "address": $hodl,
          "name": "Hodl XLM",
          "paused": false
        }
      ]
    }
  ]'
)

name_symbol=$(jq -n \
  --arg name "$vault_name" \
  --arg symbol "$vault_symbol" \
  '{
    "name": $name,
    "symbol": $symbol
  }'
)

echo "Deploying vault..."
vault_address=$(stellar contract invoke \
  --quiet \
  --source-account user \
  --id $factory_address \
  -- \
  create_defindex_vault \
  --roles "$vault_roles" \
  --vault_fee $fee_amount \
  --assets "$assets" \
  --soroswap_router $soroswap_router \
  --name_symbol "$name_symbol" \
  --upgradable $upgradable)

printf "\e[1;32m%s\e[0m\n" "🟢 Vault deployed successfully:"
printf "\e[1;33m%s\e[0m\n" "$vault_address"
vault_json=$(jq -n --arg vault_address "$(echo "$vault_address" | tr -d '"')" '{vault_address: $vault_address}')
echo "$vault_json" > "$(dirname "$0")/vault_address.json"
echo "Vault address saved to vault_address.json."
