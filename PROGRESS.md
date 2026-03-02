# 🚀 OTC Platform - Build Progress & Learning Guide

**Project:** Modular OTC Trading Platform Backend  
**Started:** February 19, 2026  
**Stack:** NestJS + Prisma + PostgreSQL + Redis + Docker  
**Approach:** Backend-first MVP, team-parallel development

---

## 📊 Current Status

**Phase:** Phase 0 - Core Foundation  
**Progress:** 90% Complete ✅  
**Current Focus:** Identity Service complete - ready for testing

### ✅ Completed Steps

1. ✅ Initialized NestJS monorepo
2. ✅ Installed all required dependencies (Prisma, JWT, bcrypt, etc.)
3. ✅ Created complete Prisma schema (all tables, enums, relations)
4. ✅ Configured Docker Compose (PostgreSQL + Redis)
5. ✅ Created modular folder structure (apps/ + libs/)
6. ✅ Built Identity Service **COMPLETE**
7. ✅ Created shared libraries (database, common utilities)
8. ✅ Configured environment variables
9. ✅ Pushed to GitHub repository
10. ✅ Generated Prisma client successfully
11. ✅ Fixed all TypeScript compilation errors
12. ✅ **Build successful** (`npm run build` passes)
13. ✅ Created comprehensive HOW/WHY documentation

### 🟡 PENDING - Docker Installation (Last Blocker)

**Current Issue:** Docker is not installed on your system. We need it to run PostgreSQL and Redis for testing.

**To unblock:**
```bash
# Install Docker Desktop (macOS)
brew install --cask docker

# Start Docker Desktop application
# Then verify:
docker --version
docker ps
```

### ⏳ Next Steps (After Docker)

1. Start Docker containers: `docker-compose up -d`
2. Push schema to database: `npx prisma db push`
3. **Test Identity Service endpoints** (curl commands)
4. Commit working code to Git
5. **Start Market Service** (Phase 1)

---

## 🎯 Project Architecture Overview

### Service Breakdown (6 Core Services)

```
otc-platform/
├── apps/                          # Microservices (each deployable)
│   ├── identity/                  # Team 1: Auth, Users, KYC
│   ├── market/                    # Team 2: Ads, Pricing, Search
│   ├── trade/                     # Team 3: Orders, Escrow, Disputes
│   ├── wallet/                    # Team 4: Ledger, Balances
│   ├── notification/              # Team 5: Email, WebSocket
│   └── admin/                     # Team 6: Admin Dashboard
│
├── libs/                          # Shared libraries (used by all services)
│   ├── database/                  # Prisma client (single source of truth)
│   ├── common/                    # Shared utilities, decorators, guards
│   └── types/                     # Shared TypeScript interfaces
│
├── prisma/                        # Database schema & migrations
├── docker/                        # Docker configurations
└── docs/                          # Documentation
```

### Why This Structure?

**Benefits:**
- ✅ **Team Parallelization:** Each team owns a service, minimal conflicts
- ✅ **Modularity:** Services are loosely coupled
- ✅ **Scalability:** Each service can be deployed independently later
- ✅ **Code Reuse:** Shared libraries prevent duplication
- ✅ **Type Safety:** Shared types ensure consistency

---

## 📚 PHASE 0: FOUNDATION SETUP

> **Goal:** Create professional project structure that supports 3-5 teams working in parallel

### Step 1: Initial NestJS Setup ✅

**What we did:**
```bash
# Install NestJS CLI globally
npm i -g @nestjs/cli

# Create new project
nest new otc-platform

# Navigate to project
cd otc-platform

# Initialize Git
git init
git add .
git commit -m "Initial NestJS setup"
```

**Learning:** NestJS CLI generates a production-ready structure with TypeScript, ESLint, and Jest configured out of the box.

---

### Step 2: Install Core Dependencies 🔄

**Required packages for financial platform:**

```bash
# Core ORM & Database
npm install @prisma/client prisma
npm install -D prisma

# Validation & Transformation (critical for financial data)
npm install class-validator class-transformer

# Security
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt

# Configuration
npm install @nestjs/config

# Redis Cache
npm install @nestjs/cache-manager cache-manager
npm install cache-manager-redis-yet redis

# File Upload (for payment proofs)
npm install @nestjs/platform-express multer
npm install -D @types/multer

# API Documentation
npm install @nestjs/swagger

# Decimal Math (NEVER use Float for money!)
npm install decimal.js
```

**Why each dependency?**

| Package | Purpose | Why Critical |
|---------|---------|--------------|
| `class-validator` | Validate incoming requests | Prevent invalid data from reaching database |
| `@nestjs/jwt` | JWT authentication | Secure, stateless auth for microservices |
| `bcrypt` | Password hashing | Industry standard, secure password storage |
| `decimal.js` | Precise decimal math | Financial calculations need precision |
| `cache-manager` | Caching layer | Store FX rates, reduce API calls |
| `@nestjs/swagger` | Auto-generate API docs | Teams need API contracts |

