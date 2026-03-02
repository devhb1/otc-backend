# 🤝 Contributing to OTC Trading Platform

**Welcome to the team!** This guide explains how to contribute to the project, work with your team, and maintain code quality.

---

## 📋 Table of Contents  

- [Getting Started](#-getting-started)
- [Development Workflow](#-development-workflow)
- [Git Guidelines](#-git-guidelines)
- [Code Standards](#-code-standards)
- [Testing Guidelines](#-testing-guidelines)
- [Team Collaboration](#-team-collaboration)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Getting Started

### 1. Initial Setup

```bash
# Clone repository
git clone <repo-url>
cd otc-platform

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# ⚠️ Ask your team lead for dev environment values

# Start Docker
docker-compose up -d

# Initialize database
npx prisma generate
npx prisma db push

# Verify setup
npm run build
```

### 2. Understand the Structure

```
otc-platform/
├── apps/              # Your service goes here
│   └── identity/      # Example: Team 1's service
├── libs/              # Shared code (DON'T modify without team discussion)
│   ├── database/      # Prisma client
│   └── common/        # Guards, decorators
├── prisma/            # Database schema (coordinate changes with all teams)
└── docs/              # Documentation
```

**Golden Rules:**
- ✅ Work in `apps/your-service/` - your team's folder
- ⚠️ Modify `libs/` only with team consensus
- ⚠️ Modify `prisma/schema.prisma` only after team discussion
- ❌ Never directly edit other team's `apps/` folders  

---

## 💻 Development Workflow

### Daily Workflow

```bash
# 1. Start of day - get latest code
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Start Docker services (if not running)
docker-compose up -d

# 4. Start your service in dev mode
npm run start:dev your-service
# Runs on http://localhost:300X (X = your service port)

# 5. Make your changes
# Edit files in apps/your-service/

# 6. Test as you go
# Visit http://localhost:300X/api for Swagger docs

# 7. End of day - commit your work
git add .
git commit -m "feat(service): descriptive message"
git push origin feature/your-feature-name
```

### Creating a New Feature

**Step 1: Create Branch**
```bash
git checkout develop
git pull
git checkout -b feature/market-service-search
```

**Step 2: Build Feature**
```bash
# If creating new service
nest g app market

# If adding module to existing service
cd apps/your-service
nest g module search
nest g controller search
nest g service search
```

**Step 3: Import Shared Libraries**
```typescript
// In your module
import { DatabaseModule } from '@app/database';
import { CommonModule } from '@app/common';

@Module({
  imports: [DatabaseModule, CommonModule],
  // ...
})
```

**Step 4: Test Locally**
```bash
# Start your service
npm run start:dev your-service

# Test with curl or Postman
curl http://localhost:300X/your-endpoint
```

**Step 5: Run Tests**
```bash
npm run test your-service
npm run lint
```

**Step 6: Commit & Push**
```bash
git add .
git commit -m "feat(market): add search with filters"
git push origin feature/market-service-search
```

**Step 7: Create Pull Request**
- Go to GitHub
- Create PR from `feature/market-service-search` → `develop`
- Request review from team lead
- Address review comments
- Merge after approval

---

## 🌳 Git Guidelines

### Branch Strategy

```
main (production)
  └── develop (integration)
       ├── feature/identity-auth (Team 1)
       ├── feature/market-ads (Team 2)
       ├── feature/trade-orders (Team 3)
       └── feature/wallet-ledger (Team 4)
```

**Branch Naming:**
- Features: `feature/service-name-feature`
- Bug fixes: `fix/service-name-issue`  
- Documentation: `docs/what-you-changed`
- Refactor: `refactor/what-you-refactored`

**Examples:**
```
✅ feature/market-pricing-calculator
✅ fix/identity-jwt-expiry
✅ docs/add-api-examples
✅ refactor/wallet-ledger-service

❌ my-changes
❌ updates
❌ fix
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

**Format:**
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `refactor`: Code change that neither fixes bug nor adds feature
- `test`: Adding tests
- `chore`: Changes to build process or tools

**Examples:**
```bash
# Good ✅
git commit -m "feat(market): add FX rate caching with Redis"
git commit -m "fix(identity): resolve JWT token expiry issue"
git commit -m "docs(readme): add quick start guide"

# Bad ❌
git commit -m "updates"
git commit -m "fixed stuff"
git commit -m "asdfgh"
```

**Detailed Example:**
```bash
git commit -m "feat(market): implement search with pagination

- Add GET /ads endpoint with filters
- Support region, currency, price range filters
- Add pagination (20 items per page)
- Cache results in Redis (5min TTL)

Closes #123"
```

### Pull Request Guidelines

**Before Creating PR:**
```bash
# 1. Update from develop
git checkout develop
git pull
git checkout your-feature-branch
git merge develop
# Resolve any conflicts

# 2. Run tests
npm run test
npm run lint

# 3. Build successfully
npm run build
```

**PR Title:**
```
feat(market): Add search with filters and pagination
fix(identity): Resolve JWT refresh token issue
docs: Update API documentation for Identity Service
```

**PR Description Template:**
```markdown
## What Does This PR Do?

Brief description of the feature/fix

## Changes Made

- Added X feature
- Fixed Y bug
- Updated Z documentation  

## Testing Done

- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Tested locally with curl
- [ ] Tested in Postman

## Screenshots (if applicable)

[Attach screenshots]

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-reviewed the code
- [ ] Commented complex logic
- [ ] Updated documentation
- [ ] No console.logs left
- [ ] Tests added/updated
```

**PR Review Process:**
1. Create PR → Request review from team lead
2. Address review comments
3. Get approval from at least 1 reviewer
4. Squash & merge to `develop`

---

## ✨ Code Standards

### TypeScript Guidelines

**Use Strict Types:**
```typescript
// Good ✅
function calculatePrice(amount: number, marginPercent: number): number {
  return amount * (1 + marginPercent / 100);
}

// Bad ❌
function calculatePrice(amount: any, marginPercent: any): any {
  return amount * (1 + marginPercent / 100);
}
```

**Use Enums for Constants:**
```typescript
// Good ✅
enum OrderStatus {
  CREATED = 'CREATED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  COMPLETED = 'COMPLETED',
}

// Bad ❌
const ORDER_STATUS = {
  CREATED: 'created',
  PAYMENT_PENDING: 'payment_pending',
};
```

**Use Interfaces/Types:**
```typescript
// Good ✅
interface CreateAdDto {
  basePair: string;
  marginPercent: number;
  minAmount: number;
  maxAmount: number;
}

// Bad ❌
function createAd(data: any) { /* ... */ }
```

### NestJS Best Practices

**1. Controller → Service → Repository Pattern:**
```typescript
// ✅ Controller (HTTP layer)
@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Post()
  create(@Body() dto: CreateAdDto) {
    return this.adsService.create(dto);
  }
}

// ✅ Service (Business logic)
@Injectable()
export class AdsService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateAdDto) {
    // Business logic here
    return this.db.otcAd.create({ data: dto });
  }
}
```

**2. Use DTOs for Validation:**
```typescript
import { IsString, IsNumber, Min } from 'class-validator';

export class CreateAdDto {
  @IsString()
  basePair: string;

  @IsNumber()
  @Min(0)
  marginPercent: number;
}
```

**3. Use Guards for Authorization:**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER')
@Post('ads')
createAd(@CurrentUser() user: User, @Body() dto: CreateAdDto) {
  return this.adsService.create(user.id, dto);
}
```

**4. Error Handling:**
```typescript
// Good ✅
@Get(':id')
async findOne(@Param('id') id: string) {
  const ad = await this.adsService.findOne(id);
  
  if (!ad) {
    throw new NotFoundException(`Ad with ID ${id} not found`);
  }
  
  return ad;
}

// Bad ❌
@Get(':id')
async findOne(@Param('id') id: string) {
  return await this.adsService.findOne(id); // Could return null!
}
```

### Naming Conventions

**Files:**
```
✅ user.service.ts
✅ auth.controller.ts
✅ create-user.dto.ts
✅ jwt-auth.guard.ts

❌ UserService.ts
❌ authController.ts
❌ createUserDTO.ts
```

**Classes:**
```typescript
// PascalCase for classes
✅ export class UserService {}
✅ export class JwtAuthGuard {}

❌ export class userService {}
❌ export class jwtAuthGuard {}
```

**Variables & Functions:**
```typescript
// camelCase
✅ const currentUser = getUser();
✅ function calculateTotalPrice() {}

❌ const CurrentUser = getUser();
❌ function CalculateTotalPrice() {}
```

**Constants:**
```typescript
// UPPER_SNAKE_CASE
✅ const MAX_FILE_SIZE = 5 * 1024 * 1024;
✅ const DEFAULT_PAGE_SIZE = 20;

❌ const maxFileSize = 5 * 1024 * 1024;
```

### Code Formatting

**We use Prettier - auto-formats on save:**
```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

**ESLint Rules:**
```bash
# Check code quality
npm run lint

# Auto-fix issues
npm run lint:fix
```

---

## 🧪 Testing Guidelines

### Unit Tests

**Test Services (Business Logic):**
```typescript
describe('AdsService', () => {
  let service: AdsService;
  let db: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdsService,
        {
          provide: DatabaseService,
          useValue: { otcAd: { create: jest.fn(), findMany: jest.fn() } },
        },
      ],
    }).compile();

    service = module.get<AdsService>(AdsService);
    db = module.get<DatabaseService>(DatabaseService);
  });

  it('should create an ad', async () => {
    const dto = { basePair: 'USDT/MYR', marginPercent: 3.5 };
    const expected = { id: '123', ...dto };

    jest.spyOn(db.otcAd, 'create').mockResolvedValue(expected as any);

    const result = await service.create('user-id', dto);

    expect(result).toEqual(expected);
    expect(db.otcAd.create).toHaveBeenCalledWith({
      data: { ...dto, sellerId: 'user-id' },
    });
  });
});
```

**Test Controllers (HTTP Layer):**
```typescript
describe('AdsController', () => {
  let controller: AdsController;
  let service: AdsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdsController],
      providers: [
        {
          provide: AdsService,
          useValue: { create: jest.fn(), findAll: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<AdsController>(AdsController);
    service = module.get<AdsService>(AdsService);
  });

  it('should create an ad', async () => {
    const dto = { basePair: 'USDT/MYR', marginPercent: 3.5 };
    const user = { id: 'user-123' } as User;

    jest.spyOn(service, 'create').mockResolvedValue({ id: '123', ...dto } as any);

    const result = await controller.create(user, dto);

    expect(result).toHaveProperty('id');
    expect(service.create).toHaveBeenCalledWith('user-123', dto);
  });
});
```

### E2E Tests

**Test Complete Flows:**
```typescript
describe('Identity Service (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [IdentityModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123!',
        role: 'BUYER',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
      });
  });
});
```

### Run Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode (for TDD)
npm run test:watch
```

