# Nonada Academia – Backend API

REST API for a martial arts academy management system. Built with **NestJS**, **MongoDB** (Mongoose), and **JWT** authentication.

## Prerequisites

- **Node.js** 20+
- **npm** 10+
- **MongoDB** (local or Atlas)
- (Optional) Asaas account for payments (sandbox/production)

## Environment variables

Create a `.env` file in the project root:

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Server port (default: `3000`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `ASAAS_ACCESS_TOKEN` | Asaas API token (payments) |
| `ASAAS_BASE_URL` | Asaas API base URL (e.g. sandbox) |
| `ASAAS_WEBHOOK_TOKEN` | Token to validate Asaas webhooks |
| `CHECKOUT_SUCCESS_URL` | Redirect after successful checkout |
| `CHECKOUT_CANCEL_URL` | Redirect after cancelled checkout |

## Installation

```bash
npm install
```

## Development

```bash
npm run start:dev
```

API runs at `http://localhost:3000`.

## Production

```bash
npm run build
npm run start:prod
```

## Seed admin users

Creates default ADMIN and CHECKIN users (see `scripts/seed-admin.ts`):

```bash
npm run seed
```

**Warning:** Only run in development; change default passwords in production.

## Main modules

- **auth** – Login, JWT, guards
- **admin** – Admin user CRUD
- **students** – Student registration and management
- **checkin** – Class attendance (check-in)
- **payments** – Payments via Asaas integration
- **webhooks** – Asaas webhook handling

## Tech stack

- **NestJS** 10
- **Mongoose** 8
- **Passport** + **JWT**
- **class-validator** / **class-transformer**
- **bcryptjs** for password hashing
- **@nestjs/throttler** for rate limiting

## API contract

The API contract consumed by the frontend is documented in the frontend repo: `nonada-front-end/docs/API_CONTRACT.md`.
