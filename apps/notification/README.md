# 🔔 Notification Service

Real-time alerts and notification management service.

## 📋 Responsibilities

- **Email Notifications**: Order updates, trade confirmations
- **WebSocket Events**: Real-time order status changes
- **SMS Alerts**: Critical notifications (future)
- **Push Notifications**: Mobile app alerts (future)
- **Notification Preferences**: User settings management

## 🏗️ Module Structure

```
apps/notification/
├── src/
│   ├── notifications/          # Notification management
│   │   ├── notifications.controller.ts
│   │   ├── notifications.service.ts
│   │   └── notifications.module.ts
│   ├── websocket/              # Real-time updates (future)
│   ├── health/                 # Health checks
│   ├── notification.module.ts  # Root module
│   └── main.ts                 # Service entry point
└── README.md
```

## 🚀 Running This Service

### Development Mode
```bash
# From project root
npm run start:dev notification

# Service runs on http://localhost:3005
# API docs: http://localhost:3005/api/docs
```

### Production Mode
```bash
npm run start:prod notification
```

## 📊 Database Tables Used

This service primarily works with:
- `Notification` - User notification records (future table)
- `User` - Notification preferences
- `OtcOrder` - Order status for alerts

## 🔧 Environment Variables

Add to `.env`:
```env
NOTIFICATION_PORT=3005
WEBSOCKET_PORT=3006
```

## 📝 TODO - Implementation Tasks

### Notifications Module
- [ ] GET /api/v1/notifications - Get user notifications
- [ ] GET /api/v1/notifications/unread - Get unread count
- [ ] POST /api/v1/notifications/:id/read - Mark as read
- [ ] POST /api/v1/notifications/read-all - Mark all as read
- [ ] DELETE /api/v1/notifications/:id - Delete notification
- [ ] GET /api/v1/notifications/preferences - Get notification settings
- [ ] PUT /api/v1/notifications/preferences - Update settings

### Email Notifications
- [ ] Order created
- [ ] Payment confirmed
- [ ] Funds released
- [ ] Dispute opened
- [ ] Trade completed

### WebSocket Events (Future)
- [ ] order.created
- [ ] order.updated
- [ ] order.completed
- [ ] chat.message
- [ ] dispute.opened

## 🔐 Authentication

Requires JWT token from Identity Service:
```typescript
@UseGuards(JwtAuthGuard)
@Get()
async getNotifications(@CurrentUser() user) {
  // Return user's notifications only
}
```

## 🧪 Testing

```bash
# Unit tests
npm run test notification

# E2E tests
npm run test:e2e notification
```

## 🏷️ API Examples

### Get Notifications
```bash
curl http://localhost:3005/api/v1/notifications \
  -H "Authorization: Bearer <token>"
```

### Mark as Read
```bash
curl -X POST http://localhost:3005/api/v1/notifications/notif-123/read \
  -H "Authorization: Bearer <token>"
```

### Update Preferences
```bash
curl -X PUT http://localhost:3005/api/v1/notifications/preferences \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "emailEnabled": true,
    "smsEnabled": false,
    "orderUpdates": true,
    "marketingEmails": false
  }'
```

## 📧 Email Templates

Location: `libs/email/templates/`
- `order-created.ejs`
- `order-confirmed.ejs`
- `order-completed.ejs`
- `dispute-opened.ejs`

## 🔗 Related Services

- **Identity Service** (port 3001) - User data
- **Trade Service** (port 3003) - Order events
- **Admin Service** (port 3006) - Admin notifications

## 📚 Learn More

- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [Socket.IO Documentation](https://socket.io/docs)
- [Project Architecture](../../docs/ARCHITECTURE_EXPLAINED.md)
