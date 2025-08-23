#!/bin/bash

# Namespace variables for easier maintenance
LS_NAMESPACE="ls_0_0_5"

#-----------------
# build
#
echo "------------------------------------------------------------------------------"
echo "Cleaning..."
sozo clean -P sepolia
echo "Building..."
sozo build -P sepolia

#-----------------
# migrate
#
echo ">>> Migrate"
sozo migrate -P sepolia
echo "👍"

#-----------------
# get deployed addresses
#

export MANIFEST_FILE_PATH="./manifest_sepolia.json"

get_contract_address () {
  local TAG=$1
  local RESULT=$(cat $MANIFEST_FILE_PATH | jq -r ".contracts[] | select(.tag == \"$TAG\" ).address")
  if [[ -z "$RESULT" ]]; then
    >&2 echo "get_contract_address($TAG) not found! 👎"
  fi
  echo $RESULT
}

export DEATH_MOUNTAIN_ADDRESS=$(get_contract_address "${LS_NAMESPACE}-game_token_systems")
export GAME_SYSTEM_ADDRESS=$(get_contract_address "${LS_NAMESPACE}-game_systems")
export SETTINGS_SYSTEM_ADDRESS=$(get_contract_address "${LS_NAMESPACE}-settings_systems")

echo "DEATH MOUNTAIN ADDRESS: $DEATH_MOUNTAIN_ADDRESS"
echo "GAME SYSTEMS ADDRESS: $GAME_SYSTEM_ADDRESS"
echo "SETTINGS SYSTEMS ADDRESS: $SETTINGS_SYSTEM_ADDRESS"