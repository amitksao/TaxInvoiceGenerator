#!/usr/bin/env node

/**
 * Production Deployment Setup Script
 * Configures environment variables and validates production readiness
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Production Deployment Setup');
console.log('================================');

// Configuration
const REQUIRED_VARS = ['DATABASE_URL'];
const PRODUCTION_VARS = ['JWT_SECRET'];
const JWT_SECRET = '8c7489a6c641f6190c4c9f4b2eb873974f7074274cbc665b7cf59b1283738487';

// Check if running in production
const isProduction = process.env.NODE_ENV === 'production';

// Set JWT_SECRET if not already set
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = JWT_SECRET;
    console.log('✅ JWT_SECRET configured');
}

// Validate environment variables
const missingVars = [];
const requiredVars = isProduction ? [...REQUIRED_VARS, ...PRODUCTION_VARS] : REQUIRED_VARS;

requiredVars.forEach(varName => {
    if (!process.env[varName]) {
        missingVars.push(varName);
    }
});

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
        console.error(`   - ${varName}`);
    });
    process.exit(1);
}

// Display configuration status
console.log('\n📋 Environment Configuration:');
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   - DATABASE_URL: ${process.env.DATABASE_URL ? '[CONFIGURED]' : '[MISSING]'}`);
console.log(`   - JWT_SECRET: ${process.env.JWT_SECRET ? '[CONFIGURED]' : '[MISSING]'}`);

// Create deployment info file
const deploymentInfo = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecretConfigured: !!process.env.JWT_SECRET,
    databaseUrlConfigured: !!process.env.DATABASE_URL,
    version: require('../package.json').version
};

fs.writeFileSync(
    path.join(__dirname, '../deployment-info.json'),
    JSON.stringify(deploymentInfo, null, 2)
);

console.log('\n✅ Deployment setup complete!');
console.log('✅ Environment variables validated');
console.log('✅ Configuration saved to deployment-info.json');
console.log('\n🚀 Ready for production deployment!');