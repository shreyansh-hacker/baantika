# Deploying Baantika to Render

This guide explains how to deploy the Baantika backend API and PostgreSQL database on Render.

## Prerequisites

1. A [Render](https://render.com) account.
2. The GitHub repository connected to your Render account.

---

## Architecture on Render

```
┌─────────────────────────────────┐
│     Render Web Service          │
│     (Node.js / Express API)     │
│     URL: https://xxx.onrender   │
└────────────────┬────────────────┘
                 │
                 │ Private Network Connection
                 ▼
┌─────────────────────────────────┐
│     Render Managed PostgreSQL   │
│     Database: baantika          │
└─────────────────────────────────┘
```

---

## Option 1: One-Click Blueprint Deployment (Recommended)

Render can provision both the Web Service and PostgreSQL database automatically using the included `render.yaml` Blueprint file.

1. Go to the [Render Dashboard](https://dashboard.render.com).
2. Click **New +** and select **Blueprint**.
3. Select your repository: `shreyansh-hacker/baantika`.
4. Render will parse `render.yaml` and display the resources to create:
   - **Service**: `baantika-api` (Web Service, Node.js)
   - **Database**: `baantika-db` (PostgreSQL)
5. Click **Apply**.
6. Render will automatically:
   - Provision the PostgreSQL database.
   - Inject the internal `DATABASE_URL` into `baantika-api`.
   - Generate secure random secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
   - Run the build command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`.
   - Launch the server with `npm run start`.
   - Monitor liveness via `/health`.

---

## Option 2: Manual Step-by-Step Deployment

If you prefer manual configuration, follow these steps:

### Step 1: Create PostgreSQL Database

1. Click **New +** > **PostgreSQL**.
2. Set:
   - **Name**: `baantika-db`
   - **Database**: `baantika`
   - **User**: `baantika_admin`
   - **Region**: Singapore (or nearest to your users)
   - **Plan**: Free (or Starter for production)
3. Click **Create Database**.
4. Once created, copy the **Internal Database URL** (for services inside Render) or **External Database URL** (for local migrations).

### Step 2: Create Web Service

1. Click **New +** > **Web Service**.
2. Connect your repository: `shreyansh-hacker/baantika`.
3. Configure settings:
   - **Name**: `baantika-api`
   - **Region**: Same region as database (e.g., Singapore)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: Free
4. Under **Advanced**, add **Health Check Path**: `/health`.

### Step 3: Configure Environment Variables

Add the following environment variables in the Web Service settings:

| Variable | Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Production environment flag |
| `PORT` | `3000` | Port for Express server |
| `DATABASE_URL` | `<internal-db-url>` | From Render PostgreSQL service |
| `JWT_SECRET` | `<random-32-chars>` | High-entropy random secret |
| `JWT_REFRESH_SECRET` | `<random-32-chars>` | High-entropy random secret |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |
| `RATE_LIMIT_WINDOW_MS` | `900000` | 15 minutes window |
| `RATE_LIMIT_MAX` | `100` | Max 100 requests per window |

5. Click **Create Web Service**.

---

## Verifying Deployment

Once deployed, verify the endpoints:

1. **Liveness Check**:
   ```bash
   curl https://your-service.onrender.com/health
   # Expected response: {"status":"ok","version":"1.0.0","timestamp":"..."}
   ```

2. **Readiness Check (Database Connectivity)**:
   ```bash
   curl https://your-service.onrender.com/ready
   # Expected response: {"status":"ready","database":"connected"}
   ```

---

## Connecting the Android App to Render

In the Baantika Android app:
1. Open the app.
2. Go to **Settings / Profile**.
3. Under **Backend API Connection**, enter your deployed URL:
   `https://your-service.onrender.com`
4. Tap **Test Connection** to verify health and readiness.
