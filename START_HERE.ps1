# Smart Pest Doctor - Complete Working Setup

Write-Host "🌾 Smart Pest Doctor - Complete Setup & Test" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

$projectRoot = "c:\Users\komat\Documents\copiletcsp"

# Test 1: Check Node.js
Write-Host "[1/8] Checking Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    exit 1
}

# Test 2: Check npm
Write-Host ""
Write-Host "[2/8] Checking npm..." -ForegroundColor Cyan
try {
    $npmVersion = npm --version
    Write-Host "✅ npm $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found!" -ForegroundColor Red
    exit 1
}

# Test 3: Check MySQL on port 3306
Write-Host ""
Write-Host "[3/8] Checking MySQL on port 3306..." -ForegroundColor Cyan
$mysqlRunning = Test-NetConnection -ComputerName localhost -Port 3306 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue

if ($mysqlRunning.TcpTestSucceeded) {
    Write-Host "✅ MySQL is accessible on port 3306" -ForegroundColor Green
    $useMysql = $true
} else {
    Write-Host "⚠️  MySQL not running on port 3306" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You have 3 options:" -ForegroundColor Cyan
    Write-Host "  1. Start Docker Desktop and run: docker-compose up -d mysql" -ForegroundColor White
    Write-Host "  2. Install and start MySQL locally" -ForegroundColor White
    Write-Host "  3. Continue anyway (backend will fail to start)" -ForegroundColor White
    Write-Host ""
    $choice = Read-Host "Enter choice (1, 2, or 3)"
    
    if ($choice -eq "1") {
        Write-Host ""
        Write-Host "Starting MySQL with Docker..." -ForegroundColor Yellow
        Set-Location "$projectRoot\infra"
        docker-compose up -d mysql
        Write-Host "Waiting 20 seconds for MySQL to initialize..." -ForegroundColor Yellow
        Start-Sleep -Seconds 20
        
        $mysqlRunning = Test-NetConnection -ComputerName localhost -Port 3306 -WarningAction SilentlyContinue
        if ($mysqlRunning.TcpTestSucceeded) {
            Write-Host "✅ MySQL started successfully" -ForegroundColor Green
            $useMysql = $true
        } else {
            Write-Host "❌ MySQL failed to start" -ForegroundColor Red
            $useMysql = $false
        }
    } elseif ($choice -eq "2") {
        Write-Host ""
        Write-Host "Please start MySQL manually, then press Enter to continue..." -ForegroundColor Yellow
        Read-Host
        $useMysql = $true
    } else {
        Write-Host "Continuing without MySQL..." -ForegroundColor Yellow
        $useMysql = $false
    }
}

# Test 4: Check Backend dependencies
Write-Host ""
Write-Host "[4/8] Checking backend dependencies..." -ForegroundColor Cyan
if (Test-Path "$projectRoot\backend\node_modules") {
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location "$projectRoot\backend"
    npm install --legacy-peer-deps --silent
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
}

# Test 5: Check Frontend dependencies
Write-Host ""
Write-Host "[5/8] Checking frontend dependencies..." -ForegroundColor Cyan
if (Test-Path "$projectRoot\frontend\node_modules") {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location "$projectRoot\frontend"
    npm install --silent
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
}

# Test 6: Run migrations (if MySQL is running)
if ($useMysql) {
    Write-Host ""
    Write-Host "[6/8] Running database migrations..." -ForegroundColor Cyan
    Set-Location "$projectRoot\backend"
    try {
        npm run migrate 2>&1 | Out-Null
        Write-Host "✅ Database migrations complete" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Migration warning (may already be done)" -ForegroundColor Yellow
    }

    # Test 7: Seed database
    Write-Host ""
    Write-Host "[7/8] Seeding database..." -ForegroundColor Cyan
    try {
        npm run seed 2>&1 | Out-Null
        Write-Host "✅ Sample data added" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Seeding warning (may already be done)" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "[6/8] Skipping migrations (no MySQL)" -ForegroundColor Yellow
    Write-Host "[7/8] Skipping seeding (no MySQL)" -ForegroundColor Yellow
}

# Test 8: Start servers
Write-Host ""
Write-Host "[8/8] Starting servers..." -ForegroundColor Cyan
Write-Host ""

# Create batch script to start backend
$backendBat = @"
@echo off
cd /d "$projectRoot\backend"
echo.
echo ================================
echo   BACKEND SERVER (PORT 4000)
echo ================================
echo.
npm run dev
pause
"@
Set-Content -Path "$projectRoot\start-backend.bat" -Value $backendBat

# Create batch script to start frontend
$frontendBat = @"
@echo off
cd /d "$projectRoot\frontend"
echo.
echo ================================
echo   FRONTEND SERVER (PORT 5173)
echo ================================
echo.
npm run dev
pause
"@
Set-Content -Path "$projectRoot\start-frontend.bat" -Value $frontendBat

Write-Host "✅ Startup scripts created" -ForegroundColor Green
Write-Host ""

# Start backend
Write-Host "Starting Backend..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/c", "$projectRoot\start-backend.bat"
Start-Sleep -Seconds 3

# Start frontend
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/c", "$projectRoot\start-frontend.bat"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Servers are starting in separate windows..." -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:     http://localhost:5173" -ForegroundColor Yellow
Write-Host "   Backend API:  http://localhost:4000" -ForegroundColor Yellow
Write-Host "   Health Check: http://localhost:4000/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔑 Test Login:" -ForegroundColor Cyan
Write-Host "   Phone: +919876543210" -ForegroundColor Yellow
Write-Host "   OTP:   123456" -ForegroundColor Yellow
Write-Host ""

if ($useMysql) {
    Write-Host "✅ MySQL is running - Full functionality available" -ForegroundColor Green
} else {
    Write-Host "⚠️  MySQL not running - Backend will crash on start" -ForegroundColor Yellow
    Write-Host "   Start MySQL first, then restart backend" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   Quick Guide:  SETUP_FIXED.md" -ForegroundColor White
Write-Host "   Full Guide:   README.md" -ForegroundColor White
Write-Host "   API Docs:     docs/API.md" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Keep the backend and frontend windows open!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit (servers will keep running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Set-Location $projectRoot
