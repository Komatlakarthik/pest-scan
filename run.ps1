# Start Backend and Frontend in separate windows

Write-Host "🚀 Starting Smart Pest Doctor..." -ForegroundColor Green

# Start Backend in new window
Write-Host "Starting Backend..." -ForegroundColor Yellow
$backendPath = "c:\Users\komat\Documents\copiletcsp\backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🔧 Backend Server' -ForegroundColor Cyan; npm run dev"

# Wait a bit
Start-Sleep -Seconds 2

# Start Frontend in new window
Write-Host "Starting Frontend..." -ForegroundColor Yellow
$frontendPath = "c:\Users\komat\Documents\copiletcsp\frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host '⚛️  Frontend Server' -ForegroundColor Magenta; npm run dev"

Write-Host ""
Write-Host "✅ Services started in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "   Backend:  http://localhost:4000" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔑 Test Login:" -ForegroundColor Cyan
Write-Host "   Phone: +919876543210" -ForegroundColor Yellow
Write-Host "   OTP: 123456" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this window (servers will keep running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
