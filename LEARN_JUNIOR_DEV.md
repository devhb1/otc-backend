# 🎓 Complete Guide for Junior Developers

**Welcome!** This is your complete guide to understanding and contributing to the OTC Trading Platform. Whether you're new to NestJS, TypeScript, or backend development, this guide will teach you everything step-by-step.

---

## 📋 Table of Contents

### Part 1: Understanding the Basics
1. [What Are We Building?](#part-1-what-are-we-building)
2. [The Technology Stack](#part-2-understanding-our-tech-stack)
3. [Why These Technologies?](#part-3-why-we-chose-these-technologies)

### Part 2: The Architecture
4. [System Architecture Explained](#part-4-system-architecture)
5. [Database Design](#part-5-database-design)
6. [Service Communication](#part-6-service-communication)

### Part 3: Hands-On Learning
7. [Building Your First Feature](#part-7-building-your-first-feature)
8. [Understanding the Identity Service](#part-8-understanding-identity-service)
9. [Common Patterns](#part-9-common-patterns-to-reuse)

### Part 4: Best Practices
10. [Testing Your Code](#part-10-testing-guidelines)
11. [Security Best Practices](#part-11-security-best-practices)
12. [Debugging Tips](#part-12-debugging-tips)

---

## Part 1: What Are We Building?

### The OTC Trading Platform

**OTC** stands for "Over-The-Counter" - it means peer-to-peer trading without a centralized exchange.

**Simple Explanation:**
- Alice wants to sell 1000 USDT (cryptocurrency) for Malaysian Ringgit (MYR)
- Bob wants to buy USDT with his MYR
- Our platform connects them safely with escrow protection

**The Flow:**
```
1. Alice (Seller) creates an ad: "Selling USDT, price: Google rate + 3%"
2. Bob (Buyer) sees the ad, clicks "Buy"
3. Platform creates an order, locks Alice's USDT in escrow
4. Bob transfers MYR to Alice's bank account
5. Bob uploads payment proof
6. Alice confirms receiving money
7. Platform releases USDT to Bob
8. Trade complete! ✅
```

**Key Features:**
- **Escrow:** Platform holds funds until both parties confirm (prevents scams)
- **Multi-Currency:** USDT, MAAL, USD, MYR, etc.
- **KYC:** Identity verification (know your customer)
- **Disputes:** Admin can resolve disagreements
- **Real-time:** WebSocket notifications for instant updates

---

## Part 2: Understanding Our Tech Stack

### What is a "Tech Stack"?

A **tech stack** is the combination of technologies we use to build our application.

Think of it like building a house:
- **Foundation:** Database (PostgreSQL)
- **Framework:** Structure (NestJS)
- **Walls:** Logic (TypeScript)
- **Roof:** API (REST endpoints)
- **Utilities:** Cache (Redis), Containers (Docker)

### Our Stack

| Layer | Technology | What It Does |
|-------|------------|--------------|
| **Language** | TypeScript | Programming language (JavaScript + types) |
| **Framework** | NestJS | Organizes our code (like React for backend) |
| **Database** | PostgreSQL | Stores data (users, orders, transactions) |
| **ORM** | Prisma | Talks to database (writes SQL for us) |
| **Cache** | Redis | Fast temporary storage (like RAM) |
| **Auth** | JWT + Passport | User authentication (login/logout) |
| **Container** | Docker | Runs PostgreSQL + Redis in isolated boxes |
| **Validation** | class-validator | Checks user input is valid |
| **Hashing** | bcrypt | Securely stores passwords (can't be reversed) |

---

## Part 3: Why We Chose These Technologies

### Why TypeScript over JavaScript?

**JavaScript Problem:**
```javascript
// JavaScript - No type checking
function addNumbers(a, b) {
  return a + b;
}

console.log(addNumbers(5, "10")); // "510" - BUG! String concatenation
console.log(addNumbers(5, 10));   // 15 - Correct
```

**TypeScript Solution:**
```typescript
// TypeScript - Type safety!
function addNumbers(a: number, b: number): number {
  return a + b;
}

console.log(addNumbers(5, "10")); // ❌ ERROR at compile-time!
console.log(addNumbers(5, 10));   // ✅ 15 - Correct
```

**Benefits:**
- ✅ Catches errors **before** running code
- ✅ Better autocomplete in VS Code
- ✅ Self-documenting code (types explain what functions do)
- ✅ Easier refactoring (rename variables safely)

---

### Why NestJS over Express?

**Express Problem (Spaghetti Code):**
```javascript
// express-app.js - Everything in one file! 😱
const express = require('express');
const app = express();

// Database connection here
const db = require('./db');

// Validation here
function validateUser(req, res, next) { /* ... */ }

// Business logic here
app.post('/register', validateUser, async (req, res) => {
  // Hash password here
  const hashedPassword = await bcrypt.hash(req.body.password, 12);
  
  // Database query here
  const user = await db.users.create({
    email: req.body.email,
    password: hashedPassword,
  });
  
  // Response here
  res.json(user);
});

// 1000 more lines of mixed code...
```

**NestJS Solution (Organized):**
```typescript
// auth.controller.ts - HTTP layer only
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}

// auth.service.ts - Business logic only
@Injectable()
export class AuthService {
  constructor(private readonly db: DatabaseService) {}

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    return this.db.user.create({
      data: { email: dto.email, passwordHash: hashedPassword },
    });
  }
}

// register.dto.ts - Validation only
export class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;
}
```

**Benefits:**
- ✅ **Separation of Concerns:** Each file has one job
- ✅ **Easy Testing:** Mock services, not HTTP
- ✅ **Team-Friendly:** Clear boundaries, minimal conflicts
- ✅ **Scalable:** Can split into microservices later

---

### Why PostgreSQL over MongoDB?

**The Financial Safety Problem:**

**MongoDB (Document DB) - Risky for Money:**
```javascript
// Operation 1: Deduct from seller
await db.wallets.updateOne(
  { userId: sellerId },
  { $inc: { balance: -100 } }
);

// ❌ APP CRASHES HERE! Power outage, server restart, etc.

// Operation 2: Add to buyer (NEVER EXECUTES!)
await db.wallets.updateOne(
  { userId: buyerId },
  { $inc: { balance: +100 } }
);

// Result: Seller lost $100, buyer gained $0
// Money disappeared! 💸
```

**PostgreSQL (Relational DB) - Safe with Transactions:**
```typescript
// Atomic transaction - ALL or NOTHING
await prisma.$transaction(async (tx) => {
  // Operation 1: Deduct from seller
  await tx.wallet.update({
    where: { userId: sellerId },
    data: { balance: { decrement: 100 } },
  });

  // ❌ Even if crash happens here...

  // Operation 2: Add to buyer
  await tx.wallet.update({
    where: { userId: buyerId },
    data: { balance: { increment: 100 } },
  });
});

// Result: Either BOTH happen OR NEITHER happens
// Money is NEVER lost! ✅
```

**Benefits:**
- ✅ **ACID Compliance:** Atomic, Consistent, Isolated, Durable
- ✅ **Transactions:** All-or-nothing operations
- ✅ **Foreign Keys:** Enforces data integrity
- ✅ **Complex Queries:** Joins are efficient

---

### Why JWT over Session-Based Auth?

**Session-Based Auth (Old Way):**
```
1. User logs in
2. Server creates session, stores in Redis
3. Server sends session ID cookie to client
4. Every request: Client sends cookie → Server checks Redis
5. Problem: Need to share Redis across all services
```

**JWT Auth (Modern Way):**
```
1. User logs in
2. Server generates JWT token (contains user info)
3. Server sends token to client
4. Every request: Client sends token → Server validates locally
5. Benefit: No need to check database/Redis!
```

**JWT Structure:**
```json
{
  "sub": "user-123",           // User ID
  "email": "alice@example.com",
  "role": "BUYER",
  "iat": 1708380000,           // Issued at (timestamp)
  "exp": 1708380900            // Expires in 15 minutes
}
```

**Benefits:**
- ✅ **Stateless:** No session storage needed
- ✅ **Scalable:** Services validate independently
- ✅ **Mobile-Friendly:** Easy to store tokens
- ✅ **Microservices-Ready:** No shared state

---

### Why Prisma over Writing SQL?

**Raw SQL (Error-Prone):**
```javascript
// SQL injection vulnerability! 💀
const query = `SELECT * FROM users WHERE email = '${email}'`;
const user = await db.query(query);

// Attacker sends: email = "' OR '1'='1"
// Final query: SELECT * FROM users WHERE email = '' OR '1'='1'
// Returns ALL users! 🚨
```

**Prisma (Type-Safe & Secure):**
```typescript
// Automatically parameterized - NO SQL injection possible ✅
const user = await prisma.user.findUnique({
  where: { email: email },
});

// TypeScript knows all fields!
console.log(user.email); // ✅ Autocomplete works
console.log(user.invalidField); // ❌ Compile error!
```

**Benefits:**
- ✅ **Type Safety:** Auto-generated types from schema
- ✅ **No SQL Injection:** Parameterized queries built-in
- ✅ **Migrations:** Database changes version-controlled
- ✅ **Autocomplete:** IDE knows all fields

---

## Part 4: System Architecture

### The Modular Monorepo

**What is a Monorepo?**
- **Mono** = One
- **Repo** = Repository
- **Monorepo** = One repository containing multiple services

**Why Not Separate Repos?**

**Multiple Repos (Hard to Manage):**
```
identity-service/
  - Own package.json
  - Own database types
  - Own utilities
  - Own Docker setup

market-service/
  - Duplicate package.json
  - Duplicate database types (out of sync!)
  - Duplicate utilities (copy-paste code)
  - Duplicate Docker setup
```

**Monorepo (Easy to Manage):**
```
otc-backend/
  - Shared package.json
  - Shared database types (single source of truth)
  - Shared utilities (libs/)
  - Shared Docker setup
  - apps/identity/
  - apps/market/
```

### Our Folder Structure Explained

```
otc-backend/
│
├── apps/                         # Services (each team owns one)
│   ├── identity/                 # Team 1: Authentication
│   │   ├── src/
│   │   │   ├── auth/             # Registration, login, JWT
│   │   │   ├── users/            # User management
│   │   │   ├── identity.module.ts
│   │   │   └── main.ts           # Runs on PORT 3001
│   │   └── test/
│   │
│   ├── market/                   # Team 2: Marketplace
│   │   ├── src/
│   │   │   ├── ads/              # Create/search ads
│   │   │   ├── pricing/          # FX rates, calculations
│   │   │   └── main.ts           # Runs on PORT 3002
│   │
│   └── ... (other services)
│
├── libs/                         # Shared code (ALL teams use)
│   ├── database/                 # Prisma client
│   │   ├── src/
│   │   │   ├── database.service.ts   # Extends PrismaClient
│   │   │   ├── database.module.ts    # NestJS module
│   │   │   └── index.ts              # Public exports
│   │
│   └── common/                   # Utilities
│       ├── src/
│       │   ├── decorators/       # @CurrentUser()
│       │   ├── guards/           # RolesGuard
│       │   └── index.ts
│
├── prisma/                       # Database (single source of truth)
│   └── schema.prisma             # All tables, all relations
│
├── docker-compose.yml            # PostgreSQL + Redis
├── package.json                  # Dependencies (shared by all)
├── tsconfig.json                 # TypeScript config (shared)
└── nest-cli.json                 # NestJS monorepo config
```

**Key Concepts:**

1. **apps/** - Independent services
   - Each service has own folder
   - Can run on different ports
   - Can be deployed separately later

2. **libs/** - Shared code
   - Written ONCE, used by ALL services
   - Import with `@app/database`, `@app/common`
   - Bug fixes benefit everyone

3. **prisma/** - Database schema
   - Single source of truth
   - Generates TypeScript types for all teams
   - Changes require team discussion

---

## Part 5: Database Design

### Understanding the Schema

**What is a Database Schema?**
- A **schema** is a blueprint of your database
- Defines tables, columns, relationships
- Like a floor plan for a building

### Our Models (Tables)

#### 1. User Model

```prisma
model User {
  id            String      @id @default(uuid())
  email         String      @unique
  passwordHash  String      // NEVER store plain passwords!
  role          UserRole    @default(BUYER)
  status        UserStatus  @default(ACTIVE)
  kycStatus     KycStatus   @default(PENDING)
  
  // Relations (other tables that link to this)
  wallets       Wallet[]               // One user, many wallets
  ordersAsBuyer Order[]  @relation("BuyerOrders")
  ordersAsSeller Order[] @relation("SellerOrders")
  ads           OtcAd[]                // Sellers have ads
  
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  @@index([email])  // Fast email lookups
}
```

**Explanation:**
- `@id` - Primary key (unique identifier)
- `@default(uuid())` - Auto-generate random ID
- `@unique` - Email must be unique (no duplicates)
- `@relation` - Links to other tables
- `@@index` - Makes searches faster

#### 2. Wallet Model (Multi-Currency)

```prisma
model Wallet {
  id        String      @id @default(uuid())
  userId    String
  user      User        @relation(fields: [userId], references: [id])
  
  currency  String      // "MAAL", "USDT", "MYR", etc.
  balance   Decimal     @default(0)  // Use Decimal, NEVER Float!
  
  ledgerEntries LedgerEntry[]  // Transaction history
  
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  
  @@unique([userId, currency])  // One wallet per currency per user
  @@index([userId])
}
```

**Why Decimal, Not Float?**
```javascript
// Float problem (NEVER use for money!)
0.1 + 0.2 === 0.3  // false! (Actually 0.30000000000000004)

// Decimal solution (safe for money)
new Decimal(0.1).add(0.2).equals(0.3)  // true! ✅
```

#### 3. LedgerEntry Model (Double-Entry Bookkeeping)

```prisma
model LedgerEntry {
  id          String          @id @default(uuid())
  walletId    String
  wallet      Wallet          @relation(fields: [walletId], references: [id])
  
  type        LedgerEntryType  // CREDIT or DEBIT
  amount      Decimal
  
  referenceType   String?     // "ORDER", "ESCROW_LOCK", etc.
  referenceId     String?     // Links to order ID
  
  description String
  metadata    Json?           // Extra info
  
  createdAt   DateTime        @default(now())
  
  @@index([walletId])
  @@index([referenceId])
}
```

**Double-Entry Bookkeeping Explained:**

**Wrong Way (Direct Balance Update):**
```typescript
// ❌ Never modify balance directly!
await prisma.wallet.update({
  where: { id: walletId },
  data: { balance: balance - 100 },  // What if someone else updated?
});
```

**Right Way (Ledger Entries):**
```typescript
// ✅ Add ledger entry, calculate balance from entries
await prisma.ledgerEntry.create({
  data: {
    walletId: walletId,
    type: 'DEBIT',
    amount: 100,
    description: 'Order payment',
    referenceType: 'ORDER',
    referenceId: orderId,
  },
});

// Calculate balance:
const balance = await prisma.ledgerEntry.aggregate({
  where: { walletId },
  _sum: {
    amount: true,  // Sum all CREDIT - DEBIT
  },
});
```

**Benefits:**
- ✅ Complete audit trail (see ALL transactions)
- ✅ Can't lose transactions
- ✅ Can rollback/undo transactions
- ✅ Matches real accounting practices

---

## Part 6: Service Communication

### How Services Talk

**Example: Creating an Order**

```
1. User clicks "Buy" on an ad in frontend

2. Frontend → Trade Service (apps/trade/)
   POST /orders
   {
     "adId": "ad-123",
     "amount": 500
   }

3. Trade Service checks:
   - Is user authenticated? (JWT validation)
   - Does ad exist? (Query Market Service OR database)
   - Does seller have enough balance? (Query Wallet Service OR database)

4. Trade Service → Wallet Service (apps/wallet/)
   POST /escrow/lock
   {
     "userId": "seller-123",
     "currency": "USDT",
     "amount": 500
   }

5. Wallet Service:
   - Creates DEBIT ledger entry
   - Locks funds in escrow
   - Returns success

6. Trade Service:
   - Creates Order in database
   - Returns order details to frontend

7. Frontend shows: "Order created! Waiting for payment..."
```

**Communication Patterns:**

**Option 1: Direct Database Access** (What we use now)
```typescript
// Trade Service directly queries database
const ad = await this.db.otcAd.findUnique({ where: { id: adId } });
```
- ✅ Simple, fast
- ✅ All services share same database
- ✅ Good for monorepo

**Option 2: HTTP Calls** (For later, when we split services)
```typescript
// Trade Service calls Market Service API
const ad = await this.httpService.get(`http://market:3002/ads/${adId}`);
```
- ✅ Services can be deployed separately
- ✅ Each service has own database
- ❌ More complex, slower

**Option 3: Message Queue** (Advanced, not implemented yet)
```typescript
// Trade Service publishes event
this.eventBus.publish('order.created', { orderId, sellerId, amount });

// Notification Service listens for event
@EventPattern('order.created')
handleOrderCreated(data: OrderCreatedEvent) {
  this.sendEmail(data.sellerId, 'You have a new order!');
}
```
- ✅ Decoupled, scalable
- ✅ Async processing
- ❌ Complex to debug

---

## Part 7: Building Your First Feature

### Exercise: Add "Get User Balance" Endpoint

Let's build a real feature step-by-step!

**Goal:** Create an endpoint that returns user's wallet balances

#### Step 1: Plan the API

**Endpoint:** `GET /wallets/balance`  
**Auth:** Required (JWT)  
**Response:**
```json
{
  "balances": [
    { "currency": "MAAL", "balance": "1000.50" },
    { "currency": "USDT", "balance": "500.25" }
  ]
}
```

#### Step 2: Create the Service

**File:** `apps/wallet/src/wallets/wallets.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@app/database';

@Injectable()
export class WalletsService {
  constructor(private readonly db: DatabaseService) {}

  async getUserBalances(userId: string) {
    // Query all wallets for this user
    const wallets = await this.db.wallet.findMany({
      where: { userId },
      select: {
        currency: true,
        balance: true,
      },
    });

    return { balances: wallets };
  }
}
```

**Explanation:**
1. `@Injectable()` - Tells NestJS this can be injected into controllers
2. `constructor(private readonly db: DatabaseService)` - Gets Prisma client
3. `findMany()` - Get multiple wallet records
4. `where: { userId }` - Filter by user ID
5. `select` - Only return currency and balance (not all fields)

#### Step 3: Create the Controller

**File:** `apps/wallet/src/wallets/wallets.controller.ts`

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@app/common/guards';
import { CurrentUser } from '@app/common/decorators';
import { User } from '@prisma/client';
import { WalletsService } from './wallets.service';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('balance')
  @UseGuards(JwtAuthGuard)  // ← Requires authentication
  getBalance(@CurrentUser() user: User) {
    // user.id automatically extracted from JWT token!
    return this.walletsService.getUserBalances(user.id);
  }
}
```

**Explanation:**
1. `@Controller('wallets')` - All routes start with `/wallets`
2. `@Get('balance')` - Full path: `GET /wallets/balance`
3. `@UseGuards(JwtAuthGuard)` - Must be logged in
4. `@CurrentUser()` - Extracts user from JWT token
5. Returns data from service

#### Step 4: Wire It Up

**File:** `apps/wallet/src/wallet.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@app/database';
import { CommonModule } from '@app/common';
import { WalletsController } from './wallets/wallets.controller';
import { WalletsService } from './wallets/wallets.service';

@Module({
  imports: [
    DatabaseModule,  // ← Provides Prisma client
    CommonModule,    // ← Provides JwtAuthGuard, @CurrentUser
  ],
  controllers: [WalletsController],
  providers: [WalletsService],
})
export class WalletModule {}
```

#### Step 5: Test It!

```bash
# Start Wallet Service
npm run start:dev wallet

# In another terminal, test with curl
# (Replace TOKEN with JWT from login)
curl -X GET http://localhost:3004/wallets/balance \
  -H "Authorization: Bearer <YOUR_TOKEN_HERE>"
```

**Expected Response:**
```json
{
  "balances": [
    { "currency": "MAAL", "balance": "0" },
    { "currency": "USDT", "balance": "0" }
  ]
}
```

**Congratulations! You just built your first feature!** 🎉

---

## Part 8: Understanding Identity Service

For complete details on how the Identity Service was built from scratch, see: `docs/IDENTITY_SERVICE_BUILD_GUIDE.md`

**Key Concepts Covered:**
- User registration with validation
- Password hashing with bcrypt
- JWT token generation
- Passport JWT strategy
- Protected routes
- Role-based authorization

---

## Part 9: Common Patterns to Reuse

### Pattern 1: Create a Protected Endpoint

```typescript
@Get('profile')
@UseGuards(JwtAuthGuard)  // ← User must be logged in
getProfile(@CurrentUser() user: User) {
  return user;
}
```

### Pattern 2: Role-Based Access

```typescript
@Post('ads')
@UseGuards(JwtAuthGuard, RolesGuard)  // ← Check login AND role
@Roles('SELLER')  // ← Only sellers allowed
createAd(@CurrentUser() user: User, @Body() dto: CreateAdDto) {
  return this.adsService.create(user.id, dto);
}
```

### Pattern 3: Input Validation

```typescript
import { IsString, IsNumber, Min } from 'class-validator';

export class CreateAdDto {
  @IsString()
  @MinLength(3)
  basePair: string;  // Must be string, min 3 chars

  @IsNumber()
  @Min(0)
  marginPercent: number;  // Must be number, min 0
}
```

### Pattern 4: Database Transaction

```typescript
// All operations succeed OR all fail (atomic)
await this.db.$transaction(async (tx) => {
  await tx.wallet.update({
    where: { id: sellerWalletId },
    data: { balance: { decrement: amount } },
  });

  await tx.wallet.update({
    where: { id: buyerWalletId },
    data: { balance: { increment: amount } },
  });
});
```

### Pattern 5: Error Handling

```typescript
@Get(':id')
async findOne(@Param('id') id: string) {
  const ad = await this.adsService.findOne(id);
  
  if (!ad) {
    throw new NotFoundException(`Ad with ID ${id} not found`);
  }
  
  return ad;
}
```

---

## Part 10: Testing Guidelines

### Writing Your First Test

**Test the Service (Business Logic):**

```typescript
describe('WalletsService', () => {
  let service: WalletsService;
  let db: DatabaseService;

  beforeEach(async () => {
    // Setup: Create test module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsService,
        {
          provide: DatabaseService,
          useValue: {
            wallet: {
              findMany: jest.fn(),  // Mock function
            },
          },
        },
      ],
    }).compile();

    service = module.get<WalletsService>(WalletsService);
    db = module.get<DatabaseService>(DatabaseService);
  });

  it('should return user balances', async () => {
    // Arrange: Setup mock data
    const userId = 'user-123';
    const mockWallets = [
      { currency: 'MAAL', balance: 1000 },
      { currency: 'USDT', balance: 500 },
    ];

    jest.spyOn(db.wallet, 'findMany').mockResolvedValue(mockWallets as any);

    // Act: Call the method
    const result = await service.getUserBalances(userId);

    // Assert: Check results
    expect(result.balances).toEqual(mockWallets);
    expect(db.wallet.findMany).toHaveBeenCalledWith({
      where: { userId },
      select: { currency: true, balance: true },
    });
  });
});
```

**Run Tests:**
```bash
npm run test wallets.service
```

---

## Part 11: Security Best Practices

### 1. Never Store Plain Passwords

```typescript
// ❌ WRONG - Never do this!
await db.user.create({
  data: {
    email,
    password: dto.password,  // Plain text!
  },
});

// ✅ CORRECT - Hash passwords
const passwordHash = await bcrypt.hash(dto.password, 12);
await db.user.create({
  data: {
    email,
    passwordHash,  // Hashed!
  },
});
```

### 2. Validate All Input

```typescript
// Use class-validator DTOs
export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
  password: string;
}
```

### 3. Use Environment Variables for Secrets

```typescript
// ❌ WRONG - Secrets in code!
const secret = 'my-secret-key';

// ✅ CORRECT - From environment
const secret = this.configService.get<string>('JWT_ACCESS_SECRET');

// .env file
JWT_ACCESS_SECRET=randomly-generated-secure-secret
```

### 4. Implement Rate Limiting

```typescript
// Prevent brute-force attacks
@Throttle({ default: { limit: 5, ttl: 60000 } })  // 5 requests per minute
@Post('login')
login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}
```

---

## Part 12: Debugging Tips

### VS Code Shows Errors But Build Works

**Issue:** Red squiggles everywhere, but `npm run build` succeeds

**Fix:**
```
1. Press Cmd+Shift+P (macOS) or Ctrl+Shift+P (Windows)
2. Type: "TypeScript: Restart TS Server"
3. Hit Enter
4. Errors should disappear!
```

### Prisma Type Errors

**Issue:** `Property 'user' does not exist on type 'DatabaseService'`

**Fix:**
```bash
npx prisma generate
# Restart VS Code TypeScript server
```

### Database Connection Errors

**Issue:** `Can't reach database server`

**Fix:**
```bash
# Check Docker is running
docker ps

# If no containers, start them
docker-compose up -d

# Check database is ready
docker-compose logs postgres
```

### Port Already in Use

**Issue:** `Error: listen EADDRINUSE: address already in use :::3001`

**Fix:**
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change port in main.ts
await app.listen(3002);  # Use different port
```

---

## 🎯 Practice Exercises

### Exercise 1: Add "Get Single Ad" Endpoint

**Task:** Create `GET /ads/:id` that returns one ad

**Steps:**
1. Add method to `AdsService`
2. Add endpoint to `AdsController`
3. Handle "not found" case
4. Test with curl

### Exercise 2: Add Pagination to Ads List

**Task:** Modify `GET /ads` to support `?page=1&limit=20`

**Hints:**
- Use `@Query()` decorator
- Prisma: `skip` and `take`
- Return total count for UI

### Exercise 3: Add Search Filter

**Task:** Add `?currency=USDT` filter to `GET /ads`

**Hints:**
- Add to query DTO
- Use Prisma `where` clause
- Combine with pagination

---

## 📚 Learning Resources

### Official Docs
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)

### Video Tutorials
- [NestJS Crash Course](https://www.youtube.com/watch?v=GHTA143_b-s)
- [Prisma Tutorial](https://www.youtube.com/watch?v=RebA5J-rlwg)
- [TypeScript for Beginners](https://www.youtube.com/watch?v=BwuLxPH8IDs)

### Practice Projects
- Build a simple blog API
- Create a todo list API
- Build a URL shortener

---

## 🎉 You're Ready!

**Congratulations on completing this guide!** You now understand:

✅ What we're building and why  
✅ Our tech stack and architecture  
✅ How to build features  
✅ Common patterns and best practices  
✅ How to test and debug

**Next Steps:**
1. Review [README.md](./README.md) for quick reference
2. Check [PROGRESS.md](./PROGRESS.md) for current status
3. Read [CONTRIBUTING.md](./CONTRIBUTING.md) for workflow
4. Pick a task from your team's backlog
5. Start coding! 🚀

**Remember:** Everyone was a beginner once. Don't hesitate to ask questions! 💪
