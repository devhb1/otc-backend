# 🔌 Identity Service API Reference

**Base URL:** `http://localhost:3001`  
**Version:** 1.0.0

---

## 📋 Quick Reference

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/auth/register` | POST | ❌ No | Register new user |
| `/auth/login` | POST | ❌ No | Login existing user |
| `/auth/refresh` | POST | ❌ No | Refresh access token |
| `/users/me` | GET | ✅ Yes | Get current user profile |
| `/users/:id` | GET | ✅ Yes | Get user by ID |
| `/users/switch-role` | PATCH | ✅ Yes | Switch between BUYER/SELLER |

---

## 🔐 Authentication

All protected endpoints require JWT Bearer token in header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

---

## 📡 Endpoints

### 1. Register New User

**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "BUYER",
  "referralCode": "REF123"  // Optional
}
```

**Validation Rules:**
- `email`: Must be valid email format, unique
- `password`: Min 8 chars, must include uppercase, lowercase, number, special char
- `role`: Must be one of: `BUYER`, `SELLER`, `ENABLER`
- `referralCode`: Optional, must be valid existing code

**Response (201 Created):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "role": "BUYER",
    "kycStatus": "PENDING",
    "referralCode": "ABC123"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**Errors:**
```json
// 409 Conflict - Email already registered
{
  "statusCode": 409,
  "message": "Email already registered",
  "error": "Conflict"
}

// 400 Bad Request - Validation error
{
  "statusCode": 400,
  "message": [
    "Please provide a valid email address",
    "Password must be at least 8 characters long"
  ],
  "error": "Bad Request"
}
```

---

### 2. Login

**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "role": "BUYER",
    "kycStatus": "PENDING"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**Errors:**
```json
// 401 Unauthorized - Invalid credentials or suspended account
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

---

### 3. Refresh Access Token

**POST** `/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**When to Use:**
- Access token expires after 15 minutes
- Call this endpoint to get a new access token
- Refresh token is valid for 7 days
- After 7 days, user must login again

**Errors:**
```json
// 401 Unauthorized - Invalid or expired refresh token
{
  "statusCode": 401,
  "message": "Invalid or expired refresh token",
  "error": "Unauthorized"
}
```

---

### 4. Get Current User Profile

**GET** `/users/me`

**Headers:**
```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "role": "BUYER",
  "status": "ACTIVE",
  "kycStatus": "PENDING",
  "referralCode": "ABC123",
  "createdAt": "2026-02-20T10:30:00.000Z"
}
```

**Errors:**
```json
// 401 Unauthorized - No token or invalid token
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 404 Not Found - User not found
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

---

### 5. Get User by ID

**GET** `/users/:id`

**Headers:**
```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**URL Parameters:**
- `id` (string, UUID): User ID

**Example:**
```http
GET /users/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "role": "BUYER",
  "status": "ACTIVE",
  "kycStatus": "APPROVED",
  "referralCode": "ABC123",
  "createdAt": "2026-02-20T10:30:00.000Z"
}
```

**Errors:**
```json
// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "User not found"
}
```

---

### 6. Switch Role

**PATCH** `/users/switch-role`

**Headers:**
```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request Body:**
```json
{
  "newRole": "SELLER"
}
```

**Allowed Switches:**
- `BUYER` → `SELLER` ✅
- `SELLER` → `BUYER` ✅
- `BUYER` → `ADMIN` ❌ (restricted)
- `SELLER` → `ENABLER` ❌ (restricted)

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "role": "SELLER",
  "status": "ACTIVE",
  "kycStatus": "PENDING",
  "referralCode": "ABC123",
  "createdAt": "2026-02-20T10:30:00.000Z"
}
```

**Errors:**
```json
// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 400 Bad Request - Invalid role
{
  "statusCode": 400,
  "message": "newRole must be BUYER or SELLER"
}
```

---

## 🔑 Data Models

### User Object

```typescript
interface User {
  id: string;              // UUID
  email: string;           // Unique email
  role: UserRole;          // BUYER|SELLER|ADMIN|ENABLER
  status: UserStatus;      // ACTIVE|SUSPENDED|DEACTIVATED
  kycStatus: KycStatus;    // PENDING|APPROVED|REJECTED|EXPIRED
  referralCode: string;    // Unique 6-char code
  createdAt: string;       // ISO 8601 datetime
}
```

### Auth Response