---

### Step 3: Configure Docker Compose 🔄

**What Docker Compose does:**
Docker Compose lets you run PostgreSQL and Redis locally without installing them on your machine. This ensures **everyone on your team has the exact same environment**.

**File:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  # PostgreSQL Database (our main data store)
  postgres:
    image: postgres:15-alpine
    container_name: otc-postgres
    environment:
      POSTGRES_USER: otc_user
      POSTGRES_PASSWORD: otc_password
      POSTGRES_DB: otc_platform
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U otc_user']
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis (for caching FX rates and session data)
  redis:
    image: redis:7-alpine
    container_name: otc-redis
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  # Prisma Studio (visual database browser)
  # Access at http://localhost:5555
  prisma-studio:
    image: node:20-alpine
    container_name: otc-prisma-studio
    working_dir: /app
    volumes:
      - .:/app
    ports:
      - '5555:5555'
    depends_on:
      - postgres
    command: sh -c "npm install -g prisma && npx prisma studio"
    environment:
      - DATABASE_URL=postgresql://otc_user:otc_password@postgres:5432/otc_platform

volumes:
  postgres_data:
  redis_data:
```

**To start:**
```bash
docker-compose up -d    # Start in background
docker-compose logs -f  # View logs
docker-compose down     # Stop everything
```

**Learning Points:**

1. **Health Checks:** Docker waits until PostgreSQL is ready before starting other services
2. **Volumes:** Data persists even if you restart containers
3. **Ports:** 5432 (PostgreSQL), 6379 (Redis), 5555 (Prisma Studio)
4. **Environment Variables:** Keep credentials in `.env` for production

---

### Step 4: Setup Environment Variables 🔄

**File:** `.env`

```bash
# Database
DATABASE_URL="postgresql://otc_user:otc_password@localhost:5432/otc_platform?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_ACCESS_SECRET=your-super-secret-access-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# API
PORT=3000
NODE_ENV=development

# File Upload
MAX_FILE_SIZE=5242880  # 5MB in bytes

# FX API (Google Finance alternative)
FX_API_KEY=your-api-key-here
FX_API_URL=https://api.exchangerate-api.com/v4/latest

