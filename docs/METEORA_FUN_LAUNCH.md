# Meteora Fun Launch Integration

This project integrates the [Meteora Invent fun-launch scaffold](https://docs.meteora.ag/developer-guide/invent/scaffolds/fun-launch) for launching team tokens with Dynamic Bonding Curve (DBC) support.

## Overview

The fun-launch scaffold provides a production-ready platform for launching tokens with Meteora's DBC program, featuring:

- **Integrated DBC Support**: Built-in integration with Meteora's bonding curve program
- **Advanced Token Analytics**: Real-time data and search functionalities
- **Trading Interface**: Ready-to-use trading UI with TradingView charts
- **Cloudflare R2 Storage**: For token images and metadata (optional)

## Architecture

Our implementation follows the fun-launch scaffold pattern:

```
lib/meteora/
├── fun-launch-client.ts      # Core DBC token launch logic (fun-launch pattern)
├── team-token-launcher.ts    # High-level launcher with fallback support
├── connection.ts             # Solana connection management
└── dbc-client.ts            # Low-level DBC SDK wrapper
```

## How It Works

### 1. Token Launch Flow

```typescript
// Initialize the launcher
const launcher = new TeamTokenLauncher('mainnet-beta')

// Launch with DBC bonding curve
const result = await launcher.launchToken({
  name: "Team Dragons",
  symbol: "DRAG",
  description: "Esports team token",
  imageUri: "https://...",
  creator: creatorPublicKey,
  useDBCBondingCurve: true
}, signTransaction)
```

### 2. Fun Launch Client

The `FunLaunchClient` implements the core fun-launch scaffold pattern:

```typescript
const funLaunch = new FunLaunchClient({
  rpcUrl: "https://mainnet.helius-rpc.com/?api-key=...",
  poolConfigKey: DBC_CONFIG_ADDRESS
})

const result = await funLaunch.launchToken(metadata, creator, signTransaction)
```

### 3. Automatic Fallback

If DBC launch fails (e.g., config not found, network issues), the system automatically falls back to creating a simple SPL token:

- **Primary**: Launch with Meteora DBC bonding curve
- **Fallback**: Create standard SPL token with metadata

## Configuration

### Required Environment Variables

```env
# Solana Network (mainnet-beta or devnet)
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta

# RPC Endpoint (REQUIRED for mainnet token creation)
# Public endpoints will return 403 errors
NEXT_PUBLIC_SOLANA_RPC_URL=<YOUR_RPC_URL_HERE>

# Meteora DBC Program ID
NEXT_PUBLIC_METEORA_DBC_PROGRAM_ID=dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN

# DBC Pool Config Key (mainnet only)
NEXT_PUBLIC_DBC_CONFIG_ADDRESS=2HUtAHdaWPZfsq4byuQTCDCF7q7zTfVKX8iFrYL6EJJC
```

### Optional: Cloudflare R2 Storage

The fun-launch scaffold supports Cloudflare R2 for storing token images and metadata. To enable:

```env
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_ACCOUNT_ID=your_r2_account_id
R2_BUCKET=your_r2_bucket_name
```

**Note**: Currently, we use direct image URLs. R2 integration can be added for production deployments.

## RPC Provider Setup

The fun-launch scaffold requires a paid RPC provider for token creation on mainnet. Recommended providers:

### 1. Helius (Recommended)
- Free tier available with rate limits
- Sign up: https://helius.dev
- Get your API key from the dashboard
- Set: `NEXT_PUBLIC_SOLANA_RPC_URL=<YOUR_HELIUS_RPC_URL_WITH_API_KEY>`

### 2. QuickNode
- Professional RPC infrastructure
- Sign up: https://quicknode.com
- Create a Solana mainnet endpoint
- Set the provided HTTPS URL

### 3. Triton (RPC Pool)
- High-performance RPC pool
- Sign up: https://rpcpool.com
- Get your endpoint URL
- Set as NEXT_PUBLIC_SOLANA_RPC_URL

## Team Token Creation

### Frontend Flow

1. User fills out team creation form
2. System validates team name and symbol uniqueness
3. Upload or provide logo image URL
4. Click "Create Team" to initiate transaction
5. Phantom wallet prompts for signature
6. Token launches with DBC bonding curve
7. Team data saved to Supabase database

### What Gets Created

When a team token is successfully launched:

- **SPL Token**: New token mint on Solana blockchain
- **DBC Pool**: Bonding curve pool for trading
- **Bonding Curve**: Price discovery mechanism
- **Database Entry**: Team metadata in Supabase
- **Explorer Link**: View transaction on Solscan

### Pool Configuration

The DBC config key (`2HUtAHdaWPZfsq4byuQTCDCF7q7zTfVKX8iFrYL6EJJC`) defines:

- **Initial Price**: Starting token price
- **Migration Cap**: When to graduate to DAMM
- **Fee Structure**: Trading fees and distribution
- **Curve Parameters**: Price curve shape

You can create custom configs on [launch.meteora.ag](https://launch.meteora.ag).

## Advanced Features (Roadmap)

Following the full fun-launch scaffold, these features can be added:

### 1. Real-Time Trading Data
- WebSocket price feeds
- Volume and holder analytics
- Trading history

### 2. Integrated Trading Interface
- TradingView charts
- Buy/sell functionality
- Jupiter swap integration

### 3. Token Analytics Dashboard
- Price charts and trends
- Top holders list
- Trading volume metrics

### 4. Advanced Search
- Filter by game, region, performance
- Sort by market cap, volume
- Real-time updates

## Troubleshooting

### "Pool config not found" Error
- **Cause**: DBC config doesn't exist on the network
- **Solution**: Ensure using mainnet (config is mainnet-only) and verify NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta

### "403 Access Forbidden" Error
- **Cause**: Using public RPC endpoint
- **Solution**: Set NEXT_PUBLIC_SOLANA_RPC_URL to a paid provider (Helius, QuickNode, etc.)

### "Transaction Failed" Errors
- **Cause**: Network congestion, insufficient SOL
- **Solution**: Ensure wallet has ~0.5 SOL for token creation and transaction fees

### Token Created But Not Saved
- **Cause**: Database connection issue
- **Solution**: Check Supabase connection, verify environment variables

## Learn More

- [Meteora Fun Launch Docs](https://docs.meteora.ag/developer-guide/invent/scaffolds/fun-launch)
- [Meteora DBC Overview](https://docs.meteora.ag/overview/products/dbc/what-is-dbc)
- [Meteora Invent Actions](https://docs.meteora.ag/developer-guide/invent/actions)
- [DBC TypeScript SDK](https://docs.meteora.ag/developer-guide/guides/dbc/typescript-sdk)

## Support

For issues with:
- **Sol Arena Platform**: Open an issue in this repository
- **Meteora DBC**: Join [Meteora Discord](https://discord.com/invite/meteora)
- **Fun Launch Scaffold**: Check [Meteora Invent GitHub](https://github.com/MeteoraAg/meteora-invent)
