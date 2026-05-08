# Social Media Backend

A production-ready RESTful backend for a social media application built with **NestJS**, **MongoDB**, and **Redis**. Covers the full user lifecycle — registration, email verification, authentication, profile onboarding, and account management.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [API Reference](#api-reference)
  - [Auth Endpoints](#auth-endpoints)
  - [User & Profile Endpoints](#user--profile-endpoints)
- [Architecture & Design](#architecture--design)
  - [Data Models](#data-models)
  - [Security](#security)
  - [Common Infrastructure](#common-infrastructure)
- [Testing](#testing)
- [Scripts](#scripts)

---

## Features

- **User Registration** with email/username uniqueness validation and strong password enforcement
- **Email Verification** via 6-digit OTP token sent through Nodemailer (EJS templates)
- **JWT Authentication** with stateless access tokens and Redis-backed token blacklisting on logout/deactivation
- **Password Management** — forgot password, reset via token (1-hour expiry), and in-session change password
- **Profile Onboarding** — separate `Profile` model with full name, bio, avatar, interests, and social links
- **Account Lifecycle** — soft-delete (permanent, with partial unique indexes) and temporary deactivation (auto-reactivated on next login)
- **User Search** — aggregated search across username and full name using MongoDB regex
- **Public Profile View** — unauthenticated endpoint to view any active user's public profile
- **Rate Limiting** — Redis-backed IP-level rate limiter with configurable TTL and max hits
- **Input Sanitization** — global `SanitizePipe` using `sanitize-html` to strip XSS vectors from all string inputs
- **Swagger UI** — auto-generated API docs at `/docs`
- **Standardized Responses** — global `TransformInterceptor` wraps all responses with `statusCode`, `message`, and `data`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [NestJS](https://nestjs.com/) v11 |
| Language | TypeScript 5.7 |
| Database | MongoDB via [Mongoose](https://mongoosejs.com/) v9 |
| Cache / Session | Redis via [ioredis](https://github.com/redis/ioredis) v5 |
| Authentication | Passport.js (Local + JWT strategies) |
| Validation | `class-validator` + `class-transformer` |
| Mail | `@nestjs-modules/mailer` + Nodemailer + EJS templates |
| API Docs | Swagger (`@nestjs/swagger`) |
| Testing | Jest + Supertest |
| Linting | ESLint + Prettier |

---

## Project Structure

```
src/
├── app.module.ts              # Root module
├── main.ts                    # Bootstrap — Swagger, CORS, global prefix
│
├── config/                    # Configuration factories (app, jwt, mongo)
│
├── database/
│   ├── database.module.ts     # Mongoose connection setup
│   └── redis.service.ts       # Redis client with get/set/del + token blacklisting
│
├── common/
│   ├── common.module.ts
│   ├── decorators/
│   │   ├── current-user.decorator.ts   # @CurrentUser() param decorator
│   │   └── public.decorator.ts         # @Public() route decorator
│   ├── filters/
│   │   ├── http-exception.filter.ts    # Structured HTTP error responses
│   │   └── mongo-exception.filter.ts   # Handles MongoDB duplicate key errors
│   ├── guards/
│   │   └── rate-limit.guard.ts         # Redis-backed IP rate limiter
│   ├── interceptors/
│   │   └── transform.interceptor.ts    # Wraps all responses in a standard envelope
│   └── pipes/
│       └── sanitize.pipe.ts            # Strips HTML/XSS from all string inputs
│
└── modules/
    ├── auth/
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── auth.module.ts
    │   ├── dto/                         # register, login, verify-email, forgot/reset/change-password
    │   ├── guards/
    │   │   ├── jwt-auth.guard.ts        # Checks blacklist + validates JWT
    │   │   └── local-auth.guard.ts
    │   └── strategies/
    │       ├── jwt.strategy.ts
    │       └── local.strategy.ts
    │
    ├── users/
    │   ├── users.controller.ts
    │   ├── users.service.ts
    │   ├── users.repository.ts          # All DB queries (User + Profile models)
    │   ├── users.module.ts
    │   ├── dto/                         # create-profile, update-profile, update-avatar, search-user
    │   ├── guards/
    │   │   └── profile-complete.guard.ts  # Blocks access if profile is incomplete
    │   └── schemas/
    │       ├── user.schema.ts           # Auth credentials + account state
    │       └── profile.schema.ts        # Public-facing profile data
    │
    └── mail/
        ├── mail.service.ts
        ├── mail.module.ts
        └── templates/
            ├── verification.ejs         # Email OTP template
            └── reset-password.ejs       # Password reset template
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** (local or Atlas)
- **Redis** (local or cloud)
- **npm** ≥ 9

### Installation

```bash
git clone <repository-url>
cd social-media-backend
npm install
```

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP server port | `3000` |
| `NODE_ENV` | Environment (`development` / `production`) | `development` |
| `API_PREFIX` | Global route prefix | `api/v1` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/social-media-db` |
| `JWT_ACCESS_SECRET` | Secret key for signing access tokens | — |
| `JWT_ACCESS_EXPIRATION` | Token expiry duration (e.g. `1d`, `12h`) | `1d` |
| `RATE_LIMIT_TTL` | Rate limit window in **milliseconds** | `60000` |
| `RATE_LIMIT_MAX` | Max requests per IP per window | `10` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `MAIL_HOST` | SMTP server host | `smtp.ethereal.email` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_USER` | SMTP username | — |
| `MAIL_PASS` | SMTP password | — |
| `MAIL_FROM` | Sender address | `noreply@socialapp.com` |

### Running the App

```bash
# Development (watch mode)
npm run start:dev

# Debug mode
npm run start:debug

# Production build
npm run build
npm run start:prod
```

Once running, the server is available at `http://localhost:3000`.  
Swagger docs are at `http://localhost:3000/docs`.

---

## API Reference

All endpoints are prefixed with `/api/v1`. Protected endpoints require the header:

```
Authorization: Bearer <access_token>
```

### Auth Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register with email, username, and password. Sends a 6-digit OTP to the email. |
| `POST` | `/auth/login` | Public | Authenticate with email and password. Returns JWT + profile completion status. |
| `POST` | `/auth/logout` | 🔒 Bearer | Blacklists the current token in Redis. |
| `POST` | `/auth/verify-email` | Public | Verify email using the 6-digit OTP. |
| `POST` | `/auth/resend-verification` | Public | Resend verification OTP to the registered email. |
| `POST` | `/auth/forgot-password` | Public | Send a password reset token to the email (expires in 1 hour). |
| `POST` | `/auth/reset-password` | Public | Reset password using the reset token. |
| `PATCH` | `/auth/change-password` | 🔒 Bearer | Change password while authenticated (requires old password). |

#### Register — Request Body

```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "Password123!"
}
```

> Username: 3–20 characters, alphanumeric + underscores only.  
> Password: 8–32 characters, must include uppercase, lowercase, and a number or special character.

#### Login — Response

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "username": "johndoe",
      "isProfileComplete": false
    },
    "accessToken": "<jwt>"
  }
}
```

---

### User & Profile Endpoints

All require `Authorization: Bearer <token>` unless marked Public.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/users/profile` | 🔒 Bearer | Create the user's profile (onboarding step). |
| `GET` | `/users/me` | 🔒 Bearer | Get the authenticated user's full profile. |
| `PATCH` | `/users/me` | 🔒 Bearer | Update the authenticated user's profile. |
| `DELETE` | `/users/me` | 🔒 Bearer | Permanently soft-delete the account. |
| `POST` | `/users/me/avatar` | 🔒 Bearer | Set a new avatar URL. |
| `DELETE` | `/users/me/avatar` | 🔒 Bearer | Remove the avatar. |
| `GET` | `/users/search?query=` | 🔒 Bearer | Search active users by username or full name. |
| `GET` | `/users/:username` | Public | View any active user's public profile. |
| `POST` | `/users/deactivate` | 🔒 Bearer | Temporarily deactivate the account (token is blacklisted). Auto-reactivated on next login. |

#### Create Profile — Request Body

```json
{
  "fullName": "John Doe",
  "bio": "Software engineer and travel enthusiast",
  "avatarUrl": "https://example.com/avatar.jpg",
  "interests": ["coding", "traveling", "music"],
  "socialLinks": {
    "twitter": "https://twitter.com/johndoe",
    "instagram": "https://instagram.com/johndoe",
    "linkedin": "https://linkedin.com/in/johndoe",
    "website": "https://johndoe.com"
  }
}
```

---

## Architecture & Design

### Data Models

The application uses two separate MongoDB collections to cleanly separate concerns:

**`User`** — authentication and account state  
Stores: `email`, `username`, `password` (bcrypt), `isEmailVerified`, `verificationToken`, `resetPasswordToken`, `resetPasswordExpires`, `isActive`, `deactivatedAt`, `deletedAt`

**`Profile`** — public-facing user data  
Stores: `userId` (ref → User), `fullName`, `bio`, `avatarUrl`, `interests[]`, `socialLinks`, `isComplete`

Partial unique indexes on `email` and `username` ensure uniqueness only for non-deleted accounts — this allows re-registration with the same credentials after a soft-delete.

### Security

- **Password hashing** using `bcrypt` with salt rounds of 10
- **JWT token blacklisting** — on logout or deactivation, tokens are stored in Redis with their remaining TTL and rejected by the `JwtAuthGuard` on every subsequent request
- **Input sanitization** — a global `SanitizePipe` runs `sanitize-html` on all string fields in incoming request bodies
- **Rate limiting** — a Redis-backed IP-level guard limits requests to a configurable number per time window
- **Validation** — all DTOs use `class-validator` decorators; password strength and username format are enforced at the DTO layer

### Common Infrastructure

| Component | Purpose |
|---|---|
| `TransformInterceptor` | Wraps every successful response in `{ statusCode, message, data }` |
| `HttpExceptionFilter` | Returns structured JSON for all HTTP exceptions including path and timestamp |
| `MongoExceptionFilter` | Catches MongoDB `code 11000` (duplicate key) and returns a user-friendly `409 Conflict` |
| `@Public()` decorator | Marks routes as unauthenticated — skips the global JWT guard |
| `@CurrentUser()` decorator | Extracts a field from the JWT payload (e.g. `@CurrentUser('userId')`) |
| `ProfileCompleteGuard` | Can be applied to future routes that require a completed profile |

---

## Testing

```bash
# Unit tests
npm test

# Unit tests in watch mode
npm run test:watch

# Coverage report
npm run test:cov

# End-to-end tests
npm run test:e2e
```

Tests live in `src/**/*.spec.ts` (unit) and `test/` (e2e). The test environment is `node` and uses `ts-jest` for TypeScript transformation.

---

## Scripts

| Command | Description |
|---|---|
| `npm run start:dev` | Start in watch/dev mode |
| `npm run start:prod` | Run compiled production build |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run format` | Format source files with Prettier |
| `npm run lint` | Lint and auto-fix with ESLint |
| `npm test` | Run unit tests |
| `npm run test:cov` | Run tests with coverage report |
| `npm run test:e2e` | Run end-to-end tests |
