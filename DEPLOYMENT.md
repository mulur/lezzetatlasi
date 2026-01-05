# Deployment Guide

## Prerequisites

- Node.js 18+ and npm
- Production database (PostgreSQL, MongoDB, or similar)
- HTTPS certificate for production
- Environment variables configured

## Production Setup

### 1. Install Dependencies

```bash
npm install --production
```

### 2. Configure Environment

Create a `.env` file with production values:

```env
NODE_ENV=production
PORT=3000

# IMPORTANT: Generate a strong secret
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Invite Codes
INVITE_CODE_LENGTH=12
INVITE_CODE_EXPIRY_DAYS=30
INVITE_CODE_MAX_USES=1

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=30

# Abuse Prevention
MAX_ACCOUNTS_PER_IP=3
DUPLICATE_DETECTION_THRESHOLD=0.85
```

### 3. Generate JWT Secret

```bash
openssl rand -base64 32
```

Copy the output to `JWT_SECRET` in your `.env` file.

### 4. Build the Application

```bash
npm run build
```

### 5. Database Migration

**IMPORTANT**: The current implementation uses an in-memory database for demonstration.
For production, you must:

1. Choose a database (PostgreSQL recommended)
2. Install the database driver:
   ```bash
   npm install pg
   # or
   npm install mongodb
   ```
3. Replace `src/database/index.ts` with real database implementation
4. Run migrations to create tables/collections

Example PostgreSQL schema:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(30) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  is_active BOOLEAN DEFAULT TRUE,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  invited_by UUID REFERENCES users(id)
);

CREATE TABLE invite_codes (
  code VARCHAR(20) PRIMARY KEY,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  max_uses INTEGER NOT NULL,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  used_by UUID[],
  metadata JSONB
);

CREATE TABLE bad_actors (
  identifier VARCHAR(255) PRIMARY KEY,
  reason TEXT NOT NULL,
  detected_at TIMESTAMP DEFAULT NOW(),
  severity VARCHAR(20) NOT NULL,
  blocked_until TIMESTAMP,
  permanent BOOLEAN DEFAULT FALSE
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  success BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_invite_codes_created_by ON invite_codes(created_by);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

### 6. Start the Server

Using PM2 (recommended):

```bash
npm install -g pm2
pm2 start dist/index.js --name lezzetatlasi
pm2 save
pm2 startup
```

Or using systemd:

```ini
# /etc/systemd/system/lezzetatlasi.service
[Unit]
Description=Lezzet Atlasi API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/lezzetatlasi
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable lezzetatlasi
sudo systemctl start lezzetatlasi
```

## Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.lezzetatlasi.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.lezzetatlasi.com;
    
    ssl_certificate /etc/letsencrypt/live/api.lezzetatlasi.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.lezzetatlasi.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }
}

# Define rate limit zone
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

## Monitoring

### Application Logs

```bash
# PM2
pm2 logs lezzetatlasi

# Systemd
journalctl -u lezzetatlasi -f
```

### Health Check Monitoring

Set up monitoring to ping `/health` endpoint every minute:

```bash
# Using uptime monitoring service (Uptime Robot, Pingdom, etc.)
# Monitor: https://api.lezzetatlasi.com/health
# Expected response: {"status":"healthy"}
```

### Database Backups

```bash
# PostgreSQL daily backup
0 2 * * * pg_dump lezzetatlasi > /backups/lezzetatlasi-$(date +\%Y\%m\%d).sql
```

## Security Checklist

- [ ] JWT_SECRET is strong and random
- [ ] HTTPS is enabled (not HTTP)
- [ ] Database credentials are secure
- [ ] Firewall rules are configured
- [ ] Rate limiting is enabled at nginx level
- [ ] Database backups are scheduled
- [ ] Monitoring alerts are configured
- [ ] Log rotation is configured
- [ ] Security headers are enabled
- [ ] CORS is properly configured
- [ ] Environment variables are not committed

## Scaling

### Horizontal Scaling

The application is stateless (except for in-memory database). To scale:

1. Replace in-memory database with Redis or PostgreSQL
2. Use a load balancer (nginx, HAProxy, AWS ALB)
3. Deploy multiple instances behind load balancer
4. Share session state via Redis

### Load Balancer Configuration

```nginx
upstream lezzetatlasi_backend {
    least_conn;
    server 10.0.1.10:3000;
    server 10.0.1.11:3000;
    server 10.0.1.12:3000;
}

server {
    listen 443 ssl http2;
    server_name api.lezzetatlasi.com;
    
    # ... SSL config ...
    
    location / {
        proxy_pass http://lezzetatlasi_backend;
        # ... proxy headers ...
    }
}
```

## Troubleshooting

### Server Won't Start

Check logs:
```bash
pm2 logs lezzetatlasi --lines 100
```

Common issues:
- Port already in use (change PORT in .env)
- Missing JWT_SECRET (set in .env)
- Database connection failed (check credentials)

### High Memory Usage

In-memory database will grow over time. For production:
- Use external database
- Implement cleanup for old audit logs
- Monitor memory with `pm2 monit`

### Rate Limit Too Strict

Adjust in `.env`:
```env
RATE_LIMIT_WINDOW_MS=900000  # Increase window
RATE_LIMIT_MAX_REQUESTS=200  # Increase limit
```

## Updates and Maintenance

```bash
# Pull latest code
git pull

# Install dependencies
npm install

# Rebuild
npm run build

# Restart
pm2 restart lezzetatlasi
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/mulur/lezzetatlasi/issues
- Documentation: See README.md and API_DOCUMENTATION.md
