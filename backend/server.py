from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional
import jwt
import os
from datetime import datetime, timedelta

app = FastAPI(title="Integrated Supply Chain API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT Config
JWT_SECRET = os.environ.get("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# In-memory user storage (for demo)
users_db = {}

# Models
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = ""

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

# Helper functions
def generate_token(user_id: str, email: str) -> str:
    payload = {
        "userId": user_id,
        "email": email,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Routes
@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "Integrated Supply Chain API"}

@app.post("/api/auth/signup", response_model=AuthResponse)
def signup(request: SignupRequest):
    email = request.email.lower()
    
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    if email in users_db:
        raise HTTPException(status_code=409, detail="Email already registered")
    
    user_id = f"user_{int(datetime.utcnow().timestamp() * 1000)}_{os.urandom(4).hex()}"
    created_at = datetime.utcnow().isoformat() + "Z"
    
    users_db[email] = {
        "id": user_id,
        "email": email,
        "password": request.password,  # In production, hash this!
        "name": request.name or "",
        "tier": "free",
        "created_at": created_at
    }
    
    token = generate_token(user_id, email)
    
    return AuthResponse(
        token=token,
        user=UserResponse(
            id=user_id,
            email=email,
            name=users_db[email]["name"],
            tier="free",
            created_at=created_at
        )
    )

@app.post("/api/auth/login", response_model=AuthResponse)
def login(request: LoginRequest):
    email = request.email.lower()
    
    user = users_db.get(email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if user["password"] != request.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = generate_token(user["id"], email)
    
    return AuthResponse(
        token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            tier=user["tier"],
            created_at=user["created_at"]
        )
    )

@app.get("/api/auth/user", response_model=UserResponse)
def get_user(payload: dict = Depends(verify_token)):
    email = payload.get("email")
    user = users_db.get(email)
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        tier=user["tier"],
        created_at=user["created_at"]
    )

# Seed a test user on startup
@app.on_event("startup")
def seed_test_user():
    test_email = "testfleetowner@test.com"
    if test_email not in users_db:
        users_db[test_email] = {
            "id": "user_test_fleetowner_001",
            "email": test_email,
            "password": "qwerty123",
            "name": "Test Fleet Owner",
            "tier": "free",
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        print(f"✅ Test user seeded: {test_email}")
