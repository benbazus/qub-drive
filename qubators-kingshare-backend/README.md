# KingShare Backend

Enterprise-level Rust backend for the KingShare file sharing application.

## Architecture

This project follows a clean architecture pattern with the following layers:

- **API Layer** (`crates/api`): HTTP handlers, routes, and middleware
- **Application Layer** (`crates/application`): Use cases, commands, and queries
- **Domain Layer** (`crates/domain`): Business entities, value objects, and repository traits
- **Infrastructure Layer** (`crates/infrastructure`): Database implementations, external services
- **Core Layer** (`crates/core`): Shared types, configuration, and error handling

## Features

### Core Platform
- 🚀 **High Performance**: Built with Rust and async/await
- 🏗️ **Clean Architecture**: Domain-driven design with clear separation of concerns
- 🔐 **Authentication**: JWT-based authentication with refresh tokens
- 🗄️ **Database**: PostgreSQL with SQLx for type-safe queries
- 📊 **Observability**: Structured logging with tracing
- 🐳 **Docker**: Containerized deployment
- ✅ **Testing**: Comprehensive test suite with mocking
- 📝 **Validation**: Request validation with custom error handling

### Google Drive-like Features
- 📁 **Drive Management**: Personal, shared, team, and organization drives with quota management
- 🗂️ **Folder Structure**: Hierarchical folder organization with drag-and-drop support
- 📄 **File Operations**: Upload, download, move, copy, star, and trash management
- 🔗 **Advanced Sharing**: User-based sharing, public links, and granular permissions
- 🔍 **Search & Discovery**: Full-text search, filters, recent files, and starred items
- 📊 **Storage Analytics**: Usage tracking, storage quotas, and detailed analytics

### Document Collaboration
- 📝 **Rich Text Documents**: Google Docs-like text editing with formatting
- 🤝 **Real-time Collaboration**: Live editing with operational transform
- 💬 **Comments & Suggestions**: Threaded comments and change suggestions
- 📚 **Version History**: Complete version tracking with restore capabilities
- 👥 **User Presence**: See who's editing and cursor positions
- 🔄 **Conflict Resolution**: Automatic merge conflict handling

### Spreadsheet Engine
- 📊 **Advanced Spreadsheets**: Google Sheets-like functionality
- 🧮 **Formula Engine**: 200+ built-in functions with dependency tracking
- 📈 **Charts & Visualizations**: Multiple chart types with customization
- 🔄 **Pivot Tables**: Dynamic data analysis and reporting
- 🎨 **Formatting**: Rich cell formatting and conditional formatting
- 📥 **Import/Export**: CSV, Excel, and other format support
- 🔍 **Data Validation**: Input validation and dropdown lists

### Forms System
- 📋 **Dynamic Forms**: Google Forms-like form builder
- 🎯 **Field Types**: 20+ field types including file upload, signatures, and ratings
- 🔀 **Conditional Logic**: Show/hide fields based on responses
- 📊 **Response Analytics**: Completion rates, abandonment analysis, and insights
- 🔗 **Integrations**: Connect to external services and webhooks
- 📧 **Notifications**: Email alerts and auto-responders
- 📱 **Mobile Optimized**: Responsive design for all devices

### Enterprise Features
- 🏢 **Team Drives**: Shared workspaces for organizations
- 🔐 **Advanced Permissions**: Role-based access control
- 📋 **Audit Logs**: Complete activity tracking and compliance
- 🔄 **Workflow Automation**: Custom workflows and approvals
- 🔌 **API Integration**: RESTful APIs for third-party integrations
- 📊 **Admin Dashboard**: User management and analytics
- 🔒 **Security**: Enterprise-grade security and encryption

### Real-time Features
- 🔌 **WebSocket Support**: Real-time notifications and live updates
- 📡 **Live Collaboration**: Real-time document editing and presence
- 🔔 **Instant Notifications**: File changes, shares, and comments
- 📊 **Live Analytics**: Real-time form responses and statistics

## Quick Start

### Prerequisites

