#!/bin/bash

# Quick Deploy Script for Heroku
# Simple wrapper for common deployment scenarios

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}$1${NC}"; }
print_warning() { echo -e "${YELLOW}$1${NC}"; }
print_error() { echo -e "${RED}$1${NC}"; }

# Default app name from environment or prompt
APP_NAME="${HEROKU_APP_NAME:-}"

if [ -z "$APP_NAME" ]; then
    echo "Enter your Heroku app name:"
    read -r APP_NAME
fi

if [ -z "$APP_NAME" ]; then
    print_error "App name is required!"
    exit 1
fi

echo "🚀 Quick Deploy to: $APP_NAME"
echo "================================"

# Run the full deployment script
./scripts/deploy-heroku.sh --app "$APP_NAME" --force

print_success "✅ Quick deployment completed!"