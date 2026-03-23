# Backend Deployment Instructions & Requirements
**Feature**: BOL Generator & Authentication Security
**Project**: Integra AI TMS Website

## Overview
The new **BOL (Bill of Lading) Generator** feature has been developed and integrated into the frontend. The BOL Generator itself is entirely client-side (generating PDFs via the browser), but it is placed behind a **ProtectedRoute** that requires the user to be authenticated. 

To support the BOL-Generator release, the backend team MUST implement full JWT-based authentication so the frontend can successfully verify users upon routing.

---

## 🚀 Required Backend Implementation

The backend must implement **three** specific authentication endpoints to support the frontend logic. The frontend expects these to be hosted at `{BACKEND_URL}/api/auth/...`.

### 1. `POST /api/auth/signup`
**Purpose**: Register new users who want to use the BOL generator.
- **Request Body**: `{ "email": "user@example.com", "password": "password123", "name": "Company Name" }`
- **Validation**:
  - Must validate email format.
  - Must ensure password is at least 6 characters.
  - Must check for duplicate emails and return `409 Conflict` if existing.
- **Response (200 OK)**:
  - Must return `{ "token": "JWT_TOKEN_HERE", "user": { "id": "...", "email": "...", "name": "...", "tier": "free" } }`.

### 2. `POST /api/auth/login`
**Purpose**: Authenticate returning users.
- **Request Body**: `{ "email": "user@example.com", "password": "password123" }`
- **Response (200 OK)**: 
  - Must return `{ "token": "JWT_TOKEN_HERE", "user": { "id": "...", "email": "...", "name": "...", "tier": "free" } }`.
- **Error (401 Unauthorized)**:
  - For invalid passwords or non-existent emails, return a generic "Invalid email or password" error.

### 3. `GET /api/auth/user` (Protected)
**Purpose**: Verify a saved session token on app initialization to permit access to the BOL Generator.
- **Headers**: `Authorization: Bearer <JWT_TOKEN_HERE>`
- **Response (200 OK)**:
  - Must return the verified user object: `{ "id": "...", "email": "...", "name": "...", "tier": "free" }`.
- **Error (401 Unauthorized)**:
  - Return if the token is missing, malformed, or expired.

---

## 🗄️ Database & Security Requirements

1. **MongoDB User Schema**:
   - Create a `User` collection.
   - Fields: `email` (unique index, lowercase), `passwordHash` (must salt & hash, e.g., using `bcrypt`), `name`, `tier` (enum: 'free', 'paid'), `created_at`.
2. **JWT Generation**:
   - Use `HS256` hashing with a secure, injected `JWT_SECRET`.
   - Set an expiration (suggested: `24h` or `7d`).
   - The token payload should include at least `{ userId, email }`.
3. **CORS Headers**:
   - The frontend and backend likely sit on different domains/ports. Ensure your API layer has CORS enabled appropriately:
   ```javascript
   const cors = require('cors');
   app.use(cors({ origin: ['https://yourfrontend.com'], credentials: true }));
   ```

---

## 🧪 Testing Your Implementation Before Handoff

Before marking the deployment as ready, please test using Postman or cURL:
1. Attempt signup with a valid email. Save the `token`.
2. Attempt signup with the *same* email (Should fail, 409).
3. Attempt login with correct credentials (Should return `token`).
4. Attempt `GET /api/auth/user` bringing the `token` in the `Authorization: Bearer <token>` header payload (Should return User info).

Once deployed successfully, the frontend will automatically direct authenticated traffic to the BOL Generator and block guest traffic! No further frontend updates are required.
