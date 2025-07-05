#!/bin/bash

# DTTP AI Search Server - Production Deployment Script
# This script will set up and deploy the DTTP backend server in production mode

set -e  # Exit on any error

echo "🚀 Starting DTTP AI Search Server Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Checking environment configuration..."

# Check if production environment file exists
if [ ! -f ".env.prod" ]; then
    print_warning "Production environment file not found. Creating from template..."
    cp .env.example .env.prod
    print_warning "⚠️  IMPORTANT: Please edit .env.prod with your production database credentials!"
    print_warning "Required variables to update:"
    echo "  - SUPABASE_URL"
    echo "  - SUPABASE_ANON_KEY" 
    echo "  - SUPABASE_SERVICE_KEY"
    echo "  - DATABASE_HOST"
    echo "  - DATABASE_PASSWORD"
    echo ""
    read -p "Have you updated the .env.prod file with your credentials? (y/N): " confirm
    if [[ $confirm != [yY] ]]; then
        print_error "Please update .env.prod with your credentials and run this script again."
        exit 1
    fi
fi

print_status "Building Docker image..."
docker-compose -f docker-compose.prod.yml build

print_status "Starting services..."
docker-compose -f docker-compose.prod.yml up -d

print_status "Waiting for services to be ready..."
sleep 10

# Check if the service is healthy
print_status "Checking service health..."
for i in {1..30}; do
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        print_success "✅ Service is healthy and ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "❌ Service health check failed after 5 minutes"
        print_status "Checking logs..."
        docker-compose -f docker-compose.prod.yml logs --tail=50 dttp-backend
        exit 1
    fi
    print_status "Waiting for service... (attempt $i/30)"
    sleep 10
done

print_success "🎉 DTTP AI Search Server deployed successfully!"
print_status "Service Details:"
echo "  🌐 Health Check: http://localhost:5000/health"
echo "  📚 API Documentation: http://localhost:5000/docs"
echo "  🔄 Redoc Documentation: http://localhost:5000/redoc"
echo ""
print_status "Your server is now ready to work with https://dttp-project.vercel.app/"
print_status "Make sure your Vercel app is configured to use this server's URL."

echo ""
print_status "Useful commands:"
echo "  📊 View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  🛑 Stop server: docker-compose -f docker-compose.prod.yml down"
echo "  🔄 Restart server: docker-compose -f docker-compose.prod.yml restart"
echo "  📈 View status: docker-compose -f docker-compose.prod.yml ps"
