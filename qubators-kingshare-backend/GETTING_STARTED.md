# Getting Started with KingShare Backend

This guide will help you get the KingShare backend up and running with all real implementations.

## Prerequisites

- Rust 1.75+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd qubators-kingshare-backend
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` file with your settings:

```bash
# Database (required)
DATABASE_URL=postgresql://username:password@localhost:5432/kingshare

# JWT Secret (required - use a strong random key)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
KINGSHARE__SERVER__HOST=0.0.0.0
KINGSHARE__SERVER__PORT=8080

# File Storage
KINGSHARE__STORAGE__MAX_FILE_SIZE=104857600  # 100MB
KINGSHARE__STORAGE__STORAGE_PATH=./uploads
```

### 3. Start Database

Using Docker:
```bash
docker-compose up postgres -d
```

Or use your local PostgreSQL and create the database:
```sql
CREATE DATABASE kingshare;
```

### 4. Run Database Migrations

```bash
# Install sqlx-cli if not already installed
cargo install sqlx-cli

# Run migrations
sqlx migrate run
```

### 5. Start the Server

```bash
# Development mode
cargo run

# Or with auto-reload
cargo install cargo-watch
cargo watch -x run

# Production build
cargo build --release
./target/release/server
```

The server will start on `http://localhost:8080`

## Testing the Implementation

### Run the Demo

```bash
# Basic functionality demo
cargo run --example demo

# Comprehensive implementation test
cargo run --example full_test
```

The demos will demonstrate all the core functionality:
- File validation and analysis
- Storage operations (upload, download, delete)
- Authentication (password hashing, JWT tokens)
- Value object validation (Email, Password)
- File deduplication via checksums
- Token refresh and revocation
- Security validation and edge cases

### Run Integration Tests

```bash
# Make sure DATABASE_URL is set
export DATABASE_URL=postgresql://localhost/kingshare_test

# Run tests
cargo test
```

### Manual API Testing

1. **Health Check**
   ```bash
   curl http://localhost:8080/health
   ```

2. **Register User**
   ```bash
   curl -X POST http://localhost:8080/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "username": "testuser",
       "first_name": "Test",
       "last_name": "User",
       "password": "SecurePassword123!"
     }'
   ```

3. **Login**
   ```bash
   curl -X POST http://localhost:8080/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "SecurePassword123!"
     }'
   ```

4. **Upload File** (Requires Authentication)
   ```bash
   # Save the JWT token from login response
   TOKEN="your_jwt_token_here"
   
   curl -X POST http://localhost:8080/api/v1/files \
     -H "Authorization: Bearer $TOKEN" \
     -F "file=@/path/to/your/file.txt"
   ```

5. **List Files** (Authentication Optional)
   ```bash
   # List user's files (requires auth)
   curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8080/api/v1/files
   
   # List public files (no auth required)
   curl http://localhost:8080/api/v1/files?public_only=true
   ```

6. **Create Share**
   ```bash
   # Use file_id from upload response
   curl -X POST http://localhost:8080/api/v1/shares \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "file_id": "your_file_id_here",
       "password": "sharepassword",
       "max_downloads": 10
     }'
   ```

### WebSocket Testing

1. **Connect to WebSocket**
   ```javascript
   const ws = new WebSocket('ws://localhost:8080/ws?token=your_jwt_token');
   
   ws.onopen = () => console.log('Connected');
   ws.onmessage = (event) => console.log('Message:', JSON.parse(event.data));
   ```

2. **Send Authentication**
   ```javascript
   ws.send(JSON.stringify({
     type: 'Authenticate',
     data: { token: 'your_jwt_token' }
   }));
   ```

## Real Implementation Features

### ✅ Fully Implemented Components

1. **Authentication System**
   - JWT token generation and validation
   - Argon2 password hashing
   - Refresh token mechanism
   - Token revocation support

2. **File Management**
   - Multipart file upload
   - File validation (size, type, content)
   - Secure file storage with deduplication
   - File download with access control
   - File expiration and cleanup

3. **Share System**
   - Password-protected shares
   - Download limits and expiration
   - Token-based public access
   - Share statistics and management

4. **Database Layer**
   - PostgreSQL with connection pooling
   - Type-safe queries with SQLx
   - Database migrations
   - Comprehensive error handling

5. **WebSocket Support**
   - Real-time notifications
   - User presence tracking
   - Connection management
   - Message broadcasting

6. **Storage System**
   - Local file storage with security checks
   - File deduplication via SHA256 checksums
   - Automatic directory structure
   - Orphaned file cleanup

7. **Validation & Security**
   - Input validation with custom error messages
   - File type and content validation
   - SQL injection protection
   - XSS prevention
   - CORS configuration

### 🔧 Enterprise Features

- **Clean Architecture**: 5-layer separation with dependency injection
- **Error Handling**: Comprehensive error types with HTTP mapping
- **Logging**: Structured logging with tracing
- **Configuration**: Environment-based configuration management
- **Health Checks**: Database and system health monitoring
- **Rate Limiting**: Infrastructure ready for rate limiting
- **Pagination**: Consistent pagination across all list endpoints
- **Async Operations**: Full async/await implementation

## Development Workflow

### Adding New Features

1. **Domain Layer**: Define entities and business rules in `crates/domain/`
2. **Infrastructure**: Implement repositories and services in `crates/infrastructure/`
3. **Application**: Create use cases in `crates/application/`
4. **API**: Add HTTP handlers in `crates/api/`
5. **Tests**: Add tests in `tests/` directory

### Code Quality

```bash
# Format code
cargo fmt

# Run linter
cargo clippy

# Run all tests
cargo test

# Check for security issues
cargo audit
```

### Database Operations

```bash
# Create new migration
sqlx migrate add create_new_table

# Run migrations
sqlx migrate run

# Revert last migration
sqlx migrate revert
```

## Production Deployment

See [Deployment Guide](docs/deployment.md) for comprehensive production deployment instructions including:

- Docker containerization
- Kubernetes deployment
- Nginx reverse proxy setup
- SSL/TLS configuration
- Database optimization
- Monitoring and logging
- Security hardening

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Ensure PostgreSQL is running
   - Verify database exists and user has permissions

2. **File Upload Issues**
   - Check file size limits in configuration
   - Verify upload directory permissions
   - Check available disk space

3. **JWT Token Issues**
   - Ensure JWT_SECRET is set and consistent
   - Check token expiration settings
   - Verify token format in Authorization header

4. **WebSocket Connection Issues**
   - Check if WebSocket is enabled in configuration
   - Verify token authentication for WebSocket
   - Check firewall and proxy settings

### Logs and Debugging

```bash
# Enable debug logging
RUST_LOG=debug cargo run

# Check specific module logs
RUST_LOG=kingshare_api=debug,kingshare_infrastructure=info cargo run

# View structured logs
RUST_LOG=info cargo run 2>&1 | jq '.'
```

## Next Steps

1. **Frontend Integration**: Connect with your frontend application
2. **API Documentation**: Use the provided API documentation in `docs/api.md`
3. **WebSocket Integration**: Implement real-time features using WebSocket API
4. **Customization**: Modify business logic in domain and application layers
5. **Scaling**: Follow deployment guide for production scaling

## Support

- **API Documentation**: [docs/api.md](docs/api.md)
- **WebSocket Guide**: [docs/websocket.md](docs/websocket.md)
- **Deployment Guide**: [docs/deployment.md](docs/deployment.md)
- **Architecture Overview**: [README.md](README.md)

The KingShare backend is now fully implemented with real, production-ready code. All placeholder implementations have been replaced with working functionality.