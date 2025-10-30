# KingShare Backend Deployment Guide

## Overview

This guide covers deploying the KingShare backend in various environments, from development to production.

## Prerequisites

- Docker and Docker Compose
- PostgreSQL 15+
- Rust 1.75+ (for building from source)
- Reverse proxy (Nginx/Apache) for production

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Server
KINGSHARE__SERVER__HOST=0.0.0.0
KINGSHARE__SERVER__PORT=8080
```

### Optional Variables

```bash
# Logging
RUST_LOG=info
KINGSHARE__LOGGING__LEVEL=info
KINGSHARE__LOGGING__FORMAT=json

# CORS
KINGSHARE__CORS__ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# File Storage
KINGSHARE__STORAGE__MAX_FILE_SIZE=104857600  # 100MB
KINGSHARE__STORAGE__STORAGE_PATH=./uploads

# WebSocket
KINGSHARE__WEBSOCKET__ENABLED=true
KINGSHARE__WEBSOCKET__MAX_CONNECTIONS=1000
KINGSHARE__WEBSOCKET__HEARTBEAT_INTERVAL=30
KINGSHARE__WEBSOCKET__CONNECTION_TIMEOUT=300

# Database Pool
KINGSHARE__DATABASE__MAX_CONNECTIONS=10
KINGSHARE__DATABASE__MIN_CONNECTIONS=1
KINGSHARE__DATABASE__CONNECT_TIMEOUT=30
KINGSHARE__DATABASE__IDLE_TIMEOUT=600

# Authentication
KINGSHARE__AUTH__JWT_EXPIRATION=3600
KINGSHARE__AUTH__REFRESH_TOKEN_EXPIRATION=604800
KINGSHARE__AUTH__PASSWORD_HASH_COST=12
```

## Development Deployment

### Using Docker Compose

1. **Clone and setup:**

   ```bash
   git clone <repository-url>
   cd qubators-kingshare-backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Start services:**

   ```bash
   docker-compose up -d
   ```

3. **Check logs:**

   ```bash
   docker-compose logs -f backend
   ```

4. **Stop services:**
   ```bash
   docker-compose down
   ```

### Local Development

1. **Setup database:**

   ```bash
   # Start PostgreSQL
   docker-compose up postgres -d

   # Or use local PostgreSQL
   createdb kingshare
   ```

2. **Set environment variables:**

   ```bash
   export DATABASE_URL=postgresql://localhost/kingshare
   export JWT_SECRET=your-development-secret-key
   ```

3. **Run migrations:**

   ```bash
   cargo install sqlx-cli
   sqlx migrate run
   ```

4. **Start development server:**
   ```bash
   cargo run
   # Or with auto-reload
   cargo watch -x run
   ```

## Production Deployment

### Docker Production Setup

1. **Create production environment file:**

   ```bash
   # .env.production
   DATABASE_URL=postgresql://kingshare:secure_password@db:5432/kingshare
   JWT_SECRET=your-super-secure-production-jwt-secret-minimum-32-characters
   RUST_LOG=info
   KINGSHARE__SERVER__HOST=0.0.0.0
   KINGSHARE__SERVER__PORT=8080
   KINGSHARE__CORS__ALLOWED_ORIGINS=https://yourdomain.com
   ```

2. **Create production docker-compose:**

   ```yaml
   # docker-compose.prod.yml
   version: "3.8"

   services:
     postgres:
       image: postgres:15-alpine
       environment:
         POSTGRES_DB: kingshare
         POSTGRES_USER: kingshare
         POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
       volumes:
         - postgres_data:/var/lib/postgresql/data
         - ./backups:/backups
       restart: unless-stopped
       networks:
         - kingshare-network

     backend:
       build: .
       env_file: .env.production
       volumes:
         - ./uploads:/app/uploads
         - ./logs:/app/logs
       depends_on:
         - postgres
       restart: unless-stopped
       networks:
         - kingshare-network
       labels:
         - "traefik.enable=true"
         - "traefik.http.routers.kingshare-api.rule=Host(`api.yourdomain.com`)"
         - "traefik.http.routers.kingshare-api.tls=true"
         - "traefik.http.routers.kingshare-api.tls.certresolver=letsencrypt"

   volumes:
     postgres_data:

   networks:
     kingshare-network:
       driver: bridge
   ```

3. **Deploy:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Kubernetes Deployment

1. **Create namespace:**

   ```yaml
   # namespace.yaml
   apiVersion: v1
   kind: Namespace
   metadata:
     name: kingshare
   ```

2. **Create secrets:**

   ```yaml
   # secrets.yaml
   apiVersion: v1
   kind: Secret
   metadata:
     name: kingshare-secrets
     namespace: kingshare
   type: Opaque
   stringData:
     DATABASE_URL: postgresql://kingshare:password@postgres:5432/kingshare
     JWT_SECRET: your-super-secure-jwt-secret
   ```

3. **Create deployment:**

   ```yaml
   # deployment.yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: kingshare-backend
     namespace: kingshare
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: kingshare-backend
     template:
       metadata:
         labels:
           app: kingshare-backend
       spec:
         containers:
           - name: backend
             image: kingshare-backend:latest
             ports:
               - containerPort: 8080
             envFrom:
               - secretRef:
                   name: kingshare-secrets
             resources:
               requests:
                 memory: "256Mi"
                 cpu: "250m"
               limits:
                 memory: "512Mi"
                 cpu: "500m"
             livenessProbe:
               httpGet:
                 path: /health
                 port: 8080
               initialDelaySeconds: 30
               periodSeconds: 10
             readinessProbe:
               httpGet:
                 path: /health
                 port: 8080
               initialDelaySeconds: 5
               periodSeconds: 5
   ```

