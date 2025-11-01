#!/bin/bash

# Heroku Setup Script for Qub Drive API
# This script configures all necessary environment variables for Heroku deployment

set -e

echo "🚀 Setting up Heroku configuration for Qub Drive API..."

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI is not installed. Please install it first:"
    echo "   https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if user is logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo "❌ Please login to Heroku first: heroku login"
    exit 1
fi

# Get app name
read -p "Enter your Heroku app name: " APP_NAME

if [ -z "$APP_NAME" ]; then
    echo "❌ App name is required"
    exit 1
fi

echo "📝 Configuring environment variables for app: $APP_NAME"

# Core application settings
echo "Setting core application variables..."
heroku config:set NODE_ENV=production --app $APP_NAME
heroku config:set PORT=5001 --app $APP_NAME
heroku config:set APP_NAME="Qub Drive" --app $APP_NAME

# Admin credentials
echo ""
read -p "Enter admin email (default: admin@qubators.com): " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@qubators.com}

read -s -p "Enter admin password (min 8 chars): " ADMIN_PASSWORD
echo ""

if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
    echo "❌ Password must be at least 8 characters long"
    exit 1
fi

heroku config:set ADMIN_EMAIL="$ADMIN_EMAIL" --app $APP_NAME
heroku config:set ADMIN_PASSWORD="$ADMIN_PASSWORD" --app $APP_NAME

# JWT secrets
echo "Generating JWT secrets..."
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')

heroku config:set JWT_SECRET="$JWT_SECRET" --app $APP_NAME
heroku config:set JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" --app $APP_NAME

# Storage configuration
echo "Setting storage configuration..."
heroku config:set DEFAULT_STORAGE_PATH="/tmp/storage" --app $APP_NAME
heroku config:set MAX_FILE_SIZE="104857600" --app $APP_NAME  # 100MB
heroku config:set MAX_STORAGE_PER_USER="10737418240" --app $APP_NAME  # 10GB

# Allowed file types
heroku config:set ALLOWED_FILE_TYPES="pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,json,xml,jpg,jpeg,png,gif,svg,webp,mp4,avi,mov,wmv,mp3,wav,flac,zip,rar,7z,tar,gz" --app $APP_NAME

# Security settings
echo "Setting security configuration..."
heroku config:set SESSION_TIMEOUT="3600000" --app $APP_NAME  # 1 hour
heroku config:set MAX_LOGIN_ATTEMPTS="5" --app $APP_NAME
heroku config:set LOCKOUT_DURATION="900000" --app $APP_NAME  # 15 minutes
heroku config:set REQUIRE_TWO_FACTOR="false" --app $APP_NAME

# Email configuration
echo ""
echo "📧 Email Configuration (optional - press Enter to skip)"
read -p "SMTP Host (e.g., smtp.gmail.com): " SMTP_HOST
read -p "SMTP Port (e.g., 587): " SMTP_PORT
read -p "SMTP Secure (true/false): " SMTP_SECURE
read -p "SMTP User (email address): " SMTP_USER
read -s -p "SMTP Password (app password): " SMTP_PASS
echo ""
read -p "From Email Address: " SMTP_FROM

if [ ! -z "$SMTP_HOST" ]; then
    heroku config:set SMTP_HOST="$SMTP_HOST" --app $APP_NAME
    heroku config:set SMTP_PORT="$SMTP_PORT" --app $APP_NAME
    heroku config:set SMTP_SECURE="$SMTP_SECURE" --app $APP_NAME
    heroku config:set SMTP_USER="$SMTP_USER" --app $APP_NAME
    heroku config:set SMTP_PASS="$SMTP_PASS" --app $APP_NAME
    heroku config:set SMTP_FROM="$SMTP_FROM" --app $APP_NAME
    echo "✅ Email configuration set"
else
    echo "⚠️  Email configuration skipped - email features will be disabled"
fi

# Database setup
echo ""
echo "🗄️  Database Setup"
read -p "Do you want to add Heroku Postgres? (y/n): " ADD_POSTGRES

if [[ $ADD_POSTGRES =~ ^[Yy]$ ]]; then
    echo "Adding Heroku Postgres..."
    
    echo "Available plans:"
    echo "1. essential-0 (Free, 10k rows, 1GB)"
    echo "2. hobby-basic ($9/month, 20 connections, 1GB)"
    echo "3. hobby-dev ($5/month, 4 connections, 256MB)"
    echo "4. standard-0 ($50/month, 120 connections, 10GB)"
    
    read -p "Select plan (1-4): " DB_PLAN
    
    case $DB_PLAN in
        1) PLAN="essential-0" ;;
        2) PLAN="hobby-basic" ;;
        3) PLAN="hobby-dev" ;;
        4) PLAN="standard-0" ;;
        *) PLAN="essential-0" ;;
    esac
    
    echo "Adding Heroku Postgres plan: $PLAN"
    heroku addons:create heroku-postgresql:$PLAN --app $APP_NAME
    
    # Enable SSL for database
    heroku config:set PGSSLMODE=require --app $APP_NAME
    echo "✅ Database added and SSL enabled"
else
    echo "⚠️  Database setup skipped - you'll need to set DATABASE_URL manually"
fi

