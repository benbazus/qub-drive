#!/bin/bash

# Heroku Deployment Script for Qub Drive API
# This script automates the deployment process to Heroku with checks and validations

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEFAULT_APP_NAME=""
BRANCH=${BRANCH:-main}
SKIP_TESTS=${SKIP_TESTS:-false}
SKIP_BUILD=${SKIP_BUILD:-false}
AUTO_MIGRATE=${AUTO_MIGRATE:-true}
BACKUP_DB=${BACKUP_DB:-true}

# Print colored output
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

# Display usage information
show_usage() {
    cat << EOF
🚀 Heroku Deployment Script for Qub Drive API

Usage: $0 [options] [app-name]

Options:
    -h, --help              Show this help message
    -a, --app APP_NAME      Heroku app name (required)
    -b, --branch BRANCH     Git branch to deploy (default: main)
    -s, --skip-tests        Skip running tests before deployment
    -S, --skip-build        Skip local build verification
    -n, --no-migrate        Skip automatic database migration
    -B, --no-backup         Skip database backup before deployment
    -f, --force             Force deployment without confirmations
    -d, --dry-run           Show what would be deployed without actually deploying

Examples:
    $0 -a my-qub-drive-api
    $0 --app my-app --branch feature/new-feature
    $0 -a my-app --skip-tests --force
    $0 --app my-app --dry-run

Environment Variables:
    HEROKU_APP_NAME         Default app name
    HEROKU_API_KEY          Heroku API key (for CI/CD)
    SKIP_TESTS              Skip tests (true/false)
    SKIP_BUILD              Skip build (true/false)
    AUTO_MIGRATE            Auto migrate database (true/false)
    BACKUP_DB               Backup database before deployment (true/false)

EOF
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -a|--app)
                APP_NAME="$2"
                shift 2
                ;;
            -b|--branch)
                BRANCH="$2"
                shift 2
                ;;
            -s|--skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            -S|--skip-build)
                SKIP_BUILD=true
                shift
                ;;
            -n|--no-migrate)
                AUTO_MIGRATE=false
                shift
                ;;
            -B|--no-backup)
                BACKUP_DB=false
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -*)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                # Assume it's the app name if not specified with -a
                if [ -z "$APP_NAME" ]; then
                    APP_NAME="$1"
                fi
                shift
                ;;
        esac
    done

    # Set app name from environment if not provided
    if [ -z "$APP_NAME" ]; then
        APP_NAME="${HEROKU_APP_NAME:-$DEFAULT_APP_NAME}"
    fi

    # Validate app name
    if [ -z "$APP_NAME" ]; then
        print_error "App name is required. Use -a option or set HEROKU_APP_NAME environment variable."
        show_usage
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check if Heroku CLI is installed
    if ! command -v heroku &> /dev/null; then
        print_error "Heroku CLI is not installed. Please install it from https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi

    # Check if user is logged in to Heroku
    if ! heroku auth:whoami &> /dev/null; then
        print_error "Not logged in to Heroku. Please run: heroku login"
        exit 1
    fi

    # Check if git is available
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed or not in PATH"
        exit 1
    fi

    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        print_error "Not in a git repository. Please initialize git first."
        exit 1
    fi

    # Check if app exists on Heroku
    if ! heroku apps:info "$APP_NAME" &> /dev/null; then
        print_error "Heroku app '$APP_NAME' does not exist or you don't have access to it."
        print_status "Available apps:"
        heroku apps --json | jq -r '.[].name' 2>/dev/null || heroku apps
        exit 1
    fi

    # Check if Node.js and npm are available
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi

    print_success "All prerequisites satisfied"
}

# Run tests
run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        print_warning "Skipping tests as requested"
        return 0
    fi

    print_status "Running tests..."
    
    # Check if test script exists
    if npm run --silent test --dry-run &> /dev/null; then
        if [ "$DRY_RUN" != "true" ]; then
            npm test
        else
            print_status "Would run: npm test"
        fi
        print_success "Tests passed"
    else
        print_warning "No test script found in package.json, skipping tests"
    fi
}

