# Backend Implementation Guide
## Integrated Supply Chain Technologies - Fleet Management System

**Target Backend URL:** `https://api.staging.integratedtech.ca`  
**Document Version:** 2.0  
**Last Updated:** March 25, 2026

---

## Table of Contents
1. [Overview](#1-overview)
2. [Technology Stack Recommendations](#2-technology-stack-recommendations)
3. [Database Setup](#3-database-setup)
4. [Authentication System](#4-authentication-system)
5. [API Endpoints - Detailed Specifications](#5-api-endpoints---detailed-specifications)
6. [Error Handling Standards](#6-error-handling-standards)
7. [Reference Implementation (Python/FastAPI)](#7-reference-implementation-pythonfastapi)
8. [Reference Implementation (Node.js/Express)](#8-reference-implementation-nodejsexpress)
9. [Testing Guide](#9-testing-guide)
10. [Deployment Checklist](#10-deployment-checklist)
11. [Security Considerations](#11-security-considerations)

---

## 1. Overview

### Purpose
This backend serves a fleet management application with three main tools:
- **BOL Generator** - Create and manage Bills of Lading
- **Fuel Surcharge Calculator** - Calculate fuel surcharges based on DOE standards
- **IFTA Tax Calculator** - Calculate Interstate Fuel Tax Agreement liabilities

### Key Features Required
- User authentication (signup, login, token validation)
- Calculation history storage and retrieval
- Multi-tenant data isolation (users only see their own data)

### Frontend Integration
The React frontend will call these endpoints with:
- Base URL from environment variable: `REACT_APP_BACKEND_URL`
- All API calls prefixed with `/api/`
- JWT Bearer token in Authorization header for protected routes

---

## 2. Technology Stack Recommendations

### Option A: Python + FastAPI (Recommended)
```
- Python 3.11+
- FastAPI 0.100+
- PyMongo 4.x (MongoDB driver)
- PyJWT 2.x (JWT handling)
- Pydantic 2.x (data validation)
- Uvicorn (ASGI server)
- bcrypt (password hashing)
```

### Option B: Node.js + Express
```
- Node.js 18+
- Express 4.x
- Mongoose 7.x (MongoDB ODM)
- jsonwebtoken (JWT handling)
- bcryptjs (password hashing)
- express-validator (input validation)
```

### Database
- **MongoDB 6.0+** (recommended)
- Can also use PostgreSQL with JSON columns if preferred

---

## 3. Database Setup

### MongoDB Connection
```javascript
// Connection string format
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

// Or for local/self-hosted
mongodb://<host>:27017/<database>
```

### Collections Required

#### 3.1 `users` Collection
```javascript
{
  _id: ObjectId,                    // Auto-generated
  email: String,                    // Required, unique, indexed, lowercase
  password: String,                 // Required, bcrypt hashed (min 60 chars)
  name: String,                     // Optional, default ""
  tier: String,                     // "free" | "pro" | "enterprise", default "free"
  created_at: ISODate,              // Auto-set on creation
  updated_at: ISODate               // Auto-update on modification
}

// Indexes
db.users.createIndex({ "email": 1 }, { unique: true })
```

#### 3.2 `fuel_surcharge_calculations` Collection
```javascript
{
  _id: ObjectId,
  user_id: String,                  // Reference to user, indexed
  type: "fuel_surcharge",           // Constant for filtering
  data: {
    current_fuel_price: Number,     // e.g., 4.50
    base_fuel_price: Number,        // e.g., 2.50
    base_rate: Number,              // e.g., 3000.00
    miles: Number,                  // e.g., 750
    surcharge_method: String,       // "percentage" | "cpm"
    surcharge_percent: Number,      // Calculated result
    surcharge_amount: Number,       // Calculated result
    total_with_surcharge: Number,   // Calculated result
    cpm_surcharge: Number           // Calculated result (cost per mile)
  },
  created_at: ISODate
}

// Indexes
db.fuel_surcharge_calculations.createIndex({ "user_id": 1, "created_at": -1 })
```

#### 3.3 `ifta_calculations` Collection
```javascript
{
  _id: ObjectId,
  user_id: String,
  type: "ifta",
  data: {
    mpg: Number,                    // Fleet average MPG, e.g., 6.5
    total_fuel_purchased: Number,   // Total gallons purchased
    total_miles: Number,            // Sum of all jurisdiction miles
    total_fuel_used: Number,        // Calculated: total_miles / mpg
    jurisdictions: [                // Array of jurisdiction data
      {
        state: String,              // 2-letter code, e.g., "TX", "CA", "ON"
        miles: Number,              // Miles driven in jurisdiction
        fuel_purchased: Number,     // Gallons purchased in jurisdiction
        tax_rate: Number,           // Tax rate per gallon, e.g., 0.20
        fuel_used: Number,          // Calculated: miles / mpg
        net_taxable_fuel: Number,   // Calculated: fuel_used - fuel_purchased
        tax_due: Number             // Calculated: net_taxable_fuel * tax_rate
      }
    ],
    total_tax_due: Number           // Sum of all jurisdiction tax_due
  },
  created_at: ISODate
}

// Indexes
db.ifta_calculations.createIndex({ "user_id": 1, "created_at": -1 })
```

#### 3.4 `bol_documents` Collection
```javascript
{
  _id: ObjectId,
  user_id: String,
  type: "bol",
  data: {
    bol_number: String,             // e.g., "BOL-2026-001234"
    bol_date: String,               // ISO date string, e.g., "2026-03-25"
    shipper_name: String,           // Company name
    consignee_name: String,         // Destination company
    carrier_name: String,           // Trucking company
    total_weight: String,           // e.g., "45000 lbs"
    freight_terms: String           // "Prepaid" | "Collect" | "Third Party"
  },
  created_at: ISODate
}

// Indexes
db.bol_documents.createIndex({ "user_id": 1, "created_at": -1 })
db.bol_documents.createIndex({ "data.bol_number": 1 })
```

### MongoDB Setup Script
```javascript
// Run in MongoDB shell or Compass
use integrated_supply_chain;

// Create collections with validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "password"],
      properties: {
        email: { bsonType: "string", pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" },
        password: { bsonType: "string", minLength: 60 },
        name: { bsonType: "string" },
        tier: { enum: ["free", "pro", "enterprise"] }
      }
    }
  }
});

// Create indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.fuel_surcharge_calculations.createIndex({ "user_id": 1, "created_at": -1 });
db.ifta_calculations.createIndex({ "user_id": 1, "created_at": -1 });
db.bol_documents.createIndex({ "user_id": 1, "created_at": -1 });

print("Database setup complete!");
```

---

## 4. Authentication System

### JWT Token Specification

#### Token Generation
```javascript
// Payload structure
{
  "userId": "user_abc123def456",    // Unique user identifier
  "email": "user@example.com",      // User's email
  "iat": 1711360800,                // Issued at (Unix timestamp)
  "exp": 1711447200                 // Expires at (24 hours later)
}

// Configuration
Algorithm: HS256
Secret: Use a strong random string (min 32 characters)
Expiration: 24 hours (86400 seconds)
```

#### Token Validation Middleware
For every protected endpoint:
1. Extract token from `Authorization: Bearer <token>` header
2. Verify token signature using secret
3. Check token expiration
4. Extract `userId` from payload for database queries

### Password Security
```javascript
// Hashing (on signup/password change)
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

// Verification (on login)
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

---

## 5. API Endpoints - Detailed Specifications

### Base URL
```
Production: https://api.staging.integratedtech.ca
Development: http://localhost:8001
```

---

### 5.1 Health Check

#### `GET /api/health`

**Description:** Simple health check endpoint for monitoring and load balancers.

**Authentication:** None required

**Request:** No body required

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "Integrated Supply Chain API",
  "timestamp": "2026-03-25T10:30:00.000Z",
  "version": "1.0.0"
}
```

---

### 5.2 User Signup

#### `POST /api/auth/signup`

**Description:** Create a new user account and return JWT token.

**Authentication:** None required

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Field Validation:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | Yes | Valid email format, max 255 chars |
| password | string | Yes | Min 6 characters, max 128 chars |
| name | string | No | Max 100 chars, default "" |

**Success Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzE3MTE...",
  "user": {
    "id": "user_1711360800_abc123",
    "email": "newuser@example.com",
    "name": "John Doe",
    "tier": "free",
    "created_at": "2026-03-25T10:30:00.000Z"
  }
}
```

**Error Responses:**

*400 Bad Request - Validation Error:*
```json
{
  "detail": "Password must be at least 6 characters"
}
```

*400 Bad Request - Invalid Email:*
```json
{
  "detail": "Invalid email format"
}
```

*409 Conflict - Email Exists:*
```json
{
  "detail": "Email already registered"
}
```

**Implementation Logic:**
```python
1. Validate email format and password length
2. Convert email to lowercase
3. Check if email already exists in database
4. Hash password with bcrypt (12 rounds)
5. Generate unique user_id: f"user_{timestamp}_{random_hex}"
6. Insert user document with created_at timestamp
7. Generate JWT token
8. Return token and user data (exclude password)
```

---

### 5.3 User Login

#### `POST /api/auth/login`

**Description:** Authenticate user and return JWT token.

**Authentication:** None required

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "userPassword123"
}
```

**Field Validation:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | Yes | Valid email format |
| password | string | Yes | Non-empty string |

**Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzE3MTE...",
  "user": {
    "id": "user_1711360800_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "tier": "free",
    "created_at": "2026-03-25T10:30:00.000Z"
  }
}
```

**Error Responses:**

*401 Unauthorized - Invalid Credentials:*
```json
{
  "detail": "Invalid email or password"
}
```

**Implementation Logic:**
```python
1. Convert email to lowercase
2. Find user by email in database
3. If not found, return 401 (use same message for security)
4. Compare password with bcrypt
5. If mismatch, return 401 (use same message for security)
6. Generate new JWT token
7. Return token and user data
```

---

### 5.4 Get Current User

#### `GET /api/auth/user`

**Description:** Get authenticated user's profile information.

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "id": "user_1711360800_abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "tier": "free",
  "created_at": "2026-03-25T10:30:00.000Z"
}
```

**Error Responses:**

*401 Unauthorized - Missing Token:*
```json
{
  "detail": "Missing or invalid authorization header"
}
```

*401 Unauthorized - Invalid Token:*
```json
{
  "detail": "Invalid token"
}
```

*401 Unauthorized - Expired Token:*
```json
{
  "detail": "Token has expired"
}
```

---

### 5.5 Save Fuel Surcharge Calculation

#### `POST /api/history/fuel-surcharge`

**Description:** Save a fuel surcharge calculation to user's history.

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "current_fuel_price": 4.50,
  "base_fuel_price": 2.50,
  "base_rate": 3000.00,
  "miles": 750,
  "surcharge_method": "percentage",
  "surcharge_percent": 80.00,
  "surcharge_amount": 2400.00,
  "total_with_surcharge": 5400.00,
  "cpm_surcharge": 0.333
}
```

**Field Validation:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| current_fuel_price | number | Yes | > 0 |
| base_fuel_price | number | Yes | > 0 |
| base_rate | number | Yes | >= 0 |
| miles | number | No | >= 0, default 0 |
| surcharge_method | string | Yes | "percentage" or "cpm" |
| surcharge_percent | number | Yes | >= 0 |
| surcharge_amount | number | Yes | >= 0 |
| total_with_surcharge | number | Yes | >= 0 |
| cpm_surcharge | number | Yes | >= 0 |

**Success Response (200 OK):**
```json
{
  "success": true,
  "id": "65f8a1b2c3d4e5f6a7b8c9d0"
}
```

**Error Responses:**

*400 Bad Request - Validation Error:*
```json
{
  "detail": "current_fuel_price must be greater than 0"
}
```

*401 Unauthorized:*
```json
{
  "detail": "Missing or invalid authorization header"
}
```

---

### 5.6 Save IFTA Calculation

#### `POST /api/history/ifta`

**Description:** Save an IFTA tax calculation to user's history.

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "mpg": 6.5,
  "total_fuel_purchased": 3500,
  "total_miles": 4300,
  "total_fuel_used": 661.54,
  "jurisdictions": [
    {
      "state": "TX",
      "miles": 2500,
      "fuel_purchased": 350,
      "tax_rate": 0.20,
      "fuel_used": 384.62,
      "net_taxable_fuel": 34.62,
      "tax_due": 6.92
    },
    {
      "state": "CA",
      "miles": 1800,
      "fuel_purchased": 250,
      "tax_rate": 0.68,
      "fuel_used": 276.92,
      "net_taxable_fuel": 26.92,
      "tax_due": 18.31
    }
  ],
  "total_tax_due": 25.23
}
```

**Field Validation:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| mpg | number | Yes | > 0 |
| total_fuel_purchased | number | No | >= 0 |
| total_miles | number | Yes | >= 0 |
| total_fuel_used | number | Yes | >= 0 |
| jurisdictions | array | Yes | At least 1 item |
| jurisdictions[].state | string | Yes | 2-3 chars |
| jurisdictions[].miles | number | Yes | >= 0 |
| jurisdictions[].fuel_purchased | number | Yes | >= 0 |
| jurisdictions[].tax_rate | number | Yes | >= 0 |
| jurisdictions[].fuel_used | number | Yes | >= 0 |
| jurisdictions[].net_taxable_fuel | number | Yes | any number |
| jurisdictions[].tax_due | number | Yes | any number |
| total_tax_due | number | Yes | any number |

**Success Response (200 OK):**
```json
{
  "success": true,
  "id": "65f8a1b2c3d4e5f6a7b8c9d1"
}
```

---

### 5.7 Save BOL Document

#### `POST /api/history/bol`

**Description:** Save a BOL document reference to user's history.

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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
  "freight_terms": "Prepaid"
}
```

**Field Validation:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| bol_number | string | Yes | Non-empty, max 50 chars |
| bol_date | string | Yes | ISO date format (YYYY-MM-DD) |
| shipper_name | string | Yes | Non-empty, max 200 chars |
| consignee_name | string | Yes | Non-empty, max 200 chars |
| carrier_name | string | No | Max 200 chars |
| total_weight | string | No | Max 50 chars |
| freight_terms | string | No | "Prepaid", "Collect", or "Third Party" |

**Success Response (200 OK):**
```json
{
  "success": true,
  "id": "65f8a1b2c3d4e5f6a7b8c9d2"
}
```

---

### 5.8 Get User History

#### `GET /api/history`

**Description:** Retrieve all history items (calculations and BOLs) for the authenticated user.

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters (Optional):**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 50 | Max items to return (1-100) |
| type | string | all | Filter by type: "fuel_surcharge", "ifta", "bol", or "all" |

**Success Response (200 OK):**
```json
{
  "history": [
    {
      "type": "fuel_surcharge",
      "data": {
        "current_fuel_price": 4.50,
        "base_fuel_price": 2.50,
        "base_rate": 3000.00,
        "miles": 750,
        "surcharge_method": "percentage",
        "surcharge_percent": 80.00,
        "surcharge_amount": 2400.00,
        "total_with_surcharge": 5400.00,
        "cpm_surcharge": 0.333
      },
      "created_at": "2026-03-25T10:30:00.000Z"
    },
    {
      "type": "ifta",
      "data": {
        "mpg": 6.5,
        "total_miles": 4300,
        "total_tax_due": 25.23,
        "jurisdictions": [...]
      },
      "created_at": "2026-03-25T09:15:00.000Z"
    },
    {
      "type": "bol",
      "data": {
        "bol_number": "BOL-2026-001234",
        "shipper_name": "ABC Logistics Inc.",
        "consignee_name": "XYZ Warehouse Co.",
        ...
      },
      "created_at": "2026-03-25T08:00:00.000Z"
    }
  ]
}
```

**Implementation Logic:**
```python
1. Extract user_id from JWT token
2. Query all three collections for user's data
3. Combine results into single array
4. Sort by created_at descending (newest first)
5. Apply limit (default 50, max 100)
6. Return formatted response
```

---

## 6. Error Handling Standards

### Standard Error Response Format
```json
{
  "detail": "Human-readable error message",
  "error_code": "OPTIONAL_ERROR_CODE",
  "field": "optional_field_name"
}
```

### HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT, or POST that returns data |
| 201 | Created | Successful POST that creates a resource |
| 400 | Bad Request | Validation errors, malformed JSON |
| 401 | Unauthorized | Missing/invalid/expired token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (e.g., email exists) |
| 422 | Unprocessable Entity | Valid JSON but semantic errors |
| 500 | Internal Server Error | Unexpected server errors |

### Error Codes Reference
```
AUTH_MISSING_TOKEN      - No Authorization header
AUTH_INVALID_TOKEN      - Token signature invalid
AUTH_EXPIRED_TOKEN      - Token has expired
AUTH_INVALID_CREDENTIALS - Wrong email/password
USER_EXISTS             - Email already registered
VALIDATION_ERROR        - Field validation failed
NOT_FOUND               - Resource not found
```

---

## 7. Reference Implementation (Python/FastAPI)

### Complete Server Implementation

```python
# server.py
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime, timedelta
from pymongo import MongoClient
import jwt
import bcrypt
import os

# ============================================
# Configuration
# ============================================
app = FastAPI(
    title="Integrated Supply Chain API",
    version="1.0.0"
)

# Environment variables
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "integrated_supply_chain")
JWT_SECRET = os.environ.get("JWT_SECRET", "your-secret-key-min-32-chars-long!")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# MongoDB connection
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Collections
users_collection = db["users"]
fuel_surcharge_collection = db["fuel_surcharge_calculations"]
ifta_collection = db["ifta_calculations"]
bol_collection = db["bol_documents"]

# ============================================
# CORS Configuration
# ============================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://app.integratedtech.ca",
        "https://staging.integratedtech.ca",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Pydantic Models
# ============================================
class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    name: Optional[str] = Field(default="", max_length=100)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    tier: str
    created_at: str

class AuthResponse(BaseModel):
    token: str
    user: UserResponse

class FuelSurchargeRequest(BaseModel):
    current_fuel_price: float = Field(..., gt=0)
    base_fuel_price: float = Field(..., gt=0)
    base_rate: float = Field(..., ge=0)
    miles: Optional[float] = Field(default=0, ge=0)
    surcharge_method: str = Field(..., pattern="^(percentage|cpm)$")
    surcharge_percent: float = Field(..., ge=0)
    surcharge_amount: float = Field(..., ge=0)
    total_with_surcharge: float = Field(..., ge=0)
    cpm_surcharge: float = Field(..., ge=0)

class JurisdictionData(BaseModel):
    state: str = Field(..., min_length=2, max_length=3)
    miles: float = Field(..., ge=0)
    fuel_purchased: float = Field(..., ge=0)
    tax_rate: float = Field(..., ge=0)
    fuel_used: float = Field(..., ge=0)
    net_taxable_fuel: float
    tax_due: float

class IFTARequest(BaseModel):
    mpg: float = Field(..., gt=0)
    total_fuel_purchased: Optional[float] = Field(default=0, ge=0)
    total_miles: float = Field(..., ge=0)
    total_fuel_used: float = Field(..., ge=0)
    jurisdictions: List[JurisdictionData] = Field(..., min_items=1)
    total_tax_due: float

class BOLRequest(BaseModel):
    bol_number: str = Field(..., min_length=1, max_length=50)
    bol_date: str
    shipper_name: str = Field(..., min_length=1, max_length=200)
    consignee_name: str = Field(..., min_length=1, max_length=200)
    carrier_name: Optional[str] = Field(default="", max_length=200)
    total_weight: Optional[str] = Field(default="", max_length=50)
    freight_terms: Optional[str] = Field(default="Prepaid")

# ============================================
# Helper Functions
# ============================================
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def generate_token(user_id: str, email: str) -> str:
    """Generate JWT token"""
    payload = {
        "userId": user_id,
        "email": email,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(authorization: str = Header(None)) -> dict:
    """Verify JWT token from Authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    token = authorization[7:]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def generate_user_id() -> str:
    """Generate unique user ID"""
    import secrets
    timestamp = int(datetime.utcnow().timestamp() * 1000)
    random_hex = secrets.token_hex(4)
    return f"user_{timestamp}_{random_hex}"

# ============================================
# API Routes
# ============================================

@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Integrated Supply Chain API",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "1.0.0"
    }

@app.post("/api/auth/signup", response_model=AuthResponse, status_code=201)
def signup(request: SignupRequest):
    """Create new user account"""
    email = request.email.lower()
    
    # Check if email exists
    if users_collection.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Email already registered")
    
    # Create user
    user_id = generate_user_id()
    created_at = datetime.utcnow().isoformat() + "Z"
    
    user_doc = {
        "id": user_id,
        "email": email,
        "password": hash_password(request.password),
        "name": request.name or "",
        "tier": "free",
        "created_at": created_at
    }
    
    users_collection.insert_one(user_doc)
    
    # Generate token
    token = generate_token(user_id, email)
    
    return AuthResponse(
        token=token,
        user=UserResponse(
            id=user_id,
            email=email,
            name=user_doc["name"],
            tier="free",
            created_at=created_at
        )
    )

@app.post("/api/auth/login", response_model=AuthResponse)
def login(request: LoginRequest):
    """Authenticate user"""
    email = request.email.lower()
    
    # Find user
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Generate token
    token = generate_token(user["id"], email)
    
    return AuthResponse(
        token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user.get("name", ""),
            tier=user.get("tier", "free"),
            created_at=user.get("created_at", "")
        )
    )

@app.get("/api/auth/user", response_model=UserResponse)
def get_current_user(payload: dict = Depends(verify_token)):
    """Get current user info"""
    user = users_collection.find_one({"email": payload["email"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user.get("name", ""),
        tier=user.get("tier", "free"),
        created_at=user.get("created_at", "")
    )

@app.post("/api/history/fuel-surcharge")
def save_fuel_surcharge(request: FuelSurchargeRequest, payload: dict = Depends(verify_token)):
    """Save fuel surcharge calculation"""
    doc = {
        "user_id": payload["userId"],
        "type": "fuel_surcharge",
        "data": request.dict(),
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    result = fuel_surcharge_collection.insert_one(doc)
    return {"success": True, "id": str(result.inserted_id)}

@app.post("/api/history/ifta")
def save_ifta(request: IFTARequest, payload: dict = Depends(verify_token)):
    """Save IFTA calculation"""
    doc = {
        "user_id": payload["userId"],
        "type": "ifta",
        "data": request.dict(),
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    result = ifta_collection.insert_one(doc)
    return {"success": True, "id": str(result.inserted_id)}

@app.post("/api/history/bol")
def save_bol(request: BOLRequest, payload: dict = Depends(verify_token)):
    """Save BOL document"""
    doc = {
        "user_id": payload["userId"],
        "type": "bol",
        "data": request.dict(),
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    result = bol_collection.insert_one(doc)
    return {"success": True, "id": str(result.inserted_id)}

@app.get("/api/history")
def get_history(payload: dict = Depends(verify_token), limit: int = 50):
    """Get all history for user"""
    user_id = payload["userId"]
    limit = min(max(limit, 1), 100)  # Clamp between 1-100
    
    # Query all collections
    fuel_items = list(fuel_surcharge_collection.find(
        {"user_id": user_id},
        {"_id": 0, "user_id": 0}
    ).sort("created_at", -1).limit(limit))
    
    ifta_items = list(ifta_collection.find(
        {"user_id": user_id},
        {"_id": 0, "user_id": 0}
    ).sort("created_at", -1).limit(limit))
    
    bol_items = list(bol_collection.find(
        {"user_id": user_id},
        {"_id": 0, "user_id": 0}
    ).sort("created_at", -1).limit(limit))
    
    # Combine and sort
    all_items = fuel_items + ifta_items + bol_items
    all_items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    return {"history": all_items[:limit]}

# ============================================
# Startup
# ============================================
@app.on_event("startup")
def startup():
    """Create indexes on startup"""
    users_collection.create_index("email", unique=True)
    fuel_surcharge_collection.create_index([("user_id", 1), ("created_at", -1)])
    ifta_collection.create_index([("user_id", 1), ("created_at", -1)])
    bol_collection.create_index([("user_id", 1), ("created_at", -1)])
    print("✅ Database indexes created")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

### Requirements.txt
```
fastapi==0.109.0
uvicorn==0.27.0
pydantic[email]==2.5.3
pymongo==4.6.1
PyJWT==2.8.0
bcrypt==4.1.2
python-multipart==0.0.6
```

### Run Command
```bash
# Development
uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Production
uvicorn server:app --host 0.0.0.0 --port 8001 --workers 4
```

---

## 8. Reference Implementation (Node.js/Express)

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();

// Configuration
const PORT = process.env.PORT || 8001;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'integrated_supply_chain';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long!';
const JWT_EXPIRATION = '24h';

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    'https://app.integratedtech.ca',
    'https://staging.integratedtech.ca',
    'http://localhost:3000'
  ],
  credentials: true
}));

// Database connection
let db;
MongoClient.connect(MONGO_URL)
  .then(client => {
    db = client.db(DB_NAME);
    console.log('✅ Connected to MongoDB');
    
    // Create indexes
    db.collection('users').createIndex({ email: 1 }, { unique: true });
    db.collection('fuel_surcharge_calculations').createIndex({ user_id: 1, created_at: -1 });
    db.collection('ifta_calculations').createIndex({ user_id: 1, created_at: -1 });
    db.collection('bol_documents').createIndex({ user_id: 1, created_at: -1 });
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Missing or invalid authorization header' });
  }
  
  const token = authHeader.slice(7);
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ detail: 'Token has expired' });
    }
    return res.status(401).json({ detail: 'Invalid token' });
  }
};

// Helper Functions
const generateUserId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(16).slice(2, 10);
  return `user_${timestamp}_${random}`;
};

const generateToken = (userId, email) => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Integrated Supply Chain API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name = '' } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ detail: 'Email and password required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ detail: 'Password must be at least 6 characters' });
    }
    
    const normalizedEmail = email.toLowerCase();
    
    // Check existing
    const existing = await db.collection('users').findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ detail: 'Email already registered' });
    }
    
    // Create user
    const userId = generateUserId();
    const hashedPassword = await bcrypt.hash(password, 12);
    const createdAt = new Date().toISOString();
    
    await db.collection('users').insertOne({
      id: userId,
      email: normalizedEmail,
      password: hashedPassword,
      name,
      tier: 'free',
      created_at: createdAt
    });
    
    const token = generateToken(userId, normalizedEmail);
    
    res.status(201).json({
      token,
      user: { id: userId, email: normalizedEmail, name, tier: 'free', created_at: createdAt }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ detail: 'Email and password required' });
    }
    
    const normalizedEmail = email.toLowerCase();
    const user = await db.collection('users').findOne({ email: normalizedEmail });
    
    if (!user) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }
    
    const token = generateToken(user.id, user.email);
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        tier: user.tier || 'free',
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

app.get('/api/auth/user', authMiddleware, async (req, res) => {
  try {
    const user = await db.collection('users').findOne({ email: req.user.email });
    
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name || '',
      tier: user.tier || 'free',
      created_at: user.created_at
    });
  } catch (err) {
    res.status(500).json({ detail: 'Internal server error' });
  }
});

app.post('/api/history/fuel-surcharge', authMiddleware, async (req, res) => {
  try {
    const result = await db.collection('fuel_surcharge_calculations').insertOne({
      user_id: req.user.userId,
      type: 'fuel_surcharge',
      data: req.body,
      created_at: new Date().toISOString()
    });
    res.json({ success: true, id: result.insertedId.toString() });
  } catch (err) {
    res.status(500).json({ detail: 'Internal server error' });
  }
});

app.post('/api/history/ifta', authMiddleware, async (req, res) => {
  try {
    const result = await db.collection('ifta_calculations').insertOne({
      user_id: req.user.userId,
      type: 'ifta',
      data: req.body,
      created_at: new Date().toISOString()
    });
    res.json({ success: true, id: result.insertedId.toString() });
  } catch (err) {
    res.status(500).json({ detail: 'Internal server error' });
  }
});

app.post('/api/history/bol', authMiddleware, async (req, res) => {
  try {
    const result = await db.collection('bol_documents').insertOne({
      user_id: req.user.userId,
      type: 'bol',
      data: req.body,
      created_at: new Date().toISOString()
    });
    res.json({ success: true, id: result.insertedId.toString() });
  } catch (err) {
    res.status(500).json({ detail: 'Internal server error' });
  }
});

app.get('/api/history', authMiddleware, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
    const userId = req.user.userId;
    
    const [fuelItems, iftaItems, bolItems] = await Promise.all([
      db.collection('fuel_surcharge_calculations')
        .find({ user_id: userId }, { projection: { _id: 0, user_id: 0 } })
        .sort({ created_at: -1 }).limit(limit).toArray(),
      db.collection('ifta_calculations')
        .find({ user_id: userId }, { projection: { _id: 0, user_id: 0 } })
        .sort({ created_at: -1 }).limit(limit).toArray(),
      db.collection('bol_documents')
        .find({ user_id: userId }, { projection: { _id: 0, user_id: 0 } })
        .sort({ created_at: -1 }).limit(limit).toArray()
    ]);
    
    const allItems = [...fuelItems, ...iftaItems, ...bolItems]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
    
    res.json({ history: allItems });
  } catch (err) {
    res.status(500).json({ detail: 'Internal server error' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### package.json
```json
{
  "name": "integrated-supply-chain-api",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "mongodb": "^6.3.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## 9. Testing Guide

### Test Sequence Script (Bash)
```bash
#!/bin/bash

BASE_URL="https://api.staging.integratedtech.ca"
# For local testing: BASE_URL="http://localhost:8001"

echo "=== 1. Health Check ==="
curl -s "$BASE_URL/api/health" | jq .

echo -e "\n=== 2. Signup ==="
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"testpass123","name":"Test User"}')
echo $SIGNUP_RESPONSE | jq .

echo -e "\n=== 3. Login ==="
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"testpass123"}')
echo $LOGIN_RESPONSE | jq .
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

echo -e "\n=== 4. Get User ==="
curl -s "$BASE_URL/api/auth/user" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n=== 5. Save Fuel Surcharge ==="
curl -s -X POST "$BASE_URL/api/history/fuel-surcharge" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_fuel_price": 4.50,
    "base_fuel_price": 2.50,
    "base_rate": 3000,
    "miles": 750,
    "surcharge_method": "percentage",
    "surcharge_percent": 80,
    "surcharge_amount": 2400,
    "total_with_surcharge": 5400,
    "cpm_surcharge": 0.333
  }' | jq .

echo -e "\n=== 6. Save IFTA ==="
curl -s -X POST "$BASE_URL/api/history/ifta" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mpg": 6.5,
    "total_fuel_purchased": 3500,
    "total_miles": 4300,
    "total_fuel_used": 661.54,
    "jurisdictions": [{"state":"TX","miles":2500,"fuel_purchased":350,"tax_rate":0.20,"fuel_used":384.62,"net_taxable_fuel":34.62,"tax_due":6.92}],
    "total_tax_due": 6.92
  }' | jq .

echo -e "\n=== 7. Save BOL ==="
curl -s -X POST "$BASE_URL/api/history/bol" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bol_number": "BOL-2026-001234",
    "bol_date": "2026-03-25",
    "shipper_name": "ABC Logistics",
    "consignee_name": "XYZ Warehouse",
    "carrier_name": "FastFreight LLC",
    "total_weight": "45000 lbs",
    "freight_terms": "Prepaid"
  }' | jq .

echo -e "\n=== 8. Get History ==="
curl -s "$BASE_URL/api/history" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n=== All tests complete! ==="
```

### Expected Test Results
- All endpoints return 200/201 status
- Signup returns token and user object
- Login returns token and user object
- Protected routes work with valid token
- History endpoint returns saved items

---

## 10. Deployment Checklist

### Pre-Deployment
- [ ] MongoDB instance provisioned and accessible
- [ ] Environment variables configured
- [ ] SSL certificate installed for HTTPS
- [ ] CORS origins updated for production domains

### Environment Variables Required
```bash
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/integrated_supply_chain
DB_NAME=integrated_supply_chain
JWT_SECRET=your-production-secret-key-at-least-32-characters
PORT=8001
```

### Post-Deployment
- [ ] Health check endpoint responding
- [ ] Test signup/login flow
- [ ] Test all history endpoints
- [ ] Verify CORS working from frontend
- [ ] Monitor error logs

---

## 11. Security Considerations

### Must Implement
1. **HTTPS Only** - All traffic must use TLS
2. **Password Hashing** - Use bcrypt with cost factor 12+
3. **JWT Secret** - Use strong random secret (32+ chars)
4. **Input Validation** - Validate all inputs server-side
5. **Rate Limiting** - Implement rate limits on auth endpoints
6. **CORS** - Restrict to known frontend domains

### Recommended
1. **Request Logging** - Log all requests for audit
2. **Error Monitoring** - Use Sentry or similar
3. **Database Backups** - Regular automated backups
4. **Token Refresh** - Implement refresh token flow
5. **Account Lockout** - Lock after failed login attempts

---

## Contact & Support

For questions about this specification:
- Frontend Team: [frontend integration questions]
- API Questions: Refer to this document

**Document maintained by:** Development Team  
**Last Review:** March 25, 2026
