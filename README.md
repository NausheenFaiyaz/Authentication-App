# FreeAPI Authentication App

A polished authentication project built with **HTML, CSS, Vanilla JavaScript, and Node.js (Express)** using the **FreeAPI Users module**.

This app demonstrates a complete frontend auth flow:
- Register user
- Login user
- Logout user
- Get current user
- Token refresh handling through backend proxy

It also includes:
- A custom UI inspired by a hand-drawn card style
- Form validation and clear error messaging
- Loading states and session-aware user panel
- A backend proxy to avoid CORS issues in browser

---

## Live Project Goal

Build and submit:
1. A hosted working app link
2. A public GitHub repository link

---

## Tech Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend Proxy:** Node.js + Express
- **Session Handling:** HTTP-only cookies (`accessToken`, `refreshToken`)
- **Upstream API:** `https://api.freeapi.app/api/v1/users`

---

## Why a Node.js Proxy is Used

Direct browser calls to FreeAPI can fail due to CORS and credential constraints.  
To make auth reliable on localhost and deployment:

- Frontend calls local routes like `/api/auth/login`
- Express server forwards requests to FreeAPI
- Tokens are stored as HTTP-only cookies by backend
- Frontend never needs to directly manage sensitive tokens

---

## Project Structure

```text
Authentication App/
├─ index.html        # UI structure
├─ styles.css        # Styling and responsive layout
├─ script.js         # Frontend auth logic + validation
├─ server.js         # Express proxy for FreeAPI auth endpoints
├─ package.json      # Node scripts and dependencies
└─ README.md
```

---

## Features

### 1) Authentication Flow
- Register with `email`, `username`, `password`, `role`
- Login with `username`, `password`
- Fetch current logged-in user data
- Logout and clear local auth session cookies

### 2) Validation
- Required field checks
- Email format check via input type
- Username frontend rule:
  - lowercase only
  - no spaces
  - allowed: letters, numbers, underscore (`[a-z0-9_]+`)
- API validation messages are surfaced in UI

### 3) UI/UX
- Tab-based Login/Register forms
- Dynamic heading text changes by tab
- Right-side “Current User” panel
- Loading/disabled states during API calls
- Success/error status messages

---

## API Endpoints (Upstream)

Used via backend proxy:

- `POST /api/v1/users/register`
- `POST /api/v1/users/login`
- `POST /api/v1/users/logout`
- `GET /api/v1/users/current-user`
- `POST /api/v1/users/refresh-token` (used by backend on 401 recovery)

Reference docs:
- https://freeapi.hashnode.space/api-guide/apireference/registerUser
- https://freeapi.hashnode.space/api-guide/apireference/loginUser
- https://freeapi.hashnode.space/api-guide/apireference/logoutUser
- https://freeapi.app/

---

## Local Setup

### Prerequisites
- Node.js 18+ (recommended)
- npm

### Installation

```bash
npm install
```

### Run

```bash
npm start
```

Open:

```text
http://localhost:3000
```

Important:
- Use `npm start` (Express server), not Live Server, so proxy routes work.

---

## Available Scripts

- `npm start`  
  Starts Express server on port `3000`.

- `npm run dev`  
  Starts server with Node watch mode.

---

## Backend Proxy Routes (Local)

Frontend calls these:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/current-user`

### Behavior Notes
- On login/register success, server stores tokens as HTTP-only cookies if returned.
- On `current-user` 401, server tries `refresh-token` using stored refresh token.
- On logout, server clears auth cookies.

---

## Common Errors and Fixes

### 1) `422 Unprocessable Entity`
Usually validation/data issue:
- Username already exists
- Email already registered
- Username format invalid (uppercase/space/special char)

Use unique credentials for testing.

### 2) `401 Unauthorized` on `current-user`
Normal if not logged in yet.  
Login first, then refresh current user panel.

### 3) CORS Errors
If calling FreeAPI directly in browser, CORS can fail.  
Use local proxy (`server.js`) and call `/api/auth/*` only.

---

## Example Test Credentials Pattern

Use unique values each run:

- Email: `user_2026_001@example.com`
- Username: `user_2026_001`
- Password: `test@123`
- Role: `ADMIN`

---

## Deployment Guide

You can deploy this as a Node app (not static-only) because it includes `server.js`.

### Option A: Render / Railway / Cyclic / Fly.io
- Push repo to GitHub
- Create new web service
- Build command: `npm install`
- Start command: `npm start`
- Set environment if needed (`PORT` usually auto-provided)

### Option B: Vercel/Netlify (Serverless setup required)
- Requires adapting Express to serverless functions or edge routes
- Not recommended for quickest submission unless you already use that flow

---

## Security Notes

- Tokens are kept in HTTP-only cookies by backend (safer than `localStorage` for auth token storage).
- This is a learning/demo project; for production use, add:
  - CSRF protection
  - stricter cookie flags (`secure` in HTTPS)
  - rate limiting
  - stronger password policy

---

## Future Improvements

- Add field-level inline error UI below each input
- Add confirm password in register form
- Add “show/hide password” toggle
- Add accessibility improvements (focus states, ARIA feedback regions)
- Add test suite (unit + integration)

---

## Author

Built as part of FreeAPI authentication project practice.

