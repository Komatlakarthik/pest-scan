# Smart Pest Doctor - Startup Script
# Run this after Docker Desktop is started

Write-Host "🌾 Smart Pest Doctor - Starting Services..." -ForegroundColor Green
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first!" -ForegroundColor Red
    Write-Host "   Then run this script again." -ForegroundColor Yellow
    pause
    exit 1
}

# Start MySQL container
Write-Host ""
Write-Host "Starting MySQL container..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\infra"
docker-compose up -d mysql

Write-Host ""
Write-Host "Waiting for MySQL to initialize (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check if MySQL is ready
Write-Host "Checking MySQL status..." -ForegroundColor Yellow
$mysqlRunning = docker ps --filter "name=mysql" --format "{{.Names}}"
if ($mysqlRunning) {
    Write-Host "✅ MySQL is running" -ForegroundColor Green
} else {
    Write-Host "❌ MySQL failed to start" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Open a NEW terminal and run:" -ForegroundColor White
Write-Host "      cd c:\Users\komat\Documents\copiletcsp\backend" -ForegroundColor Yellow
Write-Host "      npm run migrate" -ForegroundColor Yellow
Write-Host "      npm run seed" -ForegroundColor Yellow
Write-Host "      npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "   2. Open ANOTHER terminal and run:" -ForegroundColor White
Write-Host "      cd c:\Users\komat\Documents\copiletcsp\frontend" -ForegroundColor Yellow
Write-Host "      npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "   3. Open browser: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Test Login:" -ForegroundColor Cyan
Write-Host "   Phone: +919876543210" -ForegroundColor Yellow
Write-Host "   OTP: 123456" -ForegroundColor Yellow
Write-Host ""

Set-Location $PSScriptRoot
