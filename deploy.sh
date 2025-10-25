#!/bin/bash

# Nexjob Frontend Deployment Script for Ubuntu Production Server
# Make this file executable: chmod +x deploy.sh

set -e  # Exit on any error

echo "🚀 Starting Nexjob Frontend Deployment..."

# Configuration
APP_NAME="nexjob-frontend"
APP_DIR="/var/www/nexjob-frontend"
BACKUP_DIR="/var/backups/nexjob-frontend"
NODE_VERSION="18"
PM2_APP_NAME="nexjob-frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root. Use a user with sudo privileges."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js $NODE_VERSION first."
    exit 1
fi

# Check Node.js version
NODE_CURRENT_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_CURRENT_VERSION" -lt "$NODE_VERSION" ]; then
    print_error "Node.js version $NODE_VERSION or higher is required. Current version: $(node -v)"
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

# Create backup directory if it doesn't exist
sudo mkdir -p "$BACKUP_DIR"

# Create app directory if it doesn't exist
sudo mkdir -p "$APP_DIR"
sudo chown -R $(whoami):$(whoami) "$APP_DIR"

# Backup current deployment if it exists
if [ -d "$APP_DIR/.next" ]; then
    print_status "Creating backup of current deployment..."
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    sudo cp -r "$APP_DIR" "$BACKUP_DIR/$BACKUP_NAME"
    print_status "Backup created: $BACKUP_DIR/$BACKUP_NAME"
fi

# Copy files to app directory
print_status "Copying application files..."
rsync -av --exclude 'node_modules' --exclude '.git' --exclude '.next' . "$APP_DIR/"

# Navigate to app directory
cd "$APP_DIR"

# Set up environment file BEFORE installing dependencies and building
if [ ! -f ".env.local" ]; then
    print_warning ".env.local not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        print_warning "Please edit .env.local with your production values!"
    else
        print_warning "Creating basic .env.local file with placeholder values..."
        cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
EOF
        print_error "IMPORTANT: You must update .env.local with your actual Supabase credentials before the application will work!"
    fi
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci --production=false

# Clean build cache to prevent webpack caching issues
print_status "Cleaning build cache..."
rm -rf .next

# Build the application
print_status "Building Next.js application..."
npm run build

# Set proper permissions
sudo chown -R $(whoami):$(whoami) "$APP_DIR"
chmod +x "$APP_DIR/deploy.sh" 2>/dev/null || true

# PM2 process management
print_status "Managing PM2 processes..."

# Stop existing PM2 process if running
if pm2 describe "$PM2_APP_NAME" > /dev/null 2>&1; then
    print_status "Stopping existing PM2 process..."
    pm2 stop "$PM2_APP_NAME"
    pm2 delete "$PM2_APP_NAME"
fi

# Start application with PM2
if [ -f "ecosystem.config.js" ]; then
    print_status "Starting application with PM2 using ecosystem config..."
    pm2 start ecosystem.config.js --env production
else
    print_status "Starting application with PM2..."
    pm2 start npm --name "$PM2_APP_NAME" -- start
fi

# Save PM2 configuration
pm2 save

# Setup PM2 startup (run only once)
if ! systemctl is-enabled pm2-$(whoami) > /dev/null 2>&1; then
    print_status "Setting up PM2 startup..."
    pm2 startup systemd -u $(whoami) --hp $(eval echo ~$(whoami))
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $(whoami) --hp $(eval echo ~$(whoami))
fi

# Wait for application to start
print_status "Waiting for application to start..."
sleep 10

# Check if application is running
if pm2 describe "$PM2_APP_NAME" > /dev/null 2>&1; then
    APP_STATUS=$(pm2 describe "$PM2_APP_NAME" | grep "status" | head -1 | awk '{print $4}')
    if [ "$APP_STATUS" = "online" ]; then
        print_status "✅ Application deployed successfully!"
        print_status "Application is running on PM2 as '$PM2_APP_NAME'"
        
        # Show PM2 status
        pm2 status
        
        # Test if the application is responding
        if curl -s http://localhost:3000 > /dev/null; then
            print_status "✅ Application is responding on port 3000"
        else
            print_warning "⚠️  Application deployed but not responding on port 3000"
        fi
        
        echo ""
        print_status "🎉 Deployment completed successfully!"
        echo ""
        print_status "Next steps:"
        echo "1. Configure your reverse proxy (Nginx/Apache) to point to localhost:3000"
        echo "2. Set up SSL certificate"
        echo "3. Update DNS records"
        echo "4. Test sitemap functionality: curl http://localhost:3000/api/sitemap.xml"
        echo ""
        print_status "Useful PM2 commands:"
        echo "  pm2 status              - Check application status"
        echo "  pm2 logs $PM2_APP_NAME  - View application logs"
        echo "  pm2 restart $PM2_APP_NAME - Restart application"
        echo "  pm2 stop $PM2_APP_NAME     - Stop application"
        echo ""
        
    else
        print_error "❌ Application failed to start. Status: $APP_STATUS"
        print_error "Check PM2 logs: pm2 logs $PM2_APP_NAME"
        exit 1
    fi
else
    print_error "❌ Failed to deploy application"
    exit 1
fi