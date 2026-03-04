#!/bin/bash
# Railway Environment Variables Setup Script
# This script helps you set up all required environment variables on Railway

echo "=============================================="
echo "   OTC Platform - Railway Setup Helper"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}This script will help you configure Railway environment variables.${NC}"
echo ""
echo "You'll need:"
echo "  1. Supabase Database URL"
echo "  2. Gmail App Password (for OTP emails)"
echo "  3. Vercel Frontend URL"
echo ""
echo "Press Enter to continue or Ctrl+C to exit..."
read

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found!${NC}"
    echo ""
    echo "Install it with:"
    echo "  npm install -g @railway/cli"
    echo ""
    echo "Then run:"
    echo "  railway login"
    echo "  railway link"
    echo ""
    exit 1
fi

echo ""
echo "=============================================="
echo "   Step 1: JWT Secrets"
echo "=============================================="
echo ""
echo "Generating random JWT secrets..."
JWT_ACCESS_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

echo -e "${GREEN}✓ JWT secrets generated${NC}"
echo ""

echo "=============================================="
echo "   Step 2: Database URL"
echo "=============================================="
echo ""
echo "Enter your Supabase DATABASE_URL:"
echo "  (Format: postgresql://postgres:password@host:5432/postgres)"
read -p "> " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL is required!${NC}"
    exit 1
fi

echo ""
echo "=============================================="
echo "   Step 3: Email Configuration"
echo "=============================================="
echo ""
echo "Do you want to configure email (OTP) now? (recommended)"
echo "  You'll need a SendGrid API Key (free: 100 emails/day)"
echo "  Setup guide: https://app.sendgrid.com/settings/api_keys"
echo ""
read -p "Configure email? (y/n): " CONFIGURE_EMAIL

if [ "$CONFIGURE_EMAIL" = "y" ] || [ "$CONFIGURE_EMAIL" = "Y" ]; then
    echo ""
    read -p "Enter your verified sender email: " SMTP_FROM
    read -p "Enter your SendGrid API Key (starts with SG.): " SENDGRID_API_KEY
    
    if [ -z "$SMTP_FROM" ] || [ -z "$SENDGRID_API_KEY" ]; then
        echo -e "${YELLOW}⚠️  Email configuration skipped (credentials empty)${NC}"
        CONFIGURE_EMAIL="n"
    elif [[ ! "$SENDGRID_API_KEY" == SG.* ]]; then
        echo -e "${YELLOW}⚠️  Invalid API key (must start with SG.)${NC}"
        CONFIGURE_EMAIL="n"
    else
        echo -e "${GREEN}✓ Email configured${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Email configuration skipped - OTPs will not be sent!${NC}"
fi

echo ""
echo "=============================================="
echo "   Step 4: Frontend URL"
echo "=============================================="
echo ""
echo "Enter your Vercel frontend URL:"
echo "  (e.g., https://otc-platform.vercel.app)"
read -p "> " FRONTEND_URL

if [ -z "$FRONTEND_URL" ]; then
    echo -e "${YELLOW}⚠️  Using default: http://localhost:3000${NC}"
    FRONTEND_URL="http://localhost:3000"
fi

echo ""
echo "=============================================="
echo "   Summary"
echo "=============================================="
echo ""
echo "The following variables will be set:"
echo ""
echo "  DATABASE_URL: ${DATABASE_URL:0:30}..."
echo "  JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET:0:20}..."
echo "  JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:0:20}..."
echo "  FRONTEND_URL: $FRONTEND_URL"
echo "  NODE_ENV: production"

if [ "$CONFIGURE_EMAIL" = "y" ] || [ "$CONFIGURE_EMAIL" = "Y" ]; then
    echo "  SENDGRID_API_KEY: ${SENDGRID_API_KEY:0:10}..."
    echo "  SMTP_FROM: $SMTP_FROM"
fi

echo ""
read -p "Proceed with Railway deployment? (y/n): " PROCEED

if [ "$PROCEED" != "y" ] && [ "$PROCEED" != "Y" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "=============================================="
echo "   Deploying to Railway..."
echo "=============================================="
echo ""

# Set environment variables
railway variables set DATABASE_URL="$DATABASE_URL"
railway variables set JWT_ACCESS_SECRET="$JWT_ACCESS_SECRET"
railway variables set JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
railway variables set JWT_ACCESS_EXPIRY="15m"
railway variables set JWT_REFRESH_EXPIRY="7d"
railway variables set FRONTEND_URL="$FRONTEND_URL"
railway variables set CORS_ORIGIN="$FRONTEND_URL"
railway variables set NODE_ENV="production"

if [ "$CONFIGURE_EMAIL" = "y" ] || [ "$CONFIGURE_EMAIL" = "Y" ]; then
    railway variables set SENDGRID_API_KEY="$SENDGRID_API_KEY"
    railway variables set SMTP_FROM="$SMTP_FROM"
fi

echo ""
echo -e "${GREEN}✓ Environment variables set!${NC}"
echo ""
echo "Railway will now redeploy your service automatically."
echo "This takes about 2-3 minutes."
echo ""
echo "You can monitor the deployment with:"
echo "  railway logs"
echo ""
echo "Once deployed, test with:"
echo "  curl https://YOUR-APP.up.railway.app/api/v1/health"
echo ""
echo -e "${GREEN}Done!${NC}"
