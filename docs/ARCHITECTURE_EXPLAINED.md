# 🏗️ Understanding the Modular Architecture

**Purpose:** This document explains WHY we structured the OTC platform this way and HOW teams work independently.

---

## 🎯 The Core Principle


This is a **Modular Monorepo** architecture:
- **Modular:** Each service is independent (can be pulled out later as a microservice)
- **Monorepo:** All code in one repository (easy to share code, types, and database)

---

## 📁 The Structure Explained

```
otc-platform/
│
├── apps/                          # ← SERVICES (each team owns one)
│   ├── identity/                  # Team 1: Auth & Users
│   │   ├── src/
│   │   │   ├── auth/              # Registration, Login, JWT
│   │   │   ├── users/             # Profile management
│   │   │   ├── identity.module.ts # Root module
│   │   │   └── main.ts            # Entry point (runs on port 3001)
│   │   └── test/
│   │
│   ├── market/                    # Team 2: Seller Ads & Pricing
│   │   ├── src/
│   │   │   ├── ads/               # Create/edit/search ads
│   │   │   ├── pricing/           # FX rates, markup calculation
│   │   │   ├── market.module.ts
│   │   │   └── main.ts            # Entry point (runs on port 3002)
│   │
│   ├── trade/                     # Team 3: Orders & Escrow
│   │   ├── src/
│   │   │   ├── orders/            # Order creation, state machine
│   │   │   ├── disputes/          # Dispute management
│   │   │   ├── trade.module.ts
│   │   │   └── main.ts            # Entry point (runs on port 3003)
│   │
│   ├── wallet/                    # Team 4: Financial Ledger
│   │   ├── src/
│   │   │   ├── wallets/           # Balance queries
│   │   │   ├── ledger/            # Transaction history
│   │   │   ├── escrow/            # Lock/release funds
│   │   │   ├── wallet.module.ts
│   │   │   └── main.ts            # Entry point (runs on port 3004)
│   │
│   ├── notification/              # Team 5: Alerts & Real-time
│   │   └── ...                    # Email, WebSocket, SMS
│   │
│   └── admin/                     # Team 6: Admin Dashboard
│       └── ...                    # Dispute resolution, monitoring
│
├── libs/                          # ← SHARED CODE (everyone uses this)
│   │
│   ├── database/                  # Database access (Prisma)
│   │   ├── src/
│   │   │   ├── database.service.ts    # Extends PrismaClient
│   │   │   ├── database.module.ts     # Exports DatabaseService
│   │   │   └── index.ts               # Public API
│   │   │
│   │   # All teams import this:
│   │   # import { DatabaseModule } from '@app/database';
│   │
│   ├── common/                    # Shared utilities
│   │   ├── src/
│   │   │   ├── decorators/
│   │   │   │   └── current-user.decorator.ts  # @CurrentUser()
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts         # @UseGuards(JwtAuthGuard)
│   │   │   │   └── roles.guard.ts            # @Roles('ADMIN')
│   │   │   ├── interceptors/
│   │   │   ├── pipes/
│   │   │   └── index.ts           # Public API
│   │   │
│   │   # All teams import this:
│   │   # import { CurrentUser, RolesGuard } from '@app/common';
│   │
│   └── types/                     # Shared TypeScript types (future)
│       └── src/
│           ├── dto/               # Shared DTOs
│           ├── interfaces/        # Shared interfaces
│           └── constants/         # Shared constants
│
├── prisma/                        # ← DATABASE (single source of truth)
│   ├── schema.prisma              # All tables, all relations
│   └── migrations/                # Database version history
│
├── docker-compose.yml             # PostgreSQL + Redis
├── .env                           # Secrets (not committed)
├── package.json                   # Dependencies (shared)
└── tsconfig.json                  # TypeScript config (shared)
```

---

## 🔄 How Teams Work Independently

### Scenario: You (Team Lead) Start Market Service

**Step 1: Create Your Service**
```bash
cd otc-platform
git checkout -b feature/market-service

# Generate Market Service
nest g app market
```

This creates:
```
apps/market/
├── src/
│   ├── market.controller.ts
│   ├── market.service.ts
│   ├── market.module.ts
│   └── main.ts
└── test/
```

**Step 2: Import Shared Database**

`apps/market/src/market.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@app/database';  // ← Shared database access

@Module({
  imports: [DatabaseModule],  // ← Now you can use Prisma
  controllers: [MarketController],
  providers: [MarketService],
})
export class MarketModule {}
```

