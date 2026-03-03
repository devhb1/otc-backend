# 💼 Trade Service

Order processing and dispute management service.

## 📋 Responsibilities

- **Order Creation**: Process buy/sell orders from ads
- **Order State Machine**: Manage order lifecycle (pending → paid → completed)
- **Payment Verification**: Confirm payments between users
- **Dispute Management**: Handle conflicts and resolution
- **Escrow Coordination**: Work with Wallet Service for fund locks

## 🏗️ Module Structure

```
apps/trade/
├── src/
│   ├── orders/                 # Order management
│   │   ├── orders.controller.ts
│   │   ├── orders.service.ts
│   │   ├── orders.module.ts
│   │   └── dto/
│   ├── disputes/               # Dispute resolution
│   │   ├── disputes.controller.ts
│   │   ├── disputes.service.ts
│   │   └── disputes.module.ts
│   ├── health/                 # Health checks
│   ├── trade.module.ts         # Root module
│   └── main.ts                 # Service entry point
└── README.md
```

## 🚀 Running This Service

### Development Mode
```bash
# From project root
npm run start:dev trade

# Service runs on http://localhost:3003
# API docs: http://localhost:3003/api/docs
```

### Production Mode
```bash
npm run start:prod trade
```

## 📊 Database Tables Used

This service primarily works with:
- `OtcOrder` - Order records
- `OtcAd` - Advertisement details (read-only)
- `Dispute` - Dispute records
- `User` - Buyer/seller information
- `Wallet` - Balance checks (via Wallet Service)

## 🔧 Environment Variables

Add to `.env`:
```env
TRADE_PORT=3003
WALLET_SERVICE_URL=http://localhost:3004
NOTIFICATION_SERVICE_URL=http://localhost:3005
```

## 📝 TODO - Implementation Tasks

### Orders Module
- [ ] POST /api/v1/orders - Create new order
- [ ] GET /api/v1/orders - List user orders
- [ ] GET /api/v1/orders/:id - Get order details
- [ ] POST /api/v1/orders/:id/confirm-payment - Buyer confirms payment
- [ ] POST /api/v1/orders/:id/release - Seller releases funds
- [ ] POST /api/v1/orders/:id/cancel - Cancel order
- [ ] GET /api/v1/orders/:id/chat - Get order chat history
- [ ] POST /api/v1/orders/:id/chat - Send chat message

### Disputes Module
- [ ] POST /api/v1/disputes - Open dispute
- [ ] GET /api/v1/disputes - List disputes
- [ ] GET /api/v1/disputes/:id - Get dispute details
- [ ] POST /api/v1/disputes/:id/respond - Respond to dispute
- [ ] POST /api/v1/disputes/:id/resolve - Admin resolve (requires ADMIN role)

### State Machine
```
PENDING → PAID → COMPLETED
   ↓        ↓        ↓
CANCELLED  DISPUTED  REFUNDED
```

## 🔐 Authentication

Requires JWT token from Identity Service:
```typescript
@UseGuards(JwtAuthGuard)
@Post()
async createOrder(@CurrentUser() user) {
  // Buyers create orders
}
```

## 🧪 Testing

```bash
# Unit tests
npm run test trade

# E2E tests
npm run test:e2e trade
```

## 🏷️ API Examples

### Create Order
```bash
curl -X POST http://localhost:3003/api/v1/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "adId": "ad-uuid",
    "amount": 1000,
    "currency": "USDT"
  }'
```

### Confirm Payment
```bash
curl -X POST http://localhost:3003/api/v1/orders/order-123/confirm-payment \
  -H "Authorization: Bearer <token>"
```

### Open Dispute
```bash
curl -X POST http://localhost:3003/api/v1/disputes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-123",
    "reason": "Payment not received",
    "evidence": "Screenshot URL"
  }'
```

## 🔗 Related Services

- **Identity Service** (port 3001) - User authentication
- **Market Service** (port 3002) - Ad information
- **Wallet Service** (port 3004) - Escrow locks/releases
- **Notification Service** (port 3005) - Order status alerts

## 📚 Learn More

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Guide](https://www.prisma.io/docs)
- [Project Architecture](../../docs/ARCHITECTURE_EXPLAINED.md)
