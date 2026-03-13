# Prompt completo – Backend API Academia (NestJS + setup local)

You are a senior backend engineer specialized in NestJS, MongoDB and payment integrations.

Your task is to design and implement a production-ready backend API for a martial arts academy management system.

The system must follow clean architecture principles and be modular, scalable and ready for production.

## TECH STACK

- NestJS
- TypeScript
- MongoDB with Mongoose
- class-validator for DTO validation
- JWT authentication
- Asaas payment integration using MCP

## ENVIRONMENT AND LOCAL SETUP

**Environment variables**

The project must use a .env file for configuration. Do not commit .env; commit only .env.example with placeholder values and no secrets.

Required variables:

- NODE_ENV (development | production; default: development)
- PORT (default: 3000)
- MONGODB_URI (MongoDB connection string; see Local database below)
- JWT_SECRET (secret for signing JWT; long random string)
- ASAAS_ACCESS_TOKEN (Asaas API key; same as access_token header in API calls)
- ASAAS_BASE_URL (optional; default for development: https://api-sandbox.asaas.com)
- ASAAS_WEBHOOK_TOKEN (token to validate asaas-access-token webhook header; reject requests without it)

Implement a ConfigModule (or config namespace) that reads from process.env and validates required variables at application bootstrap. If any required variable is missing in non-test environment, log a clear error and exit.

**Local database (MongoDB on the developer machine)**

The project must support running MongoDB locally for development.

Provide a docker-compose.yml at the project root with a single service:

- image: mongo:7 (or latest LTS)
- container name: academia-mongo
- port: 27017:27017
- optional: volume for data persistence (e.g. academia_mongo_data)

Default MONGODB_URI for local development:

```
MONGODB_URI=mongodb://localhost:27017/academia
```

Document in README or SETUP.md:

1. Start MongoDB: docker compose up -d (or docker-compose up -d)
2. Copy .env.example to .env and set at least MONGODB_URI, JWT_SECRET, ASAAS_ACCESS_TOKEN, ASAAS_WEBHOOK_TOKEN
3. Install dependencies: npm install
4. Run the API: npm run start:dev
5. To inspect the database locally: use MongoDB Compass (or Atlas app) and connect to mongodb://localhost:27017 with database name "academia"

## BUSINESS CONTEXT

The system manages a martial arts academy.

Students do not log in to the system.

Students interact with the system only during registration.

The academy reception has a computer logged into the system using a CHECKIN role to register class attendance.

Administrators manage the system.

## ROLES

Only two roles exist in the system.

**ADMIN**  
Full control of the system.

**CHECKIN**  
Used by the reception computer to search students and register check-ins.

## PAYMENT RULES

The only payment method available is credit card recurring subscription using hosted checkout from Asaas.

Students can either:

1. Pay monthly
2. Receive a scholarship

Scholarship students do not pay.

## SYSTEM ARCHITECTURE

The system must follow clean architecture.

**Layers**

- domain
- application
- infrastructure
- presentation

**domain**  
Contains entities and business rules.

**application**  
Contains use cases and orchestration logic.

**infrastructure**  
Contains database access and external integrations.

**presentation**  
Contains HTTP controllers.

## MODULE AND FOLDER STRUCTURE

The project must follow a structure that avoids circular dependencies between modules.

```
src
  core
    guards
    decorators
    interceptors
    filters
  modules
    auth
    students
    checkin
    payments
    webhooks
    admin
  integrations
    asaas
  shared
    dto
    utils
    types
  config
```

**Rules**

- Modules must not depend directly on each other unless strictly necessary.
- External integrations must be isolated inside the integrations layer.
- Shared DTOs and utilities must be placed in the shared layer.
- Guards and interceptors must be placed in the core layer.
- Controllers must exist only inside modules.
- Business logic must exist inside use cases.
- Avoid circular dependencies between modules.

## MODULES TO GENERATE

- AuthModule
- StudentsModule
- CheckinModule
- PaymentsModule
- WebhooksModule
- AdminModule
- AsaasIntegrationModule

Each module must contain:

- controllers
- services
- use-cases
- dto
- schemas

## DATABASE MODELS

**Student**

- id
- registrationNumber
- name
- cpf
- email
- phone
- monthlyFee
- priceLocked
- planType (PAID | SCHOLARSHIP)
- paymentMethod (CARD | SCHOLARSHIP)
- financialStatus (PENDING | ACTIVE | OVERDUE | CANCELLED | EXEMPT)
- asaasCustomerId
- asaasCheckoutId
- checkoutUrl
- active
- createdAt

**PaymentHistory**

- id
- studentId
- asaasPaymentId
- asaasSubscriptionId
- amount
- method (CARD)
- status
- dueDate
- paidAt
- createdAt

**Checkin**

- id
- studentId
- dateTime
- registeredBy

**Admin**

- id
- name
- email
- passwordHash
- role (ADMIN | CHECKIN)
- createdAt

## DATA NORMALIZATION

CPF must always be normalized.

Remove all non numeric characters before saving or searching CPF.

## PRICE LOCK RULE

When a student registers with a paid plan, the system must store the value of monthlyFee in priceLocked.

priceLocked represents the amount the student agreed to pay when subscribing.

Future price changes must not modify priceLocked automatically.

Recurring payments must always use priceLocked as the charge amount.

## PUBLIC REGISTRATION

**POST /public/register**

Student fills registration form.

The public registration form must collect, in addition to the existing fields:

- mobilePhone (optional)
- address (optional)
- addressNumber (optional)
- complement (optional)
- province (optional)
- postalCode (optional)

CPF must be normalized before saving.

If the student selects scholarship:

- create student
- financialStatus = EXEMPT

If the student selects paid plan:

- create customer in Asaas
- generate hosted checkout session
- store asaasCustomerId
- store asaasCheckoutId
- store checkoutUrl
- priceLocked must be set equal to monthlyFee during registration.
- send full customer contact and address data to Asaas (name, normalized CPF, email, phone or mobilePhone, address, addressNumber, complement, province, postalCode)
- use the student database id as externalReference both when creating the Asaas customer and when generating the hosted checkout
- when building the Asaas checkout URL, **never** hardcode URLs; always use the `link` field returned by Asaas as the single source of truth for the checkout URL
- the recurring subscription created in Asaas must have `cycle = MONTHLY` and `nextDueDate` set to the current date in `YYYY-MM-DD` format
- when sending phone to Asaas, prefer `mobilePhone` when present; if not present, fall back to `phone`

Return checkoutUrl in the response.

Example response:

```json
{
  "checkoutUrl": "https://checkout.asaas.com/..."
}
```

## STUDENT SEARCH

**GET /students/search?q=**

Search supports:

- CPF
- full name
- partial name

Behavior depends on role.

If role = ADMIN: if q is empty return all students with pagination.

If role = CHECKIN: q parameter is required. Return minimal student data (id, name).

## CHECKIN ENDPOINT

**POST /checkin**

Allowed roles: ADMIN, CHECKIN

Body:

```json
{
  "studentId": "student id"
}
```

**Rules**

- Prevent duplicate check-ins for the same student within a 45 minute window.
- Students with financialStatus CANCELLED cannot check in.

## OVERDUE ACCESS RULE

Students are allowed to attend classes with up to 15 days of payment delay.

When processing a check-in the system must verify the most recent unpaid payment.

If the due date is more than 15 days in the past the check-in must be blocked.

System must store: studentId, dateTime, registeredBy.

## CHECKIN HISTORY

**GET /checkin/history/:studentId?page=&limit=**

Allowed role: ADMIN

Return paginated check-in history.

## ADMIN AUTHENTICATION

**POST /admin/auth/login**

## ADMIN STUDENT MANAGEMENT

**PATCH /admin/students/:id**

Allows partial update. Use PATCH instead of PUT.

Students must not be permanently deleted. Use soft delete with field: active.

## PAYMENT MANAGEMENT

- POST /admin/payments/create-subscription
- POST /admin/payments/cancel-subscription
- GET /admin/payments/student/:studentId

## UPDATE CREDIT CARD FLOW

Students may need to update the credit card used for their subscription.

The system must support generating a new hosted checkout to update the card.

**Endpoint:** POST /admin/payments/update-card/:studentId

Allowed role: ADMIN

**Flow**

1. Admin requests card update for a student.
2. The system generates a new hosted checkout session using Asaas.
3. The new checkout URL must be stored in the student record.
4. The endpoint must return the checkoutUrl.

Example response:

```json
{
  "checkoutUrl": "https://checkout.asaas.com/..."
}
```

The student accesses the hosted checkout and enters a new credit card. Future recurring charges will use the updated card.

## ASAAS MCP INTEGRATION

This project integrates with Asaas using MCP tools.

Before implementing the integration the system must:

- inspect MCP tools
- identify available operations
- identify request parameters
- identify response schemas
- generate TypeScript interfaces

The MCP interface is the source of truth. Do not invent API endpoints.

The Asaas integration must:

- use TypeScript types that reflect the real MCP responses, including:
  - `AsaasCheckoutResponse.link` (string): the hosted checkout URL (required)
  - `AsaasCheckoutResponse.status` (string): current checkout status
- avoid any hardcoded checkout URL patterns; `link` is the only valid source for the checkout URL
- always include customer contact and address details when available in both customer creation and checkout creation payloads:
  - email, phone, mobilePhone, address, addressNumber, complement, province, postalCode
- set the subscription configuration for recurring checkouts with:
  - `cycle = MONTHLY`
  - `nextDueDate` equal to the current date in `YYYY-MM-DD` format
- use the student id as `externalReference` on both the Asaas customer and checkout so that webhooks and dashboards can be correlated back to the student
- log every Asaas HTTP response in the client layer (method, path, and full JSON body) using the application logger for observability and easier troubleshooting

## ASAAS INTEGRATION STRUCTURE

```
integrations/asaas
  asaas.client.ts
  asaas.service.ts
  asaas.types.ts
  asaas.mapper.ts
```

- asaas.client.ts handles MCP communication.
- asaas.service.ts implements business logic.
- asaas.types.ts contains TypeScript interfaces.
- asaas.mapper.ts maps responses to internal models.

Controllers must never call Asaas directly.

## WEBHOOK

**POST /webhooks/asaas**

Handle events:

- PAYMENT_RECEIVED
- PAYMENT_CONFIRMED
- PAYMENT_OVERDUE
- SUBSCRIPTION_DELETED

Webhook must be idempotent. Use asaasPaymentId as unique identifier.

Webhook responsibilities: update student financialStatus, insert payment history.

**WEBHOOK SECURITY**  
Validate header: asaas-access-token. Reject invalid requests.

**WEBHOOK LOGGING**  
Log before processing: event type, payment id, subscription id, full payload.

## DATABASE INDEXES

- cpf unique
- name
- asaasCustomerId
- asaasCheckoutId
- studentId
- dateTime

## SECURITY

Apply rate limiting to public endpoints. Example: POST /public/register.

## BUSINESS FLOWS

**Student Registration Flow**

1. Student accesses public registration page.
2. Student submits form.
3. If scholarship: create student, financialStatus = EXEMPT.
4. If paid plan:
   - first, create and persist the student in the local database with:
     - registrationNumber
     - cpf normalized
     - planType = PAID
     - paymentMethod = CARD
     - financialStatus = PENDING
     - priceLocked = monthlyFee
     - phone stored as `mobilePhone` if provided, otherwise `phone`
   - then, call Asaas to create the customer and generate the recurring hosted checkout, sending full contact and address data and using the student id as externalReference
   - after Asaas returns, update the existing student record with asaasCustomerId, asaasCheckoutId and checkoutUrl
   - if Asaas integration fails after the student is saved, keep the student with financialStatus = PENDING and log the error; the admin will be able to manually create the subscription later via the admin payment endpoints
5. Student is redirected to checkout using the `checkoutUrl` returned by Asaas (field `link`).

**Payment Flow**

1. Student completes payment on hosted checkout.
2. Asaas sends webhook event.
3. Webhook processes event.
4. If payment received: update financialStatus ACTIVE, store payment history.

**Check-in Flow**

1. Reception computer logs in with CHECKIN role.
2. Operator searches student by name or CPF.
3. Student is selected.
4. POST /checkin is called.
5. System validates: student not CANCELLED, no check-in in last 45 minutes, payment delay <= 15 days.
6. Check-in stored.

## STRICT API CONTRACT

All endpoints must follow a strict API contract.

- Controllers must only handle HTTP logic.
- All business logic must be implemented in use cases.
- Every endpoint must use DTO validation with class-validator.
- Responses must follow a consistent JSON structure.

**Success response format:**

```json
{
  "success": true,
  "data": {}
}
```

**Error response format:**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

All endpoints must use proper HTTP status codes.

Use cases must not depend on controllers. Controllers must call services or use cases only.

## IMPLEMENTATION PRIORITY

The system must be generated in the following strict order.

1. **Step 1** – Generate project folder structure and modules.
2. **Step 2** – Generate MongoDB schemas and database indexes.
3. **Step 3** – Generate DTOs and validation rules.
4. **Step 4** – Generate domain entities.
5. **Step 5** – Generate use cases.
6. **Step 6** – Generate services.
7. **Step 7** – Generate controllers.
8. **Step 8** – Generate authentication system and role guards.
9. **Step 9** – Generate Asaas MCP integration.
10. **Step 10** – Generate webhook processing.
11. **Step 11** – Generate payment flows.
12. **Step 12** – Generate check-in system.
13. **Step 13** – Generate admin endpoints.

Do not skip steps. Do not implement integrations before domain models exist. Controllers must be implemented only after use cases and services are completed.

## GENERATE

- Complete project structure
- NestJS modules
- Mongoose schemas
- DTOs
- Use cases
- Controllers
- Services
- JWT guards
- Role guards
- Asaas integration layer
- Webhook handler
- Example HTTP requests
- Basic architecture documentation
