# Deployment Configuration Guide

## Required Environment Variables

### Production Requirements
The following environment variables must be set in production:

```bash
# Database Configuration
DATABASE_URL=your_postgresql_connection_string

# JWT Authentication
JWT_SECRET=your_secure_jwt_secret_key
```

### Optional Environment Variables
```bash
# Node Environment (automatically set by platform)
NODE_ENV=production

# Rate Limiting (uses defaults if not set)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_ATTEMPTS=5
```

## Security Features

### Environment Validation
- Validates all required environment variables at startup
- Provides clear error messages for missing variables
- Gracefully exits if critical variables are missing

### Trust Proxy Configuration
- Automatically configures trust proxy settings for production
- Ensures rate limiting works correctly behind reverse proxies
- Prevents header spoofing issues

### JWT Security
- Uses secure random 64-character hex string for JWT_SECRET
- Tokens expire after 24 hours
- Includes issuer and audience validation
- Uses bcrypt with 12 salt rounds for password hashing

## Deployment Steps

1. **Set Environment Variables**
   ```bash
   JWT_SECRET=8c7489a6c641f6190c4c9f4b2eb873974f7074274cbc665b7cf59b1283738487
   DATABASE_URL=your_database_url
   NODE_ENV=production
   ```

2. **Database Setup**
   - Ensure PostgreSQL database is available
   - Run migrations if needed: `npm run db:push`

3. **Build Application**
   ```bash
   npm run build
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

## Troubleshooting

### Common Issues

**JWT_SECRET Missing**
- Error: "Missing JWT_SECRET environment variable in production"
- Solution: Set JWT_SECRET environment variable

**Database Connection Failed**
- Error: "Missing required environment variable: DATABASE_URL"
- Solution: Verify DATABASE_URL is correct and accessible

**Port Binding Issues**
- Error: "Server failed to start: EADDRINUSE"
- Solution: Ensure port 5000 is available or change PORT env var

**Rate Limiting Errors**
- Error: "X-Forwarded-For header validation error"
- Solution: Trust proxy is now automatically configured for production

## Security Checklist

- ✅ JWT_SECRET is set and secure (64+ character random string)
- ✅ Database connection is encrypted
- ✅ Trust proxy configured for production
- ✅ Rate limiting active (100 req/15min API, 5 req/15min auth)
- ✅ Security headers enabled
- ✅ Password strength requirements enforced
- ✅ Input validation and sanitization active
- ✅ Environment validation at startup
- ✅ Error handling with proper logging