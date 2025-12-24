#!/bin/bash

# Sol Arena - Solana Program Deployment Script
# This script will build and deploy your Solana escrow program

set -e  # Exit on any error

echo "🚀 Sol Arena - Solana Program Deployment"
echo "========================================"
echo ""

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor CLI not found. Please install it first:"
    echo "   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
    echo "   avm install latest"
    echo "   avm use latest"
    exit 1
fi

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Please install it first:"
    echo "   sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    exit 1
fi

# Prompt for network selection
echo "Select network to deploy to:"
echo "1) Devnet (Free, for testing)"
echo "2) Mainnet (Costs real SOL)"
read -p "Enter choice [1-2]: " network_choice

if [ "$network_choice" = "1" ]; then
    NETWORK="devnet"
    echo "✅ Selected: Devnet"
elif [ "$network_choice" = "2" ]; then
    NETWORK="mainnet-beta"
    echo "✅ Selected: Mainnet"
    read -p "⚠️  This will cost real SOL. Continue? [y/N]: " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Deployment cancelled."
        exit 0
    fi
else
    echo "❌ Invalid choice"
    exit 1
fi

# Configure Solana CLI
echo ""
echo "📡 Configuring Solana CLI for $NETWORK..."
solana config set --url $NETWORK

# Check wallet balance
echo ""
echo "💰 Checking wallet balance..."
BALANCE=$(solana balance | awk '{print $1}')
echo "Current balance: $BALANCE SOL"

if [ "$NETWORK" = "devnet" ]; then
    echo ""
    read -p "Need devnet SOL? Request airdrop? [y/N]: " airdrop
    if [ "$airdrop" = "y" ] || [ "$airdrop" = "Y" ]; then
        echo "🪂 Requesting airdrop..."
        solana airdrop 2
        echo "New balance: $(solana balance)"
    fi
fi

# Build the program
echo ""
echo "🔨 Building Solana program..."
anchor build

# Get the program ID from the build
PROGRAM_ID=$(solana address -k target/deploy/sol_arena-keypair.json)
echo ""
echo "📝 Program ID: $PROGRAM_ID"

# Deploy the program
echo ""
echo "🚀 Deploying program to $NETWORK..."
anchor deploy --provider.cluster $NETWORK

# Verify deployment
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy your Program ID: $PROGRAM_ID"
echo "2. Update lib/solana-program.ts with this Program ID"
echo "3. Replace this line:"
echo "   const PROGRAM_ID = new PublicKey('YOUR_PROGRAM_ID_HERE');"
echo "   with:"
echo "   const PROGRAM_ID = new PublicKey('$PROGRAM_ID');"
echo ""
echo "4. Verify deployment:"
echo "   solana program show $PROGRAM_ID"
echo ""
echo "🎉 Your Sol Arena escrow program is live on $NETWORK!"
