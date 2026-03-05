# Complete Setup and Run Script

Write-Host "🌾 Smart Pest Doctor - Complete Setup" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

$projectRoot = "c:\Users\komat\Documents\copiletcsp"

# Step 1: Check Node.js
Write-Host "[1/7] Checking Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 20+ first!" -ForegroundColor Red
    exit 1
}

# Step 2: Check Docker
Write-Host ""
Write-Host "[2/7] Checking Docker..." -ForegroundColor Cyan
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker not found. Will use local MySQL instead." -ForegroundColor Yellow
}

# Step 3: Check if dependencies are installed
Write-Host ""
Write-Host "[3/7] Checking dependencies..." -ForegroundColor Cyan

if (!(Test-Path "$projectRoot\backend\node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location "$projectRoot\backend"
    npm install --legacy-peer-deps
}
Write-Host "✅ Backend dependencies ready" -ForegroundColor Green

if (!(Test-Path "$projectRoot\frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location "$projectRoot\frontend"
    npm install
}
Write-Host "✅ Frontend dependencies ready" -ForegroundColor Green

# Step 4: Check Database
Write-Host ""
Write-Host "[4/7] Setting up database..." -ForegroundColor Cyan

$useDocker = $false
try {
    docker ps | Out-Null
    $useDocker = $true
    Write-Host "✅ Docker is running, will use Docker MySQL" -ForegroundColor Green
    
    # Start MySQL
    Set-Location "$projectRoot\infra"
    docker-compose up -d mysql
    Write-Host "Waiting for MySQL to initialize (20 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 20
    
    Write-Host "✅ MySQL container started" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker not running. Make sure local MySQL is running!" -ForegroundColor Yellow
    Write-Host "   Database: smart_pest_doctor" -ForegroundColor Yellow
    Write-Host "   Update backend/.env with your MySQL credentials" -ForegroundColor Yellow
}

# Step 5: Run migrations
Write-Host ""
Write-Host "[5/7] Running database migrations..." -ForegroundColor Cyan
Set-Location "$projectRoot\backend"
try {
    npm run migrate
    Write-Host "✅ Migrations complete" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Migration failed. Will try again when starting backend." -ForegroundColor Yellow
}

# Step 6: Seed database
Write-Host ""
Write-Host "[6/7] Seeding database with sample data..." -ForegroundColor Cyan
try {
    npm run seed
    Write-Host "✅ Sample data added" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Seeding failed. You can run 'npm run seed' manually later." -ForegroundColor Yellow
}

# Step 7: Start servers
Write-Host ""
Write-Host "[7/7] Starting servers..." -ForegroundColor Cyan
Write-Host ""

# Start Backend
Write-Host "Starting Backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; Write-Host ''; Write-Host '🔧 BACKEND SERVER' -ForegroundColor Cyan; Write-Host '==================' -ForegroundColor Cyan; Write-Host ''; npm run dev"

Start-Sleep -Seconds 5

# Start Frontend
Write-Host "Starting Frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; Write-Host ''; Write-Host '⚛️  FRONTEND SERVER' -ForegroundColor Magenta; Write-Host '===================  ' -ForegroundColor Magenta; Write-Host ''; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Access your app:" -ForegroundColor Cyan
Write-Host "   🌐 Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "   ⚙️  Backend:  http://localhost:4000" -ForegroundColor Yellow
Write-Host "   ❤️  Health:   http://localhost:4000/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔑 Test Credentials:" -ForegroundColor Cyan
Write-Host "   📱 Phone: +919876543210" -ForegroundColor Yellow
Write-Host "   🔐 OTP:   123456" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  Backend and Frontend are running in separate windows." -ForegroundColor Yellow
Write-Host "   Don't close those windows!" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - Quick Start: SETUP_FIXED.md" -ForegroundColor White
Write-Host "   - Full Guide:  README.md" -ForegroundColor White
Write-Host "   - API Docs:    docs/API.md" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this window (servers will keep running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Set-Location $projectRoot