# Cloud storage setup (optional)
echo ""
echo "☁️  Cloud Storage Setup (optional for persistent file storage)"
read -p "Do you want to configure cloud storage? (y/n): " SETUP_CLOUD

if [[ $SETUP_CLOUD =~ ^[Yy]$ ]]; then
    echo "1. AWS S3"
    echo "2. Google Cloud Storage"
    echo "3. Skip"
    read -p "Select storage provider (1-3): " STORAGE_CHOICE
    
    case $STORAGE_CHOICE in
        1)
            echo "AWS S3 Configuration:"
            read -p "AWS Access Key ID: " AWS_KEY
            read -s -p "AWS Secret Access Key: " AWS_SECRET
            echo ""
            read -p "AWS Bucket Name: " AWS_BUCKET
            read -p "AWS Region (e.g., us-east-1): " AWS_REGION
            
            heroku config:set AWS_ACCESS_KEY_ID="$AWS_KEY" --app $APP_NAME
            heroku config:set AWS_SECRET_ACCESS_KEY="$AWS_SECRET" --app $APP_NAME
            heroku config:set AWS_BUCKET_NAME="$AWS_BUCKET" --app $APP_NAME
            heroku config:set AWS_REGION="$AWS_REGION" --app $APP_NAME
            heroku config:set STORAGE_TYPE="s3" --app $APP_NAME
            echo "✅ AWS S3 configuration set"
            ;;
        2)
            echo "Google Cloud Storage Configuration:"
            read -p "GCP Project ID: " GCP_PROJECT
            read -p "GCS Bucket Name: " GCS_BUCKET
            echo "Please paste your service account key (base64 encoded):"
            read -r GCP_KEY
            
            heroku config:set GOOGLE_CLOUD_PROJECT_ID="$GCP_PROJECT" --app $APP_NAME
            heroku config:set GCS_BUCKET_NAME="$GCS_BUCKET" --app $APP_NAME
            heroku config:set GOOGLE_CLOUD_KEYFILE="$GCP_KEY" --app $APP_NAME
            heroku config:set STORAGE_TYPE="gcs" --app $APP_NAME
            echo "✅ Google Cloud Storage configuration set"
            ;;
        *)
            echo "⚠️  Cloud storage configuration skipped"
            ;;
    esac
fi

# Add monitoring (optional)
echo ""
echo "📊 Monitoring Setup (optional)"
read -p "Do you want to add monitoring addons? (y/n): " ADD_MONITORING

if [[ $ADD_MONITORING =~ ^[Yy]$ ]]; then
    echo "Available monitoring options:"
    echo "1. Papertrail (Logging)"
    echo "2. New Relic (APM)"
    echo "3. Both"
    echo "4. Skip"
    read -p "Select option (1-4): " MONITOR_CHOICE
    
    case $MONITOR_CHOICE in
        1|3)
            echo "Adding Papertrail..."
            heroku addons:create papertrail:choklad --app $APP_NAME
            echo "✅ Papertrail logging added"
            ;&  # Fall through to next case if 3 was selected
        2|3)
            if [ "$MONITOR_CHOICE" = "2" ] || [ "$MONITOR_CHOICE" = "3" ]; then
                echo "Adding New Relic..."
                heroku addons:create newrelic:wayne --app $APP_NAME
                echo "✅ New Relic APM added"
            fi
            ;;
        *)
            echo "⚠️  Monitoring setup skipped"
            ;;
    esac
fi

# Display configuration summary
echo ""
echo "🎉 Configuration completed!"
echo ""
echo "📋 Summary:"
echo "App Name: $APP_NAME"
echo "Admin Email: $ADMIN_EMAIL"
echo "Storage: /tmp/storage (ephemeral)"
echo ""

# Show next steps
echo "🚀 Next Steps:"
echo "1. Deploy your app:"
echo "   git add ."
echo "   git commit -m 'Configure for Heroku'"
echo "   git push heroku main"
echo ""
echo "2. Check deployment:"
echo "   heroku logs --tail --app $APP_NAME"
echo ""
echo "3. Open your app:"
echo "   heroku open --app $APP_NAME"
echo ""
echo "4. Access API documentation:"
echo "   https://$APP_NAME.herokuapp.com/api-docs"
echo ""
echo "5. View configuration:"
echo "   heroku config --app $APP_NAME"
echo ""

# Option to deploy now
read -p "Do you want to deploy now? (y/n): " DEPLOY_NOW

if [[ $DEPLOY_NOW =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to Heroku..."
    
    # Check if we're in a git repo
    if [ ! -d ".git" ]; then
        echo "❌ Not in a git repository. Please initialize git first:"
        echo "   git init"
        echo "   git add ."
        echo "   git commit -m 'Initial commit'"
        exit 1
    fi
    
    # Add Heroku remote if not exists
    if ! git remote | grep -q heroku; then
        heroku git:remote -a $APP_NAME
    fi
    
    # Commit any changes
    git add .
    git commit -m "Configure for Heroku deployment" || true
    
    # Deploy
    git push heroku main
    
    echo "✅ Deployment initiated!"
    echo "Monitor logs: heroku logs --tail --app $APP_NAME"
else
    echo "Deploy manually when ready: git push heroku main"
fi

echo ""
echo "✨ Setup complete! Your Qub Drive API is ready for Heroku!"