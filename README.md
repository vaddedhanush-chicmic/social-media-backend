# 📱 Social Media Backend

A robust, scalable RESTful API backend for a social media platform, built with **NestJS**, **MongoDB**, and **TypeScript**. Features JWT-based authentication, rate limiting, email services, and full Swagger API documentation.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 |
| Language | TypeScript 5 |
| Database | MongoDB (via Mongoose) |
| Auth | JWT (Access + Refresh tokens), Passport.js |
| Caching / Sessions | ioredis (Redis) |
| Email | Nodemailer + @nestjs-modules/mailer (EJS templates) |
| API Docs | Swagger / OpenAPI |
| Rate Limiting | @nestjs/throttler |
| Validation | class-validator + class-transformer |
| Sanitization | sanitize-html |
| Testing | Jest + Supertest |
| Linting / Formatting | ESLint + Prettier |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **MongoDB** (local or Atlas)
- **Redis** (for session/token caching)

### Installation

```bash
# Clone the repository
git clone https://github.com/vaddedhanush-chicmic/social-media-backend.git
cd social-media-backend

# Install dependencies
npm install
```

### Environment Configuration

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

**Application**

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (`development` / `production`) | `development` |
| `API_PREFIX` | Global API route prefix | `api/v1` |

**MongoDB**

| Variable | Description | Default |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/social-media-db` |

**JWT**

| Variable | Description | Default |
|---|---|---|
| `JWT_ACCESS_SECRET` | Secret key for signing access tokens | _(required)_ |
| `JWT_ACCESS_EXPIRATION` | Access token expiry duration | `1d` |

**Rate Limiting (Redis-backed)**

| Variable | Description | Default |
|---|---|---|
| `RATE_LIMIT_TTL` | Rate limit window in milliseconds | `60000` |
| `RATE_LIMIT_MAX` | Max requests per window per IP | `10` |

**Redis**

| Variable | Description | Default |
|---|---|---|
| `REDIS_HOST` | Redis server hostname | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |

**Mail**

| Variable | Description | Default |
|---|---|---|
| `MAIL_HOST` | SMTP host | `smtp.ethereal.email` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_USER` | SMTP username | _(required)_ |
| `MAIL_PASS` | SMTP password | _(required)_ |
| `MAIL_FROM` | Sender address | `noreply@socialapp.com` |

---

## 🏃 Running the App

```bash
# Development (standard)
npm run start

# Development (watch mode — auto-restarts on file changes)
npm run start:dev

# Debug mode
npm run start:debug

# Production
npm run build
npm run start:prod
```

The server will start at `http://localhost:3000` (or the `PORT` you configured).

---

## 📖 API Documentation

Swagger UI is available once the server is running:

```
http://localhost:3000/api/v1/docs
```

All endpoints, request/response schemas, and authentication flows are documented there.

---

## 🔐 Authentication Flow

This project uses **JWT access tokens** for stateless authentication:

1. **Login** → receive an **access token** (default expiry: `1d`).
2. Include it in the `Authorization: Bearer <token>` header on all protected routes.
3. Tokens are validated via `passport-jwt` and `@nestjs/passport`.

> **Note:** The current configuration uses a single access token. Refresh token support can be added by introducing `JWT_REFRESH_SECRET` and `JWT_REFRESH_EXPIRATION` variables.

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# Unit tests in watch mode
npm run test:watch

# End-to-end tests
npm run test:e2e

# Test coverage report
npm run test:cov
```

---

## 📁 Project Structure

```
social-media-backend/
├── src/                    # Application source code
│   ├── app.module.ts       # Root module
│   ├── main.ts             # Entry point (bootstraps NestJS app)
│   └── ...                 # Feature modules (users, auth, posts, etc.)
├── test/                   # E2E test files
├── .env.example            # Environment variable template
├── .prettierrc             # Prettier formatting config
├── eslint.config.mjs       # ESLint config
├── nest-cli.json           # NestJS CLI config
├── tsconfig.json           # TypeScript base config
└── tsconfig.build.json     # TypeScript build config
```

---

## 🧹 Code Quality

```bash
# Lint and auto-fix
npm run lint

# Format code with Prettier
npm run format
```

The project enforces consistent code style via ESLint (with Prettier integration) and TypeScript strict mode.

---

## 🔒 Security Features

- **Rate Limiting** — Redis-backed rate limiting guards against abuse (configurable via `RATE_LIMIT_TTL` and `RATE_LIMIT_MAX`).
- **Input Sanitization** — `sanitize-html` strips dangerous HTML from user input.
- **Password Hashing** — `bcrypt` is used for secure password storage.
- **JWT Secrets** — Access and refresh tokens use separate signing secrets to limit blast radius on key exposure.

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `@nestjs/mongoose` | MongoDB ODM integration |
| `@nestjs/jwt` + `passport-jwt` | JWT authentication |
| `@nestjs/swagger` | Auto-generated API docs |
| `@nestjs/throttler` | Request rate limiting |
| `@nestjs-modules/mailer` + `ejs` | Transactional email with HTML templates |
| `ioredis` | Redis client for caching/sessions |
| `bcrypt` | Password hashing |
| `class-validator` | DTO validation decorators |
| `sanitize-html` | HTML sanitization |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/<feature-name>`
3. Commit your changes: `git commit -m "feat: add <feature-name>"`
4. Push to the branch: `git push origin feat/<feature-name>`
5. Open a Pull Request

Please follow the existing branch naming convention (`feat/`, `fix/`, `chore/`).

---
