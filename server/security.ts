// Security configuration and utilities
import rateLimit from "express-rate-limit";
import type { Request, Response, NextFunction } from "express";

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Remove server info
  res.removeHeader('x-powered-by');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  next();
}

// API rate limiting
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: process.env.NODE_ENV === 'production', // Enable trust proxy in production
});

// Authentication rate limiting
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts, please try again later.',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: process.env.NODE_ENV === 'production', // Enable trust proxy in production
});

// Input validation and sanitization
export function validateInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>&"'/]/g, '');
  }
  if (Array.isArray(input)) {
    return input.map(validateInput);
  }
  if (typeof input === 'object' && input !== null) {
    const validated: any = {};
    for (const [key, value] of Object.entries(input)) {
      validated[key] = validateInput(value);
    }
    return validated;
  }
  return input;
}

// Password strength validation
export function validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }
  if (password.length > 128) {
    return { isValid: false, message: "Password too long" };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!/\d/.test(password)) {
    return { isValid: false, message: "Password must contain at least one number" };
  }
  if (!/[@$!%*?&]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one special character (@$!%*?&)" };
  }
  return { isValid: true };
}

// SQL injection prevention (basic)
export function sanitizeForDatabase(input: string): string {
  return input.replace(/[';-]/g, '').replace(/--/g, '');
}

// XSS prevention
export function sanitizeForHTML(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Environment validation
export function validateEnvironment(): void {
  const requiredEnvVars = ['DATABASE_URL'];
  const missingVars: string[] = [];
  
  if (process.env.NODE_ENV === 'production') {
    requiredEnvVars.push('JWT_SECRET');
  }
  
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variable${missingVars.length > 1 ? 's' : ''} in production: ${missingVars.join(', ')}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  console.log('✅ Environment validation passed');
}

// Request logging for security monitoring
export function securityLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    };
    
    // Log suspicious activity
    if (res.statusCode >= 400) {
      console.warn('Security Event:', logData);
    }
  });
  
  next();
}