- Rust 1.75+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd qubators-kingshare-backend
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the database**
   ```bash
   docker-compose up postgres -d
   ```

4. **Run migrations**
   ```bash
   cargo run --bin migrate
   ```

5. **Start the development server**
   ```bash
   cargo run
   ```

The server will start on `http://localhost:8080`

### Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user

### Users
- `GET /api/v1/users` - List users (admin only)
- `GET /api/v1/users/profile` - Get user profile
- `POST /api/v1/users/profile` - Update user profile

### Drive Management
- `POST /api/v1/drives` - Create a new drive
- `GET /api/v1/drives` - List user drives
- `GET /api/v1/drives/:drive_id` - Get drive details
- `PATCH /api/v1/drives/:drive_id` - Update drive
- `DELETE /api/v1/drives/:drive_id` - Delete drive
- `GET /api/v1/drives/:drive_id/storage` - Get storage usage
- `GET /api/v1/drives/:drive_id/activity` - Get drive activity

### Folders
- `POST /api/v1/drives/:drive_id/folders` - Create folder
- `GET /api/v1/drives/:drive_id/folders/:folder_id/contents` - Get folder contents
- `PATCH /api/v1/folders/:folder_id` - Update folder
- `DELETE /api/v1/folders/:folder_id` - Delete folder

### Drive Items
- `GET /api/v1/items/:item_id` - Get item details
- `POST /api/v1/items/:item_id/move` - Move item
- `POST /api/v1/items/:item_id/copy` - Copy item
- `POST /api/v1/items/:item_id/star` - Star item
- `DELETE /api/v1/items/:item_id/star` - Unstar item
- `POST /api/v1/items/:item_id/trash` - Move to trash
- `POST /api/v1/items/:item_id/restore` - Restore from trash

### Sharing
- `POST /api/v1/items/:item_id/share` - Share with users
- `POST /api/v1/items/:item_id/share/link` - Create sharing link
- `DELETE /api/v1/items/:item_id/share/link` - Revoke sharing link
- `GET /api/v1/shared-with-me` - Get items shared with user
- `GET /api/v1/recent` - Get recent items
- `GET /api/v1/starred` - Get starred items

### Documents
- `POST /api/v1/documents` - Create document
- `GET /api/v1/documents` - List documents
- `GET /api/v1/documents/:document_id` - Get document
- `PATCH /api/v1/documents/:document_id` - Update document
- `DELETE /api/v1/documents/:document_id` - Delete document

### Document Collaboration
- `POST /api/v1/documents/:document_id/collaborate/start` - Start collaboration
- `POST /api/v1/documents/:document_id/collaborate/join` - Join collaboration
- `POST /api/v1/documents/:document_id/operations` - Apply operations
- `GET /api/v1/documents/:document_id/operations` - Get pending operations

### Comments & Suggestions
- `POST /api/v1/documents/:document_id/comments` - Add comment
- `GET /api/v1/documents/:document_id/comments` - Get comments
- `POST /api/v1/comments/:comment_id/reply` - Reply to comment
- `POST /api/v1/comments/:comment_id/resolve` - Resolve comment
- `POST /api/v1/documents/:document_id/suggestions` - Create suggestion
- `POST /api/v1/suggestions/:suggestion_id/review` - Review suggestion

### Spreadsheets
- `POST /api/v1/spreadsheets` - Create spreadsheet
- `GET /api/v1/spreadsheets/:spreadsheet_id` - Get spreadsheet
- `POST /api/v1/spreadsheets/:spreadsheet_id/sheets` - Add sheet
- `PATCH /api/v1/sheets/:sheet_id/cells/:cell_ref` - Update cell
- `POST /api/v1/sheets/:sheet_id/formula/calculate` - Calculate formula
- `POST /api/v1/spreadsheets/:spreadsheet_id/charts` - Create chart
- `POST /api/v1/spreadsheets/:spreadsheet_id/pivot-tables` - Create pivot table

