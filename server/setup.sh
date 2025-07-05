#!/bin/bash

# DTTP Complete Setup Script
# This script guides you through the complete setup process

echo "🚀 DTTP AI Search Server - Complete Setup Guide"
echo "================================================"

echo ""
echo "This script will help you set up the DTTP AI Search Server to work with"
echo "your Vercel-hosted frontend at: https://dttp-project.vercel.app/"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}📋 STEP $1: $2${NC}"
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

echo "Prerequisites Check:"
echo "==================="

# Check Docker
if command -v docker >/dev/null 2>&1; then
    print_success "Docker is installed"
else
    print_error "Docker is not installed"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check Docker Compose
if command -v docker-compose >/dev/null 2>&1; then
    print_success "Docker Compose is installed"
else
    print_error "Docker Compose is not installed"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo ""
print_step "1" "Environment Configuration"
echo ""

if [ ! -f ".env" ]; then
    echo "Creating environment configuration file..."
    cp .env.prod .env
    
    echo ""
    print_warning "IMPORTANT: You need to configure your database credentials!"
    echo ""
    echo "Please edit the .env file and update these variables:"
    echo "- SUPABASE_URL=your_supabase_url_here"
    echo "- SUPABASE_ANON_KEY=your_supabase_anon_key_here"
    echo "- SUPABASE_SERVICE_KEY=your_supabase_service_key_here"
    echo "- DATABASE_HOST=your_database_host_here"
    echo "- DATABASE_PASSWORD=your_database_password_here"
    echo ""
    
    read -p "Press Enter to open the .env file for editing..."
    
    # Try to open with common editors
    if command -v nano >/dev/null 2>&1; then
        nano .env
    elif command -v vim >/dev/null 2>&1; then
        vim .env
    elif command -v vi >/dev/null 2>&1; then
        vi .env
    else
        echo "Please edit .env file manually with your preferred editor"
        echo "File location: $(pwd)/.env"
        read -p "Press Enter when you've finished editing..."
    fi
    
    echo ""
    read -p "Have you updated all the required database credentials? (y/N): " confirm
    if [[ $confirm != [yY] ]]; then
        print_error "Please update the .env file with your credentials and run this script again."
        exit 1
    fi
else
    print_success "Environment file already exists"
fi

echo ""
print_step "2" "Docker Deployment"
echo ""

echo "Building and deploying the Docker container..."
if ./deploy-prod.sh; then
    print_success "Deployment completed successfully!"
else
    print_error "Deployment failed. Please check the error messages above."
    exit 1
fi

echo ""
print_step "3" "Verification"
echo ""

echo "Verifying the deployment..."
if ./verify-deployment.sh; then
    print_success "Verification completed successfully!"
else
    print_warning "Verification had some issues. Please check the details above."
fi

echo ""
print_step "4" "Network Configuration"
echo ""

# Get public IP
SERVER_IP=$(curl -s https://ipinfo.io/ip 2>/dev/null || echo "unknown")

echo "Your server IP address is: $SERVER_IP"
echo ""
echo "To make your server accessible from Vercel, you need to:"
echo ""
echo "1. 🔥 Open port 8000 in your firewall:"
echo "   Ubuntu/Debian: sudo ufw allow 8000"
echo "   CentOS/RHEL: sudo firewall-cmd --permanent --add-port=8000/tcp && sudo firewall-cmd --reload"
echo ""
echo "2. 🌐 If behind a router, configure port forwarding:"
echo "   Forward external port 8000 to internal port 8000 on this machine"
echo ""
echo "3. 🔗 Test external access:"
echo "   curl http://$SERVER_IP:8000/health"
echo ""

echo ""
print_step "5" "Vercel Configuration"
echo ""

echo "In your Vercel project (https://vercel.com/dashboard):"
echo ""
echo "1. Go to your project settings"
echo "2. Navigate to 'Environment Variables'"
echo "3. Add a new environment variable:"
echo "   Name: NEXT_PUBLIC_API_URL"
echo "   Value: http://$SERVER_IP:8000"
echo "4. Redeploy your frontend"
echo ""

echo ""
print_step "6" "Final Testing"
echo ""

echo "After completing the Vercel configuration:"
echo ""
echo "1. Visit: https://dttp-project.vercel.app/"
echo "2. Try the AI search functionality"
echo "3. Check the browser console for any connection errors"
echo ""

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Your DTTP AI Search Server is now ready to work with your Vercel frontend!"
echo ""
echo "🔗 Server Health: http://localhost:8000/health"
echo "📚 API Documentation: http://localhost:8000/docs"
echo "🌍 External Health: http://$SERVER_IP:8000/health"
echo "🌐 Frontend: https://dttp-project.vercel.app/"
echo ""
echo "📋 Management Commands:"
echo "- View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "- Stop server: docker-compose -f docker-compose.prod.yml down"
echo "- Restart server: docker-compose -f docker-compose.prod.yml restart"
echo "- Verify deployment: ./verify-deployment.sh"
