# KingShare Backend API Documentation

## Overview

The KingShare Backend provides a comprehensive REST API for file sharing and management. This document describes all available endpoints, request/response formats, and authentication requirements.

## Base URL

```
http://localhost:8080/api/v1
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Response Format

All API responses follow this standard format:

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Optional message"
}
```

Error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "status": 400
  }
}
```

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "first_name": "John",
  "last_name": "Doe",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": "johndoe",
      "full_name": "John Doe",
      "role": "User"
    }
  }
}
```

#### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:** Same as register

#### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** Same as register (new tokens)

#### Logout
```http
POST /auth/logout
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": "Logged out successfully"
}
```

### Users

#### Get User Profile
```http
GET /users/profile
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe",
    "is_active": true,
    "is_verified": false,
    "role": "User",
    "created_at": "2024-01-01T00:00:00Z",
    "last_login_at": "2024-01-01T12:00:00Z"
  }
}
```

#### Update User Profile
```http
POST /users/profile
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "username": "newusername",
  "first_name": "Jane",
  "last_name": "Smith"
}
```

**Response:** Updated user profile (same format as GET)

#### List Users (Admin only)
```http
GET /users?page=1&limit=20
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": "johndoe",
      "first_name": "John",
      "last_name": "Doe",
      "is_active": true,
      "is_verified": false,
      "role": "User",
      "created_at": "2024-01-01T00:00:00Z",
      "last_login_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### Files

#### List Files
```http
GET /files?page=1&limit=20&public_only=false
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `public_only` (optional): Show only public files (default: false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "filename": "document.pdf",
      "original_filename": "My Document.pdf",
      "content_type": "application/pdf",
      "size": 1048576,
      "is_public": false,
      "download_count": 5,
      "created_at": "2024-01-01T00:00:00Z",
      "expires_at": null,
      "owner": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "username": "johndoe",
        "full_name": "John Doe"
      }
    }
  ]
}
```

#### Upload File
```http
POST /files
```

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body:** Multipart form with `file` field

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "filename": "document.pdf",
    "original_filename": "My Document.pdf",
    "content_type": "application/pdf",
    "size": 1048576,
    "is_public": false,
    "download_count": 0,
    "created_at": "2024-01-01T00:00:00Z",
    "expires_at": null,
    "owner": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "johndoe",
      "full_name": "John Doe"
    }
  }
}
```

#### Get File Metadata
```http
GET /files/{file_id}
```

**Headers:** `Authorization: Bearer <token>`

**Response:** Same as upload response

#### Update File
```http
POST /files/{file_id}
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "filename": "new-filename.pdf",
  "is_public": true,
  "expires_at": "2024-12-31T23:59:59Z"
}
```

**Response:** Updated file metadata

#### Delete File
```http
DELETE /files/{file_id}
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": "File deleted successfully"
}
```

#### Download File
```http
GET /files/{file_id}/download
```

**Headers:** `Authorization: Bearer <token>`

**Response:** File content with appropriate headers

#### Get Storage Statistics
```http
GET /files/stats
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "file_count": 25,
    "total_size": 52428800,
    "max_file_size": 104857600
  }
}
```

### Shares

#### List Shares
```http
GET /shares?page=1&limit=20
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "share_token": "abc123def456",
      "has_password": true,
      "max_downloads": 10,
      "download_count": 3,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "expires_at": "2024-12-31T23:59:59Z",
      "file": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "filename": "document.pdf",
        "content_type": "application/pdf",
        "size": 1048576,
        "human_readable_size": "1.00 MB"
      }
    }
  ]
}
```

#### Create Share
```http
POST /shares
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "file_id": "660e8400-e29b-41d4-a716-446655440001",
  "password": "sharepassword",
  "max_downloads": 10,
  "expires_at": "2024-12-31T23:59:59Z"
}
```

**Response:** Share info (same format as list)

#### Get Share
```http
GET /shares/{share_id}
```

**Headers:** `Authorization: Bearer <token>`

**Response:** Share info (same format as list)

#### Update Share
```http
POST /shares/{share_id}
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "password": "newpassword",
  "max_downloads": 20,
  "expires_at": "2024-12-31T23:59:59Z",
  "is_active": true
}
```

**Response:** Updated share info

#### Delete Share
```http
DELETE /shares/{share_id}
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": "Share deleted successfully"
}
```

#### Regenerate Share Token
```http
POST /shares/{share_id}/regenerate
```

**Headers:** `Authorization: Bearer <token>`

**Response:** Share info with new token

#### Get Share by Token (Public)
```http
GET /shares/token/{share_token}
```

**Response:** Share info (no authentication required)

#### Download Shared File (Public)
```http
POST /shares/token/{share_token}/download
```

**Request Body:**
```json
{
  "password": "sharepassword"
}
```

**Response:** File content with appropriate headers

### WebSocket

#### Connect to WebSocket
```
ws://localhost:8080/ws?token=<jwt_token>
```

See [WebSocket Documentation](websocket.md) for detailed message formats.

#### Get WebSocket Statistics
```http
GET /ws/stats
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "total_connections": 42,
  "unique_users": 35,
  "connections_by_user": {
    "550e8400-e29b-41d4-a716-446655440000": 2
  }
}
```

#### Cleanup WebSocket Connections
```http
POST /ws/cleanup
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "removed_connections": 5
}
```

### Health

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T12:00:00Z",
    "version": "0.1.0",
    "database": "healthy"
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_ERROR` | Authentication required or failed |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Resource already exists |
| `BAD_REQUEST` | Invalid request |
| `INTERNAL_ERROR` | Server internal error |
| `DATABASE_ERROR` | Database operation failed |
| `JWT_ERROR` | JWT token error |
| `PASSWORD_HASH_ERROR` | Password hashing error |

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- Authentication endpoints: 5 requests per minute per IP
- File upload: 10 requests per minute per user
- Other endpoints: 100 requests per minute per user

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

## File Upload Limits

- Maximum file size: 100 MB
- Allowed file types: Images, documents, text files, archives, media files
- Blocked extensions: Executable files (.exe, .bat, .cmd, etc.)

## Pagination

List endpoints support pagination with these query parameters:

- `page`: Page number (starts from 1)
- `limit`: Items per page (max 100)

Pagination info is included in the response metadata when applicable.

## CORS

The API supports CORS for web applications. Configure allowed origins in the server configuration.

## Security Considerations

1. **HTTPS**: Use HTTPS in production
2. **JWT Secrets**: Use strong, random JWT secrets
3. **File Validation**: All uploaded files are validated
4. **Rate Limiting**: Implemented to prevent abuse
5. **Input Validation**: All inputs are validated
6. **SQL Injection**: Protected by using parameterized queries
7. **XSS**: JSON responses are properly escaped