### Forms
- `POST /api/v1/forms` - Create form
- `GET /api/v1/forms` - List forms
- `GET /api/v1/forms/:form_id` - Get form
- `POST /api/v1/forms/:form_id/fields` - Add field
- `POST /api/v1/forms/:form_id/publish` - Publish form
- `POST /api/v1/forms/:form_id/submit` - Submit response (public)
- `GET /api/v1/forms/:form_id/responses` - Get responses
- `GET /api/v1/forms/:form_id/analytics` - Get analytics

### Templates
- `GET /api/v1/templates` - Get document templates
- `POST /api/v1/templates/:template_id/create` - Create from template
- `GET /api/v1/form-templates` - Get form templates

### Files (Legacy)
- `GET /api/v1/files` - List user files
- `POST /api/v1/files` - Upload file (multipart/form-data)
- `GET /api/v1/files/:id` - Get file metadata
- `POST /api/v1/files/:id` - Update file
- `DELETE /api/v1/files/:id` - Delete file
- `GET /api/v1/files/:id/download` - Download file
- `GET /api/v1/files/stats` - Get user storage statistics

### Shares (Legacy)
- `GET /api/v1/shares` - List user shares
- `POST /api/v1/shares` - Create share
- `GET /api/v1/shares/:id` - Get share details
- `POST /api/v1/shares/:id` - Update share
- `DELETE /api/v1/shares/:id` - Delete share
- `POST /api/v1/shares/:id/regenerate` - Regenerate share token
- `GET /api/v1/shares/token/:token` - Get share by token (public)
- `POST /api/v1/shares/token/:token/download` - Download shared file (public)

### WebSocket
- `GET /ws` - WebSocket connection endpoint
- `GET /api/v1/ws/stats` - Get WebSocket connection statistics
- `POST /api/v1/ws/cleanup` - Clean up inactive WebSocket connections

### Health
- `GET /health` - Health check

#### WebSocket Message Types
- **Authentication**: `Authenticate`, `AuthenticationResult`
- **File Operations**: `FileUploaded`, `FileDeleted`, `FileShared`
- **Share Operations**: `ShareAccessed`, `ShareExpired`
- **Real-time Updates**: `UserOnline`, `UserOffline`, `UploadProgress`
- **System**: `SystemNotification`, `Ping`, `Pong`, `Error`

See [API Documentation](docs/api.md) for detailed endpoint specifications.

## Configuration

Configuration is managed through environment variables and config files:

- Environment variables with `KINGSHARE__` prefix
- Config files in `config/` directory
- `.env` file for local development

See `.env.example` for all available configuration options.

## Testing

```bash
# Run all tests
cargo test

# Run tests with coverage
cargo tarpaulin --out html

# Run specific test
cargo test test_name
```

## Development

### Code Structure

```
src/
├── main.rs              # Application entry point
crates/
├── core/                # Core types and utilities
├── domain/              # Business logic and entities
├── infrastructure/      # External service implementations
├── application/         # Use cases and application services
└── api/                 # HTTP API layer
```

### Adding New Features

1. Define domain entities in `crates/domain/entities/`
2. Create repository traits in `crates/domain/repositories/`
3. Implement repositories in `crates/infrastructure/repositories/`
4. Create use cases in `crates/application/`
5. Add HTTP handlers in `crates/api/handlers/`
6. Update routes in `crates/api/routes.rs`

## Deployment

### Environment Variables

Key environment variables for production:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens (use a strong random key)
- `RUST_LOG`: Log level (info, debug, warn, error)
- `KINGSHARE__SERVER__PORT`: Server port (default: 8080)

### Security Considerations

- Change default JWT secret in production
- Use HTTPS in production
- Configure CORS appropriately
- Set up proper database permissions
- Use environment-specific configuration files
- Enable request rate limiting
- Set up proper logging and monitoring

## Documentation

- [API Documentation](docs/api.md) - Complete API reference
- [WebSocket Documentation](docs/websocket.md) - Real-time communication guide
- [Deployment Guide](docs/deployment.md) - Production deployment instructions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.