# Admin
ADMIN_EMAIL=admin@otcplatform.com
```

**File:** `.env.example` (commit this to Git)

```bash
DATABASE_URL="postgresql://otc_user:otc_password@localhost:5432/otc_platform?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE=5242880
FX_API_KEY=
FX_API_URL=https://api.exchangerate-api.com/v4/latest
ADMIN_EMAIL=admin@otcplatform.com
```

**Update `.gitignore` to exclude `.env`:**
```bash
# Add to .gitignore
.env
.env.local
.env.*.local
```

---

### Step 5: Setup Complete Prisma Schema 🔄

**File:** `prisma/schema.prisma`

This is the **single source of truth** for our database structure.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== ENUMS ====================

enum UserRole {
  BUYER
  SELLER
  ADMIN
  ENABLER
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DEACTIVATED
}

enum KycStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}

enum OrderStatus {
  CREATED
  PAYMENT_PENDING
  PAYMENT_UPLOADED
  RELEASED
  COMPLETED
  DISPUTED
  CANCELLED
  EXPIRED
}

enum DisputeStatus {
  OPEN
  UNDER_REVIEW
  RESOLVED
}

enum LedgerEntryType {
  CREDIT
  DEBIT
}

// ==================== MODELS ====================

model User {
  id            String       @id @default(uuid())
  email         String       @unique
  passwordHash  String       @map("password_hash")
  role          UserRole     @default(BUYER)
  status        UserStatus   @default(ACTIVE)
  kycStatus     KycStatus    @default(PENDING) @map("kyc_status")
  referralCode  String?      @unique @map("referral_code")
  referredBy    String?      @map("referred_by")
  
  // Relations
  wallets       Wallet[]
  ordersAsBuyer Order[]      @relation("BuyerOrders")
  ordersAsSeller Order[]     @relation("SellerOrders")
  ads           OtcAd[]
  kycRecords    KycRecord[]
  auditLogs     AuditLog[]
  
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")
  
  @@index([email])
  @@index([role])
  @@index([kycStatus])
  @@map("users")
}

model KycRecord {
  id            String       @id @default(uuid())
  userId        String       @map("user_id")
  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  providerId    String?      @map("provider_id")
  status        KycStatus    @default(PENDING)
  documentUrl   String?      @map("document_url")
  metadata      Json?
  
  submittedAt   DateTime     @default(now()) @map("submitted_at")
  reviewedAt    DateTime?    @map("reviewed_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")
  
  @@index([userId])
  @@map("kyc_records")
}

model Wallet {
  id            String          @id @default(uuid())
  userId        String          @map("user_id")
  user          User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  currency      String
  balance       Decimal         @default(0) @db.Decimal(18, 8)
  lockedBalance Decimal         @default(0) @map("locked_balance") @db.Decimal(18, 8)
  
  ledgerEntries LedgerEntry[]
  
  createdAt     DateTime        @default(now()) @map("created_at")
  updatedAt     DateTime        @updatedAt @map("updated_at")
  
  @@unique([userId, currency])
  @@index([userId])
  @@map("wallets")
}

model LedgerEntry {
  id            String          @id @default(uuid())
  walletId      String          @map("wallet_id")
  wallet        Wallet          @relation(fields: [walletId], references: [id], onDelete: Cascade)
  
  type          LedgerEntryType
  amount        Decimal         @db.Decimal(18, 8)
  balance       Decimal         @db.Decimal(18, 8)
  
  referenceId   String?         @map("reference_id")
  referenceType String?         @map("reference_type")
  description   String?
  metadata      Json?
  
  createdAt     DateTime        @default(now()) @map("created_at")
  
  @@index([walletId])
  @@index([referenceId])
  @@index([createdAt])
  @@map("ledger_entries")
}

model OtcAd {
  id              String    @id @default(uuid())
  sellerId        String    @map("seller_id")
  seller          User      @relation(fields: [sellerId], references: [id], onDelete: Cascade)
  
  basePair        String    @map("base_pair")
  baseCurrency    String    @map("base_currency")
  priceType       String    @map("price_type")
  marginPercent   Decimal   @map("margin_percent") @db.Decimal(5, 2)
  
  minLimit        Decimal   @map("min_limit") @db.Decimal(18, 8)
  maxLimit        Decimal   @map("max_limit") @db.Decimal(18, 8)
  
  paymentMethods  String[]  @map("payment_methods")
  region          String
  
  isActive        Boolean   @default(true) @map("is_active")
  stock           Decimal   @db.Decimal(18, 8)
  
  orders          Order[]
  
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  @@index([sellerId])
  @@index([isActive])
  @@index([region])
  @@map("otc_ads")
}

model Order {
  id              String       @id @default(uuid())
  
  buyerId         String       @map("buyer_id")
  buyer           User         @relation("BuyerOrders", fields: [buyerId], references: [id])
  sellerId        String       @map("seller_id")
  seller          User         @relation("SellerOrders", fields: [sellerId], references: [id])
  
  adId            String       @map("ad_id")
  ad              OtcAd        @relation(fields: [adId], references: [id])
  
  fiatAmount      Decimal      @map("fiat_amount") @db.Decimal(18, 2)
  fiatCurrency    String       @map("fiat_currency")
  cryptoAmount    Decimal      @map("crypto_amount") @db.Decimal(18, 8)
  cryptoCurrency  String       @map("crypto_currency")
  
  exchangeRate    Decimal      @map("exchange_rate") @db.Decimal(18, 8)
  
  status          OrderStatus  @default(CREATED)
  
  paymentMethod   String       @map("payment_method")
  paymentProofUrl String?      @map("payment_proof_url")
  
  expiresAt       DateTime?    @map("expires_at")
  completedAt     DateTime?    @map("completed_at")
  
  disputes        Dispute[]
  stateHistory    OrderStateHistory[]
  
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")
  
  @@index([buyerId])
  @@index([sellerId])
  @@index([status])
  @@index([createdAt])
  @@map("orders")
}

model OrderStateHistory {
  id              String       @id @default(uuid())
  orderId         String       @map("order_id")
  order           Order        @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  fromStatus      OrderStatus? @map("from_status")
  toStatus        OrderStatus  @map("to_status")
  
  triggeredBy     String       @map("triggered_by")
  reason          String?
  metadata        Json?
  
  createdAt       DateTime     @default(now()) @map("created_at")
  
  @@index([orderId])
  @@index([createdAt])
  @@map("order_state_history")
}

model Dispute {
  id              String         @id @default(uuid())
  orderId         String         @map("order_id")
  order           Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  initiatorId     String         @map("initiator_id")
  reason          String
  description     String?
  evidenceUrls    String[]       @map("evidence_urls")
  
  status          DisputeStatus  @default(OPEN)
  
  adminNotes      String?        @map("admin_notes")
  resolution      String?
  resolvedBy      String?        @map("resolved_by")
  resolvedAt      DateTime?      @map("resolved_at")
  
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")
  
  @@index([orderId])
  @@index([status])
  @@map("disputes")
}

model AuditLog {
  id              String         @id @default(uuid())
  
  userId          String?        @map("user_id")
  user            User?          @relation(fields: [userId], references: [id])
  action          String
  entityType      String         @map("entity_type")
  entityId        String         @map("entity_id")
  
  changes         Json?
  ipAddress       String?        @map("ip_address")
  userAgent       String?        @map("user_agent")
  
  createdAt       DateTime       @default(now()) @map("created_at")
  
  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

**Key Prisma Concepts:**

1. **@map()**: Maps TypeScript field names to snake_case database columns (industry standard)
2. **@relation()**: Defines foreign key relationships
3. **@@index()**: Creates database indexes for fast queries
4. **@db.Decimal(18, 8)**: Precise decimal storage (critical for money!)
5. **onDelete: Cascade**: When user is deleted, delete their records too

**Generate Prisma Client:**
```bash
npx prisma generate
npx prisma migrate dev --name init
```

---

### Step 6: Create Modular Folder Structure 🔄

**Current structure:** Single `src/` folder (doesn't scale)  
**Target structure:** Modular monorepo (team-friendly)

**Commands to create structure:**

```bash
# Create apps directory (microservices)
mkdir -p apps/identity/src
mkdir -p apps/market/src
mkdir -p apps/trade/src
mkdir -p apps/wallet/src
mkdir -p apps/notification/src
mkdir -p apps/admin/src

