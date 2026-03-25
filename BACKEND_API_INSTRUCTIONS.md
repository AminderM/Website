# Backend API Integration Instructions

## Overview
This document provides instructions for the backend developer to implement the required API endpoints on the production backend at `api.staging.integratedtech.ca`. The frontend application expects these endpoints to support authentication, history tracking for calculations, and BOL management.

---

## Base Configuration

**Production API Base URL:** `https://api.staging.integratedtech.ca`

**Frontend will call:** `{BASE_URL}/api/{endpoint}`

**Authentication:** JWT Bearer Token in Authorization header

---

## Required API Endpoints

### 1. Authentication Endpoints

#### POST /api/auth/signup
Create a new user account.

**Request Body:**
```json
{
  "email": "string (required, valid email)",
  "password": "string (required, min 6 characters)",
  "name": "string (optional)"
}
```

**Response (201 Created):**
```json
{
  "token": "JWT_TOKEN_STRING",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "tier": "free|pro|enterprise",
    "created_at": "ISO8601 datetime string"
  }
}
```

**Error Responses:**
- 400: Password too short
- 409: Email already registered

---

#### POST /api/auth/login
Authenticate existing user.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "token": "JWT_TOKEN_STRING",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "tier": "free|pro|enterprise",
    "created_at": "ISO8601 datetime string"
  }
}
```

**Error Responses:**
- 401: Invalid email or password

---

#### GET /api/auth/user
Get current authenticated user info.

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response (200 OK):**
```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "tier": "free|pro|enterprise",
  "created_at": "ISO8601 datetime string"
}
```

**Error Responses:**
- 401: Missing/invalid/expired token

---

### 2. History Endpoints

All history endpoints require authentication via Bearer token.

#### POST /api/history/fuel-surcharge
Save a fuel surcharge calculation to user's history.

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request Body:**
```json
{
  "current_fuel_price": 4.50,
  "base_fuel_price": 2.50,
  "base_rate": 3000.00,
  "miles": 750,
  "surcharge_method": "percentage|cpm",
  "surcharge_percent": 80.00,
  "surcharge_amount": 2400.00,
  "total_with_surcharge": 5400.00,
  "cpm_surcharge": 0.333
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "id": "inserted_document_id"
}
```

---

#### POST /api/history/ifta
Save an IFTA tax calculation to user's history.

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request Body:**
```json
{
  "mpg": 6.5,
  "total_fuel_purchased": 3500,
  "total_miles": 4300,
  "total_fuel_used": 661.5,
  "jurisdictions": [
    {
      "state": "TX",
      "miles": 2500,
      "fuel_purchased": 350,
      "tax_rate": 0.20,
      "fuel_used": 384.6,
      "net_taxable_fuel": 34.6,
      "tax_due": 6.92
    },
    {
      "state": "CA",
      "miles": 1800,
      "fuel_purchased": 250,
      "tax_rate": 0.68,
      "fuel_used": 276.9,
      "net_taxable_fuel": 26.9,
      "tax_due": 18.29
    }
  ],
  "total_tax_due": 25.21
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "id": "inserted_document_id"
}
```

---

#### POST /api/history/bol
Save a BOL document reference to user's history.

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request Body:**
```json
{
  "bol_number": "BOL-2026-001234",
  "bol_date": "2026-03-25",
  "shipper_name": "ABC Logistics Inc.",
  "consignee_name": "XYZ Warehouse Co.",
  "carrier_name": "FastFreight LLC",
  "total_weight": "45000 lbs",
  "freight_terms": "Prepaid|Collect|Third Party"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "id": "inserted_document_id"
}
```

---

#### GET /api/history
Retrieve all history items for the authenticated user.

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response (200 OK):**
```json
{
  "history": [
    {
      "type": "fuel_surcharge",
      "data": {
        "current_fuel_price": 4.50,
        "base_fuel_price": 2.50,
        "surcharge_percent": 80.00,
        "surcharge_amount": 2400.00,
        ...
      },
      "created_at": "2026-03-25T10:30:00.000Z"
    },
    {
      "type": "ifta",
      "data": {
        "total_miles": 4300,
        "total_tax_due": 25.21,
        "jurisdictions": [...],
        ...
      },
      "created_at": "2026-03-25T09:15:00.000Z"
    },
    {
      "type": "bol",
      "data": {
        "bol_number": "BOL-2026-001234",
        "shipper_name": "ABC Logistics Inc.",
        ...
      },
      "created_at": "2026-03-25T08:00:00.000Z"
    }
  ]
}
```

**Notes:**
- Return history sorted by `created_at` descending (newest first)
- Limit to most recent 50 items
- Each type should query its respective collection and combine results

---

### 3. Health Check Endpoint

#### GET /api/health
Simple health check for monitoring.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "Integrated Supply Chain API"
}
```

