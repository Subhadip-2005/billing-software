from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from typing import Optional, List
import jwt, bcrypt, os
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv()

app = FastAPI(title="MedBill API")

app.add_middleware(CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"])

# MongoDB
client = AsyncIOMotorClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
db = client.medbill

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
security = HTTPBearer()

def hash_password(pwd): return bcrypt.hashpw(pwd.encode(), bcrypt.gensalt()).decode()
def verify_password(pwd, hashed): return bcrypt.checkpw(pwd.encode(), hashed.encode())
def create_token(data): return jwt.encode({**data, "exp": datetime.utcnow() + timedelta(days=7)}, JWT_SECRET)
def str_id(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc

async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=["HS256"])
        user = await db.users.find_one({"_id": ObjectId(payload["user_id"])})
        if not user: raise HTTPException(401, "User not found")
        return str_id(user)
    except: raise HTTPException(401, "Invalid token")

# --- MODELS ---
class UserCreate(BaseModel):
    name: str; email: EmailStr; password: str; role: str = "cashier"

class UserLogin(BaseModel):
    email: EmailStr; password: str

class Medicine(BaseModel):
    name: str; generic_name: str = ""; manufacturer: str = ""
    batch_number: str = ""; quantity: int; price: float; mrp: float
    gst_percentage: float = 12.0; expiry_date: str; barcode: str = ""
    category: str = ""; minimum_stock_level: int = 10

class Customer(BaseModel):
    name: str; phone: str; email: str = ""; address: str = ""

class InvoiceItem(BaseModel):
    medicine_id: str; medicine_name: str; quantity: int
    unit_price: float; gst_percentage: float; total: float

class Invoice(BaseModel):
    customer_id: str = ""; customer_name: str = "walk-in"
    items: List[InvoiceItem]; payment_method: str = "cash"
    cash_amount: float = 0; digital_amount: float = 0
    total_amount: float; gst_amount: float; discount: float = 0

# --- AUTH ROUTES ---
@app.post("/api/auth/register")
async def register(user: UserCreate):
    if await db.users.find_one({"email": user.email}):
        raise HTTPException(400, "Email already registered")
    doc = {**user.dict(), "password": hash_password(user.password), "created_at": datetime.utcnow()}
    result = await db.users.insert_one(doc)
    return {"message": "User created", "id": str(result.inserted_id)}

@app.post("/api/auth/login")
async def login(creds: UserLogin):
    user = await db.users.find_one({"email": creds.email})
    if not user or not verify_password(creds.password, user["password"]):
        raise HTTPException(401, "Invalid credentials")
    token = create_token({"user_id": str(user["_id"]), "role": user["role"]})
    user = str_id(user)
    user.pop("password", None)
    return {"token": token, "user": user}

@app.get("/api/auth/me")
async def me(user=Depends(get_current_user)):
    user.pop("password", None)
    return user

# --- MEDICINE ROUTES ---
@app.get("/api/medicines")
async def get_medicines(search: str = "", user=Depends(get_current_user)):
    query = {"name": {"$regex": search, "$options": "i"}} if search else {}
    meds = await db.medicines.find(query).to_list(500)
    return [str_id(m) for m in meds]

@app.post("/api/medicines")
async def add_medicine(med: Medicine, user=Depends(get_current_user)):
    doc = {**med.dict(), "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
    result = await db.medicines.insert_one(doc)
    return {"id": str(result.inserted_id)}

@app.put("/api/medicines/{med_id}")
async def update_medicine(med_id: str, med: Medicine, user=Depends(get_current_user)):
    await db.medicines.update_one({"_id": ObjectId(med_id)},
        {"$set": {**med.dict(), "updated_at": datetime.utcnow()}})
    return {"message": "Updated"}

@app.delete("/api/medicines/{med_id}")
async def delete_medicine(med_id: str, user=Depends(get_current_user)):
    await db.medicines.delete_one({"_id": ObjectId(med_id)})
    return {"message": "Deleted"}

@app.get("/api/medicines/barcode/{barcode}")
async def get_by_barcode(barcode: str, user=Depends(get_current_user)):
    med = await db.medicines.find_one({"barcode": barcode})
    if not med: raise HTTPException(404, "Medicine not found")
    return str_id(med)

# --- CUSTOMER ROUTES ---
@app.get("/api/customers")
async def get_customers(search: str = "", user=Depends(get_current_user)):
    query = {"$or": [{"name": {"$regex": search, "$options": "i"}},
                     {"phone": {"$regex": search}}]} if search else {}
    customers = await db.customers.find(query).to_list(500)
    return [str_id(c) for c in customers]

@app.post("/api/customers")
async def add_customer(customer: Customer, user=Depends(get_current_user)):
    doc = {**customer.dict(), "created_at": datetime.utcnow()}
    result = await db.customers.insert_one(doc)
    return {"id": str(result.inserted_id)}

# --- INVOICE ROUTES ---
@app.post("/api/invoices")
async def create_invoice(invoice: Invoice, user=Depends(get_current_user)):
    # Generate invoice number
    count = await db.invoices.count_documents({})
    inv_num = f"INV-{datetime.now().strftime('%Y%m')}-{count+1:04d}"
    doc = {**invoice.dict(), "invoice_number": inv_num,
           "cashier_id": user["id"], "cashier_name": user["name"],
           "created_at": datetime.utcnow()}
    # Deduct stock
    for item in invoice.items:
        await db.medicines.update_one({"_id": ObjectId(item.medicine_id)},
            {"$inc": {"quantity": -item.quantity}})
    result = await db.invoices.insert_one(doc)
    return {"id": str(result.inserted_id), "invoice_number": inv_num}

@app.get("/api/invoices")
async def get_invoices(user=Depends(get_current_user)):
    invoices = await db.invoices.find().sort("created_at", -1).to_list(100)
    return [str_id(i) for i in invoices]

# --- REPORTS ROUTES ---
@app.get("/api/reports/dashboard")
async def dashboard_stats(user=Depends(get_current_user)):
    today = datetime.utcnow().replace(hour=0, minute=0, second=0)
    today_sales = await db.invoices.aggregate([
        {"$match": {"created_at": {"$gte": today}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]).to_list(1)
    return {
        "today_sales": today_sales[0]["total"] if today_sales else 0,
        "total_medicines": await db.medicines.count_documents({}),
        "total_customers": await db.customers.count_documents({}),
        "low_stock_count": await db.medicines.count_documents({"$expr": {"$lte": ["$quantity", "$minimum_stock_level"]}})
    }

@app.get("/api/reports/low-stock")
async def low_stock(user=Depends(get_current_user)):
    meds = await db.medicines.find(
        {"$expr": {"$lte": ["$quantity", "$minimum_stock_level"]}}
    ).to_list(100)
    return [str_id(m) for m in meds]

@app.get("/api/reports/expiry")
async def expiry_alerts(user=Depends(get_current_user)):
    threshold = (datetime.utcnow() + timedelta(days=30)).strftime("%Y-%m-%d")
    meds = await db.medicines.find({"expiry_date": {"$lte": threshold}}).to_list(100)
    return [str_id(m) for m in meds]

@app.get("/api/")
async def root(): return {"message": "MedBill API running"}