#!/bin/bash

# DTTP Backend Docker Deployment Script
# This script builds and deploys the DTTP AI Search Server using Docker

set -e  # Exit on any error

echo "🚀 DTTP Backend Docker Deployment Script"
echo "========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found"
    if [ -f ".env.production" ]; then
        print_status "Copying .env.production to .env"
        cp .env.production .env
        print_warning "Please edit .env file with your actual configuration values"
        print_warning "Especially update ALLOWED_ORIGINS with your Vercel domain"
    else
        print_error "No environment configuration found. Please create .env file."
        echo "You can copy from .env.example and modify the values."
        exit 1
    fi
fi

# Parse command line arguments
COMMAND=${1:-"start"}
SERVICE=${2:-""}

case $COMMAND in
    "build")
        print_status "Building Docker image..."
        docker-compose build --no-cache
        print_success "Docker image built successfully"
        ;;
    
    "start"|"up")
        print_status "Starting DTTP Backend services..."
        docker-compose up -d
        print_success "Services started successfully"
        
        print_status "Waiting for services to be healthy..."
        sleep 10
        
        # Check if the service is running
        if docker-compose ps | grep -q "Up"; then
            print_success "DTTP Backend is running!"
            echo ""
            echo "🌐 API URL: http://localhost:5000"
            echo "📊 Health Check: http://localhost:5000/health"
            echo "📖 API Docs: http://localhost:5000/docs"
            echo ""
            print_status "To view logs: ./deploy.sh logs"
            print_status "To stop: ./deploy.sh stop"
        else
            print_error "Failed to start services. Check logs with: ./deploy.sh logs"
            exit 1
        fi
        ;;
    
    "stop"|"down")
        print_status "Stopping DTTP Backend services..."
        docker-compose down
        print_success "Services stopped"
        ;;
    
    "restart")
        print_status "Restarting DTTP Backend services..."
        docker-compose restart
        print_success "Services restarted"
        ;;
    
    "logs")
        if [ -z "$SERVICE" ]; then
            docker-compose logs -f
        else
            docker-compose logs -f "$SERVICE"
        fi
        ;;
    
    "status")
        print_status "Service Status:"
        docker-compose ps
        echo ""
        
        # Try to check health endpoint
        if curl -f http://localhost:5000/health &> /dev/null; then
            print_success "Health check: API is responding"
        else
            print_warning "Health check: API is not responding"
        fi
        ;;
    
    "clean")
        print_warning "This will remove all containers, images, and volumes. Are you sure? (y/N)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            print_status "Cleaning up Docker resources..."
            docker-compose down -v --rmi all
            docker system prune -f
            print_success "Cleanup complete"
        else
            print_status "Cleanup cancelled"
        fi
        ;;
    
    "update")
        print_status "Updating DTTP Backend..."
        docker-compose pull
        docker-compose up -d --build
        print_success "Update complete"
        ;;
    
    "shell")
        print_status "Opening shell in DTTP Backend container..."
        docker-compose exec dttp-backend /bin/bash
        ;;
    
    *)
        echo "DTTP Backend Docker Deployment"
        echo ""
        echo "Usage: ./deploy.sh [COMMAND] [SERVICE]"
        echo ""
        echo "Commands:"
        echo "  build     - Build the Docker image"
        echo "  start|up  - Start the services"
        echo "  stop|down - Stop the services"
        echo "  restart   - Restart the services"
        echo "  logs      - View logs (optionally for specific service)"
        echo "  status    - Show service status and health"
        echo "  clean     - Remove all containers, images, and volumes"
        echo "  update    - Pull latest images and rebuild"
        echo "  shell     - Open shell in the backend container"
        echo ""
        echo "Examples:"
        echo "  ./deploy.sh start         - Start all services"
        echo "  ./deploy.sh logs          - View all logs"
        echo "  ./deploy.sh logs dttp-backend - View backend logs only"
        echo "  ./deploy.sh status        - Check service status"
        ;;
esac
