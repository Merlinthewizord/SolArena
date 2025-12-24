# Setup Solana Development Tools for Windows
# Run this script first if you don't have the tools installed

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Sol Arena - Solana Tools Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Warning: Not running as Administrator. Some installations may fail." -ForegroundColor Yellow
    Write-Host "Consider running PowerShell as Administrator." -ForegroundColor Yellow
    Write-Host ""
}

# Install Rust
Write-Host "Step 1: Installing Rust..." -ForegroundColor Green
if (!(Get-Command rustc -ErrorAction SilentlyContinue)) {
    Write-Host "Downloading Rust installer..."
    Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile "$env:TEMP\rustup-init.exe"
    Start-Process -FilePath "$env:TEMP\rustup-init.exe" -ArgumentList "-y" -Wait
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    Write-Host "Rust installed successfully!" -ForegroundColor Green
} else {
    Write-Host "Rust is already installed." -ForegroundColor Yellow
}

# Install Solana CLI
Write-Host ""
Write-Host "Step 2: Installing Solana CLI..." -ForegroundColor Green
if (!(Get-Command solana -ErrorAction SilentlyContinue)) {
    Write-Host "Downloading Solana CLI..."
    $solanaVersion = "stable"
    Invoke-WebRequest -Uri "https://release.solana.com/v1.18.18/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "$env:TEMP\solana-install-init.exe"
    Start-Process -FilePath "$env:TEMP\solana-install-init.exe" -ArgumentList "v1.18.18" -Wait
    $env:Path += ";$env:USERPROFILE\.local\share\solana\install\active_release\bin"
    [System.Environment]::SetEnvironmentVariable("Path", $env:Path, [System.EnvironmentVariableTarget]::User)
    Write-Host "Solana CLI installed successfully!" -ForegroundColor Green
} else {
    Write-Host "Solana CLI is already installed." -ForegroundColor Yellow
}

# Install Anchor
Write-Host ""
Write-Host "Step 3: Installing Anchor CLI..." -ForegroundColor Green
if (!(Get-Command anchor -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Anchor via Cargo..."
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    avm install latest
    avm use latest
    Write-Host "Anchor CLI installed successfully!" -ForegroundColor Green
} else {
    Write-Host "Anchor CLI is already installed." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Close and reopen PowerShell to refresh environment variables"
Write-Host "2. Run: .\scripts\deploy-solana.ps1"
Write-Host ""
