# Email Verification Guide - OTC Platform

## Overview

The OTC Platform now requires email verification during user registration. This ensures valid email addresses and prevents spam accounts.

**Flow:**
1. User registers with email/password
2. System sends 6-digit OTP to email
3. User enters OTP on verification page
4. Account activated → User can login

---

## What Changed

### Database Schema
```prisma
model User {
  // ... existing fields ...
  
  // ✅ NEW: Email Verification
  isVerified    Boolean      @default(false)
  verifyCode    String?      // 6-digit OTP
  verifyCodeExpiry DateTime? // Expires in 10 minutes
}
```

### API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/register` | POST | ❌ Public | Register + Send OTP |
| `/auth/verify-email` | POST | ❌ Public | Verify OTP |
| `/auth/resend-otp` | POST | ❌ Public | Resend OTP |
| `/auth/login` | POST | ❌ Public | Login (requires verified email) |

### Registration Flow Change

**BEFORE:**
```typescript
POST /auth/register
→ User created
→ Returns JWT tokens ✅
→ User can immediately login
```

**AFTER:**
```typescript
POST /auth/register
→ User created (isVerified = false)
→ Returns message: "Check your email"
→ NO TOKENS YET ❌

POST /auth/verify-email
→ Validates OTP
→ Sets isVerified = true
→ Sends welcome email

POST /auth/login
→ Checks isVerified
→ Returns JWT tokens ✅
```

---

## API Documentation

### 1. Register (Updated)

**Endpoint:** `POST /auth/register`

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "BUYER"
}
```

**Response (Changed):**
```json
{
  "message": "Registration successful! Please check your email for verification code.",
  "email": "john@example.com",
  "emailSent": true
}
```

**What happens:**
1. User record created with `isVerified = false`
2. 6-digit OTP generated (e.g., "123456")
3. OTP saved to database with 10-minute expiry
4. Email sent with OTP
5. User redirected to verification page

---

### 2. Verify Email (New)

**Endpoint:** `POST /auth/verify-email`

**Request:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "message": "Email verified successfully! You can now login.",
  "isVerified": true
}
```

**Error Responses:**
- **400**: `"Invalid verification code"` - Wrong OTP
- **400**: `"Verification code has expired"` - OTP older than 10 minutes
- **400**: `"Email already verified"` - Already done
- **400**: `"User not found"` - Email doesn't exist

**What happens:**
1. Checks if OTP matches
2. Checks if OTP not expired (10 minutes)
3. Sets `isVerified = true`
4. Clears `verifyCode` and `verifyCodeExpiry`
5. Sends welcome email

---

### 3. Resend OTP (New)

**Endpoint:** `POST /auth/resend-otp`

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "Verification code sent successfully!",
  "emailSent": true
}
```

**Error Responses:**
- **400**: `"Email already verified"` - No need to resend
- **400**: `"User not found"` - Email doesn't exist

**What happens:**
1. Generates new 6-digit OTP
2. Updates database with new OTP and expiry
3. Sends new email

**⚠️ Rate Limiting Recommended:**
- Implement rate limiting (e.g., 3 requests per hour per email)
- Prevents OTP spam

---

### 4. Login (Updated)

**Endpoint:** `POST /auth/login`

**Request:** (Same as before)
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**New Validation:** ✅ Checks `isVerified = true`

**Error Response (401):**
```json
{
  "statusCode": 401,
  "message": "Please verify your email before logging in",
  "error": "Unauthorized"
}
```

---

## Email Configuration

### SendGrid HTTP API Setup (Recommended for Production)

**Why SendGrid HTTP API?**
- ✅ Works on Railway and cloud platforms (SMTP ports often blocked)
- ✅ Uses HTTPS (port 443) instead of SMTP (ports 587/465)
- ✅ Free tier: 100 emails/day
- ✅ Better deliverability and analytics
- ✅ No connection timeouts

**Setup Steps:**

1. **Create SendGrid Account:**
   - Go to https://signup.sendgrid.com/
   - Verify your email

2. **Verify Sender Email:**
   - Go to https://app.sendgrid.com/settings/sender_auth/senders
   - Click "Create New Sender"
   - Enter your email address (e.g., youremail@gmail.com)
   - Verify it via email link

3. **Create API Key:**
   - Go to https://app.sendgrid.com/settings/api_keys
   - Click "Create API Key"
   - Name: "OTC Platform"
   - Permissions: **Full Access** (or "Mail Send" minimum)
   - Copy the API key (starts with `SG.`)

4. **Configure .env:**
```bash
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
SMTP_FROM=youremail@gmail.com  # Must match verified sender
```

5. **Update Railway Variables:**
   - Add `SENDGRID_API_KEY` to Railway
   - Add `SMTP_FROM` to Railway
   - Remove old SMTP variables if present

### Alternative: Gmail SMTP (Development Only)

⚠️ **NOT RECOMMENDED** for production - many cloud platforms block SMTP ports.

1. **Enable 2-Factor Authentication:**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Configure .env:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # App password (remove spaces)
SMTP_FROM=noreply@otcplatform.com
```

