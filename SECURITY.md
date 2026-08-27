# Security

This document describes the security posture of the Family Expense Tracker repository. It intentionally distinguishes between controls that are already implemented and work that is still required. It is not a security certification.

## Implemented foundations

The backend currently includes:

- bcrypt password hashing
- short-lived JWT access tokens
- refresh-token rotation and hashed refresh-token storage
- Helmet HTTP security headers
- CORS configuration
- request rate limiting
- request validation on multiple API routes
- Prisma parameterised database access
- centralised API error handling
- secrets loaded from environment variables
- `.env` files excluded from Git

## Production-readiness work in progress

The following items must be completed or re-audited before treating the service as broadly public-ready:

- enforce family membership on every family-scoped API request
- enforce family membership on every Socket.IO family room/event
- enforce clear Family versus Single data ownership boundaries
- verify role/owner permissions for destructive family actions
- repair complete refresh-token revocation during logout
- protect uploaded chat media and documents with authenticated access
- move large chat media out of database message text and into private object storage
- validate upload type and size on the server
- add secure password-reset and email-verification flows
- add privacy/data export and account-deletion workflows
- review logging so secrets, tokens and private user content are not logged
- add automated authorisation/security regression tests
- review Supabase, Render and Vercel production settings before launch

## Secret management

Never commit real values for:

- `DATABASE_URL`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- storage/service credentials
- email-provider credentials
- third-party API secrets

Use `server/.env.example` as the template and configure real values in local `.env` files or the hosting provider's secret/environment settings.

If a secret is accidentally committed or shared, remove it from use and rotate it. Deleting the text from the latest commit is not enough once a secret has been exposed.

## Reporting a vulnerability

Do not publish credentials, private user data or exploitable details in a public issue. Use the project's private support/security contact once that address is configured for the public release.