# Build application
build_application() {
    if [ "$SKIP_BUILD" = "true" ]; then
        print_warning "Skipping build verification as requested"
        return 0
    fi

    print_status "Building application locally..."
    
    if [ "$DRY_RUN" != "true" ]; then
        npm run build
    else
        print_status "Would run: npm run build"
    fi
    
    print_success "Build completed successfully"
}

# Check git status
check_git_status() {
    print_status "Checking git status..."

    # Check if there are uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "You have uncommitted changes:"
        git status --short
        
        if [ "$FORCE" != "true" ] && [ "$DRY_RUN" != "true" ]; then
            read -p "Do you want to commit these changes? (y/N): " commit_changes
            if [[ $commit_changes =~ ^[Yy]$ ]]; then
                read -p "Enter commit message: " commit_message
                git add .
                git commit -m "${commit_message:-Prepare for deployment}"
                print_success "Changes committed"
            else
                print_error "Please commit or stash your changes before deployment"
                exit 1
            fi
        elif [ "$DRY_RUN" = "true" ]; then
            print_status "Would prompt to commit changes"
        fi
    fi

    # Check if we're on the correct branch
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "$BRANCH" ]; then
        print_warning "Currently on branch '$current_branch', but deploying '$BRANCH'"
        if [ "$FORCE" != "true" ] && [ "$DRY_RUN" != "true" ]; then
            read -p "Continue with deployment? (y/N): " continue_deploy
            if [[ ! $continue_deploy =~ ^[Yy]$ ]]; then
                exit 1
            fi
        elif [ "$DRY_RUN" = "true" ]; then
            print_status "Would prompt for branch confirmation"
        fi
    fi

    print_success "Git status check completed"
}

# Backup database
backup_database() {
    if [ "$BACKUP_DB" != "true" ]; then
        print_warning "Skipping database backup as requested"
        return 0
    fi

    print_status "Creating database backup..."
    
    if [ "$DRY_RUN" != "true" ]; then
        backup_url=$(heroku pg:backups:capture --app "$APP_NAME" --wait-interval 5 2>&1 | grep -o 'https://[^[:space:]]*' || echo "")
        if [ -n "$backup_url" ]; then
            print_success "Database backup created: $backup_url"
        else
            print_warning "Could not create database backup, but continuing..."
        fi
    else
        print_status "Would run: heroku pg:backups:capture --app $APP_NAME"
    fi
}

# Deploy to Heroku
deploy_to_heroku() {
    print_status "Deploying to Heroku app: $APP_NAME"
    print_status "Branch: $BRANCH"

    if [ "$DRY_RUN" = "true" ]; then
        print_status "Would run: git push heroku $BRANCH:main"
        return 0
    fi

    # Add Heroku remote if it doesn't exist
    if ! git remote | grep -q heroku; then
        print_status "Adding Heroku remote..."
        heroku git:remote -a "$APP_NAME"
    fi

    # Deploy to Heroku
    print_status "Pushing to Heroku..."
    if [ "$BRANCH" = "main" ]; then
        git push heroku main
    else
        git push heroku "$BRANCH":main
    fi

    print_success "Deployment completed!"
}

# Wait for deployment to complete
wait_for_deployment() {
    if [ "$DRY_RUN" = "true" ]; then
        print_status "Would wait for deployment to complete"
        return 0
    fi

    print_status "Waiting for deployment to complete..."
    
    # Wait for the release to complete
    sleep 10
    
    # Get the latest release
    latest_release=$(heroku releases --app "$APP_NAME" --json | jq -r '.[0].version' 2>/dev/null || echo "unknown")
    print_status "Latest release: v$latest_release"
}

# Run database migrations
run_migrations() {
    if [ "$AUTO_MIGRATE" != "true" ]; then
        print_warning "Skipping automatic database migration"
        return 0
    fi

    print_status "Running database migrations..."
    
    if [ "$DRY_RUN" != "true" ]; then
        # Check if migration is needed (this is handled by the release command in Procfile)
        print_status "Migrations are handled by the release command in Procfile"
        print_status "Checking migration status..."
        
        heroku run "npm run prisma:migrate status" --app "$APP_NAME" || true
    else
        print_status "Would check and run migrations via release command"
    fi
}

