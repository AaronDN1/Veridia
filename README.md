# Veridia

Structuring AI to help you learn.

## Overview

Veridia is an AI-powered STEM learning workspace designed to support real academic workflows, not just generate answers. It helps users ask better questions, receive structured explanations, draft lab reports, and create clean graphs inside a focused interface built around clarity and usability.

## Screenshots

**Home Page**

![Home Page](docs/images/home-page.png)

**Application Interface**

![Application Interface](docs/images/application-interface.png)

## Features

- AI-powered STEM problem solving across subjects such as math, physics, chemistry, statistics, and related technical topics
- Structured, readable explanations designed to feel guided rather than generic
- Dedicated graphing workflow with downloadable outputs
- File uploads for prompt and lab workflows, including PDF, image, and text-based context
- Threaded AI conversations with recent and history views for continuity
- Lab Helper workflow for turning rough notes into stronger report drafts
- Feedback submission flow for product iteration
- Admin controls for user and feedback review
- Clean responsive interface with light and dark mode support

## Tech Stack

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion
- Backend: FastAPI, SQLAlchemy, PostgreSQL, Python
- AI: OpenAI API
- Analytics: PostHog
- Graphing and parsing: matplotlib, NumPy, PyPDF, Pillow
- Billing and auth: Stripe, Google Identity / Google Auth

## How It Works

1. A user submits a prompt, lab draft, or graphing request from the Veridia workspace.
2. The backend processes the request, attaches any uploaded context, and routes the task through the appropriate service.
3. OpenAI-generated output is structured and returned to the frontend for readable presentation.
4. For graphing and file-based workflows, Veridia can generate downloadable visual outputs or use uploaded materials to ground the response.

## Current Status

### Public Beta

Veridia is currently in a public beta phase. The product is actively being refined through testing, iteration, and user feedback, and features may continue to evolve as the platform matures.

## Deployment

### Frontend on Vercel

- Set `NEXT_PUBLIC_API_URL` to the public Render backend origin, for example `https://veridia-api.onrender.com`
- Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- Set `NEXT_PUBLIC_STRIPE_PRICE_ID`
- Set `NEXT_PUBLIC_BETA_FREE_MODE`

### Backend on Render

- Start command: `python -m app.main`
- The backend reads Render's runtime `PORT` automatically and binds to `0.0.0.0` outside development
- Set `ENVIRONMENT=production`
- Set `APP_URL` to the public Vercel frontend origin
- Set `API_URL` to the public Render backend origin
- Set `SECRET_KEY` to a strong random value
- Set `DATABASE_URL` to the externally hosted Postgres connection string
- Set `BACKEND_CORS_ORIGINS` to a comma-separated list of allowed frontend origins
- Set `GOOGLE_CLIENT_ID`
- Set `GOOGLE_CLIENT_SECRET`
- Set `OPENAI_API_KEY`
- Set `STRIPE_SECRET_KEY`
- Set `STRIPE_WEBHOOK_SECRET`
- Set `STRIPE_PRICE_ID`

### Session Cookies

- For Vercel-to-Render deployments, use `SESSION_COOKIE_SECURE=true` and `SESSION_COOKIE_SAMESITE=none`
- Leave `SESSION_COOKIE_DOMAIN` unset unless you intentionally need a shared parent-domain cookie
- Local development can continue using `SESSION_COOKIE_SECURE=false` and `SESSION_COOKIE_SAMESITE=lax`

### File Storage

- Veridia currently treats uploaded files and generated graphs as beta-stage filesystem assets stored under `STORAGE_ROOT`
- The default backend storage path is local and therefore ephemeral on Render unless you attach a persistent disk
- To use a Render disk later, point `STORAGE_ROOT` at the mounted disk path; `UPLOAD_DIR` and `GRAPHS_DIR` can stay under that root or be overridden explicitly
