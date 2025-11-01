.PHONY: help build run test clean docker-build docker-run setup migrate dev

# Default target
help:
	@echo "Available commands:"
	@echo "  setup        - Set up the development environment"
	@echo "  build        - Build the application"
	@echo "  run          - Run the application"
	@echo "  dev          - Run in development mode with auto-reload"
	@echo "  test         - Run tests"
	@echo "  test-cov     - Run tests with coverage"
	@echo "  migrate      - Run database migrations"
	@echo "  clean        - Clean build artifacts"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run   - Run with Docker Compose"
	@echo "  docker-stop  - Stop Docker services"
	@echo "  lint         - Run linting"
	@echo "  fmt          - Format code"

# Development setup
setup:
	@echo "Setting up development environment..."
	cp .env.example .env
	@echo "Please edit .env with your configuration"
	@echo "Then run 'make migrate' to set up the database"

# Build the application
build:
	cargo build --release

# Run the application
run:
	cargo run

# Development mode with auto-reload
dev:
	cargo watch -x run

# Run tests
test:
	cargo test

# Run tests with coverage
test-cov:
	cargo tarpaulin --out html

# Run database migrations
migrate:
	sqlx migrate run

# Clean build artifacts
clean:
	cargo clean

# Docker commands
docker-build:
	docker build -t kingshare-backend .

docker-run:
	docker-compose up -d

docker-stop:
	docker-compose down

docker-logs:
	docker-compose logs -f backend

# Code quality
lint:
	cargo clippy -- -D warnings

fmt:
	cargo fmt

# Check everything
check: fmt lint test

# Database commands
db-reset:
	docker-compose down postgres
	docker volume rm qubators-kingshare-backend_postgres_data || true
	docker-compose up postgres -d
	sleep 5
	make migrate

# Install development dependencies
install-deps:
	cargo install cargo-watch
	cargo install cargo-tarpaulin
	cargo install sqlx-cli