#!/bin/bash

# Smart Pest Doctor - Quick Setup Script
# This script sets up the complete development environment

set -e

echo "🌾 Smart Pest Doctor - Setup Script"
echo "===================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js is not installed. It's recommended for local development.${NC}"
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Setup backend environment
echo "📦 Setting up backend environment..."
cd backend
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Created backend .env file${NC}"
    echo -e "${YELLOW}⚠️  Please edit backend/.env and add your API keys${NC}"
else
    echo -e "${YELLOW}⚠️  backend/.env already exists, skipping...${NC}"
fi
cd ..

# Setup frontend environment
echo "📦 Setting up frontend environment..."
cd frontend
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Created frontend .env file${NC}"
    echo -e "${YELLOW}⚠️  Please edit frontend/.env and add your configuration${NC}"
else
    echo -e "${YELLOW}⚠️  frontend/.env already exists, skipping...${NC}"
fi
cd ..

echo ""
echo "🐳 Starting Docker containers..."
cd infra
docker-compose up -d

echo ""
echo "⏳ Waiting for MySQL to be ready..."
sleep 15

echo ""
echo "📊 Running database migrations..."
docker-compose exec -T backend npm run migrate

echo ""
echo "🌱 Seeding database with sample data..."
docker-compose exec -T backend npm run seed

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "🎉 Smart Pest Doctor is now running:"
echo ""
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:4000"
echo "   Adminer:   http://localhost:8080"
echo ""
echo "📝 Next steps:"
echo "   1. Edit backend/.env with your API keys"
echo "   2. Edit frontend/.env with your configuration"
echo "   3. Restart containers: cd infra && docker-compose restart"
echo ""
echo "📚 Documentation: See README.md for more details"
echo ""
