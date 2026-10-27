# Baantika API Documentation

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://your-render-service.onrender.com`

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Access Tokens
- JWT format, 15-minute expiry
- Contains: `{ sub: userId, iat, exp }`

### Refresh Tokens
- Opaque tokens, 7-day expiry
- Stored hashed server-side
- Rotated on use (old token revoked, new one issued)

---

## Endpoints

### Health & Readiness

#### GET /health
Lightweight liveness check.

**Response** `200 OK`:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET /ready
Readiness check (includes database connectivity).

**Response** `200 OK`:
```json
{
  "status": "ready",
  "database": "connected"
}
```

**Response** `503 Service Unavailable`:
```json
{
  "status": "not_ready",
  "database": "disconnected"
}
```

---

### Authentication

#### POST /api/v1/auth/register

**Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "displayName": "Raj Kumar"
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "Raj Kumar",
      "currency": "INR",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt...",
    "refreshToken": "opaque-token"
  }
}
```

#### POST /api/v1/auth/login

**Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response** `200 OK`: Same shape as register response.

#### POST /api/v1/auth/refresh

**Body**:
```json
{
  "refreshToken": "opaque-token"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt...",
    "refreshToken": "new-opaque-token"
  }
}
```

#### POST /api/v1/auth/logout

**Headers**: Authorization required.

**Body**:
```json
{
  "refreshToken": "opaque-token"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### User Profile

#### GET /api/v1/users/me
Get current user profile.

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "Raj Kumar",
    "avatarUrl": null,
    "currency": "INR",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PATCH /api/v1/users/me
Update profile.

**Body**:
```json
{
  "displayName": "Rajesh Kumar",
  "currency": "INR"
}
```

#### GET /api/v1/users/me/dashboard
Dashboard summary.

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "totalBalancePaise": 15000,
    "totalToReceivePaise": 25000,
    "totalOwedPaise": 10000,
    "recentActivity": [...],
    "groups": [...]
  }
}
```

---

### Groups

#### GET /api/v1/groups
List user's groups.

**Query**: `?page=1&limit=20`

#### POST /api/v1/groups
Create a group.

**Body**:
```json
{
  "name": "Goa Trip 2024",
  "description": "Expenses for our Goa trip",
  "currency": "INR"
}
```

#### GET /api/v1/groups/:id
Group details with members.

#### PATCH /api/v1/groups/:id
Update group (OWNER/ADMIN only).

#### POST /api/v1/groups/:id/members
Add member by email (OWNER/ADMIN only).

**Body**:
```json
{
  "email": "friend@example.com"
}
```

#### DELETE /api/v1/groups/:id/members/:userId
Remove member (OWNER only).

#### POST /api/v1/groups/:id/invitations
Create invitation (OWNER/ADMIN only).

**Body**:
```json
{
  "inviteEmail": "friend@example.com"
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "data": {
    "inviteCode": "abc123xyz",
    "expiresAt": "2024-01-08T00:00:00.000Z"
  }
}
```

#### POST /api/v1/invitations/:code/accept
Accept an invitation.

---

### Expenses

#### GET /api/v1/groups/:id/expenses
List expenses (paginated).

**Query**: `?page=1&limit=20&category=food`

#### POST /api/v1/groups/:id/expenses
Create an expense.

**Body**:
```json
{
  "description": "Dinner at Beach Shack",
  "amountPaise": 300000,
  "expenseDate": "2024-01-15",
  "category": "food",
  "splitMethod": "EQUAL",
  "payers": [
    { "userId": "uuid-1", "amountPaise": 300000 }
  ],
  "splits": [
    { "userId": "uuid-1" },
    { "userId": "uuid-2" },
    { "userId": "uuid-3" }
  ],
  "notes": "Including drinks",
  "idempotencyKey": "unique-client-key-123"
}
```

For EXACT split:
```json
{
  "splits": [
    { "userId": "uuid-1", "amountPaise": 150000 },
    { "userId": "uuid-2", "amountPaise": 100000 },
    { "userId": "uuid-3", "amountPaise": 50000 }
  ]
}
```

For PERCENTAGE split:
```json
{
  "splits": [
    { "userId": "uuid-1", "percentage": 50 },
    { "userId": "uuid-2", "percentage": 30 },
    { "userId": "uuid-3", "percentage": 20 }
  ]
}
```

For SHARES split:
```json
{
  "splits": [
    { "userId": "uuid-1", "shares": 2 },
    { "userId": "uuid-2", "shares": 1 },
    { "userId": "uuid-3", "shares": 1 }
  ]
}
```

#### GET /api/v1/groups/:id/expenses/:expenseId
Expense detail with payers and splits.

#### PATCH /api/v1/groups/:id/expenses/:expenseId
Edit expense (creator/admin only).

#### DELETE /api/v1/groups/:id/expenses/:expenseId
Soft-delete expense (creator/admin only).

---

### Balances

#### GET /api/v1/groups/:id/balances
Member balances for a group.

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "balances": [
      {
        "userId": "uuid-1",
        "displayName": "Raj",
        "netBalancePaise": 15000,
        "totalPaidPaise": 30000,
        "totalOwedPaise": 15000
      },
      {
        "userId": "uuid-2",
        "displayName": "Priya",
        "netBalancePaise": -10000,
        "totalPaidPaise": 5000,
        "totalOwedPaise": 15000
      }
    ],
    "integrityCheck": true
  }
}
```

---

### Settlement Suggestions

#### GET /api/v1/groups/:id/settlements/suggestions

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "fromUserId": "uuid-2",
        "fromDisplayName": "Priya",
        "toUserId": "uuid-1",
        "toDisplayName": "Raj",
        "amountPaise": 10000
      }
    ],
    "disclaimer": "Settlement suggestions are recommendations only. Baantika does not verify actual money transfers."
  }
}
```

---

### Settlements

#### GET /api/v1/groups/:id/settlements
List settlements (paginated).

#### POST /api/v1/groups/:id/settlements
Create a settlement.

**Body**:
```json
{
  "payerId": "uuid-2",
  "payeeId": "uuid-1",
  "amountPaise": 10000,
  "note": "UPI transfer"
}
```

#### PATCH /api/v1/groups/:id/settlements/:settlementId
Update settlement status.

**Body**:
```json
{
  "status": "COMPLETED"
}
```

---

### Activity

#### GET /api/v1/groups/:id/activity
Group activity history (paginated).

**Query**: `?page=1&limit=50`

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": [...]
  }
}
```

### Error Codes

| HTTP Status | Code | Description |
|---|---|---|
| 400 | VALIDATION_ERROR | Invalid request data |
| 401 | AUTHENTICATION_ERROR | Missing or invalid token |
| 403 | AUTHORIZATION_ERROR | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Duplicate resource |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

## Pagination

Paginated endpoints accept:
- `page` (default: 1)
- `limit` (default: 20, max: 100)

Response includes:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Financial Notes

- All monetary amounts are in **paise** (1 INR = 100 paise)
- Display formatting: ₹1,23,456.78 (Indian numbering system)
- Settlement is a **manual user confirmation** — Baantika does not execute or verify actual money transfers
- Net balances in a group always sum to zero
