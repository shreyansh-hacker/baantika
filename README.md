# Baantika (बांटिका)

> **Share expenses. Settle simply.**

An Indian-first group expense-sharing and settlement-tracking platform built with bare React Native CLI for native Android and an enterprise-grade Express/TypeScript/PostgreSQL backend.

---

## ⚠️ Important Product Scope & Disclaimer

> **Baantika does not execute or verify actual money transfers.**
> Settlement tracking is solely a record of mutual agreements and offline actions confirmed by users. Marking a settlement "COMPLETED" is based on user confirmation and must never be represented as proof that a financial transaction took place through any banking or UPI gateway.

---

## ✨ Core Features

- **India-First Accounting**:
  - Full financial precision using **integer paise** (never floating-point arithmetic).
  - Indian currency formatting (`₹1,250.00` and compact `₹1,250` for lakhs/crores).
- **Flexible & Deterministic Split Engine**:
  - **Equal Split**: Floor division with deterministic remainder paise distribution by sorted user IDs.
  - **Exact Split**: Custom amounts per member with exact-sum verification.
  - **Percentage Split**: Exact 100% verification with Largest-Remainder (Hare-Niemeyer) allocation.
  - **Shares/Weights Split**: Ratio-based splitting with deterministic remainder resolution.
  - **Multiple Payers**: Supports multiple members contributing custom amounts to a single bill.
- **Ledger Invariant & Settlement Suggestions**:
  - Group net balance invariant strictly enforced: `Σ(all member nets) === 0`.
  - Greedy debt simplification algorithm that computes the minimal number of transfers required to settle the group ledger.
- **Manual Settlement Lifecycle**:
  - `PENDING` ➔ `COMPLETED` / `CANCELLED` state machine.
  - Completed settlements require explicit manual confirmation by the payer or payee.
  - Idempotent status updates preventing duplicate credits.
- **Hardware-Backed Mobile Security**:
  - Mobile tokens stored inside the **hardware-backed Android Keystore** via `react-native-keychain`.
  - Passwords hashed server-side using **Argon2id**.
  - Opaque refresh token rotation with reuse detection.
  - Rate limiting on sensitive endpoints.
- **Cold-Start Resilience**:
  - Mobile splash screen automatically probes backend health with backoff and retry.
  - Designed for graceful operation on free-tier hosting (e.g. Render sleeping instances).
- **Audit History**:
  - Full activity log tracking expense creation, edits, soft-deletions, settlements, and membership changes.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Mobile ["Android Native Client (Bare React Native CLI)"]
        UI["React Navigation (Tabs + Stacks)"]
        Forms["React Hook Form + Zod Validation"]
        Cache["TanStack Query Cache"]
        Storage["Android Keystore (react-native-keychain)"]
        Axios["Axios Client (Token Refresh + Cold Start Retry)"]
        UI --> Forms
        UI --> Cache
        Cache --> Axios
        Axios --> Storage
    end

    subgraph Backend ["Express.js + TypeScript API (Render Web Service)"]
        Router["Express Routers (/api/v1)"]
        AuthMiddleware["JWT Auth & Rate Limiting"]
        SplitEngine["Split & Ledger Math Engine (Paise)"]
        PrismaClient["Prisma ORM Client"]
        Router --> AuthMiddleware
        AuthMiddleware --> SplitEngine
        SplitEngine --> PrismaClient
    end

    subgraph Database ["PostgreSQL (Render Managed)"]
        PG["PostgreSQL Database (Integer Paise Schema)"]
        PrismaClient --> PG
    end

    Axios -- "HTTPS (Bearer Token)" --> Router
```

---

## 🛠️ Technology Stack

| Domain | Technologies |
|---|---|
| **Mobile** | React Native 0.88 (Bare CLI, strictly no Expo), TypeScript strict mode, React Navigation 7, TanStack Query v5, React Hook Form, Zod, react-native-keychain, react-native-svg, Android Gradle (Gradle 9.4.1) |
| **Backend** | Node.js 22 LTS, TypeScript, Express 4, Prisma ORM 6, Zod, Argon2id, JWT, Express Rate Limit, Helmet, Pino structured logging |
| **Database** | PostgreSQL with committed, reproducible Prisma migrations |
| **DevOps & Infra** | Render Blueprint (`render.yaml`), Render PostgreSQL, GitHub Actions CI |

---

## 📋 Prerequisites

- **Node.js**: `v22.x` (LTS)
- **Package Manager**: `npm`
- **Java**: JDK 17 or JDK 22 (Gradle 9.4.1 is compatible with both)
- **Android SDK**: API level 34 or 35 with build-tools installed
- **PostgreSQL**: Local instance or cloud database (Render)

---

## 🚀 Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/shreyansh-hacker/baantika.git
cd baantika
```

### 2. Configure Backend Environment

Copy `.env.example` in the `backend` directory to `.env`:

```bash
cd backend
cp .env.example .env
```

Ensure the following variables are defined in `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/baantika_dev?schema=public"
JWT_SECRET="your-32-character-minimum-jwt-secret-key"
JWT_REFRESH_SECRET="your-32-character-minimum-refresh-secret-key"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="*"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000
```

### 3. Install Backend Dependencies & Run Migrations

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Seed Development Database (Optional)

```bash
npm run db:seed
```
*Seeds demo users (`aarav@baantika.local`, `diya@baantika.local`, `kabir@baantika.local` with password `Baantika@123`) and a sample Koramangala flat group.*

### 5. Start Backend Server

```bash
npm run dev
# Server runs at http://localhost:3000
```

Verify backend health:
```bash
curl http://localhost:3000/health
# {"status":"ok","version":"1.0.0","timestamp":"..."}
```

---

## 📱 Mobile App Setup & Build

### 1. Install Mobile Dependencies

```bash
cd ../mobile
npm install
```

### 2. Configure Android SDK Path

Create or verify `mobile/android/local.properties`:
```properties
sdk.dir=C\:\\Users\\<your-username>\\AppData\\Local\\Android\\Sdk
```

### 3. Run Mobile Typecheck

```bash
npx tsc --noEmit
```

### 4. Build Android Debug APK

```bash
cd android
./gradlew assembleDebug
# Generated APK: mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

### 5. Run on Android Emulator or Device

```bash
cd ..
npx react-native run-android
```

> **Note for Android Emulator**: The app connects to `http://10.0.2.2:3000` by default, which maps directly to your host machine's `localhost:3000`. You can also configure a custom Render URL in the app's Profile / Settings tab.

---

## 🧪 Testing

### Backend Unit & Integration Tests

Run comprehensive Jest tests (covering split math, largest-remainder allocation, greedy debt settlement, and health endpoints):

```bash
cd backend
npm test
```

### Mobile Typecheck & Lint

```bash
cd mobile
npx tsc --noEmit
```

---

## 🌐 Render Deployment

Deploy the entire stack to Render with a single click using the included `render.yaml` Blueprint:

1. Connect your repository to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** ➔ **Blueprint**.
3. Render automatically provisions the Node.js API Web Service and the PostgreSQL instance.
4. For detailed step-by-step instructions, see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## 📚 API Specification

Full REST API documentation is available in [`docs/API.md`](docs/API.md), covering:
- Authentication & refresh token rotation (`/api/v1/auth/*`)
- User profiles & dashboard summary (`/api/v1/users/*`)
- Group management & member invitations (`/api/v1/groups/*`)
- Expenses & split calculation rules (`/api/v1/groups/:groupId/expenses/*`)
- Group balances & settlement suggestions (`/api/v1/groups/:groupId/balances/*`)
- Settlement lifecycle & manual confirmation (`/api/v1/groups/:groupId/settlements/*`)
- Group and user activity feeds (`/api/v1/activity/*`)

---

## 🔒 Security & Privacy

- **Android Keystore**: No auth tokens or credentials are stored in plain `AsyncStorage`.
- **Argon2id**: Memory-hard password hashing with calibrated memory and parallelism cost.
- **Tenant Boundaries**: Strict group authorization checks on every database query prevent Insecure Direct Object References (IDOR).
- **Ledger Immutability**: Expenses and user accounts use soft-deletion to guarantee that past financial balances never break.
- **Audit Logging**: All financial actions log the actor ID, timestamp, and change metadata.

---

## 📄 License

Proprietary © Baantika. All rights reserved.
