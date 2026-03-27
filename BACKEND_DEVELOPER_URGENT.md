# Backend Developer Instructions
## Fixing Login Issue - Integrated Supply Chain Technologies

**Issue:** Frontend login is failing with "Failed to fetch" error  
**Root Cause:** Frontend is trying to connect to `api.staging.integratedtech.ca` but backend is not responding

---

## URGENT: Checklist to Fix Login

### 1. Verify Backend is Running
```bash
# Test if your backend is accessible
curl -v https://api.staging.integratedtech.ca/api/health

# Expected response:
# {"status": "healthy", "service": "Integrated Supply Chain API"}
```

**If not responding:** Deploy the backend service to `api.staging.integratedtech.ca`

---

### 2. Verify CORS is Configured

The frontend is hosted at:
```
https://981d5552-e907-49f6-a000-953b349b48f4.preview.emergentagent.com
```

**Your backend MUST allow this origin.** Add to your CORS configuration:

#### Python/FastAPI:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://981d5552-e907-49f6-a000-953b349b48f4.preview.emergentagent.com",
        "https://app.integratedtech.ca",
        "https://staging.integratedtech.ca",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Node.js/Express:
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://981d5552-e907-49f6-a000-953b349b48f4.preview.emergentagent.com',
    'https://app.integratedtech.ca',
    'https://staging.integratedtech.ca',
    'http://localhost:3000'
  ],
  credentials: true
}));
```

---

### 3. Verify Login Endpoint Works

**Endpoint:** `POST /api/auth/login`

```bash
# Test login endpoint
curl -X POST https://api.staging.integratedtech.ca/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testfleetowner@test.com","password":"qwerty123"}'
```

**Expected Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "email": "testfleetowner@test.com",
    "name": "Test Fleet Owner",
    "tier": "free",
    "created_at": "2026-03-25T10:30:00.000Z"
  }
}
```

**If user doesn't exist:** Create test user or use signup endpoint

---

### 4. Create Test User (if needed)

**Option A: Seed in Database**
```javascript
// MongoDB
db.users.insertOne({
  id: "user_test_fleetowner_001",
  email: "testfleetowner@test.com",
  password: "$2b$12$...", // bcrypt hash of "qwerty123"
  name: "Test Fleet Owner",
  tier: "free",
  created_at: new Date().toISOString()
});
```

**Option B: Seed on Startup (Python)**
```python
@app.on_event("startup")
def seed_test_user():
    test_email = "testfleetowner@test.com"
    existing = users_collection.find_one({"email": test_email})
    if not existing:
        users_collection.insert_one({
            "id": "user_test_fleetowner_001",
            "email": test_email,
            "password": bcrypt.hashpw("qwerty123".encode(), bcrypt.gensalt(12)).decode(),
            "name": "Test Fleet Owner",
            "tier": "free",
            "created_at": datetime.utcnow().isoformat() + "Z"
        })
        print(f"✅ Test user seeded: {test_email}")
```

**Option C: Use Signup Endpoint**
```bash
curl -X POST https://api.staging.integratedtech.ca/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"testfleetowner@test.com","password":"qwerty123","name":"Test Fleet Owner"}'
```

---

### 5. Required Endpoints Checklist

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/health` | GET | ⬜ |
| `/api/auth/signup` | POST | ⬜ |
| `/api/auth/login` | POST | ⬜ |
| `/api/auth/user` | GET | ⬜ |
| `/api/history/fuel-surcharge` | POST | ⬜ |
| `/api/history/ifta` | POST | ⬜ |
| `/api/history/bol` | POST | ⬜ |
| `/api/history` | GET | ⬜ |
| `/api/history/{id}` | GET | ⬜ |
| `/api/history/{id}` | DELETE | ⬜ |

---

### 6. Quick Verification Script

Run this to test all critical endpoints:

```bash
#!/bin/bash
API_URL="https://api.staging.integratedtech.ca"

echo "=== 1. Health Check ==="
curl -s "$API_URL/api/health" && echo ""

echo -e "\n=== 2. Login ==="
RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testfleetowner@test.com","password":"qwerty123"}')
echo $RESPONSE

TOKEN=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

if [ -n "$TOKEN" ]; then
  echo -e "\n✅ Login successful!"
  
  echo -e "\n=== 3. Get User ==="
  curl -s "$API_URL/api/auth/user" -H "Authorization: Bearer $TOKEN"
  echo ""
else
  echo -e "\n❌ Login failed!"
fi
```

---

## Common Issues & Solutions

### Issue: "Failed to fetch"
**Cause:** CORS not configured or backend not running  
**Solution:** 
1. Verify backend is deployed and accessible
2. Add frontend origin to CORS allowed origins
3. Ensure HTTPS is properly configured

### Issue: "Invalid email or password"
**Cause:** User doesn't exist or password mismatch  
**Solution:** Create test user with credentials above

### Issue: "Token expired/invalid"
**Cause:** JWT configuration mismatch  
**Solution:** Verify JWT secret and algorithm match

---

## Environment Variables Required

```bash
# Database
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/integrated_supply_chain
DB_NAME=integrated_supply_chain

# Authentication
JWT_SECRET=your-secret-key-at-least-32-characters-long
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Server
PORT=8001
```

---

## Contact

Once backend is deployed and tested, please confirm:
1. ✅ Health endpoint responding
2. ✅ Login endpoint working with test credentials
3. ✅ CORS configured for frontend origin

**Test Credentials:**
- Email: `testfleetowner@test.com`
- Password: `qwerty123`

**Frontend URL:** `https://981d5552-e907-49f6-a000-953b349b48f4.preview.emergentagent.com`

---

## Reference Documentation

Full implementation guides available at:
- `/app/BACKEND_IMPLEMENTATION_GUIDE.md` - Complete API implementation
- `/app/DATA_SCHEMA_REFERENCE.md` - Database schemas
- `/app/FRONTEND_INTEGRATION_GUIDE.md` - Frontend integration specs