**Step 3: Use Database in Your Service**

`apps/market/src/market.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@app/database';

@Injectable()
export class MarketService {
  constructor(private readonly db: DatabaseService) {}

  async createAd(sellerId: string, data: CreateAdDto) {
    // You have full access to Prisma
    return this.db.otcAd.create({
      data: {
        sellerId,
        basePair: data.basePair,
        marginPercent: data.marginPercent,
        // ... rest of fields
      },
    });
  }

  async searchAds(filters: SearchFilters) {
    return this.db.otcAd.findMany({
      where: {
        isActive: true,
        region: filters.region,
        // ... more filters
      },
      orderBy: {
        // Sort by price
      },
    });
  }
}
```

**Step 4: Configure Your Service Port**

`apps/market/src/main.ts`:
```typescript
import { NestFactory } from '@nestjs/core';
import { MarketModule } from './market.module';

async function bootstrap() {
  const app = await NestFactory.create(MarketModule);
  await app.listen(3002);  // ← Different port from Identity (3001)
  console.log('Market Service running on http://localhost:3002');
}
bootstrap();
```

**Step 5: Run Your Service**
```bash
# Start just your service
npm run start:dev market

# Or start multiple services
npm run start:dev identity  # Terminal 1 (port 3001)
npm run start:dev market    # Terminal 2 (port 3002)
```

**Step 6: Work on Your Features**
```bash
# In apps/market/src/
mkdir ads pricing search

# Build your features
# - Create ads
# - Calculate prices with markup
# - Search and filter ads
```

**Step 7: Push Your Work**
```bash
git add apps/market
git commit -m "feat: market service - ad creation and search"
git push origin feature/market-service

# Create PR to merge into develop
```

---

### Meanwhile: Team 3 Works on Trade Service

**They do the same process:**
```bash
git checkout -b feature/trade-service
nest g app trade

# Build their features in apps/trade/
# - Order creation
# - Escrow locking (calls Wallet Service)
# - Payment proof upload
# - State machine

# Push to their branch
git push origin feature/trade-service
```

**No conflicts because:**
- ✅ You're in `apps/market/`
- ✅ They're in `apps/trade/`
- ✅ Both use same `libs/database/`
- ✅ Both run on different ports (3002 vs 3003)

---

## 🔗 How Services Communicate

### Within Same Service: Direct Database Access

```typescript
// In Market Service
async getAdDetails(adId: string) {
  // Direct Prisma query
  return this.db.otcAd.findUnique({
    where: { id: adId },
    include: {
      seller: true,  // ← Include user data
    },
  });
}
```

### Between Services: HTTP or Message Queue

**Option 1: HTTP (MVP approach)**

```typescript
// In Trade Service, creating an order
async createOrder(buyerId: string, adId: string, amount: number) {
  // 1. Fetch ad details from Market Service
  const ad = await this.httpService.get(`http://localhost:3002/ads/${adId}`);
  
  // 2. Calculate total
  const total = amount * ad.data.finalPrice;
  
  // 3. Lock funds via Wallet Service
  await this.httpService.post('http://localhost:3004/escrow/lock', {
    userId: ad.data.sellerId,
    amount: amount,
    orderId: newOrderId,
  });
  
  // 4. Create order in database
  return this.db.order.create({ /* ... */ });
}
```

**Option 2: Direct Database (since we're in monorepo)**

```typescript
// In Trade Service
async createOrder(buyerId: string, adId: string, amount: number) {
  return this.db.$transaction(async (tx) => {
    // 1. Get ad (same database)
    const ad = await tx.otcAd.findUnique({ where: { id: adId } });
    
    // 2. Lock funds (update wallet)
    await tx.wallet.update({
      where: { userId_currency: { userId: ad.sellerId, currency: 'MAAL' } },
      data: { lockedBalance: { increment: amount } },
    });
    
    // 3. Create order
    return tx.order.create({ /* ... */ });
  });
}
```

**Why Direct Database is Better (for MVP):**
- ✅ Atomic transactions (all-or-nothing)
- ✅ No network latency
- ✅ Simpler to debug
- ✅ Can move to HTTP later if needed

---

## 🗄️ The Database: Single Source of Truth

### Everyone Uses the Same Schema

**The Prisma schema (`prisma/schema.prisma`) defines ALL data:**

```prisma
model User {
  id     String    @id @default(uuid())
  email  String    @unique
  role   UserRole
  // ... 10 more fields
  
  // Relations
  wallets  Wallet[]
  orders   Order[]
  ads      OtcAd[]
}

