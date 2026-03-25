from fastapi import FastAPI, HTTPException, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Literal
import jwt
import os
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson import ObjectId

app = FastAPI(title="Integrated Supply Chain API")

# MongoDB Connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "integrated_supply_chain")
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Collections
fuel_surcharge_collection = db["fuel_surcharge_calculations"]
ifta_collection = db["ifta_calculations"]
bol_collection = db["bol_documents"]

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

# ============================================
# History Models
# ============================================
class FuelSurchargeCalc(BaseModel):
    current_fuel_price: float
    base_fuel_price: float
    base_rate: float
    miles: Optional[float] = 0
    surcharge_method: str
    surcharge_percent: float
    surcharge_amount: float
    total_with_surcharge: float
    cpm_surcharge: float

class JurisdictionData(BaseModel):
    state: str
    miles: float
    fuel_purchased: float
    tax_rate: float
    fuel_used: float
    net_taxable_fuel: float
    tax_due: float

class IFTACalc(BaseModel):
    mpg: float
    total_fuel_purchased: float
    total_miles: float
    total_fuel_used: float
    jurisdictions: List[JurisdictionData]
    total_tax_due: float

class BOLData(BaseModel):
    bol_number: str
    bol_date: str
    shipper_name: str
    consignee_name: str
    carrier_name: str
    total_weight: Optional[str] = ""
    freight_terms: Optional[str] = "Prepaid"

class HistoryItem(BaseModel):
    id: str
    type: str
    data: Any
    created_at: str

# ============================================
# History Endpoints
# ============================================
@app.post("/api/history/fuel-surcharge")
def save_fuel_surcharge(calc: FuelSurchargeCalc, payload: dict = Depends(verify_token)):
    user_id = payload.get("userId")
    doc = {
        "user_id": user_id,
        "type": "fuel_surcharge",
        "data": calc.dict(),
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    result = fuel_surcharge_collection.insert_one(doc)
    return {"success": True, "id": str(result.inserted_id)}

@app.post("/api/history/ifta")
def save_ifta(calc: IFTACalc, payload: dict = Depends(verify_token)):
    user_id = payload.get("userId")
    doc = {
        "user_id": user_id,
        "type": "ifta",
        "data": calc.dict(),
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    result = ifta_collection.insert_one(doc)
    return {"success": True, "id": str(result.inserted_id)}

@app.post("/api/history/bol")
def save_bol(bol: BOLData, payload: dict = Depends(verify_token)):
    user_id = payload.get("userId")
    doc = {
        "user_id": user_id,
        "type": "bol",
        "data": bol.dict(),
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    result = bol_collection.insert_one(doc)
    return {"success": True, "id": str(result.inserted_id)}

@app.get("/api/history")
def get_history(
    payload: dict = Depends(verify_token),
    type: Optional[Literal["fuel_surcharge", "ifta", "bol"]] = Query(None, description="Filter by type"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page")
):
    user_id = payload.get("userId")
    skip = (page - 1) * limit
    
    all_items = []
    total_count = 0
    
    # Helper to add items from collection
    def fetch_from_collection(collection, item_type):
        nonlocal total_count
        query = {"user_id": user_id}
        count = collection.count_documents(query)
        total_count += count
        
        items = list(collection.find(query).sort("created_at", -1))
        for item in items:
            all_items.append({
                "id": str(item["_id"]),
                "type": item_type,
                "data": item.get("data"),
                "created_at": item.get("created_at")
            })
    
    # Fetch based on type filter
    if type is None or type == "fuel_surcharge":
        fetch_from_collection(fuel_surcharge_collection, "fuel_surcharge")
    if type is None or type == "ifta":
        fetch_from_collection(ifta_collection, "ifta")
    if type is None or type == "bol":
        fetch_from_collection(bol_collection, "bol")
    
    # Sort combined results by date
    all_items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    # Apply pagination
    paginated_items = all_items[skip:skip + limit]
    has_more = len(all_items) > skip + limit
    
    return {
        "history": paginated_items,
        "total": len(all_items),
        "page": page,
        "limit": limit,
        "has_more": has_more
    }

@app.get("/api/history/{item_id}")
def get_history_item(item_id: str, payload: dict = Depends(verify_token)):
    """Get a single history item by ID"""
    user_id = payload.get("userId")
    
    try:
        obj_id = ObjectId(item_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    # Search in all collections
    for collection, item_type in [
        (fuel_surcharge_collection, "fuel_surcharge"),
        (ifta_collection, "ifta"),
        (bol_collection, "bol")
    ]:
        item = collection.find_one({"_id": obj_id, "user_id": user_id})
        if item:
            return {
                "id": str(item["_id"]),
                "type": item_type,
                "data": item.get("data"),
                "created_at": item.get("created_at")
            }
    
    raise HTTPException(status_code=404, detail="History item not found")

@app.delete("/api/history/{item_id}")
def delete_history_item(item_id: str, payload: dict = Depends(verify_token)):
    """Delete a history item by ID"""
    user_id = payload.get("userId")
    
    try:
        obj_id = ObjectId(item_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    # Try to delete from each collection
    for collection in [fuel_surcharge_collection, ifta_collection, bol_collection]:
        result = collection.delete_one({"_id": obj_id, "user_id": user_id})
        if result.deleted_count > 0:
            return {"success": True, "message": "Item deleted"}
    
    raise HTTPException(status_code=404, detail="History item not found")
