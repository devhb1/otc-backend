# 💰 Wallet Service

Financial ledger and balance management service.

## 📋 Responsibilities

- **Balance Management**: Track user balances across currencies
- **Transaction History**: Complete ledger of all movements
- **Escrow Operations**: Lock/release funds during trades
- **Double-Entry Bookkeeping**: Ensure financial integrity
- **Audit Trail**: Complete transaction history

## 🏗️ Module Structure

```
apps/wallet/
├── src/
│   ├── wallets/                # Balance queries
│   │   ├── wallets.controller.ts
│   │   ├── wallets.service.ts
│   │   └── wallets.module.ts
│   ├── ledger/                 # Transaction history
│   │   ├── ledger.controller.ts
│   │   ├── ledger.service.ts
│   │   └── ledger.module.ts
│   ├── escrow/                 # Fund locking
│   │   ├── escrow.controller.ts
│   │   ├── escrow.service.ts
│   │   └── escrow.module.ts
│   ├── health/                 # Health checks
│   ├── wallet.module.ts        # Root module
│   └── main.ts                 # Service entry point
└── README.md
```

## 🚀 Running This Service

### Development Mode
```bash
# From project root
npm run start:dev wallet

# Service runs on http://localhost:3004
# API docs: http://localhost:3004/api/docs
```

### Production Mode
```bash
npm run start:prod wallet
```

## 📊 Database Tables Used

This service primarily works with:
- `Wallet` - User balances per currency
- `LedgerEntry` - Double-entry bookkeeping records
- `User` - Account ownership (read-only)
- `OtcOrder` - Related to escrow operations

## 🔧 Environment Variables

Add to `.env`:
```env
WALLET_PORT=3004
```

## 📝 TODO - Implementation Tasks

### Wallets Module
- [ ] GET /api/v1/wallets - Get user wallets
- [ ] GET /api/v1/wallets/:currency - Get specific currency balance
- [ ] POST /api/v1/wallets/deposit - Record deposit (admin only)
- [ ] POST /api/v1/wallets/withdraw - Record withdrawal (admin only)

### Ledger Module
- [ ] GET /api/v1/ledger - Get transaction history
- [ ] GET /api/v1/ledger/:id - Get specific transaction
- [ ] GET /api/v1/ledger/export - Export to CSV

### Escrow Module
- [ ] POST /api/v1/escrow/lock - Lock funds for order
- [ ] POST /api/v1/escrow/release - Release funds to seller
- [ ] POST /api/v1/escrow/refund - Refund to buyer
- [ ] GET /api/v1/escrow/:orderId - Get escrow status

### Double-Entry System
Every transaction creates 2 ledger entries:
- **Debit**: From account (-)
- **Credit**: To account (+)

Example: Escrow lock for 100 USDT
```
Ledger Entry 1: User Wallet USDT -100 (debit)
Ledger Entry 2: Escrow Wallet USDT +100 (credit)
```

## 🔐 Authentication

Requires JWT token from Identity Service:
```typescript
@UseGuards(JwtAuthGuard)
@Get()
async getWallets(@CurrentUser() user) {
  // Return user's wallets only
}
```

## 🧪 Testing

```bash
# Unit tests
npm run test wallet

# E2E tests
npm run test:e2e wallet
```

## 🏷️ API Examples

### Get Wallets
```bash
curl http://localhost:3004/api/v1/wallets \
  -H "Authorization: Bearer <token>"
```

### Lock Funds in Escrow
```bash
curl -X POST http://localhost:3004/api/v1/escrow/lock \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-123",
    "amount": 1000,
    "currency": "USDT"
  }'
```

### Get Transaction History
```bash
curl "http://localhost:3004/api/v1/ledger?currency=USDT&limit=50" \
  -H "Authorization: Bearer <token>"
```

## 🔗 Related Services

- **Identity Service** (port 3001) - User authentication
- **Trade Service** (port 3003) - Triggers escrow operations
- **Admin Service** (port 3006) - Manual adjustments

## ⚠️ Critical Operations

### Concurrent Transactions
Use database transactions to prevent race conditions:
```typescript
await this.db.$transaction(async (tx) => {
  // Lock wallet
  // Create ledger entries
  // Update balance
});
```

### Balance Validation
Always verify sufficient balance before locking:
```typescript
const wallet = await this.getWallet(userId, currency);
if (wallet.balance < amount) {
  throw new InsufficientBalanceException();
}
```

## 📚 Learn More

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- [Project Architecture](../../docs/ARCHITECTURE_EXPLAINED.md)
