# WebSocket API Documentation

## Overview

The KingShare backend provides real-time communication through WebSocket connections. This enables live updates for file operations, user presence, and system notifications.

## Connection

### Endpoint
```
ws://localhost:8080/ws
```

### Authentication
WebSocket connections can be authenticated by providing a JWT token as a query parameter:
```
ws://localhost:8080/ws?token=your_jwt_token
```

Anonymous connections are also supported for public features.

## Message Format

All WebSocket messages follow this JSON structure:

```json
{
  "type": "MessageType",
  "data": {
    // Message-specific data
  }
}
```

## Message Types

### Authentication Messages

#### Authenticate
Client sends JWT token for authentication:
```json
{
  "type": "Authenticate",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### AuthenticationResult
Server responds with authentication status:
```json
{
  "type": "AuthenticationResult",
  "data": {
    "success": true,
    "message": "Authenticated successfully"
  }
}
```

### File Operation Messages

#### FileUploaded
Notifies when a file is uploaded:
```json
{
  "type": "FileUploaded",
  "data": {
    "file_id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "document.pdf",
    "size": 1048576
  }
}
```

#### FileDeleted
Notifies when a file is deleted:
```json
{
  "type": "FileDeleted",
  "data": {
    "file_id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "document.pdf"
  }
}
```

#### FileShared
Notifies when a file is shared:
```json
{
  "type": "FileShared",
  "data": {
    "share_id": "660e8400-e29b-41d4-a716-446655440001",
    "file_id": "550e8400-e29b-41d4-a716-446655440000",
    "share_token": "abc123def456"
  }
}
```

### Share Operation Messages

#### ShareAccessed
Notifies when a shared file is accessed:
```json
{
  "type": "ShareAccessed",
  "data": {
    "share_id": "660e8400-e29b-41d4-a716-446655440001",
    "file_id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "document.pdf"
  }
}
```

#### ShareExpired
Notifies when a share expires:
```json
{
  "type": "ShareExpired",
  "data": {
    "share_id": "660e8400-e29b-41d4-a716-446655440001",
    "file_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Real-time Update Messages

#### UserOnline
Notifies when a user comes online:
```json
{
  "type": "UserOnline",
  "data": {
    "user_id": "770e8400-e29b-41d4-a716-446655440002",
    "username": "john_doe"
  }
}
```

#### UserOffline
Notifies when a user goes offline:
```json
{
  "type": "UserOffline",
  "data": {
    "user_id": "770e8400-e29b-41d4-a716-446655440002",
    "username": "john_doe"
  }
}
```

#### UploadProgress
Real-time upload progress updates:
```json
{
  "type": "UploadProgress",
  "data": {
    "file_id": "550e8400-e29b-41d4-a716-446655440000",
    "progress": 0.75,
    "bytes_uploaded": 786432,
    "total_bytes": 1048576
  }
}
```

#### DownloadStarted
Notifies when a download begins:
```json
{
  "type": "DownloadStarted",
  "data": {
    "file_id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "document.pdf"
  }
}
```

### System Messages

#### SystemNotification
System-wide notifications:
```json
{
  "type": "SystemNotification",
  "data": {
    "message": "System maintenance scheduled for 2:00 AM UTC",
    "level": "Warning"
  }
}
```

Notification levels: `Info`, `Warning`, `Error`, `Success`

#### Ping/Pong
Heartbeat messages to keep connection alive:
```json
{
  "type": "Ping"
}
```

```json
{
  "type": "Pong"
}
```

#### Error
Error messages:
```json
{
  "type": "Error",
  "data": {
    "code": "INVALID_MESSAGE",
    "message": "Invalid message format"
  }
}
```

## Client Implementation Examples

### JavaScript/Browser
```javascript
const ws = new WebSocket('ws://localhost:8080/ws?token=your_jwt_token');

ws.onopen = function(event) {
    console.log('Connected to WebSocket');
};

ws.onmessage = function(event) {
    const message = JSON.parse(event.data);
    console.log('Received:', message);
    
    switch(message.type) {
        case 'FileUploaded':
            handleFileUploaded(message.data);
            break;
        case 'UserOnline':
            handleUserOnline(message.data);
            break;
        // Handle other message types...
    }
};

ws.onerror = function(error) {
    console.error('WebSocket error:', error);
};

ws.onclose = function(event) {
    console.log('WebSocket connection closed');
};

// Send authentication message
function authenticate(token) {
    ws.send(JSON.stringify({
        type: 'Authenticate',
        data: { token: token }
    }));
}

// Send ping
function sendPing() {
    ws.send(JSON.stringify({ type: 'Ping' }));
}
```

### Node.js
```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080/ws?token=your_jwt_token');

ws.on('open', function open() {
    console.log('Connected to WebSocket');
});

ws.on('message', function message(data) {
    const message = JSON.parse(data);
    console.log('Received:', message);
});

ws.on('error', function error(err) {
    console.error('WebSocket error:', err);
});

ws.on('close', function close() {
    console.log('WebSocket connection closed');
});
```

## Connection Management

### Statistics Endpoint
Get current WebSocket connection statistics:
```http
GET /api/v1/ws/stats
```

Response:
```json
{
  "total_connections": 42,
  "unique_users": 35,
  "connections_by_user": {
    "550e8400-e29b-41d4-a716-446655440000": 2,
    "660e8400-e29b-41d4-a716-446655440001": 1
  }
}
```

### Cleanup Endpoint
Clean up inactive connections:
```http
POST /api/v1/ws/cleanup
```

Response:
```json
{
  "removed_connections": 5
}
```

## Best Practices

1. **Reconnection Logic**: Implement automatic reconnection with exponential backoff
2. **Heartbeat**: Send ping messages regularly to keep connection alive
3. **Message Queuing**: Queue messages when connection is lost and resend on reconnect
4. **Error Handling**: Handle all error cases gracefully
5. **Authentication**: Always authenticate connections for user-specific features
6. **Rate Limiting**: Implement client-side rate limiting to avoid overwhelming the server

## Security Considerations

1. **Token Validation**: JWT tokens are validated on connection and message handling
2. **User Isolation**: Users only receive messages relevant to them
3. **Rate Limiting**: Server implements rate limiting to prevent abuse
4. **Connection Limits**: Maximum connections per user and globally
5. **Message Validation**: All incoming messages are validated before processing

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_MESSAGE` | Message format is invalid |
| `AUTHENTICATION_REQUIRED` | Authentication required for this operation |
| `INVALID_TOKEN` | JWT token is invalid or expired |
| `RATE_LIMITED` | Too many messages sent |
| `CONNECTION_LIMIT` | Maximum connections exceeded |
| `INTERNAL_ERROR` | Server internal error |