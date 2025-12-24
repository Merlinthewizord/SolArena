# Solana RPC Setup for Sol Arena

## Current Issue
The team token creation is failing because the `NEXT_PUBLIC_SOLANA_RPC_URL` environment variable is not configured with the Helius RPC endpoint.

## Solution

You need to set the `NEXT_PUBLIC_SOLANA_RPC_URL` environment variable in your Vercel project.

### Step 1: Access Environment Variables in v0

1. Look for the **in-chat sidebar** on the left side of the v0 interface
2. Click on **"Vars"** (Variables section)
3. Find the environment variable `NEXT_PUBLIC_SOLANA_RPC_URL`

### Step 2: Set the Helius RPC URL

Set the value to:
```
https://mainnet.helius-rpc.com/?api-key=e45878a7-25fb-4b1a-9f3f-3ed1d643b319
```

### Step 3: Verify Other Required Variables

Make sure these are also set:
- `NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta`
- `NEXT_PUBLIC_METEORA_DBC_PROGRAM_ID=dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN`
- `NEXT_PUBLIC_DBC_CONFIG_ADDRESS=2HUtAHdaWPZfsq4byuQTCDCF7q7zTfVKX8iFrYL6EJJC`

### Step 4: Redeploy or Refresh

After setting the environment variable, the preview should automatically update. If not:
1. Refresh the page
2. Try creating a team token again

## Why This Is Needed

The public Solana RPC endpoint (`https://api.mainnet-beta.solana.com`) blocks token creation operations with 403 errors to prevent abuse. You need a paid RPC provider like Helius, which provides higher rate limits and allows token creation transactions.

## Testing

Once configured, go to `/teams` and try creating a new team. The token creation should now work and you'll see:
- Transaction signature on Solscan
- Team token mint address
- Bonding curve address (if using DBC)
