<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Social Media Backend — README</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.0.0/dist/tabler-icons.min.css" />
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #ffffff;
    --bg-secondary: #f7f7f5;
    --bg-tertiary: #f0efea;
    --text-primary: #1a1a18;
    --text-secondary: #6b6b67;
    --text-tertiary: #9e9e9a;
    --border: rgba(0,0,0,0.1);
    --border-md: rgba(0,0,0,0.18);
    --radius-md: 8px;
    --radius-lg: 12px;
    --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --font-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #1c1c1a;
      --bg-secondary: #252523;
      --bg-tertiary: #2e2e2b;
      --text-primary: #e8e8e2;
      --text-secondary: #9a9a94;
      --text-tertiary: #6a6a66;
      --border: rgba(255,255,255,0.1);
      --border-md: rgba(255,255,255,0.18);
    }
  }

  body {
    font-family: var(--font-sans);
    background: var(--bg-tertiary);
    color: var(--text-primary);
    font-size: 15px;
    line-height: 1.6;
    min-height: 100vh;
    padding: 2rem 1rem;
  }

  .container {
    max-width: 860px;
    margin: 0 auto;
    background: var(--bg);
    border-radius: var(--radius-lg);
    border: 0.5px solid var(--border);
    padding: 2rem 2.5rem;
  }

  .header { margin-bottom: 1.5rem; }
  .header h1 { font-size: 22px; font-weight: 500; margin-bottom: 6px; }
  .header p { font-size: 14px; color: var(--text-secondary); line-height: 1.6; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
  .pill { display: inline-block; font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px; border: 0.5px solid var(--border); color: var(--text-secondary); background: var(--bg-secondary); }

  nav { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 1.75rem; padding-bottom: 1rem; border-bottom: 0.5px solid var(--border); }
  nav button {
    background: transparent;
    border: 0.5px solid var(--border-md);
    border-radius: var(--radius-md);
    padding: 6px 14px;
    font-size: 13px;
    cursor: pointer;
    color: var(--text-secondary);
    font-family: var(--font-sans);
    transition: all .15s;
    display: flex; align-items: center; gap: 6px;
  }
  nav button:hover { background: var(--bg-secondary); color: var(--text-primary); }
  nav button.active { background: var(--bg-secondary); color: var(--text-primary); border-color: var(--border-md); font-weight: 500; }

  .section { display: none; }
  .section.active { display: block; }
  .section-title { font-size: 16px; font-weight: 500; margin-bottom: 1rem; }

  .badge { display: inline-block; font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 20px; line-height: 1.6; }
  .b-post { background: #dbeafe; color: #1e40af; }
  .b-get  { background: #dcfce7; color: #166534; }
  .b-patch{ background: #fef3c7; color: #92400e; }
  .b-delete{background: #fee2e2; color: #991b1b; }
  .b-pub  { background: #f1f0e8; color: #5f5e5a; }
  .b-auth { background: #ede9fe; color: #4c1d95; }

  @media (prefers-color-scheme: dark) {
    .b-post { background: #1e3a5f; color: #93c5fd; }
    .b-get  { background: #14532d; color: #86efac; }
    .b-patch{ background: #451a03; color: #fcd34d; }
    .b-delete{background: #450a0a; color: #fca5a5; }
    .b-pub  { background: #2c2c2a; color: #9a9a94; }
    .b-auth { background: #2e1065; color: #c4b5fd; }
  }

  .feat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; }
  .feat-card { background: var(--bg-secondary); border: 0.5px solid var(--border); border-radius: var(--radius-lg); padding: 12px 14px; }
  .feat-card i { font-size: 20px; margin-bottom: 8px; display: block; }
  .feat-card .fc-title { font-size: 13px; font-weight: 500; margin-bottom: 4px; }
  .feat-card .fc-body { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }

  .stack-table { background: var(--bg-secondary); border: 0.5px solid var(--border); border-radius: var(--radius-lg); padding: 4px 16px; }
  .stack-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 0; border-bottom: 0.5px solid var(--border); font-size: 14px; }
  .stack-row:last-child { border-bottom: none; }
  .stack-row .layer { color: var(--text-secondary); font-size: 13px; min-width: 150px; }
  .stack-row .tech { font-weight: 500; }
  .stack-row a { font-size: 12px; color: var(--text-secondary); text-decoration: none; }
  .stack-row a:hover { color: var(--text-primary); }

  .ep-group-label { font-size: 11px; font-weight: 500; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .05em; padding: 14px 0 6px; border-top: 0.5px solid var(--border); margin-top: 4px; }
  .ep-group-label:first-child { border-top: none; padding-top: 0; }
  .endpoint-row { display: grid; grid-template-columns: 64px 68px 1fr 20px; gap: 10px; align-items: center; padding: 10px 0; border-bottom: 0.5px solid var(--border); cursor: pointer; }
  .endpoint-row:last-of-type { border-bottom: none; }
  .endpoint-row:hover .ep-path { color: var(--text-primary); }
  .ep-path { font-family: var(--font-mono); font-size: 13px; color: var(--text-secondary); word-break: break-all; }
  .chevron { font-size: 14px; color: var(--text-tertiary); transition: transform .2s; }
  .endpoint-row.open .chevron { transform: rotate(180deg); }
  .detail-box { background: var(--bg-secondary); border-radius: var(--radius-lg); padding: 1rem 1.25rem; margin-bottom: 4px; border: 0.5px solid var(--border); display: none; }
  .detail-box.open { display: block; }
  .detail-box p { font-size: 13px; }
  .detail-box pre { font-family: var(--font-mono); font-size: 12px; background: var(--bg); border: 0.5px solid var(--border); border-radius: var(--radius-md); padding: 12px; overflow-x: auto; line-height: 1.6; white-space: pre-wrap; }
  .detail-label { font-size: 11px; font-weight: 500; color: var(--text-secondary); margin-bottom: 6px; margin-top: 12px; text-transform: uppercase; letter-spacing: .05em; }
  .detail-label:first-child { margin-top: 0; }

  .env-header { display: grid; grid-template-columns: 1.1fr 1.4fr 1fr; gap: 8px; padding: 6px 0; border-bottom: 0.5px solid var(--border-md); font-size: 11px; font-weight: 500; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 4px; }
  .env-wrap { background: var(--bg-secondary); border: 0.5px solid var(--border); border-radius: var(--radius-lg); padding: 4px 16px; }
  .env-row { display: grid; grid-template-columns: 1.1fr 1.4fr 1fr; gap: 8px; padding: 8px 0; border-bottom: 0.5px solid var(--border); font-size: 13px; align-items: start; }
  .env-row:last-child { border-bottom: none; }
  .env-row .var { font-family: var(--font-mono); font-size: 12px; color: #1d6dae; word-break: break-all; }
  @media (prefers-color-scheme: dark) { .env-row .var { color: #60a5fa; } }
  .env-row .desc { color: var(--text-secondary); }
  .env-row .def { font-family: var(--font-mono); font-size: 12px; color: var(--text-secondary); }

  .tree-wrap { background: var(--bg-secondary); border: 0.5px solid var(--border); border-radius: var(--radius-lg); padding: 14px 16px; }
  .tree { font-family: var(--font-mono); font-size: 12px; line-height: 1.9; color: var(--text-secondary); }
  .tree .dir { color: var(--text-primary); font-weight: 500; }
  .tree .cmt { color: var(--text-tertiary); }

  .cmd-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 9px 14px; background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: 6px; border: 0.5px solid var(--border); }
  .cmd-row code { font-family: var(--font-mono); font-size: 13px; }
  .cmd-row .purpose { font-size: 12px; color: var(--text-secondary); flex: 1; text-align: right; }
  .copy-btn { font-size: 12px; border: 0.5px solid var(--border-md); background: var(--bg); border-radius: 6px; padding: 4px 10px; cursor: pointer; color: var(--text-secondary); font-family: var(--font-sans); white-space: nowrap; display: flex; align-items: center; gap: 4px; transition: background .15s; }
  .copy-btn:hover { background: var(--bg-tertiary); }

  code { font-family: var(--font-mono); font-size: 12px; background: var(--bg-secondary); padding: 1px 5px; border-radius: 4px; border: 0.5px solid var(--border); }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Social Media Backend</h1>
    <p>A production-ready RESTful backend for a social media application built with NestJS, MongoDB, and Redis. Covers the full user lifecycle — registration, email verification, JWT authentication, profile onboarding, and account management.</p>
    <div class="badges">
      <span class="pill">NestJS v11</span>
      <span class="pill">TypeScript 5.7</span>
      <span class="pill">MongoDB</span>
      <span class="pill">Redis</span>
      <span class="pill">Swagger</span>
      <span class="pill">JWT Auth</span>
    </div>
  </div>

  <nav>
    <button class="active" onclick="show('features',this)"><i class="ti ti-star"></i> Features</button>
    <button onclick="show('stack',this)"><i class="ti ti-stack-2"></i> Tech stack</button>
    <button onclick="show('api',this)"><i class="ti ti-api"></i> API reference</button>
    <button onclick="show('env',this)"><i class="ti ti-settings"></i> Env vars</button>
    <button onclick="show('structure',this)"><i class="ti ti-folder"></i> Project structure</button>
    <button onclick="show('scripts',this)"><i class="ti ti-terminal"></i> Scripts</button>
  </nav>

  <!-- FEATURES -->
  <div id="features" class="section active">
    <p class="section-title">Features</p>
    <div class="feat-grid" id="feat-grid"></div>
  </div>

  <!-- STACK -->
  <div id="stack" class="section">
    <p class="section-title">Tech stack</p>
    <div class="stack-table" id="stack-table"></div>
  </div>

  <!-- API -->
  <div id="api" class="section">
    <p class="section-title">API reference</p>
    <p style="font-size:13px;color:var(--text-secondary);margin-bottom:1rem">All endpoints prefixed <code>/api/v1</code>. Protected endpoints require <code>Authorization: Bearer &lt;token&gt;</code>. Click a row to expand.</p>
    <div class="ep-group-label">Auth</div>
    <div id="ep-auth"></div>
    <div class="ep-group-label">Users &amp; Profiles</div>
    <div id="ep-users"></div>
  </div>

  <!-- ENV -->
  <div id="env" class="section">
    <p class="section-title">Environment variables</p>
    <p style="font-size:13px;color:var(--text-secondary);margin-bottom:1rem">Copy <code>.env.example</code> to <code>.env</code> and fill in your values.</p>
    <div class="env-wrap">
      <div class="env-header"><span>Variable</span><span>Description</span><span>Default</span></div>
      <div id="env-list"></div>
    </div>
  </div>

  <!-- STRUCTURE -->
  <div id="structure" class="section">
    <p class="section-title">Project structure</p>
    <div class="tree-wrap"><div class="tree" id="tree"></div></div>
  </div>

  <!-- SCRIPTS -->
  <div id="scripts" class="section">
    <p class="section-title">Scripts</p>
    <div id="scripts-list"></div>
  </div>
</div>

<script>
const features = [
  { icon: 'ti-user-plus', color: '#1d6dae', title: 'Registration', body: 'Email + username uniqueness enforced with strong password rules (uppercase, lowercase, digit/special char, 8–32 chars).' },
  { icon: 'ti-mail-check', color: '#166534', title: 'Email verification', body: '6-digit OTP sent via Nodemailer using EJS templates. Resend endpoint included.' },
  { icon: 'ti-shield-lock', color: '#4c1d95', title: 'JWT authentication', body: 'Stateless access tokens. Redis blacklisting on logout and deactivation.' },
  { icon: 'ti-key', color: '#92400e', title: 'Password management', body: 'Forgot / reset (1-hour token) and in-session change password flows.' },
  { icon: 'ti-id-badge', color: '#1d6dae', title: 'Profile onboarding', body: 'Separate Profile model — name, bio, avatar, interests, and social links (Twitter, Instagram, LinkedIn, website).' },
  { icon: 'ti-user-off', color: '#991b1b', title: 'Account lifecycle', body: 'Soft-delete (permanent, partial unique indexes) and temporary deactivation with auto-reactivation on login.' },
  { icon: 'ti-search', color: '#166534', title: 'User search', body: 'MongoDB aggregation across username and full name with regex matching. Returns up to 10 results.' },
  { icon: 'ti-world', color: '#1d6dae', title: 'Public profile view', body: 'Unauthenticated endpoint to view any active user\'s public profile by username.' },
  { icon: 'ti-traffic-cone', color: '#92400e', title: 'Rate limiting', body: 'Redis-backed IP-level guard with configurable TTL (ms) and max requests per window.' },
  { icon: 'ti-shield-check', color: '#4c1d95', title: 'Input sanitization', body: 'Global SanitizePipe strips XSS vectors from all string fields using sanitize-html.' },
  { icon: 'ti-book', color: '#1d6dae', title: 'Swagger UI', body: 'Auto-generated API docs with bearer auth at /docs.' },
  { icon: 'ti-transform', color: '#5f5e5a', title: 'Standard responses', body: 'TransformInterceptor wraps all responses: { statusCode, message, data }.' },
];

const stack = [
  { layer: 'Framework', tech: 'NestJS v11', url: 'https://nestjs.com/' },
  { layer: 'Language', tech: 'TypeScript 5.7', url: '' },
  { layer: 'Database', tech: 'MongoDB via Mongoose v9', url: 'https://mongoosejs.com/' },
  { layer: 'Cache / Session', tech: 'Redis via ioredis v5', url: 'https://github.com/redis/ioredis' },
  { layer: 'Authentication', tech: 'Passport.js (Local + JWT strategies)', url: '' },
  { layer: 'Validation', tech: 'class-validator + class-transformer', url: '' },
  { layer: 'Mail', tech: '@nestjs-modules/mailer + Nodemailer + EJS', url: '' },
  { layer: 'API docs', tech: 'Swagger (@nestjs/swagger)', url: '' },
  { layer: 'Testing', tech: 'Jest + Supertest', url: '' },
  { layer: 'Linting', tech: 'ESLint + Prettier', url: '' },
];

const authEndpoints = [
  { method: 'POST', path: '/auth/register', auth: 'public', desc: 'Register a new user — sends a 6-digit OTP to the email.', body: '{\n  "email": "user@example.com",\n  "username": "johndoe",\n  "password": "Password123!"\n}', notes: 'Username: 3–20 chars, alphanumeric + underscores only. Password: 8–32 chars, requires uppercase, lowercase, and a digit or special char.', response: '{\n  "statusCode": 201,\n  "message": "Success",\n  "data": {\n    "message": "Registration successful. Please verify your email.",\n    "userId": "<objectId>"\n  }\n}' },
  { method: 'POST', path: '/auth/login', auth: 'public', desc: 'Authenticate — returns JWT and profile completion status.', body: '{\n  "email": "user@example.com",\n  "password": "Password123!"\n}', notes: 'Email must be verified. Deactivated accounts are automatically reactivated on successful login.', response: '{\n  "statusCode": 200,\n  "message": "Success",\n  "data": {\n    "user": { "id": "...", "email": "user@example.com", "username": "johndoe", "isProfileComplete": false },\n    "accessToken": "<jwt>"\n  }\n}' },
  { method: 'POST', path: '/auth/logout', auth: 'bearer', desc: 'Blacklists the current JWT in Redis for its remaining TTL.', body: null, notes: 'Send the token in the Authorization header. No request body needed.', response: '{\n  "statusCode": 200,\n  "message": "Success",\n  "data": { "message": "Logged out successfully" }\n}' },
  { method: 'POST', path: '/auth/verify-email', auth: 'public', desc: 'Verify email address using the 6-digit OTP from the registration email.', body: '{\n  "email": "user@example.com",\n  "token": "482910"\n}', notes: 'Use /auth/resend-verification if the OTP expires.', response: '{\n  "data": { "message": "Email verified successfully" }\n}' },
  { method: 'POST', path: '/auth/resend-verification', auth: 'public', desc: 'Resend the OTP verification email.', body: '{\n  "email": "user@example.com"\n}', notes: 'Only works if the email is not yet verified.', response: '{\n  "data": { "message": "Verification token resent" }\n}' },
  { method: 'POST', path: '/auth/forgot-password', auth: 'public', desc: 'Send a password reset token to the registered email. Token expires in 1 hour.', body: '{\n  "email": "user@example.com"\n}', notes: 'Reset token is an 8-character alphanumeric string stored with a 1-hour expiry.', response: '{\n  "data": { "message": "Password reset token sent to email" }\n}' },
  { method: 'POST', path: '/auth/reset-password', auth: 'public', desc: 'Reset password using the token received by email.', body: '{\n  "token": "abc12xyz",\n  "newPassword": "NewPass456!"\n}', notes: 'Token must not be expired. Cleared from DB on success.', response: '{\n  "data": { "message": "Password reset successful" }\n}' },
  { method: 'PATCH', path: '/auth/change-password', auth: 'bearer', desc: 'Change password while authenticated. Requires the current password.', body: '{\n  "oldPassword": "Password123!",\n  "newPassword": "NewPass456!"\n}', notes: 'Same validation rules as registration apply to the new password.', response: '{\n  "data": { "message": "Password changed successfully" }\n}' },
];

const userEndpoints = [
  { method: 'POST', path: '/users/profile', auth: 'bearer', desc: 'Create the authenticated user\'s profile (onboarding step).', body: '{\n  "fullName": "John Doe",\n  "bio": "Software engineer",\n  "avatarUrl": "https://example.com/avatar.jpg",\n  "interests": ["coding","music"],\n  "socialLinks": {\n    "twitter": "https://twitter.com/johndoe",\n    "linkedin": "https://linkedin.com/in/johndoe"\n  }\n}', notes: 'Sets isComplete: true on the profile document.', response: '{ "data": { "fullName": "John Doe", "isComplete": true, ... } }' },
  { method: 'GET', path: '/users/me', auth: 'bearer', desc: 'Fetch the full profile of the authenticated user.', body: null, notes: 'Populates userId with username and email from the User collection.', response: '{ "data": { "fullName": "John Doe", "bio": "...", "avatarUrl": null, "interests": [...] } }' },
  { method: 'PATCH', path: '/users/me', auth: 'bearer', desc: 'Update the authenticated user\'s profile fields.', body: '{\n  "bio": "Updated bio text"\n}', notes: 'All fields are optional. Partial updates supported.', response: '{ "data": { "fullName": "John Doe", "bio": "Updated bio text", ... } }' },
  { method: 'DELETE', path: '/users/me', auth: 'bearer', desc: 'Permanently soft-delete the account (sets deletedAt, isActive: false).', body: null, notes: 'Partial unique indexes on email and username allow re-registration after deletion.', response: '{ "data": { ... } }' },
  { method: 'POST', path: '/users/me/avatar', auth: 'bearer', desc: 'Set or update the avatar URL on the profile.', body: '{\n  "avatarUrl": "https://example.com/new-avatar.jpg"\n}', notes: 'Must be a valid URL.', response: '{ "data": { "avatarUrl": "https://example.com/new-avatar.jpg", ... } }' },
  { method: 'DELETE', path: '/users/me/avatar', auth: 'bearer', desc: 'Remove the avatar (sets avatarUrl to null).', body: null, notes: 'Only clears the URL field — does not delete any actual image file.', response: '{ "data": { "avatarUrl": null, ... } }' },
  { method: 'GET', path: '/users/search?query=', auth: 'bearer', desc: 'Search active users by username or full name using regex.', body: null, notes: 'MongoDB aggregation pipeline joining users and profiles. Returns up to 10 results.', response: '{ "data": [{ "username": "johndoe", "fullName": "John Doe", "avatarUrl": null }] }' },
  { method: 'GET', path: '/users/:username', auth: 'public', desc: 'View any active user\'s public profile by username.', body: null, notes: 'Only returns profiles of active, non-deleted users. Excludes isComplete and internal fields.', response: '{ "data": { "fullName": "John Doe", "bio": "...", "interests": [...], "socialLinks": {...} } }' },
  { method: 'POST', path: '/users/deactivate', auth: 'bearer', desc: 'Temporarily deactivate the account and blacklist the current token.', body: null, notes: 'Auto-reactivated on next successful login.', response: '{ "data": { "isActive": false, "deactivatedAt": "2024-01-01T00:00:00.000Z" } }' },
];

const envVars = [
  { v: 'PORT', d: 'HTTP server port', def: '3000' },
  { v: 'NODE_ENV', d: 'Environment mode', def: 'development' },
  { v: 'API_PREFIX', d: 'Global route prefix', def: 'api/v1' },
  { v: 'MONGODB_URI', d: 'MongoDB connection string', def: 'mongodb://localhost:27017/social-media-db' },
  { v: 'JWT_ACCESS_SECRET', d: 'JWT signing secret key', def: '—' },
  { v: 'JWT_ACCESS_EXPIRATION', d: 'Token expiry (e.g. 1d, 12h)', def: '1d' },
  { v: 'RATE_LIMIT_TTL', d: 'Rate limit window in milliseconds', def: '60000' },
  { v: 'RATE_LIMIT_MAX', d: 'Max requests per IP per window', def: '10' },
  { v: 'REDIS_HOST', d: 'Redis host', def: 'localhost' },
  { v: 'REDIS_PORT', d: 'Redis port', def: '6379' },
  { v: 'MAIL_HOST', d: 'SMTP server host', def: 'smtp.ethereal.email' },
  { v: 'MAIL_PORT', d: 'SMTP port', def: '587' },
  { v: 'MAIL_USER', d: 'SMTP username', def: '—' },
  { v: 'MAIL_PASS', d: 'SMTP password', def: '—' },
  { v: 'MAIL_FROM', d: 'Sender address', def: 'noreply@socialapp.com' },
];

const treeLines = [
  { t: 'dir', text: 'src/' },
  { text: '├── app.module.ts', c: 'Root module — wires all modules' },
  { text: '├── main.ts', c: 'Bootstrap: Swagger, CORS, global prefix' },
  { t: 'dir', text: '├── config/' },
  { text: '│   └── app.config.ts · jwt.config.ts · mongo.config.ts' },
  { t: 'dir', text: '├── database/' },
  { text: '│   ├── database.module.ts', c: 'Mongoose connection setup' },
  { text: '│   └── redis.service.ts', c: 'get/set/del + token blacklisting' },
  { t: 'dir', text: '├── common/' },
  { text: '│   ├── decorators/', c: '@CurrentUser(), @Public()' },
  { text: '│   ├── filters/', c: 'HttpExceptionFilter, MongoExceptionFilter' },
  { text: '│   ├── guards/', c: 'RateLimitGuard (Redis-backed IP limiter)' },
  { text: '│   ├── interceptors/', c: 'TransformInterceptor — standard response envelope' },
  { text: '│   └── pipes/', c: 'SanitizePipe — strips XSS from all string inputs' },
  { t: 'dir', text: '└── modules/' },
  { t: 'dir', text: '    ├── auth/' },
  { text: '    │   ├── auth.controller.ts · auth.service.ts · auth.module.ts' },
  { text: '    │   ├── dto/', c: 'register, login, verify-email, forgot/reset/change-password' },
  { text: '    │   ├── guards/', c: 'JwtAuthGuard (blacklist check), LocalAuthGuard' },
  { text: '    │   └── strategies/', c: 'jwt.strategy.ts, local.strategy.ts' },
  { t: 'dir', text: '    ├── users/' },
  { text: '    │   ├── users.controller.ts · users.service.ts · users.module.ts' },
  { text: '    │   ├── users.repository.ts', c: 'All DB queries — User and Profile models' },
  { text: '    │   ├── dto/', c: 'create-profile, update-profile, update-avatar, search-user' },
  { text: '    │   ├── guards/', c: 'ProfileCompleteGuard' },
  { text: '    │   └── schemas/', c: 'user.schema.ts (auth state), profile.schema.ts (public data)' },
  { t: 'dir', text: '    └── mail/' },
  { text: '        ├── mail.service.ts · mail.module.ts' },
  { text: '        └── templates/', c: 'verification.ejs, reset-password.ejs' },
];

const scripts = [
  { cmd: 'npm run start:dev', purpose: 'Start in watch / dev mode' },
  { cmd: 'npm run start:prod', purpose: 'Run compiled production build' },
  { cmd: 'npm run build', purpose: 'Compile TypeScript to dist/' },
  { cmd: 'npm run format', purpose: 'Format source files with Prettier' },
  { cmd: 'npm run lint', purpose: 'Lint and auto-fix with ESLint' },
  { cmd: 'npm test', purpose: 'Run unit tests' },
  { cmd: 'npm run test:cov', purpose: 'Unit tests with coverage report' },
  { cmd: 'npm run test:e2e', purpose: 'Run end-to-end tests' },
];

// Render features
const fg = document.getElementById('feat-grid');
features.forEach(f => {
  fg.innerHTML += `<div class="feat-card"><i class="ti ${f.icon}" style="color:${f.color}"></i><div class="fc-title">${f.title}</div><div class="fc-body">${f.body}</div></div>`;
});

// Render stack
const st = document.getElementById('stack-table');
stack.forEach(s => {
  st.innerHTML += `<div class="stack-row"><span class="layer">${s.layer}</span><span class="tech">${s.tech}</span>${s.url ? `<a href="${s.url}" target="_blank"><i class="ti ti-external-link"></i></a>` : '<span></span>'}</div>`;
});

// Render endpoints
function methodBadge(m) { const map = { POST: 'b-post', GET: 'b-get', PATCH: 'b-patch', DELETE: 'b-delete' }; return `<span class="badge ${map[m]}">${m}</span>`; }
function authBadge(a) { return a === 'bearer' ? '<span class="badge b-auth"><i class="ti ti-lock" style="font-size:10px"></i> Bearer</span>' : '<span class="badge b-pub">Public</span>'; }

function renderEndpoints(data, containerId) {
  const c = document.getElementById(containerId);
  data.forEach((ep, i) => {
    const row = document.createElement('div');
    row.className = 'endpoint-row';
    row.innerHTML = `${methodBadge(ep.method)}${authBadge(ep.auth)}<span class="ep-path">${ep.path}</span><i class="ti ti-chevron-down chevron"></i>`;
    const det = document.createElement('div');
    det.className = 'detail-box';
    let html = `<div class="detail-label">Description</div><p>${ep.desc}</p>`;
    if (ep.notes) html += `<div class="detail-label">Notes</div><p style="font-size:12px;color:var(--text-secondary)">${ep.notes}</p>`;
    if (ep.body) html += `<div class="detail-label">Request body</div><pre>${ep.body}</pre>`;
    html += `<div class="detail-label">Example response</div><pre>${ep.response}</pre>`;
    det.innerHTML = html;
    row.onclick = () => { const open = det.classList.toggle('open'); row.classList.toggle('open', open); };
    c.appendChild(row);
    c.appendChild(det);
  });
}

renderEndpoints(authEndpoints, 'ep-auth');
renderEndpoints(userEndpoints, 'ep-users');

// Render env vars
const el = document.getElementById('env-list');
envVars.forEach(e => {
  el.innerHTML += `<div class="env-row"><span class="var">${e.v}</span><span class="desc">${e.d}</span><span class="def">${e.def}</span></div>`;
});

// Render tree
const tr = document.getElementById('tree');
treeLines.forEach(l => {
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;align-items:baseline;gap:8px';
  const code = document.createElement('span');
  code.className = l.t === 'dir' ? 'dir' : '';
  code.textContent = l.text;
  row.appendChild(code);
  if (l.c) { const cm = document.createElement('span'); cm.className = 'cmt'; cm.textContent = '# ' + l.c; row.appendChild(cm); }
  tr.appendChild(row);
});

// Render scripts
const sl = document.getElementById('scripts-list');
scripts.forEach(s => {
  const row = document.createElement('div');
  row.className = 'cmd-row';
  row.innerHTML = `<code>${s.cmd}</code><span class="purpose">${s.purpose}</span><button class="copy-btn" onclick="copyCmd(this,'${s.cmd}')"><i class="ti ti-copy"></i> Copy</button>`;
  sl.appendChild(row);
});

function copyCmd(btn, text) {
  navigator.clipboard.writeText(text).then(() => {
    btn.innerHTML = '<i class="ti ti-check"></i> Copied!';
    setTimeout(() => { btn.innerHTML = '<i class="ti ti-copy"></i> Copy'; }, 1500);
  });
}

function show(id, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  btn.classList.add('active');
}
</script>
</body>
</html>