model OtcAd {
  id              String   @id
  sellerId        String
  seller          User     @relation(...)
  basePair        String
  marginPercent   Decimal
  // ... 8 more fields
  
  orders          Order[]
}

model Order {
  id          String      @id
  buyerId     String
  buyer       User        @relation(...)
  sellerId    String
  seller      User        @relation(...)
  adId        String
  ad          OtcAd       @relation(...)
  status      OrderStatus
  // ... 10 more fields
}
```

### When You Need to Add a Field

**Example: Team 2 needs to add "featured" flag to ads**

1. **Update schema:**
```prisma
model OtcAd {
  // ... existing fields
  isFeatured  Boolean  @default(false)
}
```

2. **Regenerate Prisma client:**
```bash
npx prisma generate
```

3. **Push to database:**
```bash
npx prisma db push
```

4. **Now ALL services can use it:**
```typescript
// In Market Service
await this.db.otcAd.create({
  data: {
    // ...
    isFeatured: true,  // ← TypeScript knows this exists!
  },
});

// In Trade Service
const featuredAds = await this.db.otcAd.findMany({
  where: { isFeatured: true },  // ← Works here too!
});
```

---

## 🎯 Benefits of This Architecture

### 1. **Team Independence**

| Team | Folder | Port | Can Work Independently? |
|------|--------|------|-------------------------|
| Team 1 | `apps/identity/` | 3001 | ✅ Yes |
| Team 2 | `apps/market/` | 3002 | ✅ Yes |
| Team 3 | `apps/trade/` | 3003 | ✅ Yes (after Market done) |
| Team 4 | `apps/wallet/` | 3004 | ✅ Yes |
| Team 5 | `apps/notification/` | 3005 | ✅ Yes |
| Team 6 | `apps/admin/` | 3006 | ✅ Yes |

### 2. **Shared Code, Zero Duplication**

**Without shared libraries:**
```typescript
// Team 1 writes this in identity service
export function getCurrentUser(req) { /* ... */ }

// Team 2 copies it to market service
export function getCurrentUser(req) { /* ... */ }  // ❌ Duplication!

// Bug fix in Team 1's version
// Team 2 still has the bug  // ❌ Inconsistency!
```

**With shared libraries:**
```typescript
// libs/common/src/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(...);

// Team 1 uses it
@Get('profile')
getProfile(@CurrentUser() user: User) { }

// Team 2 uses the SAME code
@Post('ads')
createAd(@CurrentUser() user: User) { }  // ✅ No duplication!

// Bug fix in library
// Both teams get the fix automatically  // ✅ Consistency!
```

### 3. **Type Safety Across Services**

**Prisma generates TypeScript types:**
```typescript
// This is auto-generated from your schema
import { User, UserRole, OtcAd, Order } from '@prisma/client';

// All teams get the same types
function createOrder(buyer: User, ad: OtcAd) {
  // TypeScript knows all fields
  console.log(buyer.email);  // ✅ Type-safe
  console.log(ad.marginPercent);  // ✅ Type-safe
  console.log(buyer.nonExistentField);  // ❌ Compiler error!
}
```

### 4. **Easy to Scale Later**

**MVP: Monorepo (everything in one repository)**
```
otc-platform/
├── apps/identity/
├── apps/market/
└── apps/trade/
```

**Future: Microservices (separate deployments)**
```
identity-service/     (GitHub repo 1, deployed to Kubernetes pod 1)
market-service/       (GitHub repo 2, deployed to Kubernetes pod 2)
trade-service/        (GitHub repo 3, deployed to Kubernetes pod 3)
```

**Migration is easy because services are already modular!**

---

## 🔒 Security: How Authentication Works Across Services

### The Flow

```
1. User logs in to Identity Service
   ↓
2. Identity Service generates JWT token
   ↓
3. User gets access token (expires in 15 minutes)
   ↓
4. User calls Market Service with token in header:
   Authorization: Bearer eyJhbGc...
   ↓
