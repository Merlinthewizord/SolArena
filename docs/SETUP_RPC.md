# Setting Up Solana RPC Endpoint

## Why You Need a Custom RPC Endpoint

The public Solana RPC endpoints (`api.mainnet-beta.solana.com`) have strict rate limits and block certain operations, including token creation. You will receive **403 Forbidden** errors when trying to create team tokens without a proper RPC provider.

## Recommended RPC Providers

### 1. Helius (Recommended)
- **Website**: https://helius.dev
- **Free Tier**: Yes (100,000 credits/month)
- **Setup**:
  1. Sign up at https://helius.dev
  2. Create a new project
  3. Copy your API key
  4. Set environment variable:
     ```bash
     NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
     ```

### 2. QuickNode
- **Website**: https://quicknode.com
- **Free Tier**: Limited
- **Setup**:
  1. Sign up at https://quicknode.com
  2. Create a Solana mainnet endpoint
  3. Copy your HTTP endpoint URL
  4. Set environment variable:
     ```bash
     NEXT_PUBLIC_SOLANA_RPC_URL=https://YOUR-ENDPOINT.solana-mainnet.quiknode.pro/YOUR_TOKEN/
     ```

### 3. Alchemy
- **Website**: https://alchemy.com
- **Free Tier**: Yes
- **Setup**:
  1. Sign up at https://alchemy.com
  2. Create a Solana app
  3. Copy your HTTPS endpoint
  4. Set environment variable:
     ```bash
     NEXT_PUBLIC_SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY
     ```

### 4. Triton (RPC Pool)
- **Website**: https://rpcpool.com
- **Free Tier**: Limited
- **Setup**:
  1. Sign up at https://rpcpool.com
  2. Get your endpoint URL
  3. Set environment variable:
     ```bash
     NEXT_PUBLIC_SOLANA_RPC_URL=https://YOUR-ENDPOINT.rpcpool.com/YOUR_TOKEN
     ```

## Configuration

Add the environment variable to your Vercel project:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add `NEXT_PUBLIC_SOLANA_RPC_URL` with your RPC endpoint
4. Redeploy your application

## Troubleshooting

### Still Getting 403 Errors?
- Verify your RPC URL is correct
- Check your API key is valid
- Ensure you haven't exceeded your plan's rate limits
- Try a different RPC provider

### Need Higher Limits?
- Upgrade your RPC provider plan
- Consider running your own Solana RPC node
