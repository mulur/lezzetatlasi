# Lezzet Atlası - Secure Invite & User Management System

A production-ready security and invite code management system with comprehensive abuse prevention, role-based access control (Gurme system), and audit logging.

## 🎯 Overview

This system provides a secure, invite-only user registration platform with:
- **Invite Code Lifecycle Management**: Generate, validate, and track cryptographically secure invite codes
- **Gurme Role System**: Three-tier role hierarchy (Basic → Gurme → Admin)
- **Abuse Prevention**: Multi-layered protection against spam, duplicate accounts, and bad actors
- **Security**: Rate limiting, JWT authentication, account lockout, and comprehensive audit trails

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings (especially JWT_SECRET)

# Build
npm run build

# Start
npm start
```

## 📚 Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference, security guidelines, and deployment instructions.

## 🔑 Key Features

### Invite Code Management
- Cryptographically secure code generation
- Configurable expiration and usage limits
- Real-time validation and tracking
- Creator-based permissions

### Role-Based Access (Gurme System)
- **Basic**: Standard users
- **Gurme**: Can generate invite codes
- **Admin**: Full system management

### Security & Abuse Prevention
- Rate limiting (per IP, per endpoint)
- Bad actor detection and blocking
- Duplicate account prevention
- Email pattern analysis
- Account lockout mechanism
- Comprehensive audit logging

## 📖 Usage Example

```javascript
// Register a new user with invite code
POST /api/users/register
{
  "email": "user@example.com",
  "username": "newuser",
  "password": "securepass",
  "inviteCode": "ABCD-EFGH-IJKL"
}

// Generate invite code (Gurme/Admin)
POST /api/invites/generate
Authorization: Bearer <token>
{
  "maxUses": 1,
  "expiryDays": 30
}
```

## 🏗️ Architecture

Built with:
- **TypeScript** for type safety
- **Express.js** for API server
- **JWT** for authentication
- **bcrypt** for password hashing
- **Helmet** for security headers
- In-memory database (easily replaceable with PostgreSQL/MongoDB)

## 📄 License

MIT