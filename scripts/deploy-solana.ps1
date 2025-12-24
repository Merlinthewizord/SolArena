# Deploy Sol Arena Solana Program
# Make sure you've run setup-solana-tools.ps1 first

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Sol Arena - Program Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Solana is installed
if (!(Get-Command solana -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Solana CLI not found!" -ForegroundColor Red
    Write-Host "Please run: .\scripts\setup-solana-tools.ps1" -ForegroundColor Yellow
    exit 1
}

# Check if Anchor is installed
if (!(Get-Command anchor -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Anchor CLI not found!" -ForegroundColor Red
    Write-Host "Please run: .\scripts\setup-solana-tools.ps1" -ForegroundColor Yellow
    exit 1
}

# Select network
Write-Host "Select network for deployment:" -ForegroundColor Yellow
Write-Host "1) Devnet (Free, for testing)"
Write-Host "2) Mainnet (Costs real SOL)"
Write-Host ""
$choice = Read-Host "Enter choice (1 or 2)"

$network = ""
switch ($choice) {
    "1" { $network = "devnet" }
    "2" { $network = "mainnet-beta" }
    default { 
        Write-Host "Invalid choice. Defaulting to devnet." -ForegroundColor Yellow
        $network = "devnet"
    }
}

Write-Host ""
Write-Host "Setting Solana cluster to $network..." -ForegroundColor Green
solana config set --url $network

# Check for wallet
Write-Host ""
Write-Host "Checking for Solana wallet..." -ForegroundColor Green
$walletPath = "$env:USERPROFILE\.config\solana\id.json"

if (!(Test-Path $walletPath)) {
    Write-Host "No wallet found. Creating new wallet..." -ForegroundColor Yellow
    Write-Host "IMPORTANT: Save the seed phrase shown below!" -ForegroundColor Red
    Write-Host ""
    solana-keygen new --outfile $walletPath
    Write-Host ""
}

# Check balance
Write-Host "Checking wallet balance..." -ForegroundColor Green
$balance = solana balance
Write-Host "Current balance: $balance" -ForegroundColor Cyan

if ($network -eq "devnet") {
    Write-Host ""
    Write-Host "Requesting airdrop (devnet only)..." -ForegroundColor Green
    solana airdrop 2
    Start-Sleep -Seconds 2
    $balance = solana balance
    Write-Host "New balance: $balance" -ForegroundColor Cyan
}

# Build program
Write-Host ""
Write-Host "Building Solana program..." -ForegroundColor Green
anchor build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green

# Deploy program
Write-Host ""
Write-Host "Deploying program to $network..." -ForegroundColor Green
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
Write-Host ""

anchor deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Deployment Successful!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Get program ID
Write-Host "Getting Program ID..." -ForegroundColor Green
$programId = anchor keys list | Select-String "sol_arena" | ForEach-Object { $_.ToString().Split(":")[1].Trim() }

Write-Host ""
Write-Host "Your Program ID: $programId" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy the Program ID above"
Write-Host "2. Update lib/solana-program.ts with:"
Write-Host "   const PROGRAM_ID = new PublicKey('$programId');" -ForegroundColor Cyan
Write-Host ""
Write-Host "Network: $network" -ForegroundColor Green
Write-Host "Wallet: $walletPath" -ForegroundColor Green
Write-Host ""
