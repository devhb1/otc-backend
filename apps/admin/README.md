# 👨‍💼 Admin Service

Administrative dashboard and platform management service.

## 📋 Responsibilities

- **Platform Statistics**: Real-time metrics and analytics
- **User Management**: Suspend, verify, KYC approval
- **Dispute Resolution**: Manually resolve user disputes
- **Audit Logs**: View all platform activity
- **Manual Interventions**: Adjust balances, refund transactions

## 🏗️ Module Structure

```
apps/admin/
├── src/
│   ├── dashboard/              # Platform statistics
│   │   ├── dashboard.controller.ts
│   │   ├── dashboard.service.ts
│   │   └── dashboard.module.ts
│   ├── users-management/       # User admin ops
│   │   ├── users-management.controller.ts
│   │   ├── users-management.service.ts
│   │   └── users-management.module.ts
│   ├── dispute-resolution/     # Dispute handling
│   │   ├── dispute-resolution.controller.ts
│   │   ├── dispute-resolution.service.ts
│   │   └── dispute-resolution.module.ts
│   ├── health/                 # Health checks
│   ├── admin.module.ts         # Root module
│   └── main.ts                 # Service entry point
└── README.md
```

## 🚀 Running This Service

### Development Mode
```bash
# From project root
npm run start:dev admin

# Service runs on http://localhost:3006
# API docs: http://localhost:3006/api/docs
```

### Production Mode
```bash
npm run start:prod admin
```

## 📊 Database Tables Used

This service has access to ALL tables:
- All user data (`User`, `Wallet`, `LedgerEntry`)
- All trading data (`OtcOrder`, `OtcAd`)
- All disputes (`Dispute`)
- All audit logs (`AuditLog`)

## 🔧 Environment Variables

Add to `.env`:
```env
ADMIN_PORT=3006
```

## 📝 TODO - Implementation Tasks

### Dashboard Module
- [ ] GET /api/v1/dashboard/stats - Platform statistics
- [ ] GET /api/v1/dashboard/revenue - Revenue metrics
- [ ] GET /api/v1/dashboard/active-users - Active users count
- [ ] GET /api/v1/dashboard/recent-orders - Latest orders

### Users Management
- [ ] GET /api/v1/users - List all users (paginated)
- [ ] GET /api/v1/users/:id - Get user details
- [ ] POST /api/v1/users/:id/suspend - Suspend user
- [ ] POST /api/v1/users/:id/unsuspend - Unsuspend user
- [ ] POST /api/v1/users/:id/verify-kyc - Approve KYC
- [ ] POST /api/v1/users/:id/reject-kyc - Reject KYC
- [ ] GET /api/v1/users/:id/audit-log - User activity log

### Dispute Resolution
- [ ] GET /api/v1/disputes - List all disputes
- [ ] GET /api/v1/disputes/:id - Get dispute details
- [ ] POST /api/v1/disputes/:id/resolve - Resolve dispute
- [ ] POST /api/v1/disputes/:id/refund-buyer - Refund to buyer
- [ ] POST /api/v1/disputes/:id/release-seller - Release to seller
- [ ] POST /api/v1/disputes/:id/comment - Add admin comment

### Manual Interventions
- [ ] POST /api/v1/ledger/adjust - Manual balance adjustment
- [ ] POST /api/v1/orders/:id/force-complete - Force complete order
- [ ] POST /api/v1/orders/:id/force-cancel - Force cancel order

## 🔐 Authentication & Authorization

**ALL endpoints require ADMIN role:**

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Get()
async getUsers(@CurrentUser() admin) {
  // Only admins can access
}
```

## 🧪 Testing

```bash
# Unit tests
npm run test admin

# E2E tests
npm run test:e2e admin
```

## 🏷️ API Examples

### Get Platform Stats
```bash
curl http://localhost:3006/api/v1/dashboard/stats \
  -H "Authorization: Bearer <admin-token>"
```

### Suspend User
```bash
curl -X POST http://localhost:3006/api/v1/users/user-123/suspend \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Suspicious activity",
    "duration": "30days"
  }'
```

### Resolve Dispute
```bash
curl -X POST http://localhost:3006/api/v1/disputes/dispute-123/resolve \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "resolution": "REFUND_BUYER",
    "reason": "Seller failed to deliver"
  }'
```

## 📊 Dashboard Metrics

### Key Statistics
- Total users (buyers, sellers)
- Active users (last 7 days)
- Total orders (pending, completed)
- Total volume (by currency)
- Platform revenue
- Active disputes

### Real-time Monitoring
- Orders per hour
- New registrations
- Failed transactions
- System health status

## 🔗 Related Services

- **Identity Service** (port 3001) - User data
- **Trade Service** (port 3003) - Order data
- **Wallet Service** (port 3004) - Financial data
- **Notification Service** (port 3005) - Send admin alerts

## ⚠️ Security Considerations

### Admin Access Control
- Only users with `role: 'ADMIN'` can access
- All actions logged in `AuditLog` table
- Two-factor authentication recommended (future)

### Critical Operations
- Manual balance adjustments require approval workflow
- Dispute resolutions are irreversible
- User suspensions are logged and can be audited

## 📚 Learn More

- [NestJS Guards](https://docs.nestjs.com/guards)
- [Role-Based Access Control](https://docs.nestjs.com/security/authorization)
- [Project Architecture](../../docs/ARCHITECTURE_EXPLAINED.md)
