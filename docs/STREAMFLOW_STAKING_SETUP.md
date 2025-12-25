# Streamflow Staking Integration Guide

This guide explains how to set up and use the Streamflow Finance Staking SDK for team token staking.

## Overview

Streamflow Finance provides a robust staking protocol on Solana that allows teams to:
- Create staking pools for their team tokens
- Set up reward distribution mechanisms
- Configure stake weights and durations
- Enable users to stake and earn rewards

## Installation

The Streamflow SDK is already added to `package.json`:

```bash
npm install @streamflow/staking
```

## Architecture

### 1. Stake Pool Setup (One-time per team)

When a team token is launched, a corresponding Stake Pool should be created on Streamflow:

**Location:** `lib/streamflow/staking-client.ts`

```typescript
import { StakingClient } from "@streamflow/staking"
import BN from "bn.js"

const client = new StakingClient({
  clusterUrl: process.env.SOLANA_MAINNET_RPC_URL!,
  cluster: "mainnet-beta"
})

// Create stake pool for team token
const { stakePool, txId } = await client.create({
  mint: teamMintAddress,
  nonce: 0,
  maxWeight: new BN(2_000_000_000), // 2x max weight
  minDuration: new BN(86400), // 1 day minimum
  maxDuration: new BN(2592000) // 30 days maximum
}, {
  invoker: teamCreatorWallet
})
```

### 2. Add Reward Pool

After creating the stake pool, add a reward pool for distributing SOL rewards:

```typescript
await client.addRewardPool({
  stakePool: stakePoolAddress,
  mint: NATIVE_SOL_MINT // For SOL rewards
}, {
  invoker: teamCreatorWallet
})
```

### 3. User Staking Flow

**Frontend:** `app/teams/[id]/page.tsx`
**Backend:** `app/api/teams/[teamId]/stake/route.ts` (to be created)

```typescript
// User stakes tokens
const { txId, stakeEntry } = await client.stake({
  stakePool: stakePoolAddress,
  amount: toRawAmount(100, 9), // 100 tokens with 9 decimals
  duration: new BN(86400 * 30), // 30 days
  nonce: 0
}, {
  invoker: userWallet
})

// Save to database
await supabase.from("team_token_stakes").insert({
  team_id: teamId,
  staker_wallet: userWallet.publicKey.toString(),
  amount: 100,
  stake_entry_address: stakeEntry,
  tx_signature: txId,
  duration_seconds: 86400 * 30
})
```

### 4. Claiming Rewards

```typescript
// User claims accumulated rewards
await client.claim({
  stakePool: stakePoolAddress,
  stakeEntry: userStakeEntryAddress
}, {
  invoker: userWallet
})
```

### 5. Unstaking

```typescript
// User unstakes after duration has passed
await client.unstake({
  stakePool: stakePoolAddress,
  stakeEntry: userStakeEntryAddress
}, {
  invoker: userWallet
})
```

## Database Schema

Add these columns to the `teams` table:

```sql
ALTER TABLE teams ADD COLUMN stake_pool_address TEXT;
ALTER TABLE teams ADD COLUMN reward_pool_address TEXT;
```

Add these columns to `team_token_stakes`:

```sql
ALTER TABLE team_token_stakes ADD COLUMN stake_entry_address TEXT;
ALTER TABLE team_token_stakes ADD COLUMN duration_seconds INTEGER;
ALTER TABLE team_token_stakes ADD COLUMN unstake_time TIMESTAMP;
ALTER TABLE team_token_stakes ADD COLUMN tx_signature TEXT;
```

## Implementation Checklist

### Phase 1: Pool Creation (Admin/Team Creator)
- [ ] Create API endpoint: `POST /api/teams/[teamId]/create-stake-pool`
- [ ] Implement stake pool creation in team launch flow
- [ ] Add reward pool creation
- [ ] Store stake pool address in database

### Phase 2: User Staking (Frontend)
- [ ] Complete `handleStake` function in `app/teams/[id]/page.tsx`
- [ ] Import actual Streamflow SDK client
- [ ] Replace placeholder with real stake transaction
- [ ] Add ATA creation for stake mint tokens
- [ ] Handle transaction signing and confirmation

### Phase 3: Rewards Distribution
- [ ] Create admin endpoint to fund reward pools
- [ ] Implement automatic reward distribution on team wins
- [ ] Add claim rewards button to UI
- [ ] Show pending rewards in user dashboard

### Phase 4: Unstaking
- [ ] Add unstake button to UI (disabled if duration not passed)
- [ ] Implement unstake transaction
- [ ] Update database after successful unstake

## Key Considerations

### Weights and Duration
- **maxWeight**: Set to `2_000_000_000` for 2x multiplier
  - Users staking for longer get more weight = more rewards
  - If set to `1_000_000_000`, all stakes have equal weight
  
### Minimum Duration
- Users cannot unstake before `minDuration` has passed
- Recommended: 1-7 days to discourage immediate unstaking

### Reward Pool Funding
- Reward pools must be topped up periodically
- When team wins, transfer prize to reward pool
- Users claim proportionally based on their stake weight

### Associated Token Accounts
- Streamflow creates a `stakeMint` PDA
- Users receive stake tokens representing their position
- These tokens can be used in governance
- Tokens are burned on unstake

## Testing

Test on devnet first:
1. Create a test team token
2. Create stake pool with test parameters
3. Stake small amounts
4. Wait for duration to pass
5. Test claiming and unstaking

## Support

- Streamflow Docs: https://docs.streamflow.finance/en/articles/9680408-staking-sdk
- Discord: Join Streamflow community
- Email: [[email protected]](mailto:[email protected])