5. Market Service validates token (doesn't call Identity Service)
   ↓
6. Market Service extracts user info from token
   ↓
7. Market Service processes request
```

### How Each Service Validates JWT

**All services use the SAME JWT secret (from .env):**

```typescript
// apps/market/src/main.ts
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,  // ← Same secret
    }),
  ],
})
```

**Each service can validate tokens independently:**

```typescript
// apps/market/src/ads/ads.controller.ts
@Controller('ads')
export class AdsController {
  @Post()
  @UseGuards(JwtAuthGuard)  // ← Validates JWT locally
  @Roles('SELLER')          // ← Checks role from JWT payload
  createAd(@CurrentUser() user: User, @Body() dto: CreateAdDto) {
    // User is authenticated and authorized!
    return this.adsService.create(user.id, dto);
  }
}
```

**No need to call Identity Service for every request!**

---

## 📊 Example: Full Order Flow (Multi-Service)

Let's trace a complete order from start to finish:

### Services Involved
1. **Market Service** - Provides ad listing
2. **Identity Service** - Authenticates buyer
3. **Trade Service** - Creates order
4. **Wallet Service** - Locks seller funds
5. **Notification Service** - Alerts buyer and seller

### Step-by-Step Flow

```typescript
// ============================================================
// STEP 1: Buyer browses ads (Market Service - port 3002)
// ============================================================
GET http://localhost:3002/ads?region=MY&currency=MYR
Authorization: Bearer eyJhbGc...

// Market Service response:
[
  {
    id: "ad-123",
    seller: { name: "John Seller" },
    basePair: "MAAL-MYR",
    finalPrice: 4.12,  // 4.00 + 3% markup
    minLimit: 100,
    maxLimit: 10000
  }
]

// ============================================================
// STEP 2: Buyer creates order (Trade Service - port 3003)
// ============================================================
POST http://localhost:3003/orders
Authorization: Bearer eyJhbGc...
{
  "adId": "ad-123",
  "fiatAmount": 1000,
  "fiatCurrency": "MYR"
}

// Inside Trade Service:
async createOrder(buyerId: string, dto: CreateOrderDto) {
  return this.db.$transaction(async (tx) => {
    // 1. Check ad exists and is active
    const ad = await tx.otcAd.findUnique({
      where: { id: dto.adId },
      include: { seller: true },
    });
    
    if (!ad.isActive) throw new BadRequestException('Ad not active');
    
    // 2. Calculate crypto amount
    const cryptoAmount = dto.fiatAmount / ad.finalPrice;
    
    // 3. Check seller has enough balance
    const sellerWallet = await tx.wallet.findUnique({
      where: {
        userId_currency: { userId: ad.sellerId, currency: 'MAAL' },
      },
    });
    
    const available = sellerWallet.balance - sellerWallet.lockedBalance;
    if (available < cryptoAmount) {
      throw new BadRequestException('Seller insufficient funds');
    }
    
    // 4. Lock seller funds (ESCROW)
    await tx.wallet.update({
      where: { id: sellerWallet.id },
      data: {
        lockedBalance: { increment: cryptoAmount },
      },
    });
    
    // 5. Create ledger entry
    await tx.ledgerEntry.create({
      data: {
        walletId: sellerWallet.id,
        type: 'DEBIT',
        amount: cryptoAmount,
        referenceId: orderId,
        referenceType: 'order',
        description: 'Funds locked for order',
      },
    });
    
    // 6. Create order
    const order = await tx.order.create({
      data: {
        id: orderId,
        buyerId,
        sellerId: ad.sellerId,
        adId: ad.id,
        fiatAmount: dto.fiatAmount,
        fiatCurrency: dto.fiatCurrency,
        cryptoAmount,
        cryptoCurrency: 'MAAL',
        exchangeRate: ad.finalPrice,
        status: 'PAYMENT_PENDING',
        paymentMethod: dto.paymentMethod,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      },
    });
    
    // 7. Log state change
    await tx.orderStateHistory.create({
      data: {
        orderId: order.id,
        fromStatus: null,
        toStatus: 'PAYMENT_PENDING',
        triggeredBy: buyerId,
      },
    });
    
    return order;
  });
}

// ============================================================
// STEP 3: Send notifications (Notification Service - port 3005)
// ============================================================
// Trade Service publishes event to message queue
this.eventEmitter.emit('order.created', {
  orderId: order.id,
  buyerId: order.buyerId,
  sellerId: order.sellerId,
});