# Verify deployment
verify_deployment() {
    if [ "$DRY_RUN" = "true" ]; then
        print_status "Would verify deployment"
        return 0
    fi

    print_status "Verifying deployment..."

    # Check app status
    app_status=$(heroku ps --app "$APP_NAME" --json | jq -r '.[0].state' 2>/dev/null || echo "unknown")
    if [ "$app_status" = "up" ]; then
        print_success "App is running"
    else
        print_warning "App status: $app_status"
    fi

    # Test health endpoint
    app_url=$(heroku apps:info "$APP_NAME" --json | jq -r '.web_url' 2>/dev/null || echo "")
    if [ -n "$app_url" ]; then
        print_status "Testing health endpoint: ${app_url}health"
        
        if curl -f -s "${app_url}health" > /dev/null; then
            print_success "Health check passed"
        else
            print_warning "Health check failed - app may still be starting"
        fi

        # Test API docs endpoint
        print_status "API Documentation: ${app_url}api-docs"
    fi

    print_success "Deployment verification completed"
}

# Show deployment summary
show_deployment_summary() {
    print_success "🎉 Deployment Summary"
    echo "----------------------------------------"
    echo "App Name: $APP_NAME"
    echo "Branch: $BRANCH"
    echo "Timestamp: $(date)"
    
    if [ "$DRY_RUN" != "true" ]; then
        app_url=$(heroku apps:info "$APP_NAME" --json | jq -r '.web_url' 2>/dev/null || echo "")
        if [ -n "$app_url" ]; then
            echo "App URL: $app_url"
            echo "API Docs: ${app_url}api-docs"
            echo "Health Check: ${app_url}health"
        fi
        
        echo ""
        echo "Useful commands:"
        echo "  View logs: heroku logs --tail --app $APP_NAME"
        echo "  Open app: heroku open --app $APP_NAME"
        echo "  Scale app: heroku ps:scale web=1 --app $APP_NAME"
        echo "  Run seed: heroku run npm run seed:prod --app $APP_NAME"
    else
        echo ""
        echo "This was a dry run - no actual deployment occurred"
    fi
    echo "----------------------------------------"
}

# Handle deployment failure
handle_deployment_failure() {
    print_error "Deployment failed!"
    
    if [ "$DRY_RUN" != "true" ]; then
        print_status "Recent logs:"
        heroku logs --tail --num 50 --app "$APP_NAME" || true
        
        print_status "Release status:"
        heroku releases --app "$APP_NAME" --num 5 || true
        
        echo ""
        print_status "Troubleshooting commands:"
        echo "  View detailed logs: heroku logs --tail --app $APP_NAME"
        echo "  Check releases: heroku releases --app $APP_NAME"
        echo "  Rollback: heroku rollback --app $APP_NAME"
        echo "  Restart app: heroku restart --app $APP_NAME"
    fi
    
    exit 1
}

# Rollback deployment
rollback_deployment() {
    print_status "Rolling back deployment..."
    
    if [ "$DRY_RUN" != "true" ]; then
        heroku rollback --app "$APP_NAME"
        print_success "Rollback completed"
    else
        print_status "Would run: heroku rollback --app $APP_NAME"
    fi
}

# Main deployment process
main() {
    # Set trap for error handling
    trap 'handle_deployment_failure' ERR

    echo "🚀 Starting Heroku deployment process..."
    echo "======================================="
    
    # Parse arguments
    parse_arguments "$@"
    
    if [ "$DRY_RUN" = "true" ]; then
        print_warning "DRY RUN MODE - No actual deployment will occur"
        echo ""
    fi

    # Execute deployment steps
    check_prerequisites
    check_git_status
    run_tests
    build_application
    backup_database
    deploy_to_heroku
    wait_for_deployment
    run_migrations
    verify_deployment
    show_deployment_summary

    print_success "🎉 Deployment completed successfully!"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi