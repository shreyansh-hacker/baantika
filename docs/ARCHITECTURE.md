# Baantika Architecture

## System Architecture

```
┌─────────────────────┐     HTTPS/REST      ┌──────────────────────┐
│                     │ ─────────────────→  │                      │
│  React Native App   │                     │   Express API        │
│  (Android)          │ ←────────────────── │   (Node.js/TS)       │
│                     │    JSON responses   │                      │
│  • React Navigation │                     │  • JWT Auth          │
│  • TanStack Query   │                     │  • Zod Validation    │
│  • React Hook Form  │                     │  • Prisma ORM        │
│  • Secure Storage   │                     │  • Pino Logging      │
│  • Offline Support  │                     │  • Rate Limiting     │
│                     │                     │  • Error Handling    │
└─────────────────────┘                     └──────────┬───────────┘
                                                       │
                                                       │ Prisma
                                                       │
                                              ┌────────▼──────────┐
                                              │                   │
                                              │  PostgreSQL       │
                                              │  (Render)         │
                                              │                   │
                                              │  • Integer paise  │
                                              │  • UUID PKs       │
                                              │  • Audit trails   │
                                              │  • Soft deletes   │
                                              └───────────────────┘
```

## Mobile Architecture

### Layer Diagram

```
┌────────────────────────────────────────────┐
│                 Screens                     │
│  (Dashboard, Groups, Expenses, Settings)   │
├────────────────────────────────────────────┤
│              Navigation                     │
│  (Tab Navigator + Stack Navigators)        │
├────────────────────────────────────────────┤
│           Design System                     │
│  (Buttons, Cards, Inputs, Typography)      │
├────────────────────────────────────────────┤
│         Hooks & State Management           │
│  (TanStack Query, React Hook Form, Zod)   │
├────────────────────────────────────────────┤
│              API Client                     │
│  (Axios, Token Interceptor, Retry)         │
├────────────────────────────────────────────┤
│           Services                          │
│  (Auth Storage, Network Monitor)           │
├────────────────────────────────────────────┤
│         React Native (Bare CLI)            │
│  (Android Native Modules)                  │
└────────────────────────────────────────────┘
```

### Key Libraries
| Library | Purpose |
|---|---|
| react-native (CLI) | Core framework |
| @react-navigation/* | Navigation |
| @tanstack/react-query | Server state |
| react-hook-form + zod | Forms + validation |
| react-native-keychain | Secure token storage |
| axios | HTTP client |

## Backend Architecture

### Module Structure
Each feature module contains:
- `routes.ts` — Express route definitions
- `controller.ts` — Request handling, response formatting
- `service.ts` — Business logic
- `schema.ts` — Zod validation schemas

### Modules
1. **Auth** — Registration, login, token management
2. **Users** — Profile, dashboard
3. **Groups** — CRUD, membership, invitations
4. **Expenses** — CRUD, split calculations
5. **Balances** — Balance computation, settlement suggestions
6. **Settlements** — CRUD, state transitions
7. **Activity** — Event logging, history

## Database Design

### Key Decisions
- **UUIDs** for all primary keys (no sequential IDs for security)
- **Integer paise** for all monetary values (100 paise = ₹1)
- **Soft deletes** for expenses and users (preserve financial integrity)
- **Audit trail** via activity_events table
- **Refresh token rotation** for session security

### Split Calculation Rules
- **EQUAL**: Floor division + deterministic remainder allocation (by sorted user ID)
- **EXACT**: Sum must equal total exactly
- **PERCENTAGE**: Must total 100%, largest-remainder allocation
- **SHARES**: Proportional with largest-remainder allocation

### Balance Integrity
- Net = Σ(paid) - Σ(owed) + Σ(settlements_received) - Σ(settlements_paid)
- Σ(all member nets) = 0 for every group (integrity invariant)
- Settlement suggestions via greedy min-transfer algorithm

## Deployment

### Render Configuration
- **Web Service**: Node.js, builds TypeScript, runs Prisma migrations
- **PostgreSQL**: Managed instance
- **Health Check**: `/health` endpoint
- **Environment**: All secrets via environment variables

### CI/CD
- GitHub Actions for:
  - Backend: TypeScript check, lint, unit tests
  - Mobile: TypeScript check, lint