⚠️ **Note:** Gmail SMTP will NOT work on Railway due to port blocking.

### Other Providers

**SendGrid SMTP** (not recommended - use HTTP API instead):
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-api-key
```

**Outlook/Hotmail:**
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=youremail@outlook.com
SMTP_PASS=your-password
```

**AWS SES:**
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

---

## Email Templates

### Verification Email

**Subject:** "Verify Your Email - OTC Platform"

**Content:**
- Professional design with blue gradient header
- Large 6-digit OTP display
- "Valid for 10 minutes" notice
- Links to support (if needed)

**Template:** `libs/email/templates/verification.ejs`

### Welcome Email

**Subject:** "🎉 Welcome to OTC Platform!"

**Content:**
- Green gradient header (success theme)
- Welcome message
- Feature highlights (wallets, trading, role switching)
- "Start Trading Now" button

**Template:** `libs/email/templates/welcome.ejs`

---

## Frontend Integration

### Registration Flow

```typescript
// 1. Register
const handleRegister = async () => {
  try {
    const response = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'BUYER' }),
    });

    const data = await response.json();

    if (response.ok) {
      // ✅ Redirect to verification page
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Registration error:', error);
  }
};
```

### Verification Page

```typescript
// /verify-email?email=john@example.com

const VerifyEmailPage = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const email = searchParams.get('email');

  const handleVerify = async () => {
    const response = await fetch('/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        otp: otp.join('') 
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // ✅ Redirect to login
      router.push('/login?message=Email verified! Please login.');
    } else {
      alert(data.message);
    }
  };

  const handleResend = async () => {
    const response = await fetch('/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    setCountdown(60); // 60-second countdown
  };

  return (
    <div>
      <h1>Verify Your Email</h1>
      <p>Enter the 6-digit code sent to {email}</p>

      {/* 6 OTP input boxes */}
      <div className="otp-inputs">
        {otp.map((digit, i) => (
          <input
            key={i}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => {
              const newOtp = [...otp];
              newOtp[i] = e.target.value;
              setOtp(newOtp);
            }}
          />
        ))}
      </div>

      <button onClick={handleVerify}>Verify</button>

      <button 
        onClick={handleResend} 
        disabled={countdown > 0}
      >
        {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
      </button>
    </div>
  );
};
```

### Updated Login Flow

```typescript
const handleLogin = async () => {
  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.status === 401 && 
        data.message.includes('verify your email')) {
      // ❌ Not verified - redirect to verification
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } else if (response.ok) {
      // ✅ Success - store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      router.push('/dashboard');
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Login error:', error);
  }
};
```

---

## Testing

### Manual Testing

1. **Start PostgreSQL:**
```bash
# Docker
docker run --name otc-db -e POSTGRES_PASSWORD=otc_password -e POSTGRES_USER=otc_user -e POSTGRES_DB=otc_platform -p 5432:5432 -d postgres:15

# Or use existing database
```

2. **Run Migrations:**
```bash
cd otc-backend
npx prisma migrate dev --name add-email-verification
```

3. **Start Backend:**
```bash
npm run start:dev identity
```

4. **Test Registration:**
```bash
# Register user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "role": "BUYER"
  }'

# Response: {"message": "Check your email", "emailSent": true}
```

5. **Check Email:**
- Open email inbox
- Find OTP (e.g., "123456")

6. **Verify Email:**
```bash
curl -X POST http://localhost:3001/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'

# Response: {"message": "Email verified!", "isVerified": true}
```

7. **Login:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'

# Response: {user, accessToken, refreshToken}
```

### Test Error Cases

**Expired OTP:**
1. Wait 10+ minutes after registration
2. Try to verify → `"Verification code has expired"`
3. Resend OTP
4. Verify with new code

**Invalid OTP:**
```bash
curl -X POST http://localhost:3001/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "otp": "999999"}'

# Response: 400 "Invalid verification code"
```

**Login Without Verification:**
```bash
# Don't verify, try to login immediately
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!@#"}'

# Response: 401 "Please verify your email before logging in"
```

---

## Database Migration

**Migration SQL:**
```sql
-- Add email verification columns
ALTER TABLE "users" 
ADD COLUMN "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "verify_code" TEXT,
ADD COLUMN "verify_code_expiry" TIMESTAMP;

-- Add index for faster queries
CREATE INDEX "users_is_verified_idx" ON "users"("is_verified");

-- Set existing users as verified (optional - for migration)
UPDATE "users" SET "is_verified" = true;
```

**Run Migration:**
```bash
npx prisma migrate dev --name add-email-verification
```

---

## Security Considerations

### OTP Security
- ✅ **10-minute expiry** - Limits brute force window
- ✅ **6 digits** - 1 million combinations (sufficient for time-limited OTP)
- ⚠️ **Rate limiting needed** - Prevent OTP spam (implement in production)
- ⚠️ **Account lockout** - Lock after N failed attempts (future feature)

### Email Security
- ✅ **SMTP over TLS** - Encrypted email transmission
- ✅ **App passwords** - No plaintext passwords in .env
- ⚠️ **Email validation** - Currently basic regex (consider email-validator npm package)

### Implementation Recommendations

1. **Rate Limiting (Critical for Production):**
```typescript
// Add to auth.controller.ts
import { Throttle } from '@nestjs/throttler';

