# Family Expense Tracker

A full-stack family and personal expense-tracking application built with React, Vite, Node.js, Express, PostgreSQL, Prisma and Socket.IO.

## Current deployment

- Frontend: Vercel
- Backend API: Render
- PostgreSQL: Supabase
- Source control: GitHub

## Repository structure

```text
Family-Expense-Tracker/
├── client/                 React + Vite frontend
│   ├── public/
│   └── src/
├── server/                 Express + Prisma backend
│   ├── prisma/
│   └── src/
├── README.md
└── SECURITY.md
```

## Requirements

- Node.js 18 or newer
- npm
- PostgreSQL database

## Local development

### Backend

```bash
cd server
npm install
cp .env.example .env
npx prisma generate
npm run dev
```

Fill the local `.env` with your own database URL and JWT secrets. Never commit the real `.env` file.

### Frontend

```bash
cd client
npm install
npm run dev
```

Vite normally starts the frontend at `http://localhost:5173`.

## Production configuration

The frontend and backend use environment-specific configuration. Production secrets belong in the hosting provider's environment-variable settings, not in source control.

Before a production release:

1. Back up the production database.
2. Test migrations against a staging database first.
3. Run the client build.
4. Validate and generate Prisma Client.
5. Test authentication, family authorisation, expenses, shopping, reminders and chat.
6. Deploy the backend before the frontend when an API/schema change requires it.
7. Run a production smoke test after deployment.

## Security

Read [SECURITY.md](./SECURITY.md) for the current security posture and the remaining work required before a wider public launch.

## Status

The application is undergoing a production-readiness cleanup. Existing working features are being preserved while security, Family/Single data separation, financial integration, media handling, accessibility and responsive UI are strengthened.