# Create shared libraries
mkdir -p libs/database/src
mkdir -p libs/common/src/{decorators,guards,interceptors,pipes,filters,dto}
mkdir -p libs/types/src

# Create documentation
mkdir -p docs/api
mkdir -p docs/architecture
```

**What goes where:**

| Folder | Contents | Who Uses It |
|--------|----------|-------------|
| `apps/identity/` | Auth, Users, KYC | Team 1 |
| `apps/market/` | Ads, Pricing | Team 2 |
| `apps/trade/` | Orders, Escrow | Team 3 |
| `apps/wallet/` | Ledger, Balances | Team 4 |
| `libs/database/` | Prisma client | All teams |
| `libs/common/` | Shared utilities | All teams |
| `libs/types/` | TypeScript interfaces | All teams |

---

### Step 7: Setup Shared Database Module 🔄

**Why we need this:**
Every service needs to access the database, but we don't want to initialize Prisma in every service. This shared module gives everyone access to the Prisma client.

**File:** `libs/database/src/database.module.ts`

```typescript
import { Module, Global } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Global()  // Makes this module available everywhere
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
```

**File:** `libs/database/src/database.service.ts`

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],  // Enable query logging
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('❌ Database disconnected');
  }
}
```

**File:** `libs/database/src/index.ts`

```typescript
export * from './database.module';
export * from './database.service';
```

**Learning:** This pattern ensures:
1. Single database connection (efficient)
2. Automatic connection/disconnection
3. Query logging in development
4. All services use the same Prisma client

---

## 📝 Quick Reference

### Common Commands

```bash
# Start development
npm run start:dev

# Start Docker services
docker-compose up -d

# Generate Prisma client (after schema changes)
npx prisma generate

# Create migration
npx prisma migrate dev --name description_here

# View database
npx prisma studio

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

---

## 🎓 Learning Resources

### For Team Members New to NestJS

1. **NestJS Docs:** https://docs.nestjs.com/
2. **Prisma Docs:** https://www.prisma.io/docs
3. **PostgreSQL Tutorial:** https://www.postgresqltutorial.com/

### Key Concepts to Understand

- **Dependency Injection:** How NestJS passes services around
- **Decorators:** `@Injectable()`, `@Controller()`, `@Get()`
- **DTO (Data Transfer Objects):** Validate incoming data
- **Guards:** Protect routes (authentication)
- **Interceptors:** Modify requests/responses
- **Pipes:** Transform/validate data

---

## 🐛 Troubleshooting

### Issue: Prisma Client not found
```bash
npx prisma generate
```

### Issue: Database connection failed
1. Check Docker is running: `docker ps`
2. Check credentials in `.env`
3. Restart containers: `docker-compose restart`

### Issue: Port already in use
```bash
# Find process using port 3000
lsof -ti:3000 | xargs kill -9
```

---

## 📈 Next Steps

Once foundation is complete, we'll build services in this order:

1. **Identity Service** (Week 1) - Auth, Users
2. **Wallet Service** (Week 1-2) - Ledger system
3. **Market Service** (Week 2) - Ads, Pricing
4. **Trade Service** (Week 3) - Orders, Escrow
5. **Notification Service** (Week 3) - Real-time updates
6. **Admin Service** (Week 4) - Dashboard, Disputes

---

**Last Updated:** {{ DATE }}  
**Updated By:** Development Team  
**Current Phase:** Foundation Setup
