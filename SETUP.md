# Academia Backend – Setup Guide

## Prerequisites

- Node.js 20+
- Docker (for local MongoDB)
- npm

## Local Development

### 1. Start MongoDB

```bash
docker compose up -d
```

This starts a MongoDB 7 container (`academia-mongo`) on port `27017`.
Data is persisted in the `academia_mongo_data` Docker volume.

To inspect the database, connect MongoDB Compass to:
```
mongodb://localhost:27017
```
and select the `academia` database.

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Description |
|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017/academia` |
| `JWT_SECRET` | A long random string for signing JWTs |
| `ASAAS_ACCESS_TOKEN` | Your Asaas sandbox API key |
| `ASAAS_WEBHOOK_TOKEN` | Token to validate Asaas webhook requests |
| `ASAAS_BASE_URL` | Asaas API base URL (default: sandbox) |
| `CHECKOUT_SUCCESS_URL` | Redirect after successful payment |
| `CHECKOUT_CANCEL_URL` | Redirect after cancelled payment |

### 3. Install dependencies

```bash
npm install
```

### 4. Seed the first admin user

```bash
npx ts-node scripts/seed-admin.ts
```

This creates an ADMIN user with:
- Email: `admin@academia.com`
- Password: `admin123456`

**Change the password after first login.**

### 5. Run the API

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`.

---

## API Overview

### Public

| Method | Endpoint | Description |
|---|---|---|
| POST | `/public/register` | Student self-registration |

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/admin/auth/login` | Login (returns JWT) |

### Students (authenticated)

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/students/search?q=` | ADMIN, CHECKIN | Search students |
| PATCH | `/admin/students/:id` | ADMIN | Update student |

### Check-in (authenticated)

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| POST | `/checkin` | ADMIN, CHECKIN | Register check-in |
| GET | `/checkin/history/:studentId` | ADMIN | Check-in history |

### Payments (ADMIN only)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/admin/payments/create-subscription` | Create checkout session |
| POST | `/admin/payments/cancel-subscription` | Cancel subscription |
| GET | `/admin/payments/student/:studentId` | Payment history |
| POST | `/admin/payments/update-card/:studentId` | Generate new card update checkout |

### Webhooks

| Method | Endpoint | Description |
|---|---|---|
| POST | `/webhooks/asaas` | Asaas webhook receiver |

---

## Webhook Configuration

Configure the Asaas webhook URL in your Asaas dashboard:

```
POST https://yourdomain.com/webhooks/asaas
```

Set the header `asaas-access-token` to the value of `ASAAS_WEBHOOK_TOKEN`.

Handled events:
- `PAYMENT_RECEIVED`
- `PAYMENT_CONFIRMED`
- `PAYMENT_OVERDUE`
- `SUBSCRIPTION_DELETED`

---

## Business Rules Summary

- Students register via public endpoint; paid students are redirected to Asaas hosted checkout
- `priceLocked` is set at registration and never changes automatically
- Scholarship students have `financialStatus = EXEMPT` and can always check in
- Check-in is blocked if student is `CANCELLED`
- Check-in is blocked if there is an unpaid payment more than 15 days overdue
- Duplicate check-in within 45 minutes is prevented
- Webhooks are idempotent (deduplicated by `asaasPaymentId`)
