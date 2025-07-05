#!/bin/bash

# DTTP Backend Verification Script
# This script verifies that the deployed backend is working correctly with Vercel

echo "🔍 DTTP Backend Verification"
echo "============================"

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

# Check if Docker container is running
print_info "Checking Docker container status..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    print_success "Docker container is running"
else
    print_error "Docker container is not running"
    echo "Run: ./deploy-prod.sh"
    exit 1
fi

# Check if port 8000 is accessible
print_info "Checking if port 8000 is accessible..."
if nc -z localhost 8000; then
    print_success "Port 8000 is accessible"
else
    print_error "Port 8000 is not accessible"
    exit 1
fi

# Check health endpoint
print_info "Checking health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:8000/health -o /tmp/health_response.json)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    print_success "Health endpoint is responding (HTTP 200)"
    
    # Parse health response
    if command -v jq >/dev/null 2>&1; then
        STATUS=$(jq -r '.status' /tmp/health_response.json 2>/dev/null)
        if [ "$STATUS" = "healthy" ]; then
            print_success "Service status: healthy"
        else
            print_warning "Service status: $STATUS"
        fi
    fi
else
    print_error "Health endpoint failed (HTTP $HEALTH_RESPONSE)"
    exit 1
fi

# Check API documentation
print_info "Checking API documentation..."
DOCS_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:8000/docs -o /dev/null)
if [ "$DOCS_RESPONSE" = "200" ]; then
    print_success "API documentation is accessible"
else
    print_warning "API documentation not accessible (HTTP $DOCS_RESPONSE)"
fi

# Check CORS headers
print_info "Checking CORS configuration..."
CORS_RESPONSE=$(curl -s -H "Origin: https://dttp-project.vercel.app" \
                     -H "Access-Control-Request-Method: POST" \
                     -H "Access-Control-Request-Headers: Content-Type" \
                     -X OPTIONS \
                     http://localhost:8000/health \
                     -w "%{http_code}" -o /dev/null)

if [ "$CORS_RESPONSE" = "200" ]; then
    print_success "CORS is configured correctly for Vercel"
else
    print_warning "CORS might not be configured correctly (HTTP $CORS_RESPONSE)"
fi

# Get server IP
SERVER_IP=$(curl -s https://ipinfo.io/ip 2>/dev/null || echo "unknown")

echo ""
print_info "Deployment Summary:"
echo "==================="
echo "🐳 Docker Status: Running"
echo "🌐 Local Health Check: http://localhost:8000/health"
echo "📚 API Documentation: http://localhost:8000/docs"
echo "🌍 Server IP: $SERVER_IP"
echo "🔗 External Health Check: http://$SERVER_IP:8000/health"
echo ""
print_info "Vercel Configuration:"
echo "====================="
echo "Environment Variable to set in Vercel:"
echo "NEXT_PUBLIC_API_URL=http://$SERVER_IP:8000"
echo ""
print_info "Next Steps:"
echo "==========="
echo "1. Ensure port 5000 is open in your firewall"
echo "2. If behind a router, configure port forwarding for port 5000"
echo "3. Update Vercel environment variable: NEXT_PUBLIC_API_URL=http://$SERVER_IP:5000"
echo "4. Test your frontend at: https://dttp-project.vercel.app/"

# Cleanup
rm -f /tmp/health_response.json
