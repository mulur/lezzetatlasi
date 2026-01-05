# Lezzet Atlası - Invite Code Management & Security System

A comprehensive security and invite code management system with abuse prevention, role-based access control, and audit logging.

## Features

### 🎫 Invite Code Management
- Cryptographically secure invite code generation
- Configurable expiration dates and usage limits
- Invite code validation and redemption
- Per-user invite code tracking

### 👥 User Role System (Gurme)
- **Basic**: Standard user with limited permissions
- **Gurme**: Enhanced user with invite generation privileges
- **Admin**: Full system access and user management

### 🛡️ Security Features
- Rate limiting per IP and endpoint
- Bad actor detection and blocking
- Duplicate account detection
- Suspicious pattern recognition
- Account lockout after failed login attempts
- JWT-based authentication

### 🚫 Abuse Prevention
- IP-based account creation limits
- Email pattern analysis (disposable emails, plus addressing, etc.)
- Similarity detection for usernames and emails
- Automated bad actor flagging
- Comprehensive audit logging

## Installation

1. Clone the repository:
```bash
git clone https://github.com/mulur/lezzetatlasi.git
cd lezzetatlasi
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Edit `.env` and configure your settings (especially JWT_SECRET)

5. Build the project:
```bash
npm run build
```

6. Start the server:
```bash
npm start
```

For development:
```bash
npm run dev
```

## API Endpoints

### Public Endpoints

#### Health Check
```
GET /health
```
Returns server health status.

### User Endpoints

#### Register User
```
POST /api/users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "newuser",
  "password": "securepassword123",
  "inviteCode": "ABCD-EFGH-IJKL"
}
```

#### Login
```
POST /api/users/login
Content-Type: application/json

{
  "emailOrUsername": "user@example.com",
  "password": "securepassword123"
}
```

#### Get Current User
```
GET /api/users/me
Authorization: Bearer <token>
```

### Invite Code Endpoints (Requires Gurme or Admin role)

#### Generate Invite Code
```
POST /api/invites/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "maxUses": 1,
  "expiryDays": 30,
  "purpose": "Friend invitation",
  "targetRole": "basic"
}
```

#### Redeem Invite Code
```
POST /api/invites/redeem
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "ABCD-EFGH-IJKL"
}
```

#### Get Invite Code Details
```
GET /api/invites/:code
Authorization: Bearer <token>
```

#### Get My Invite Codes
```
GET /api/invites/my/codes
Authorization: Bearer <token>
```

#### Deactivate Invite Code
```
DELETE /api/invites/:code
Authorization: Bearer <token>
```

### Admin Endpoints (Requires Admin role)

#### Promote User
```
POST /api/users/:userId/promote
Authorization: Bearer <token>
```

#### Demote User
```
POST /api/users/:userId/demote
Authorization: Bearer <token>
```

#### Deactivate User
```
POST /api/users/:userId/deactivate
Authorization: Bearer <token>
```

#### Get Bad Actors
```
GET /api/admin/bad-actors
Authorization: Bearer <token>
```

#### Add Bad Actor
```
POST /api/admin/bad-actors
Authorization: Bearer <token>
Content-Type: application/json

{
  "identifier": "192.168.1.1",
  "reason": "Multiple abuse attempts",
  "severity": "high",
  "permanent": false,
  "blockDurationMinutes": 1440
}
```

#### Remove Bad Actor
```
DELETE /api/admin/bad-actors/:identifier
Authorization: Bearer <token>
```

#### Get Audit Logs
```
GET /api/admin/audit-logs?userId=<userId>&action=<action>&limit=<limit>
Authorization: Bearer <token>
```

#### Get Security Events
```
GET /api/admin/security-events?limit=100
Authorization: Bearer <token>
```

#### Get User Activity
```
GET /api/admin/users/:userId/activity
Authorization: Bearer <token>
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment (development/production) |
| `JWT_SECRET` | (required) | Secret key for JWT tokens |
| `JWT_EXPIRES_IN` | 7d | JWT token expiration |
| `RATE_LIMIT_WINDOW_MS` | 900000 | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |
| `INVITE_CODE_LENGTH` | 12 | Length of invite codes |
| `INVITE_CODE_EXPIRY_DAYS` | 30 | Default invite expiration |
| `INVITE_CODE_MAX_USES` | 1 | Default max uses per invite |
| `BCRYPT_ROUNDS` | 12 | Password hashing rounds |
| `MAX_LOGIN_ATTEMPTS` | 5 | Max login attempts before lockout |
| `LOCKOUT_DURATION_MINUTES` | 30 | Account lockout duration |
| `MAX_ACCOUNTS_PER_IP` | 3 | Max accounts per IP address |
| `DUPLICATE_DETECTION_THRESHOLD` | 0.85 | Similarity threshold for duplicates |

## Security Considerations

### Production Deployment

1. **Change JWT Secret**: Generate a strong, random JWT secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. **Use HTTPS**: Always use HTTPS in production
3. **Database**: Replace in-memory database with PostgreSQL/MongoDB
4. **Rate Limiting**: Adjust rate limits based on your needs
5. **Monitoring**: Set up monitoring for security events
6. **Backup**: Regular backup of audit logs and user data

### Abuse Prevention Strategies

1. **Invite-Only Registration**: All registrations require valid invite codes
2. **IP-Based Limits**: Prevent mass account creation from single IP
3. **Email Validation**: Detect disposable emails and suspicious patterns
4. **Similarity Detection**: Identify duplicate accounts with similar credentials
5. **Bad Actor Blocking**: Automatic and manual IP/email blocking
6. **Rate Limiting**: Protect all endpoints from brute force attacks
7. **Account Lockout**: Temporary lockout after failed login attempts
8. **Audit Logging**: Complete audit trail for security analysis

### Invite Code Lifecycle

1. **Generation**: Gurme or Admin creates invite with configurable limits
2. **Distribution**: Code shared with intended recipient
3. **Validation**: System checks code validity, expiration, and usage limits
4. **Redemption**: New user registers using valid invite code
5. **Tracking**: System tracks who created and who used each code
6. **Expiration**: Codes automatically expire after set period
7. **Deactivation**: Creators or admins can manually deactivate codes

## Development

### Project Structure
```
src/
├── database/       # In-memory database (replace with real DB)
├── middleware/     # Authentication, rate limiting, security
├── models/         # (Future: Database models)
├── routes/         # API route handlers
├── services/       # Business logic
├── types/          # TypeScript type definitions
└── utils/          # Helper functions and configuration
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Architecture

### Component Overview

```
┌─────────────────┐
│   Client App    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Gateway    │
│  (Express.js)   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌──────────────┐
│Security │ │Authentication│
│Middleware│ │  Middleware  │
└─────────┘ └──────────────┘
         │
    ┌────┴─────┬──────────┬───────────┐
    │          │          │           │
    ▼          ▼          ▼           ▼
┌────────┐ ┌───────┐ ┌───────┐ ┌─────────┐
│ User   │ │Invite │ │Abuse  │ │ Audit   │
│Service │ │Service│ │Service│ │ Service │
└────────┘ └───────┘ └───────┘ └─────────┘
         │
         ▼
    ┌────────┐
    │Database│
    └────────┘
```

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For issues and questions, please open an issue on GitHub.
