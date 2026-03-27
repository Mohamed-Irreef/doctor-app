# NiviDoc Backend

Production-oriented backend for NiviDoc mobile apps and admin panel.

## Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT auth + Google OAuth token verification
- Razorpay payment order + signature verification
- Cloudinary upload integration
- Nodemailer email service

## Project Structure

```text
src/
  app.js
  server.js
  config/
  controllers/
  middlewares/
  models/
  routes/
  services/
  utils/
  validators/
  scripts/
```

## Quick Start

1. Copy env template and fill secrets:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Seed base data (plans, commission defaults, admin):

```bash
npm run seed
```

4. Run server:

```bash
npm run dev
```

## Default Seed Admin

- email: `admin@nividoc.com`
- password: `Admin@12345`

## API Base

`/api`

## Core Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/me`

### Doctors

- `GET /api/doctors`
- `GET /api/doctors/:id`
- `POST /api/doctors/signup-request`
- `PUT /api/doctors/profile`
- `GET /api/doctors/appointments/me`

### Appointments

- `POST /api/appointments`
- `GET /api/appointments/patient`
- `GET /api/appointments/doctor`
- `PUT /api/appointments/:id/status`
- `PUT /api/appointments/:id/reschedule`

### Slots

- `POST /api/slots`
- `GET /api/slots/:doctorId`
- `DELETE /api/slots/:id`

### Labs

- `GET /api/labs`
- `GET /api/labs/:id`
- `POST /api/labs/book`

### Pharmacy

- `GET /api/pharmacy/medicines`
- `GET /api/pharmacy/medicines/:id`
- `POST /api/pharmacy/orders`
- `GET /api/pharmacy/orders`

### Payments

- `POST /api/payments/create-order`
- `POST /api/payments/verify`

### Subscriptions / Monetization

- `GET /api/plans`
- `POST /api/subscriptions/create-order`
- `POST /api/subscriptions/verify-payment`
- `GET /api/subscriptions/doctor/:id`
- `POST /api/subscriptions/cancel`

### Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/revenue`
- `GET /api/admin/subscriptions`
- `GET /api/admin/patients`
- `GET /api/admin/doctors`
- `PUT /api/admin/doctors/approve`
- `GET /api/admin/appointments`
- `POST /api/admin/labs`
- `POST /api/admin/medicines`
- `GET /api/admin/payments`
- `POST /api/admin/notifications`
- `PUT /api/admin/settings`
- `GET /api/admin/reviews`
- `DELETE /api/admin/reviews/:id`

### Misc

- `POST /api/upload` (`multipart/form-data`, `file` field)
- `GET /api/notifications`
- `POST /api/reviews`

## Notes

- This service is built against UI data contracts from patient app, doctor app, and admin panel.
- Commission percentages are configurable via admin settings and stored in `PlatformSetting`.
- Subscription plans drive doctor monetization and admin revenue reporting.
