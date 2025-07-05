#!/bin/bash

# Port conflict resolution script
echo "🔧 Port 5000 Conflict Resolution"
echo "================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
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

echo "Port 5000 is currently in use. Let's check what's using it:"
echo ""

# Check what's using port 5000
PROCESS_INFO=$(lsof -i :5000)
echo "$PROCESS_INFO"
echo ""

print_warning "This appears to be macOS Control Center or AirPlay Receiver."
echo ""
echo "You have several options:"
echo ""
echo "1. 🔄 Use a different port (8000) - Recommended"
echo "2. 🛑 Stop the conflicting service (may affect AirPlay)"
echo "3. ⚙️  Disable AirPlay Receiver in System Preferences"
echo ""

read -p "Which option would you like? (1/2/3): " choice

case $choice in
    1)
        print_info "Switching to port 8000..."
        
        # Update docker-compose to use port 8000
        if [ -f "docker-compose.prod.yml" ]; then
            # Create backup
            cp docker-compose.prod.yml docker-compose.prod.yml.backup
            
            # Replace port 5000 with 8000
            sed -i '' 's/5000:5000/8000:5000/g' docker-compose.prod.yml
            
            print_success "Updated docker-compose.prod.yml to use port 8000"
        fi
        
        # Update environment to reflect the change
        if [ -f ".env" ]; then
            # Create backup
            cp .env .env.backup
            
            # Update port in environment if it exists
            if grep -q "SERVER_PORT" .env; then
                sed -i '' 's/SERVER_PORT=5000/SERVER_PORT=5000/g' .env
            fi
            
            print_info "Note: Server still runs on port 5000 internally, but accessible via port 8000 externally"
        fi
        
        print_success "Configuration updated!"
        echo ""
        print_info "Now run the deployment again:"
        echo "./deploy-prod.sh"
        echo ""
        print_warning "Remember to update your Vercel environment variable to:"
        echo "NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:8000"
        ;;
        
    2)
        print_warning "Attempting to stop the conflicting process..."
        
        # Get the PID
        PID=$(lsof -ti :5000)
        
        if [ ! -z "$PID" ]; then
            echo "Found process ID: $PID"
            read -p "Are you sure you want to kill this process? (y/N): " confirm
            
            if [[ $confirm == [yY] ]]; then
                sudo kill -9 $PID
                sleep 2
                
                # Check if port is now free
                if ! lsof -i :5000 > /dev/null 2>&1; then
                    print_success "Port 5000 is now available!"
                    echo "You can now run: ./deploy-prod.sh"
                else
                    print_error "Port is still in use. Try option 1 or 3."
                fi
            else
                print_info "Process not killed. Try option 1 or 3."
            fi
        else
            print_error "Could not find process ID"
        fi
        ;;
        
    3)
        print_info "To disable AirPlay Receiver:"
        echo ""
        echo "1. Open System Preferences (or System Settings on newer macOS)"
        echo "2. Go to Sharing"
        echo "3. Turn off 'AirPlay Receiver'"
        echo ""
        echo "Alternatively, you can run:"
        echo "sudo launchctl unload -w /System/Library/LaunchDaemons/com.apple.AirPlayXPCHelper.plist"
        echo ""
        read -p "Press Enter when you've disabled AirPlay Receiver..."
        
        # Check if port is now free
        if ! lsof -i :5000 > /dev/null 2>&1; then
            print_success "Port 5000 is now available!"
            echo "You can now run: ./deploy-prod.sh"
        else
            print_warning "Port is still in use. You may need to restart your Mac or try option 1."
        fi
        ;;
        
    *)
        print_error "Invalid choice. Please run this script again."
        exit 1
        ;;
esac