```typescript
interface AuthResponse {
  user: User;
  accessToken: string;     // JWT, expires in 15 min
  refreshToken: string;    // JWT, expires in 7 days
  expiresIn: number;       // Seconds (900 = 15 min)
}
```

---

## 🛠️ Frontend Integration Examples

### React Example (with Fetch)

```typescript
// Login
async function login(email: string, password: string) {
  const response = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const data = await response.json();
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  return data;
}

// Get Profile
async function getProfile() {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch('http://localhost:3001/users/me', {
    headers: { 
      'Authorization': `Bearer ${token}` 
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  return response.json();
}
```

### Axios Example

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      
      try {
        const { data } = await axios.post(
          'http://localhost:3001/auth/refresh',
          { refreshToken }
        );
        
        localStorage.setItem('accessToken', data.accessToken);
        
        // Retry original request
        error.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return axios(error.config);
      } catch {
        // Refresh failed, redirect to login
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Usage
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  getProfile: () => api.get('/users/me'),
  switchRole: (newRole) => api.patch('/users/switch-role', { newRole }),
};
```

---

## 🧪 Testing with Curl

### Register
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "role": "BUYER"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

### Get Profile
```bash
# Save token from login response
TOKEN="YOUR_ACCESS_TOKEN"

curl -X GET http://localhost:3001/users/me \
  -H "Authorization: Bearer $TOKEN"
```

### Switch Role
```bash
curl -X PATCH http://localhost:3001/users/switch-role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "newRole": "SELLER" }'
```

---

## ⚠️ Common Errors & Solutions

### 401 Unauthorized

**Cause:** Token expired or invalid

**Solution:**
```typescript
// Check if token exists
const token = localStorage.getItem('accessToken');
if (!token) {
  // Redirect to login
}

// If 401 error, try refresh
const refreshToken = localStorage.getItem('refreshToken');
const response = await fetch('/auth/refresh', {
  method: 'POST',
  body: JSON.stringify({ refreshToken }),
});
```

### 409 Conflict (Email exists)

**Cause:** Email already registered

**Solution:**
```typescript
try {
  await register(email, password, role);
} catch (error) {
  if (error.statusCode === 409) {
    alert('Email already registered. Try logging in instead.');
    navigate('/login');
  }
}
```

### 400 Bad Request (Validation)

**Cause:** Invalid input data

**Solution:**
```typescript
// Show validation errors to user
try {
  await register(email, password, role);
} catch (error) {
  if (error.statusCode === 400) {
    // error.message is an array of validation errors
    error.message.forEach(msg => {
      showError(msg);
    });
  }
}
```

---

## 📊 Token Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│ User logs in                                                │
│ → Returns Access Token (15 min) + Refresh Token (7 days)   │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ Use Access Token for API calls (0-15 minutes)              │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ Access Token expires (after 15 min)                        │
│ → Backend returns 401 Unauthorized                         │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend calls /auth/refresh with Refresh Token            │
│ → Returns new Access Token (15 min)                        │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ Continue using new Access Token (15 min)                   │
│ → Repeat refresh process when needed                       │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ After 7 days, Refresh Token expires                        │
│ → User must login again                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security Best Practices

1. **Store tokens securely:**
   ```typescript
   // ✅ Good: HttpOnly cookies (best, but needs backend support)
   // ✅ OK: localStorage (acceptable for MVP)
   localStorage.setItem('accessToken', token);
   
   // ❌ Bad: Regular cookies (vulnerable to XSS)
   // ❌ Bad: Global variables (lost on refresh)
   ```

2. **Never log tokens:**
   ```typescript
   // ❌ Bad
   console.log('Token:', accessToken);
   
   // ✅ Good
   console.log('User logged in successfully');
   ```

3. **Clear tokens on logout:**
   ```typescript
   function logout() {
     localStorage.removeItem('accessToken');
     localStorage.removeItem('refreshToken');
     // Redirect to login
   }
   ```

4. **Validate token expiry:**
   ```typescript
   function isTokenExpired(token: string): boolean {
     const payload = JSON.parse(atob(token.split('.')[1]));
     return payload.exp * 1000 < Date.now();
   }
   ```

---

## 🚀 Ready to Build!

Your Identity Service API is:
- ✅ Production-ready
- ✅ Well-documented
- ✅ Secure (JWT + bcrypt)
- ✅ Easy to integrate

Start building your frontend MVP! 🎉
