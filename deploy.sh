#!/bin/bash
# Deploy script for Vartmaan Sarokaar to Cloudflare

set -e

echo "🚀 Vartmaan Sarokaar Production Deployment"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
command -v wrangler >/dev/null 2>&1 || { echo -e "${RED}Error: wrangler is not installed. Run: npm install -g wrangler${NC}"; exit 1; }

# Check if logged in
echo "🔑 Checking Cloudflare authentication..."
wrangler whoami || { echo -e "${RED}Error: Not authenticated. Run: wrangler login${NC}"; exit 1; }

# Step 1: Check D1 database
echo ""
echo -e "${YELLOW}Step 1: Checking D1 Database...${NC}"
if ! wrangler d1 list | grep -q "vartmaansarokar-db"; then
    echo -e "${YELLOW}Creating D1 database...${NC}"
    wrangler d1 create vartmaansarokar-db
    echo -e "${YELLOW}If this DB is new: copy the printed database_id into wrangler.toml, then re-run deploy.${NC}"
    echo -e "${GREEN}✅ D1 database created${NC}"
else
    echo -e "${GREEN}✅ D1 database already exists${NC}"
fi

# Step 2: Check R2 bucket
echo ""
echo -e "${YELLOW}Step 2: Checking R2 Bucket...${NC}"
if ! wrangler r2 bucket list | grep -q "vartmaan-media"; then
    echo -e "${YELLOW}Creating R2 bucket...${NC}"
    wrangler r2 bucket create vartmaan-media
    echo -e "${GREEN}✅ R2 bucket created${NC}"
else
    echo -e "${GREEN}✅ R2 bucket already exists${NC}"
fi

# Step 3: Apply database schema
echo ""
echo -e "${YELLOW}Step 3: Applying Database Schema...${NC}"
wrangler d1 execute vartmaansarokar-db --file=schema.sql -c wrangler.worker.toml
echo -e "${GREEN}✅ Database schema applied${NC}"

# Step 4: Check secrets
echo ""
echo -e "${YELLOW}Step 4: Checking Secrets...${NC}"
SECRETS=$(wrangler secret list 2>/dev/null || echo "")

if ! echo "$SECRETS" | grep -q "JWT_SECRET"; then
    echo -e "${YELLOW}⚠️ JWT_SECRET not set. Run: wrangler secret put JWT_SECRET${NC}"
fi

if ! echo "$SECRETS" | grep -q "STAFF_PASSWORD"; then
    echo -e "${YELLOW}⚠️ STAFF_PASSWORD not set. Run: wrangler secret put STAFF_PASSWORD${NC}"
fi

if ! echo "$SECRETS" | grep -q "GOOGLE_CLIENT_ID"; then
    echo -e "${YELLOW}⚠️ GOOGLE_CLIENT_ID not set (optional, for OAuth). Run: wrangler secret put GOOGLE_CLIENT_ID${NC}"
fi

# Step 5: Deploy Workers
echo ""
echo -e "${YELLOW}Step 5: Deploying Workers API...${NC}"
wrangler deploy -c wrangler.worker.toml
echo -e "${GREEN}✅ Workers API deployed${NC}"

# Step 6: Build and deploy frontend
echo ""
echo -e "${YELLOW}Step 6: Building Frontend...${NC}"
npm run build
echo -e "${GREEN}✅ Frontend built${NC}"

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "Next steps:"
echo "1. Update PRODUCTION_API_URL in utils/app.ts with your Workers URL"
echo "2. Rebuild and deploy frontend to Pages/GitHub Pages"
echo "3. Test the deployment with: wrangler tail"
echo ""
echo "For detailed documentation, see DEPLOYMENT.md"
