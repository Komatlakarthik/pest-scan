# Smart Pest Doctor - Setup Script for Windows (PowerShell)
# Run this script in PowerShell to set up the development environment

Write-Host "🌾 Smart Pest Doctor - Setup Script" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

# Check if Docker is installed
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is available
if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose is not available. Please install Docker Desktop with Compose support." -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Node.js is not installed. It's recommended for local development." -ForegroundColor Yellow
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green
Write-Host ""

# Setup backend environment
Write-Host "📦 Setting up backend environment..." -ForegroundColor Cyan
Set-Location backend
if (!(Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "✅ Created backend .env file" -ForegroundColor Green
    Write-Host "⚠️  Please edit backend\.env and add your API keys" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  backend\.env already exists, skipping..." -ForegroundColor Yellow
}
Set-Location ..

# Setup frontend environment
Write-Host "📦 Setting up frontend environment..." -ForegroundColor Cyan
Set-Location frontend
if (!(Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "✅ Created frontend .env file" -ForegroundColor Green
    Write-Host "⚠️  Please edit frontend\.env and add your configuration" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  frontend\.env already exists, skipping..." -ForegroundColor Yellow
}
Set-Location ..

Write-Host ""
Write-Host "🐳 Starting Docker containers..." -ForegroundColor Cyan
Set-Location infra
docker-compose up -d

Write-Host ""
Write-Host "⏳ Waiting for MySQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "📊 Running database migrations..." -ForegroundColor Cyan
docker-compose exec -T backend npm run migrate

Write-Host ""
Write-Host "🌱 Seeding database with sample data..." -ForegroundColor Cyan
docker-compose exec -T backend npm run seed

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Smart Pest Doctor is now running:" -ForegroundColor Green
Write-Host ""
Write-Host "   Frontend:  http://localhost:5173"
Write-Host "   Backend:   http://localhost:4000"
Write-Host "   Adminer:   http://localhost:8080"
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Edit backend\.env with your API keys"
Write-Host "   2. Edit frontend\.env with your configuration"
Write-Host "   3. Restart containers: cd infra ; docker-compose restart"
Write-Host ""
Write-Host "📚 Documentation: See README.md for more details"
Write-Host ""

Set-Location ..
