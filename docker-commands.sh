#!/bin/bash

# Docker Commands Helper Script for UZQueue Bot

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_warning "docker-compose not found. Trying 'docker compose'..."
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed!"
        exit 1
    fi
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Main menu
show_menu() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  UZQueue Bot - Docker Commands"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1) Build containers"
    echo "2) Start all services"
    echo "3) Stop all services"
    echo "4) Restart app service"
    echo "5) View logs (all services)"
    echo "6) View app logs"
    echo "7) Run database migrations"
    echo "8) Connect to PostgreSQL"
    echo "9) Connect to Redis"
    echo "10) Show container status"
    echo "11) Stop and remove all containers"
    echo "12) Full cleanup (remove volumes too)"
    echo "0) Exit"
    echo ""
}

# Build containers
build_containers() {
    print_info "Building Docker containers..."
    $COMPOSE_CMD build
    print_success "Build completed!"
}

# Start services
start_services() {
    print_info "Starting all services..."
    $COMPOSE_CMD up -d
    print_success "Services started!"
    echo ""
    print_info "Checking service status..."
    $COMPOSE_CMD ps
}

# Stop services
stop_services() {
    print_info "Stopping all services..."
    $COMPOSE_CMD stop
    print_success "Services stopped!"
}

# Restart app
restart_app() {
    print_info "Restarting app service..."
    $COMPOSE_CMD restart app
    print_success "App restarted!"
}

# View all logs
view_all_logs() {
    print_info "Viewing all logs (Ctrl+C to exit)..."
    $COMPOSE_CMD logs -f
}

# View app logs
view_app_logs() {
    print_info "Viewing app logs (Ctrl+C to exit)..."
    $COMPOSE_CMD logs -f app
}

# Run migrations
run_migrations() {
    print_info "Running database migrations..."
    $COMPOSE_CMD exec app npm run migrate
    print_success "Migrations completed!"
}

# Connect to PostgreSQL
connect_postgres() {
    print_info "Connecting to PostgreSQL..."
    $COMPOSE_CMD exec postgres psql -U postgres -d uzqueue_bot
}

# Connect to Redis
connect_redis() {
    print_info "Connecting to Redis..."
    $COMPOSE_CMD exec redis redis-cli
}

# Show status
show_status() {
    print_info "Container status:"
    $COMPOSE_CMD ps
    echo ""
    print_info "Resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Stop and remove
stop_and_remove() {
    print_warning "This will stop and remove all containers!"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Stopping and removing containers..."
        $COMPOSE_CMD down
        print_success "Containers removed!"
    fi
}

# Full cleanup
full_cleanup() {
    print_warning "This will remove ALL containers, networks, and volumes!"
    print_warning "Database data will be lost!"
    read -p "Are you absolutely sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Performing full cleanup..."
        $COMPOSE_CMD down -v
        print_success "Cleanup completed!"
    fi
}

# Main loop
while true; do
    show_menu
    read -p "Select option: " choice
    
    case $choice in
        1) build_containers ;;
        2) start_services ;;
        3) stop_services ;;
        4) restart_app ;;
        5) view_all_logs ;;
        6) view_app_logs ;;
        7) run_migrations ;;
        8) connect_postgres ;;
        9) connect_redis ;;
        10) show_status ;;
        11) stop_and_remove ;;
        12) full_cleanup ;;
        0) print_success "Goodbye!"; exit 0 ;;
        *) print_warning "Invalid option. Please try again." ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done