---

## 👥 Team Collaboration

### Service Ownership

| Team | Service | Folder | Your Responsibility |
|------|---------|--------|---------------------|
| 1 | Identity | `apps/identity/` | Auth, users, KYC |
| 2 | Market | `apps/market/` | Ads, pricing, search |
| 3 | Trade | `apps/trade/` | Orders, escrow, disputes |
| 4 | Wallet | `apps/wallet/` | Ledger, balances |
| 5 | Notification | `apps/notification/` | Email, WebSocket |
| 6 | Admin | `apps/admin/` | Dashboard, monitoring |

### Communication

**Before You:**

**1. Modify `prisma/schema.prisma`** (database)
- ⚠️ Discuss with ALL teams first!
- Create GitHub issue explaining change
- Wait for consensus
- Make change in separate PR
- All teams run `npx prisma generate` after merge

**2. Modify `libs/database/` or `libs/common/`** (shared code)
- ⚠️ Discuss with team leads
- Could affect all services
- Write tests
- Update documentation

**3. Change Environment Variables**
- Update `.env.example`
- Notify all teams in Slack
- Document in PR description

### Handling Conflicts

**Merge Conflicts:**
```bash
# Update your branch with latest develop
git checkout your-branch
git fetch origin
git merge origin/develop

# If conflicts:
# 1. Open conflicted files
# 2. Resolve conflicts (keep both changes if possible)
# 3. Test that nothing broke
npm run test
npm run build

# 4. Commit resolution
git add .
git commit -m "chore: resolve merge conflicts with develop"
git push
```