@Post('resend-otp')
@Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 per minute
async resendOtp() { ... }
```

2. **Account Lockout:**
```typescript
// Track failed verification attempts
// Lock account after 5 failed OTP attempts
```

3. **Email Verification Link (Alternative):**
```typescript
// Instead of OTP, send magic link with JWT
const token = jwt.sign({ email }, secret, { expiresIn: '1h' });
const link = `https://app.com/verify?token=${token}`;
```

---

## Troubleshooting

### Email Not Sending

**Check 1: SendGrid API Configuration**
```bash
# Test if SendGrid is configured
curl https://your-backend.up.railway.app/api/v1/health/smtp

# Should return:
{
  "configuration": {
    "hasApiKey": true,
    "apiKeyValid": true
  },
  "status": "configured"
}
```

**Check 2: SendGrid API Key**
- Must start with `SG.`
- Must have Full Access or Mail Send permission
- Verify in: https://app.sendgrid.com/settings/api_keys

**Check 3: Sender Email Verified**
- Go to: https://app.sendgrid.com/settings/sender_auth/senders
- Your `SMTP_FROM` email must have green checkmark
- If not verified, click verification email link

**Check 4: Railway Environment Variables**
```bash
# Required variables in Railway:
SENDGRID_API_KEY=SG.your-api-key
SMTP_FROM=your-verified-email@gmail.com
```

**Check 5: Backend Logs**
```bash
# Railway logs should show:
"✅ SendGrid API initialized"
"✅ OTP email sent to user@example.com"

# If errors:
"❌ SendGrid API key not configured"
"❌ Failed to send OTP email: 401 Unauthorized"  # Invalid API key
"❌ Failed to send OTP email: 403 Forbidden"     # Sender not verified
```

**Common Issues:**

| Error | Cause | Solution |
|-------|-------|----------|
| `SendGrid API not configured` | Missing API key | Add `SENDGRID_API_KEY` to `.env` |
| `401 Unauthorized` | Invalid API key | Regenerate key in SendGrid dashboard |
| `403 Forbidden` | Sender not verified | Verify `SMTP_FROM` email in SendGrid |
| `emailSent: false` | API key missing on Railway | Add to Railway variables |

**Debug Commands:**
```bash
# Test registration
curl -X POST 'https://your-backend.up.railway.app/api/v1/auth/register' \\
  -H 'Content-Type: application/json' \\
  -d '{"email":"test@gmail.com","password":"Test123@Pass","role":"BUYER"}'

# Expected response:
{
  "emailSent": true,  # ← Should be true!
  "message": "Registration successful! Please check your email..."
}
```

### User Can't Verify

**Issue: "Invalid OTP"**
- User typed wrong code
- Copy-paste with extra spaces
- Solution: Trim whitespace in frontend

**Issue: "OTP expired"**
- 10 minutes passed
- Solution: Resend OTP

**Issue: "User not found"**
- Wrong email address
- Solution: Re-register or check database

---

## Production Checklist

Before deploying email verification to production:

- [ ] SendGrid account created and verified
- [ ] SendGrid API key created (Full Access or Mail Send)
- [ ] Sender email verified in SendGrid dashboard
- [ ] `SENDGRID_API_KEY` and `SMTP_FROM` configured in Railway
- [ ] Rate limiting implemented (3 OTP requests per hour)
- [ ] Email templates tested (desktop, mobile, dark mode)
- [ ] Error handling tested (SendGrid down, invalid OTP, expired OTP)
- [ ] Health endpoint tested: `/api/v1/health/smtp`
- [ ] Database migration run
- [ ] Existing users marked as verified (if applicable)
- [ ] Frontend verification page implemented
- [ ] Login page shows "verify email" message
- [ ] Analytics added (registration success rate, verification rate)
- [ ] Monitoring added (OTP send failures, verification failures)
- [ ] SendGrid activity monitoring: https://app.sendgrid.com/email_activity

---

## Future Enhancements

1. **Magic Link Authentication**
   - Click link instead of typing OTP
   - Better UX, same security

2. **Phone Verification (SMS OTP)**
   - Use Twilio/AWS SNS
   - Alternative to email

3. **Social Login**
   - OAuth with Google, GitHub
   - Email pre-verified

4. **Remember Device**
   - Skip verification on trusted devices
   - Use device fingerprinting

---

## Support

**Email Issues?**
- Check [API_REFERENCE.md](API_REFERENCE.md) for detailed endpoint docs
- Review backend logs for SMTP errors
- Test with `curl` commands above

**Frontend Integration?**
- See code examples in "Frontend Integration" section
- Reference your previous project: https://github.com/devhb1/FrappeLms

**Questions?**
- Check `IDENTITY_MODULE_EXPLAINED.md` for architecture
- Review `LEARN_JUNIOR_DEV.md` for concepts

---

**Status:** ✅ Email Verification Implemented  
**Version:** 1.1.0 (MVP + Email Verification)  
**Last Updated:** February 2026
