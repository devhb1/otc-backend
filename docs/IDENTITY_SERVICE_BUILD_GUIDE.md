# 🏗️ Building the Identity Service - Complete Journey from Scratch

**Document:** How we built Team 1's Identity Service  
**Date:** February 19, 2026  
**Status:** ✅ Complete and Working

---

## 📖 Table of Contents

1. [The Problem We're Solving](#the-problem)
2. [Why We Chose This Architecture](#why-this-architecture)
3. [Step-by-Step Build Process](#build-process)
4. [Key Design Decisions](#design-decisions)
5. [Testing the Identity Service](#testing)
6. [Common Patterns to Reuse](#patterns)

---

## 🎯 The Problem We're Solving

### What is the Identity Service?

The Identity Service is the **gatekeeper** for our OTC platform. It handles:

1. **User Registration** - Create accounts (buyers, sellers, admins)
2. **Authentication** - Verify who users are (login with email/password)
3. **Authorization** - Control what users can do (roles & permissions)
4. **Session Management** - Keep users logged in securely

### Why Build It First?

**Every other service depends on authentication:**
- Market Service: "Who is creating this ad?" → Need user ID
- Trade Service: "Who is placing this order?" → Need user ID + role
- Wallet Service: "Whose balance to show?" → Need user ID
- Admin Service: "Is this user an admin?" → Need role check

**If we don't build auth first, we can't test anything else securely.**

---

## 🏛️ Why We Chose This Architecture

### Decision 1: NestJS Over Plain Express

**What We Chose:** NestJS  
**Why:** Enforces structure, prevents "spaghetti code"

**The Problem with Plain Express:**
```typescript
// Express: Everything in one file, hard to maintain
app.post('/register', async (req, res) => {
  // Validation here
  // Business logic here
  // Database here
  // Error handling here
  // All mixed together! 😱
});
```

**Our Solution with NestJS:**
```typescript
// Controller (handles HTTP)
@Post('register')
register(@Body() dto: RegisterDto) {
  return this.authService.register(dto);
}

// Service (handles business logic)
async register(dto: RegisterDto) {
  // Pure business logic, easy to test
}

// DTO (handles validation)
class RegisterDto {
  @IsEmail()
  email: string;
}
```

**Benefits:**
- ✅ Clear separation of concerns
- ✅ Easy to test (mock services, not HTTP)
- ✅ TypeScript native (type safety)
- ✅ Modular (team-friendly)

---

### Decision 2: Prisma + PostgreSQL Over MongoDB

**What We Chose:** PostgreSQL with Prisma ORM  
**Why:** Financial data needs ACID compliance

**MongoDB Problems for Financial Systems:**
```javascript
// MongoDB: No transactions, can lose money!
await db.users.updateOne({ id: sellerId }, { $inc: { balance: -100 } });
// ❌ App crashes here
await db.users.updateOne({ id: buyerId }, { $inc: { balance: +100 } });
// Seller lost money, buyer never got it!
```

**PostgreSQL Solution:**
```typescript
// PostgreSQL: Atomic transactions
await prisma.$transaction(async (tx) => {
  await tx.wallet.update({ data: { balance: { decrement: 100 } } });
  await tx.wallet.update({ data: { balance: { increment: 100 } } });
});
// ✅ Either both happen or neither happens
```

**Why Prisma?**
- ✅ Type-safe database queries
- ✅ Auto-generated TypeScript types
- ✅ Migrations handled automatically
- ✅ No SQL injection possible

**Example:**
```typescript
// Types are auto-generated from schema
const user = await prisma.user.findUnique({
  where: { id: '123' }
});
// TypeScript knows all fields: user.email, user.role, etc.
```

---

### Decision 3: JWT Tokens Over Sessions

**What We Chose:** JWT (JSON Web Tokens)  
**Why:** Stateless authentication (scales better)

**Session-Based Auth (What We Didn't Use):**
```
1. User logs in
2. Server stores session in Redis
3. Every request checks Redis
4. Problem: Need to share Redis across all services
```

**JWT-Based Auth (What We Use):**
```
1. User logs in
2. Server generates JWT token (contains user info)
3. Client sends token with each request
4. Server validates token locally (no database/Redis check)
5. Benefit: Market Service can validate without calling Identity Service
```

**JWT Structure:**
```json
{
  "sub": "user-123",      // User ID
  "email": "user@example.com",
  "role": "BUYER",
  "iat": 1708380000,      // Issued at
  "exp": 1708380900       // Expires in 15 minutes
}
```

**Security:**
- ✅ Signed with secret (can't be tampered)
- ✅ Short expiry (15 minutes for access token)
- ✅ Refresh tokens for long-term sessions
- ✅ Tokens stored client-side only

---

### Decision 4: Modular Structure (Shared Libraries)

**What We Chose:** Monorepo with shared `libs/`  
**Why:** Teams don't duplicate code

**The Problem Without Shared Libraries:**
```
identity-service/
  └── getCurrentUser.ts    // Team 1 writes this

market-service/
  └── getCurrentUser.ts    // Team 2 copies it (code duplication)

trade-service/
  └── getCurrentUser.ts    // Team 3 copies it (now 3 versions!)

# Bug found in Team 1's version
# Teams 2 and 3 still have the bug!
```

**Our Solution:**
```
libs/common/
  └── decorators/
      └── current-user.decorator.ts  // Written ONCE

apps/identity/   // Team 1 uses it
apps/market/     // Team 2 uses it
apps/trade/      // Team 3 uses it

# Bug fix in one place → all teams get the fix!
```

**How Teams Use It:**
```typescript
// All teams import the same decorator
import { CurrentUser } from '@app/common/decorators';

@Get('profile')
getProfile(@CurrentUser() user: User) {
  // Works identically in all services
}
```

---

## 🛠️ Step-by-Step Build Process

### Phase 1: Project Foundation

#### Step 1.1: Initialize NestJS Project

```bash
# Install NestJS CLI (command-line tool)
npm i -g @nestjs/cli

# Create project
nest new otc-platform

# Result: Basic NestJS structure created
```

**What This Created:**
- `src/` - Main application code
- `tsconfig.json` - TypeScript configuration
- `nest-cli.json` - NestJS configuration
- `package.json` - Dependencies

**Why This Way:**  
NestJS CLI generates production-ready structure automatically. Saves hours of setup.

---

#### Step 1.2: Install Core Dependencies

```bash
cd otc-platform

# Prisma (database ORM)
npm install @prisma/client prisma

# JWT & Passport (authentication)
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install --save-dev @types/passport-jwt

# Validation
npm install class-validator class-transformer

# Password hashing
npm install bcrypt
npm install --save-dev @types/bcrypt

# Configuration
npm install @nestjs/config
```

**Why Each Dependency:**

| Package | Purpose | Why This One |
|---------|---------|--------------|
| `@prisma/client` | Talk to PostgreSQL | Type-safe, auto-completion |
| `@nestjs/jwt` | Generate JWT tokens | Official NestJS integration |
| `passport-jwt` | Validate JWT tokens | Industry standard, battle-tested |
| `class-validator` | Validate user input | Declarative, easy to read |
| `bcrypt` | Hash passwords | Secure, can't be reversed |
| `@nestjs/config` | Manage env variables | Type-safe configuration |

---

#### Step 1.3: Create Prisma Schema

```bash
# Initialize Prisma
npx prisma init

# This creates:
# - prisma/schema.prisma (database structure)
# - .env (environment variables)
```

**Why Prisma Schema First?**  
The schema is the **single source of truth** for your data model. All teams work from the same schema.

**Our Schema Design (`prisma/schema.prisma`):**

```prisma
// User model - Core of identity
model User {
  id            String       @id @default(uuid())
  email         String       @unique
  passwordHash  String       // Never store passwords in plain text!
  role          UserRole     @default(BUYER)
  status        UserStatus   @default(ACTIVE)
  kycStatus     KycStatus    @default(PENDING)
  
  // Relations
  wallets       Wallet[]     // One user, many wallets (multi-currency)
  ordersAsBuyer Order[]      @relation("BuyerOrders")
  ordersAsSeller Order[]     @relation("SellerOrders")
  ads           OtcAd[]      // Sellers have ads
  
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  
  // Indexes for fast lookups
  @@index([email])
  @@index([role])
}

// Enums for type safety
enum UserRole {
  BUYER
  SELLER
  ADMIN
  ENABLER
}
```

**Why This Design?**

1. **UUID instead of integer ID:** Can't guess user IDs
2. **`passwordHash` not `password`:** Never store raw passwords
3. **Enums for roles:** Can't have invalid roles like "ADMIN123"
4. **Indexes on email/role:** Fast search queries
5. **Relations defined:** Prisma handles foreign keys automatically

---

#### Step 1.4: Setup Shared Libraries

```bash
# Generate database library
nest g library database

# Generate common library
nest g library common
```

**What This Created:**
```
libs/
├── database/
│   ├── src/
│   │   ├── database.service.ts    # Prisma client wrapper
│   │   ├── database.module.ts     # NestJS module
│   │   └── index.ts               # Public exports
│   └── tsconfig.lib.json
│
└── common/
    ├── src/
    │   ├── decorators/             # Custom decorators
    │   ├── guards/                 # Auth guards
    │   └── index.ts
    └── tsconfig.lib.json
```

**Why Libraries?**
- ✅ All services import from `@app/database` (consistent)
- ✅ Change once, all services updated
- ✅ Easy to test (mock the library)

---

### Phase 2: Database Service (Foundation Layer)

#### Step 2.1: Create DatabaseService

**File:** `libs/database/src/database.service.ts`

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(DatabaseService.name);

    constructor(private configService: ConfigService) {
        super({
            log: process.env.NODE_ENV === 'development'
                ? ['query', 'info', 'warn', 'error']  // Verbose in dev
                : ['error'],                           // Quiet in production
            errorFormat: 'pretty',
        });
    }

    async onModuleInit() {
        await this.$connect();
        this.logger.log('✅ Database connected');
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('❌ Database disconnected');
    }
}
```

**Why This Way?**

1. **Extends PrismaClient:** Gets all Prisma methods (`user`, `wallet`, etc.)
2. **Lifecycle hooks:** Auto-connect when app starts, auto-disconnect when app stops
3. **Logging:** See queries in development (helps debugging)
4. **Injectable:** Can be dependency-injected anywhere

**How Teams Use It:**
```typescript
// In any service
constructor(private readonly db: DatabaseService) {}

async getUser(id: string) {
  return this.db.user.findUnique({ where: { id } });
  //           ↑ TypeScript knows all fields!
}
```

---

#### Step 2.2: Create DatabaseModule

**File:** `libs/database/src/database.module.ts`

```typescript
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database.service';

@Global()  // ← Makes it available everywhere
@Module({
  imports: [ConfigModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
```

**Why `@Global()`?**

Without `@Global()`:
```typescript
// Every module needs to import DatabaseModule
@Module({
  imports: [DatabaseModule],  // Annoying!
})
export class MarketModule {}
```

With `@Global()`:
```typescript
// Import once in root module, available everywhere
@Module({
  imports: [DatabaseModule],  // Only here
})
export class AppModule {}

// Other modules just use it
@Module({})
export class MarketModule {}  // DatabaseService available!
```

---

### Phase 3: Identity Service (Core Logic)

#### Step 3.1: Generate Identity App

```bash
# Generate new NestJS application
nest g app identity

# This creates:
# apps/identity/
#   ├── src/
#   │   ├── identity.module.ts
#   │   └── main.ts
#   └── tsconfig.app.json
```

**Why Separate App?**  
Each service runs independently (different port, can scale separately).

---

#### Step 3.2: Create Auth Module

```bash
cd apps/identity
nest g module auth
nest g controller auth
nest g service auth
```

**Structure Created:**
```
apps/identity/src/
├── auth/
│   ├── auth.controller.ts   # HTTP endpoints
│   ├── auth.service.ts      # Business logic
│   └── auth.module.ts       # Module definition
```

---

#### Step 3.3: Build DTOs (Data Transfer Objects)

**File:** `apps/identity/src/auth/dto/register.dto.ts`

```typescript
import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
    @IsEmail({}, { message: 'Invalid email format' })
    email: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    password: string;

    @IsEnum(UserRole, { message: 'Role must be BUYER, SELLER, ADMIN, or ENABLER' })
    role: UserRole;
}
```

**Why DTOs?**

**Without DTOs:** 
```typescript
// No validation, anything can pass through
@Post('register')
register(@Body() body: any) {  // ❌ body could be anything!
  // body.email might be undefined
  // body.password might be "123" (too short)
  // body.role might be "HACKER" (invalid)
}
```

**With DTOs:**
```typescript
// Automatic validation before reaching controller
@Post('register')
register(@Body() dto: RegisterDto) {  // ✅ Validated!
  // dto.email is guaranteed to be valid email
  // dto.password is guaranteed to be 8+ characters
  // dto.role is guaranteed to be valid enum
}
```

**Validation Happens Automatically:**
```json
// Invalid request
{
  "email": "not-an-email",
  "password": "123",
  "role": "HACKER"
}

// Response (before reaching controller)
{
  "statusCode": 400,
  "message": [
    "Invalid email format",
    "Password must be at least 8 characters",
    "Role must be BUYER, SELLER, ADMIN, or ENABLER"
  ]
}
```

---

#### Step 3.4: Build AuthService (Business Logic)

**File:** `apps/identity/src/auth/auth.service.ts`

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user
   * 
   * Steps:
   * 1. Check if email already exists
   * 2. Hash password (bcrypt)
   * 3. Create user + wallet in transaction
   * 4. Generate JWT tokens
   */
  async register(dto: RegisterDto) {
    // Step 1: Check existing user
    const existingUser = await this.db.user.findUnique({
      where: { email: dto.email },
    });
    
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Step 2: Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);
    //                                                    ↑ Salt rounds (higher = more secure, slower)

    // Step 3: Create user + wallet (atomic transaction)
    const user = await this.db.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: dto.role,
        },
      });

      // Create default wallets (multi-currency)
      await tx.wallet.createMany({
        data: [
          { userId: newUser.id, currency: 'MAAL', balance: 0 },
          { userId: newUser.id, currency: 'USDT', balance: 0 },
        ],
      });

      return newUser;
    });

    // Step 4: Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Login existing user
   */
  async login(dto: LoginDto) {
    // Find user
    const user = await this.db.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    return this.generateTokens(user.id, user.email, user.role);
  }

  /**
   * Generate access + refresh tokens
   */
  private async generateTokens(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: '15m',  // Short-lived
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',   // Long-lived
      }),
    ]);

    return { accessToken, refreshToken, expiresIn: 900 };
  }
}
```

**Key Design Decisions:**

1. **`bcrypt` with 12 rounds:** Industry standard for password hashing
2. **Transaction for user + wallet:** Atomic (both happen or neither)
3. **Two JWT secrets:** Access vs Refresh tokens have different secrets
4. **15-minute access token:** Limits damage if token is stolen
5. **7-day refresh token:** User doesn't log in every 15 minutes

---

#### Step 3.5: Create JWT Strategy

**File:** `apps/identity/src/auth/strategies/jwt.strategy.ts`

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || 'default-secret',
    });
  }

  /**
   * Called after token is verified
   * Loads user from database and attaches to request
   */
  async validate(payload: any) {
    const user = await this.authService.validateUser(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    return user;  // Attached to request.user
  }
}
```

**How This Works:**

```
1. Client sends request:
   GET /profile
   Authorization: Bearer eyJhbGciOiJIUzI1...

2. JwtStrategy extracts token from header

3. JwtStrategy verifies signature (using secret)

4. If valid, calls validate() with decoded payload

5. validate() loads user from database

6. User attached to request object

7. Controller receives request with user attached
```

**Usage in Controller:**
```typescript
@UseGuards(JwtAuthGuard)  // ← Applies JWT validation
@Get('profile')
getProfile(@Req() req) {
  return req.user;  // User attached by JwtStrategy
}
```

---

#### Step 3.6: Create Auth Controller

**File:** `apps/identity/src/auth/auth.controller.ts`

```typescript
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register new user
   * POST /auth/register
   */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Login existing user
   * POST /auth/login
   */
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }
}
```

**Why Minimal Controller?**

Controllers should be **thin** (just routing). All logic in services:
- ✅ Easy to test (test services, not HTTP)
- ✅ Reusable (services can call other services)
- ✅ Clear separation (HTTP vs business logic)

---

### Phase 4: Shared Utilities

#### Step 4.1: Create CurrentUser Decorator

**File:** `libs/common/src/decorators/current-user.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;  // Attached by JwtStrategy
  },
);
```

**Why?**

**Before (ugly):**
```typescript
@Get('profile')
getProfile(@Req() req) {
  const user = req.user;  // Not type-safe!
  return user;
}
```

**After (clean):**
```typescript
@Get('profile')
getProfile(@CurrentUser() user: User) {  // Type-safe!
  return user;
}
```

---

#### Step 4.2: Create Roles Guard

**File:** `libs/common/src/guards/roles.guard.ts`

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;  // No roles required
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

**Usage:**
```typescript
// Create a @Roles decorator
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

// Use in controller
@Post('ads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER')  // Only sellers can create ads
createAd(@CurrentUser() user: User) {
  // Guaranteed user.role === 'SELLER'
}
```

---

## 🎯 Key Design Decisions - Summary

### 1. Modular Architecture

**Decision:** Split by domain (auth, users, market, trade)  
**Why:** Teams work independently, minimal conflicts  
**Trade-off:** More files, but clearer structure

### 2. TypeScript Everywhere

**Decision:** Strict TypeScript, no `any` types  
**Why:** Catch errors at compile-time, not runtime  
**Trade-off:** More verbose, but safer

### 3. Database-First Design

**Decision:** Design Prisma schema first, then services  
**Why:** Schema is source of truth, generates types  
**Trade-off:** Schema changes need coordination

### 4. JWT Over Sessions

**Decision:** Stateless JWT tokens  
**Why:** Scale horizontally, service independence  
**Trade-off:** Can't revoke tokens instantly (mitigate with short expiry)

### 5. DTO Validation

**Decision:** Validate at API boundary using class-validator  
**Why:** Catch bad input before business logic  
**Trade-off:** More classes to maintain

### 6. Shared Libraries

**Decision:** Extract common code to `libs/`  
**Why:** DRY principle, consistent patterns  
**Trade-off:** Changes affect all services (but that's good!)

### 7. Transaction-Based Operations

**Decision:** Wrap related DB ops in transactions  
**Why:** Data consistency (all or nothing)  
**Trade-off:** Slight performance overhead, but worth it

---

## 🧪 Testing the Identity Service

### Manual Testing with cURL

#### 1. Register a User
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePass123!",
    "role": "BUYER"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "alice@example.com",
    "role": "BUYER"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

#### 2. Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePass123!"
  }'
```

#### 3. Access Protected Route
```bash
# Use the accessToken from login response
curl -X GET http://localhost:3001/users/profile \
  -H "Authorization: Bearer <your-access-token-here>"
```

---

## 📚 Common Patterns to Reuse

### Pattern 1: Create a New Service

```bash
# Generate new app
nest g app wallet

# Generate modules
nest g module ledger
nest g controller ledger
nest g service ledger

# Import DatabaseModule
# Use DatabaseService in your service
```

### Pattern 2: Protect a Route

```typescript
@UseGuards(JwtAuthGuard)  // Check if user is logged in
@Get('profile')
getProfile(@CurrentUser() user: User) {
  return user;
}
```

### Pattern 3: Role-Based Authorization

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')  // Only admins
@Delete('users/:id')
deleteUser(@Param('id') id: string) {
  return this.usersService.delete(id);
}
```

### Pattern 4: Database Transaction

```typescript
return this.db.$transaction(async (tx) => {
  // All operations in transaction
  await tx.user.update(...);
  await tx.wallet.update(...);
  // If any fails, all rollback
});
```

### Pattern 5: DTO with Validation

```typescript
export class CreateAdDto {
  @IsString()
  @MinLength(1)
  basePair: string;

  @IsNumber()
  @Min(0)
  marginPercent: number;
}
```

---

## 🎓 What You Learned

1. **NestJS Modules** - Organize code by feature
2. **Dependency Injection** - Services inject dependencies
3. **DTOs** - Validate input automatically
4. **Prisma** - Type-safe database access
5. **JWT** - Stateless authentication
6. **Guards** - Protect routes
7. **Decorators** - Custom parameter extraction
8. **Transactions** - Atomic database operations
9. **Shared Libraries** - Code reuse across services
10. **Modular Architecture** - Independent team development

---

## ✅ Identity Service Complete!

**What We Built:**
- ✅ User registration with validation
- ✅ Login with JWT tokens
- ✅ Password hashing (bcrypt)
- ✅ Protected routes (JwtAuthGuard)
- ✅ Role-based access (RolesGuard)
- ✅ Profile management
- ✅ Token refresh flow

**API Endpoints:**
- `POST /auth/register` - Create account
- `POST /auth/login` - Get JWT tokens
- `POST /auth/refresh` - Refresh access token
- `GET /users/profile` - Get current user (protected)
- `PATCH /users/role` - Switch role (protected)

**Next Steps:**
- Build Market Service (Team 2)
- Use Identity Service patterns
- Protect Market endpoints with JWT

---

**This is the foundation all other services will build upon!** 🚀
