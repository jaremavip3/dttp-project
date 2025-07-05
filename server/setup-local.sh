#!/bin/bash

# Local Development Setup Script
# This script sets up the DTTP server for local development without Docker

echo "🔧 DTTP AI Search Server - Local Development Setup"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check Python
if command -v python3 >/dev/null 2>&1; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    print_success "Python 3 is installed (version $PYTHON_VERSION)"
else
    print_error "Python 3 is not installed"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

# Check if we're in a virtual environment
if [[ "$VIRTUAL_ENV" != "" ]]; then
    print_success "Virtual environment is active: $(basename $VIRTUAL_ENV)"
else
    print_warning "No virtual environment detected"
    echo "It's recommended to use a virtual environment"
    read -p "Continue anyway? (y/N): " confirm
    if [[ $confirm != [yY] ]]; then
        echo "Create a virtual environment with:"
        echo "python3 -m venv dttp-env"
        echo "source dttp-env/bin/activate"
        exit 1
    fi
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    print_info "Creating local environment file..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        # Create a basic .env file
        cat > .env << EOF
# Local Development Environment
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

DATABASE_HOST=your_database_host_here
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_database_password_here
DATABASE_NAME=postgres

SERVER_HOST=0.0.0.0
SERVER_PORT=5000
LOG_LEVEL=INFO

ALLOWED_ORIGINS=http://localhost:3000,https://dttp-project.vercel.app

IMAGES_PATH=../client/public/test_images
MODELS_CACHE_DIR=./model_cache
EMBEDDINGS_CACHE_DIR=./embeddings_cache
MAX_WORKERS=4
ENABLE_MODEL_PARALLELISM=true
EOF
    fi
    
    print_warning "Please edit .env with your database credentials"
    echo "Required variables:"
    echo "- SUPABASE_URL"
    echo "- SUPABASE_ANON_KEY"
    echo "- SUPABASE_SERVICE_KEY"
    echo "- DATABASE_HOST"
    echo "- DATABASE_PASSWORD"
    echo ""
    read -p "Press Enter to edit the .env file..."
    
    if command -v nano >/dev/null 2>&1; then
        nano .env
    elif command -v vim >/dev/null 2>&1; then
        vim .env
    else
        print_info "Please edit .env manually with your preferred editor"
        read -p "Press Enter when done..."
    fi
fi

# Install dependencies
print_info "Installing Python dependencies..."
if pip install -r requirements.txt; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Create necessary directories
print_info "Creating cache directories..."
mkdir -p model_cache embeddings_cache logs

print_success "Local setup complete!"
echo ""
print_info "To start the server locally:"
echo "python unified_server.py"
echo ""
print_info "The server will be available at:"
echo "🌐 http://localhost:5000"
echo "📚 http://localhost:5000/docs"
echo ""
print_info "To test with your frontend:"
echo "1. Make sure your client/.env.local has: NEXT_PUBLIC_API_URL=http://localhost:5000"
echo "2. Start your Next.js frontend: cd ../client && npm run dev"
echo "3. Visit: http://localhost:3000"