---

## Database Schema Recommendations

### MongoDB Collections

#### Collection: `users`
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (hashed with bcrypt),
  name: String,
  tier: String (enum: "free", "pro", "enterprise"),
  created_at: ISODate
}
```

#### Collection: `fuel_surcharge_calculations`
```javascript
{
  _id: ObjectId,
  user_id: String (indexed),
  type: "fuel_surcharge",
  data: {
    current_fuel_price: Number,
    base_fuel_price: Number,
    base_rate: Number,
    miles: Number,
    surcharge_method: String,
    surcharge_percent: Number,
    surcharge_amount: Number,
    total_with_surcharge: Number,
    cpm_surcharge: Number
  },
  created_at: ISODate (indexed)
}
```

#### Collection: `ifta_calculations`
```javascript
{
  _id: ObjectId,
  user_id: String (indexed),
  type: "ifta",
  data: {
    mpg: Number,
    total_fuel_purchased: Number,
    total_miles: Number,
    total_fuel_used: Number,
    jurisdictions: Array,
    total_tax_due: Number
  },
  created_at: ISODate (indexed)
}
```

#### Collection: `bol_documents`
```javascript
{
  _id: ObjectId,
  user_id: String (indexed),
  type: "bol",
  data: {
    bol_number: String,
    bol_date: String,
    shipper_name: String,
    consignee_name: String,
    carrier_name: String,
    total_weight: String,
    freight_terms: String
  },
  created_at: ISODate (indexed)
}
```

---

## JWT Token Configuration

**Recommended Settings:**
- Algorithm: HS256
- Expiration: 24 hours
- Payload should include:
  ```json
  {
    "userId": "user_id_string",
    "email": "user@example.com",
    "iat": 1234567890,
    "exp": 1234654290
  }
  ```

---

## CORS Configuration

Enable CORS for the frontend domains:
```
Allowed Origins:
- https://app.integratedtech.ca
- https://staging.integratedtech.ca
- http://localhost:3000 (development)

Allowed Methods: GET, POST, PUT, DELETE, OPTIONS
Allowed Headers: Content-Type, Authorization
Allow Credentials: true
```

---

## Frontend Environment Configuration

Once the backend is deployed, update the frontend `.env` file:

```env
REACT_APP_BACKEND_URL=https://api.staging.integratedtech.ca
```

---

## Testing the Integration

### Test Sequence:

1. **Health Check**
   ```bash
   curl https://api.staging.integratedtech.ca/api/health
   ```

2. **Create User**
   ```bash
   curl -X POST https://api.staging.integratedtech.ca/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpass123","name":"Test User"}'
   ```

3. **Login & Get Token**
   ```bash
   TOKEN=$(curl -s -X POST https://api.staging.integratedtech.ca/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpass123"}' | jq -r '.token')
   ```

4. **Save Fuel Surcharge Calculation**
   ```bash
   curl -X POST https://api.staging.integratedtech.ca/api/history/fuel-surcharge \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"current_fuel_price":4.5,"base_fuel_price":2.5,"base_rate":3000,"miles":750,"surcharge_method":"percentage","surcharge_percent":80,"surcharge_amount":2400,"total_with_surcharge":5400,"cpm_surcharge":0.333}'
   ```

5. **Get History**
   ```bash
   curl https://api.staging.integratedtech.ca/api/history \
     -H "Authorization: Bearer $TOKEN"
   ```

---

## Reference Implementation

A reference FastAPI implementation is available at:
`/app/backend/server.py`

This can be used as a guide for implementing the same endpoints in your preferred framework/language.

---

## Contact

For questions about the frontend integration, contact the frontend development team.

**Document Version:** 1.0  
**Last Updated:** March 25, 2026
