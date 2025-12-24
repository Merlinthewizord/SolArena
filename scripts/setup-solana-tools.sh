#!/bin/bash

# Sol Arena - Solana Tools Setup Script
# Run this first if you don't have Solana/Anchor tools installed

set -e

echo "🛠️  Sol Arena - Installing Solana Development Tools"
echo "=================================================="
echo ""

# Install Rust
echo "📦 Installing Rust..."
if ! command -v rustc &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
    echo "✅ Rust installed"
else
    echo "✅ Rust already installed"
fi

# Install Solana CLI
echo ""
echo "📦 Installing Solana CLI..."
if ! command -v solana &> /dev/null; then
    sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    echo "✅ Solana CLI installed"
else
    echo "✅ Solana CLI already installed"
fi

# Install Anchor
echo ""
echo "📦 Installing Anchor CLI..."
if ! command -v anchor &> /dev/null; then
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    avm install latest
    avm use latest
    echo "✅ Anchor CLI installed"
else
    echo "✅ Anchor CLI already installed"
fi

# Create new wallet
echo ""
read -p "Create a new Solana wallet? [y/N]: " create_wallet
if [ "$create_wallet" = "y" ] || [ "$create_wallet" = "Y" ]; then
    solana-keygen new --outfile ~/.config/solana/id.json
    echo "✅ Wallet created"
fi

# Setup complete
echo ""
echo "🎉 Setup complete! You can now run the deployment script:"
echo "   chmod +x scripts/deploy-solana.sh"
echo "   ./scripts/deploy-solana.sh"