4. **Create service:**

   ```yaml
   # service.yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: kingshare-backend-service
     namespace: kingshare
   spec:
     selector:
       app: kingshare-backend
     ports:
       - protocol: TCP
         port: 80
         targetPort: 8080
     type: ClusterIP
   ```

5. **Deploy to Kubernetes:**
   ```bash
   kubectl apply -f namespace.yaml
   kubectl apply -f secrets.yaml
   kubectl apply -f deployment.yaml
   kubectl apply -f service.yaml
   ```

### Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/kingshare-api
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # File upload size limit
    client_max_body_size 100M;

    # API endpoints
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket endpoint
    location /ws {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket specific
        proxy_buffering off;
        proxy_cache off;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8080;
        access_log off;
    }
}
```

## Database Setup

### PostgreSQL Configuration

1. **Create database and user:**

   ```sql
   CREATE DATABASE kingshare;
   CREATE USER kingshare WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE kingshare TO kingshare;
   ```

2. **Run migrations:**

   ```bash
   # Using sqlx-cli
   sqlx migrate run --database-url postgresql://kingshare:password@localhost/kingshare

   # Or using the application
   RUST_LOG=info ./target/release/server
   ```

### Database Backup

```bash
# Backup
pg_dump -h localhost -U kingshare kingshare > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
psql -h localhost -U kingshare kingshare < backup_20240101_120000.sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U kingshare kingshare | gzip > $BACKUP_DIR/kingshare_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "kingshare_*.sql.gz" -mtime +7 -delete
```

## Monitoring and Logging

### Application Logs

```bash
# View logs
docker-compose logs -f backend

# Log rotation with logrotate
# /etc/logrotate.d/kingshare
/app/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 app app
    postrotate
        docker-compose restart backend
    endscript
}
```

### Health Monitoring

```bash
# Health check script
#!/bin/bash
HEALTH_URL="http://localhost:8080/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "Service is healthy"
    exit 0
else
    echo "Service is unhealthy (HTTP $RESPONSE)"
    exit 1
fi
```

### Prometheus Metrics (Future Enhancement)

```yaml
# Add to docker-compose.yml
prometheus:
  image: prom/prometheus
  ports:
    - "9090:9090"
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml

grafana:
  image: grafana/grafana
  ports:
    - "3000:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
```

## Security Checklist

### Production Security

- [ ] Use HTTPS/TLS certificates
- [ ] Set strong JWT secrets (minimum 32 characters)
- [ ] Configure proper CORS origins
- [ ] Set up firewall rules
- [ ] Use non-root user in containers
- [ ] Enable database SSL connections
- [ ] Set up proper file permissions
- [ ] Configure rate limiting
- [ ] Enable security headers
- [ ] Regular security updates

### Environment Security

```bash
# Secure file permissions
chmod 600 .env.production
chown app:app .env.production

# Secure upload directory
chmod 755 uploads/
chown app:app uploads/

# Database connection security
# Use SSL: ?sslmode=require in DATABASE_URL
```

## Performance Optimization

### Database Optimization

```sql
-- Add indexes for better performance
CREATE INDEX CONCURRENTLY idx_files_owner_created ON files(owner_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_shares_token_active ON shares(share_token, is_active);
CREATE INDEX CONCURRENTLY idx_users_email_active ON users(email, is_active);

-- Analyze tables
ANALYZE users;
ANALYZE files;
ANALYZE shares;
```

### Application Tuning

```bash
# Environment variables for performance
KINGSHARE__DATABASE__MAX_CONNECTIONS=20
KINGSHARE__DATABASE__MIN_CONNECTIONS=5
KINGSHARE__SERVER__WORKERS=4  # Number of CPU cores

# Rust compilation optimizations
RUSTFLAGS="-C target-cpu=native"
cargo build --release
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

   ```bash
   # Check database status
   docker-compose ps postgres

   # Check logs
   docker-compose logs postgres

   # Test connection
   psql -h localhost -U kingshare kingshare
   ```

2. **File Upload Issues**

   ```bash
   # Check disk space
   df -h

   # Check permissions
   ls -la uploads/

   # Check file size limits
   grep MAX_FILE_SIZE .env
   ```

3. **WebSocket Connection Issues**

   ```bash
   # Check if WebSocket is enabled
   grep WEBSOCKET .env

   # Test WebSocket connection
   wscat -c ws://localhost:8080/ws
   ```

### Log Analysis

```bash
# Search for errors
grep -i error /app/logs/kingshare.log

# Monitor real-time logs
tail -f /app/logs/kingshare.log | grep ERROR

# Analyze performance
grep "request completed" /app/logs/kingshare.log | awk '{print $NF}' | sort -n
```

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer Configuration**
2. **Shared File Storage** (NFS, S3, etc.)
3. **Database Connection Pooling**
4. **Session Affinity** for WebSocket connections

### Vertical Scaling

1. **Increase CPU/Memory** resources
2. **Database Performance** tuning
3. **Connection Pool** optimization

This deployment guide provides comprehensive instructions for deploying KingShare backend in various environments with proper security, monitoring, and performance considerations.