// Notification Service listens and sends emails
@OnEvent('order.created')
async handleOrderCreated(event: OrderCreatedEvent) {
  // Email to buyer
  await this.email.send(event.buyerId, {
    subject: 'Order Created',
    template: 'order-created-buyer',
    data: { orderId: event.orderId },
  });
  
  // Email to seller
  await this.email.send(event.sellerId, {
    subject: 'New Order Received',
    template: 'order-created-seller',
    data: { orderId: event.orderId },
  });
}

// ============================================================
// STEP 4: Later, buyer uploads payment proof (Trade Service)
// ============================================================
POST http://localhost:3003/orders/order-789/payment
Authorization: Bearer eyJhbGc...
Content-Type: multipart/form-data

file: photo of bank transfer

// Trade Service uploads to S3 and updates order
async uploadPaymentProof(orderId: string, file: Express.Multer.File) {
  // 1. Upload to S3
  const url = await this.s3.upload(file);
  
  // 2. Update order (with state machine validation)
  return this.stateMachine.transitionOrder(
    orderId,
    'PAYMENT_UPLOADED',
    { paymentProofUrl: url },
  );
}

// ============================================================
// STEP 5: Seller confirms (Trade Service + Wallet Service)
// ============================================================
POST http://localhost:3003/orders/order-789/release
Authorization: Bearer eyJhbGc...

// Trade Service releases funds
async releaseOrder(orderId: string, sellerId: string) {
  return this.db.$transaction(async (tx) => {
    // 1. Get order
    const order = await tx.order.findUnique({ where: { id: orderId } });
    
    if (order.status !== 'PAYMENT_UPLOADED') {
      throw new BadRequestException('Cannot release');
    }
    
    // 2. Unlock seller funds and transfer to buyer
    const sellerWallet = await tx.wallet.findUnique({
      where: {
        userId_currency: { userId: order.sellerId, currency: 'MAAL' },
      },
    });
    
    const buyerWallet = await tx.wallet.findUnique({
      where: {
        userId_currency: { userId: order.buyerId, currency: 'MAAL' },
      },
    });
    
    // 3. Deduct from seller (unlock + deduct)
    await tx.wallet.update({
      where: { id: sellerWallet.id },
      data: {
        balance: { decrement: order.cryptoAmount },
        lockedBalance: { decrement: order.cryptoAmount },
      },
    });
    
    // 4. Credit to buyer
    await tx.wallet.update({
      where: { id: buyerWallet.id },
      data: {
        balance: { increment: order.cryptoAmount },
      },
    });
    
    // 5. Update order status
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
    
    // 6. Create ledger entries
    await tx.ledgerEntry.createMany({
      data: [
        {
          walletId: sellerWallet.id,
          type: 'DEBIT',
          amount: order.cryptoAmount,
          referenceId: orderId,
          description: 'Order completed - seller',
        },
        {
          walletId: buyerWallet.id,
          type: 'CREDIT',
          amount: order.cryptoAmount,
          referenceId: orderId,
          description: 'Order completed - buyer',
        },
      ],
    });
  });
}
```

**Notice:**
- ✅ All database operations in ONE transaction (atomic)
- ✅ Funds never leave escrow until seller confirms
- ✅ Complete audit trail (ledger entries + state history)
- ✅ Multiple services coordinated through database

---

## 🎓 Key Takeaways

### 1. **Modular = Team Independence**
- Each team owns a folder
- Each service runs on its own port
- Minimal coordination needed

### 2. **Shared Database = Consistency**
- Single source of truth (Prisma schema)
- All teams get same types
- Atomic transactions across services

### 3. **Shared Libraries = Code Reuse**
- Write once, use everywhere
- Bug fixes benefit all teams
- Type-safe across the board

### 4. **Start Modular, Scale Later**
- MVP: Monorepo (easy to develop)
- Future: Microservices (easy to scale)
- Architecture supports both

---

## ✅ What You Should Understand Now

- [ ] Why we use monorepo (code sharing + team independence)
- [ ] How services communicate (direct DB in monorepo, HTTP later)
- [ ] Why Prisma schema is shared (single source of truth)
- [ ] How teams work without conflicts (separate folders)
- [ ] How authentication works across services (JWT validation)
- [ ] Why we use transactions (atomic operations for money)

---

**Next:** Install Docker, generate Prisma client, and start building! 🚀

See [CURRENT_STATUS.md](./CURRENT_STATUS.md) for immediate next steps.