**Database Schema Conflicts:**
- If two teams need conflicting schema changes
- Create GitHub issue
- Tag team leads
- Schedule short meeting
- Find compromise solution

---

## 🔧 Troubleshooting

### Common Issues

**Issue: Port Already in Use**
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change your service port temporarily
```

**Issue: Prisma Types Out of Sync**
```bash
npx prisma generate
npm run build
# Restart VSCode TypeScript server
```

**Issue: Docker Container Won't Start**
```bash
# Check logs
docker-compose logs postgres

# Restart containers
docker-compose down
docker-compose up -d

# Nuclear option (deletes data!)
docker-compose down -v
docker-compose up -d
npx prisma db push
```

**Issue: Database Connection Error**
```bash
# Check DATABASE_URL in .env
# Verify PostgreSQL is running
docker ps

# Test connection
docker exec -it otc-postgres psql -U otc_user -d otc_platform
```

**Issue: VSCode Shows Errors But Build Works**
```bash
# Restart TypeScript server
# Cmd+Shift+P (macOS) → "TypeScript: Restart TS Server"

# Or reload  window
# Cmd+Shift+P → "Developer: Reload Window"
```

---

## 📞 Getting Help

**For Code Questions:**
1. Check [LEARN_JUNIOR_DEV.md](./LEARN_JUNIOR_DEV.md) (complete tutorial)
2. Check [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) (technical details)
3. Ask in team Slack channel
4. Schedule pair programming session

**For Setup Issues:**
1. Check [README.md](./README.md) Quick Start
2. Check this file's Troubleshooting section
3. Ask team lead

**For Architecture Decisions:**
1. Create GitHub issue with `question` label
2. Tag relevant team leads
3. Wait for discussion

---

## 🎉 Congratulations!

You're ready to contribute! Remember:

✅ Work in your team's folder  
✅ Test before committing  
✅ Write good commit messages  
✅ Request code reviews  
✅ Help your teammates  

**Happy coding!** 🚀
