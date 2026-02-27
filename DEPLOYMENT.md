# Deployment Guide

This guide covers deploying the Push Capture application to production.

## Prerequisites

- **Node.js** 20+ or **Bun** latest
- **PostgreSQL** 16+
- **Docker** and **Docker Compose** (for containerized deployment)
- **Domain name** with SSL certificate (recommended for production)

## Quick Start (Docker)

### 1. Generate VAPID Keys

Generate VAPID keys for Web Push notifications:

```bash
npx web-push generate-vapid-keys
```

### 2. Configure Environment

Copy the production environment template and fill in your values:

```bash
cp .env.production .env
```

Edit `.env` and provide:
- `DATABASE_URL` - PostgreSQL connection string
- `VAPID_PUBLIC_KEY` - From step 1
- `VAPID_PRIVATE_KEY` - From step 1
- `VAPID_SUBJECT` - Your contact email (e.g., `mailto:admin@yourdomain.com`)
- `CORS_ORIGINS` - Comma-separated list of allowed frontend origins
- `VITE_API_URL` - Public API URL for frontend

### 3. Start Services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Run Database Migrations

```bash
docker-compose -f docker-compose.prod.yml exec backend bun run db:push
```

### 5. Verify Health

Check that all services are healthy:

```bash
# Backend health
curl http://localhost:3001/health

# Admin dashboard health
curl http://localhost/health

# Subscriber landing health
curl http://localhost:8080/health
```

## Manual Deployment

### Backend

```bash
cd packages/backend

# Install dependencies
bun install

# Build TypeScript
bun run build

# Run database migrations
bun run db:push

# Start server
NODE_ENV=production bun start
```

### Admin Dashboard

```bash
cd packages/admin-dashboard

# Install dependencies
bun install

# Build for production
bun run build

# Serve with a production web server (nginx recommended)
# Example: copy dist/ to nginx html directory
```

### Subscriber Landing

```bash
cd packages/subscriber-landing

# Install dependencies
bun install

# Build for production
bun run build

# Serve with nginx
```

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | No | Environment mode | `production` |
| `PORT` | No | Backend port (default: 3001) | `3001` |
| `LOG_LEVEL` | No | Logging level | `info` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `VAPID_PUBLIC_KEY` | Yes | VAPID public key | `BBB...` |
| `VAPID_PRIVATE_KEY` | Yes | VAPID private key | `AAA...` |
| `VAPID_SUBJECT` | Yes | VAPID subject (contact) | `mailto:admin@example.com` |
| `CORS_ORIGINS` | Yes | Allowed CORS origins | `https://admin.domain.com,https://landing.domain.com` |
| `VITE_API_URL` | Frontend | Backend API URL | `https://api.domain.com` |

## Production Considerations

### SSL/TLS Configuration

For production, use a reverse proxy (nginx) with SSL:

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Database Backups

Set up regular database backups:

```bash
# Daily backup cron job
0 2 * * * docker-compose exec postgres pg_dump -U postgres push_capture > /backup/push_capture_$(date +\%Y\%m\%d).sql
```

### Monitoring

The application exposes several endpoints for monitoring:

- `/health` - Health check with database status
- `/ready` - Readiness probe (Kubernetes)
- `/live` - Liveness probe (Kubernetes)
- `/api/metrics` - Application metrics
- `/api/metrics/prometheus` - Prometheus-format metrics

### Rate Limiting

Default rate limits:
- API endpoints: 100 requests per 15 minutes
- Subscriptions: 5 requests per hour
- Push notifications: 60 per minute

Adjust in `packages/backend/src/middleware/rate-limit.ts`.

### Security Headers

The following security headers are automatically added in production:
- `Strict-Transport-Security` - HSTS with 1-year max-age
- `X-Content-Type-Options` - Prevents MIME sniffing
- `X-Frame-Options` - Prevents clickjacking
- `X-XSS-Protection` - XSS protection
- `Content-Security-Policy` - CSP header
- `Referrer-Policy` - Controls referrer information
- `Permissions-Policy` - Restricts browser features

## Scaling

### Horizontal Scaling

For multiple backend instances:

1. Use an external PostgreSQL instance
2. Use Redis for rate limiting (replace in-memory store)
3. Place behind a load balancer
4. Share `DATABASE_URL` across instances

### Kubernetes

Example deployment configuration:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: push-capture-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: push-capture-backend
  template:
    metadata:
      labels:
        app: push-capture-backend
    spec:
      containers:
      - name: backend
        image: push-capture-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        livenessProbe:
          httpGet:
            path: /live
            port: 3001
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
```

## Troubleshooting

### Database Connection Issues

Check DATABASE_URL format and network connectivity:

```bash
# Test database connection
psql $DATABASE_URL
```

### VAPID Key Errors

Ensure keys are properly generated and match:

```bash
# Regenerate keys
npx web-push generate-vapid-keys
```

### CORS Errors

Verify `CORS_ORIGINS` includes your frontend domains:

```bash
# Check allowed origins
curl -H "Origin: https://yourdomain.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://localhost:3001/api/subscriptions
```

### Health Check Failures

Check service logs:

```bash
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs postgres
```

## Maintenance

### Database Migrations

```bash
# Generate migration
bun run db:generate

# Apply migration
bun run db:push

# View migration status
bun run db:studio
```

### Log Rotation

Configure log rotation for long-running deployments:

```bash
# /etc/logrotate.d/push-capture
/var/log/push-capture/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review environment configuration
- Verify database connectivity
- Check rate limiting status
