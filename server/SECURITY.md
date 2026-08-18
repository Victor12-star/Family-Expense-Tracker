# 🔐 Family Finance — Security Architecture

> **Guiding principle:** *Never trust user input. Defend in depth. Assume the database will eventually be compromised — design so that even a leaked database doesn't expose user data.*

This document explains every security measure in the backend and how to extend them.

---

## 1. 🛡️ Core Security Measures (implemented)

### Authentication
- **bcrypt password hashing** (cost factor 12) — passwords are never stored in plaintext. Even if the DB leaks, passwords remain unusable.
- **JWT access tokens** — short-lived (15 min default), signed with a secret, with `sub`, `issuer`, `audience`, and a unique `jwtid`.
- **JWT refresh tokens** — long-lived (30 days), signed with a *different* secret, rotated on every refresh.
- **Refresh token hashing** — only a SHA-256 hash of the refresh token is stored in the DB, never the raw token. A leaked DB doesn't expose usable refresh tokens.
- **Refresh token rotation & revocation** — each refresh revokes the old token and issues a new one (detects token reuse).
- **Generic login errors** — the app returns the same message whether the email doesn't exist or the password is wrong, preventing **user enumeration**.

### Transport & Headers
- **HTTPS** — enforced in production (via hosting). No plaintext traffic.
- **Helmet** — sets secure HTTP headers (CSP, `X-Content-Type-Options`, `X-Frame-Options` (anti-clickjacking), `Referrer-Policy`, HSTS in prod).
- **HSTS** — in production, browsers are told to only use HTTPS.

### Rate Limiting (brute-force protection)
- **Global limiter** — all routes limited per IP (default 100 req / 15 min).
- **Auth limiter** — login/register limited harder (20 req / 15 min).
- Prevents brute-force password guessing and DoS.

### Input Validation & Injection
- **express-validator** — every input is validated & sanitized *before* reaching the controller.
- **Password policy** — min 8 chars, upper/lowercase + number.
- **Body size limit** (100kb) — prevents oversized-payload abuse.
- **Parameterized queries** (via Prisma ORM) — prevents **SQL injection**.

### CORS & CSRF
- **Strict CORS** — only the trusted frontend origin can call the API. Blocks cross-origin requests (a core CSRF defense).
- **Credentials** allowed only for the configured origin.
- **SameSite cookies** (when cookies are used) — adds CSRF protection.

### Error Handling
- **Central error handler** — never leaks stack traces or internal details to the client.
- **Production hides internal errors** (returns generic "Internal server error").
- **Structured logging** — real bugs are logged server-side only.

---

## 2. 🧱 Defense-in-Depth Layers

| Layer | What it does |
|-------|--------------|
| **Network** | HTTPS, HSTS, trusted proxy |
| **HTTP** | Helmet headers, CORS policy, body limits |
| **Transport** | Short-lived access tokens, rate limiting |
| **Application** | Input validation, parameterized queries, role-based access |
| **Auth** | bcrypt, JWT, token rotation, hashed refresh tokens |
| **Data** | Password/refresh-token hashing (leak-resilient), per-user privacy flags |
| **Ops** | Secrets in env vars (never committed), .gitignore for `.env` |

---

## 3. 🔑 Secret Management

- All secrets live in **`.env`** (git-ignored) — never committed.
- Copy `.env.example` → `.env`, fill real values.
- In **production**, use your host's secret manager (Render/Railway env vars, or AWS Secrets Manager).
- **JWT secrets** must be long random strings. Generate with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- The app **refuses to start in production** if secrets are still placeholders.

---

## 4. 🗄️ Database Leak-Resilience

If the PostgreSQL database is ever compromised:
- ✅ Passwords → **bcrypt hashes** (extremely hard to crack)
- ✅ Refresh tokens → **SHA-256 hashes** (raw tokens unusable)
- ✅ Access tokens → not stored at all
- ✅ No sensitive data beyond user profile (name/email)

This is the "assume breach" philosophy — the most sensitive things are stored hashed.

---

## 5. ⚙️ To Run Locally

```bash
cd backend
npm install
cp .env.example .env   # fill DATABASE_URL + secrets
npx prisma migrate dev # create tables
npm run dev
```

---

## 6. 🚧 Security To Add in Later Milestones

These are queued for the appropriate milestone:

- **Email verification** — confirm email ownership at registration (M1 finalize).
- **Password reset tokens** — short-lived, single-use, hashed (M1 finalize).
- **Account lockout / gradual backoff** — on repeated failed logins (M2).
- **Role-based access control** — enforce OWNER/ADMIN/MEMBER in controllers (M4).
- **CSRF protection for cookie-based sessions** (if we move auth to cookies).
- **Audit logging** — log auth events, family changes (M8).
- **Helmet CSP hardening** — tighten CSP once React build is known (M1 finalize).
- **Security headers on the frontend hosting** too.
- **Row-level security (RLS)** in Supabase for direct DB access.
- **Web Application Firewall (WAF)** — e.g. Cloudflare, in production.
- **Rate limiting per-user** (beyond per-IP).
- **HTTPS-only cookies** + `__Host-` prefix if using cookies.

---

## 7. ✅ Security Checklist

- [x] bcrypt password hashing
- [x] JWT access + refresh tokens (different secrets)
- [x] Refresh token rotation + hashed storage
- [x] Generic login errors (no user enumeration)
- [x] Helmet security headers
- [x] Strict CORS
- [x] Rate limiting (global + auth)
- [x] Input validation & sanitization
- [x] Parameterized queries (SQL-injection safe)
- [x] Body size limits
- [x] Central error handler (no info leak)
- [x] Secrets via .env (git-ignored)
- [x] Production refuses placeholder secrets
- [ ] Email verification *(M1 finalize)*
- [ ] Password reset *(M1 finalize)*
- [ ] RBAC enforcement *(M4)*
- [ ] Audit logging *(M8)*

---

*Security documentation — Family Finance app.*
