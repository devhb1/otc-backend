# 🏪 Market Service

OTC marketplace and pricing management service.

## 📋 Responsibilities

- **Ad Management**: Create, edit, browse, and delete OTC ads
- **Search & Filtering**: Advanced ad search with filters
- **Pricing Engine**: FX rate integration and price calculations
- **Markup Management**: Seller spread/markup configuration

## 🏗️ Module Structure

```
apps/market/
├── src/
│   ├── ads/                    # Ad management
│   │   ├── ads.controller.ts
│   │   ├── ads.service.ts
│   │   └── ads.module.ts
│   ├── pricing/                # Pricing and FX rates
│   │   ├── pricing.controller.ts
│   │   ├── pricing.service.ts
│   │   └── pricing.module.ts
│   ├── health/                 # Health checks
│   ├── market.module.ts        # Root module
│   └── main.ts                 # Service entry point
└── README.md
```

## 🚀 Running This Service

### Development Mode
```bash
# From project root
npm run start:dev market

# Service runs on http://localhost:3002
# API docs: http://localhost:3002/api/docs
```

### Production Mode
```bash
npm run start:prod market
```

## 📊 Database Tables Used

This service primarily works with:
- `OtcAd` - Advertisement listings
- `User` - Seller information (read-only)
- `Wallet` - Available balances for ads

## 🔧 Environment Variables

Add to `.env`:
```env
MARKET_PORT=3002
FX_API_KEY=<your-fx-api-key>
FX_API_URL=https://api.exchangerate-api.com/v4/latest
```

## 📝 TODO - Implementation Tasks

### Ads Module
- [ ] POST /api/v1/ads - Create new ad
- [ ] GET /api/v1/ads - List all ads (with pagination)
- [ ] GET /api/v1/ads/:id - Get ad details
- [ ] PUT /api/v1/ads/:id - Update ad
- [ ] DELETE /api/v1/ads/:id - Delete ad
- [ ] GET /api/v1/ads/search - Search ads with filters
- [ ] POST /api/v1/ads/:id/activate - Activate ad
- [ ] POST /api/v1/ads/:id/deactivate - Deactivate ad

### Pricing Module
- [ ] GET /api/v1/pricing/rates - Get current FX rates
- [ ] POST /api/v1/pricing/calculate - Calculate trade amount
- [ ] GET /api/v1/pricing/history/:pair - Historical rates

## 🔐 Authentication

Requires JWT token from Identity Service:
```typescript
@UseGuards(JwtAuthGuard)
@Roles('SELLER')
@Post()
async createAd(@CurrentUser() user) {
  // Only sellers can create ads
}
```

## 🧪 Testing

```bash
# Unit tests
npm run test market

# E2E tests
npm run test:e2e market
```

## 🏷️ API Examples

### Create Ad
```bash
curl -X POST http://localhost:3002/api/v1/ads \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "buyCurrency": "USDT",
    "sellCurrency": "MYR",
    "minAmount": 100,
    "maxAmount": 10000,
    "exchangeRate": 4.65,
    "margin": 0.02
  }'
```

### Search Ads
```bash
curl "http://localhost:3002/api/v1/ads/search?currency=USDT&country=MY"
```

## 🔗 Related Services

- **Identity Service** (port 3001) - User authentication
- **Trade Service** (port 3003) - Order processing
- **Wallet Service** (port 3004) - Balance checks

## 📚 Learn More

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Guide](https://www.prisma.io/docs)
- [Project Architecture](../../docs/ARCHITECTURE_EXPLAINED.md)
