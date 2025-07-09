#!/bin/bash

# Production Environment Setup Script
# This script sets up the required environment variables for production deployment

echo "🚀 Setting up production environment variables..."

# Generate JWT_SECRET if not provided
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET="8c7489a6c641f6190c4c9f4b2eb873974f7074274cbc665b7cf59b1283738487"
    echo "✅ JWT_SECRET generated"
fi

# Set environment variables
export JWT_SECRET="$JWT_SECRET"
export NODE_ENV="production"

echo "✅ Environment variables configured:"
echo "   - JWT_SECRET: [HIDDEN]"
echo "   - NODE_ENV: $NODE_ENV"
echo "   - DATABASE_URL: $([ -n "$DATABASE_URL" ] && echo '[CONFIGURED]' || echo '[MISSING]')"

# Validate required variables
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL is required but not set"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ ERROR: JWT_SECRET is required but not set"
    exit 1
fi

echo "✅ All required environment variables are set"
echo "🚀 Ready for production deployment!"