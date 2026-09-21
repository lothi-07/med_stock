from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date


# ── Auth ───────────────────────────────────────────────────────────────────────

class UserLogin(BaseModel):
    email: str
    password: str


class OwnerSignup(BaseModel):
    owner_name: str = Field(min_length=2, max_length=100)
    email: str = Field(
        min_length=3,
        max_length=150,
        pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
    )
    password: str = Field(min_length=8, max_length=128)
    pharmacy_name: str = Field(min_length=2, max_length=200)
    address: Optional[str] = None
    phone: Optional[str] = None
    license_no: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "pharmacist"
    org_id: int


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    org_id: int
    org_name: Optional[str] = None
    org_type: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


# ── Organization ───────────────────────────────────────────────────────────────

class OrgCreate(BaseModel):
    name: str
    type: str = "pharmacy"
    address: Optional[str] = None
    phone: Optional[str] = None
    license_no: Optional[str] = None


class OrgResponse(BaseModel):
    id: int
    name: str
    type: str
    address: Optional[str] = None
    phone: Optional[str] = None
    license_no: Optional[str] = None

    class Config:
        from_attributes = True


# ── Medicine ───────────────────────────────────────────────────────────────────

class MedicineCreate(BaseModel):
    name: str
    category: Optional[str] = None
    barcode: Optional[str] = None
    min_stock: int = 10
    medium_stock: int = 25
    unit: str = "strips"
    description: Optional[str] = None


class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    barcode: Optional[str] = None
    min_stock: Optional[int] = None
    medium_stock: Optional[int] = None
    unit: Optional[str] = None
    description: Optional[str] = None


class MedicineResponse(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    barcode: Optional[str] = None
    min_stock: int
    medium_stock: int
    unit: str
    description: Optional[str] = None
    total_stock: Optional[int] = 0
    stock_status: Optional[str] = "ok"
    is_active: bool

    class Config:
        from_attributes = True


# ── Batch ──────────────────────────────────────────────────────────────────────

class BatchCreate(BaseModel):
    batch_no: str
    expiry_date: date
    qty_received: int
    mrp: float
    purchase_price: float


class BatchUpdate(BaseModel):
    qty_on_hand: Optional[int] = None
    mrp: Optional[float] = None
    purchase_price: Optional[float] = None


class BatchResponse(BaseModel):
    id: int
    medicine_id: int
    medicine_name: Optional[str] = None
    batch_no: str
    expiry_date: date
    qty_received: int
    qty_on_hand: int
    mrp: float
    purchase_price: float
    days_to_expiry: Optional[int] = None
    expiry_status: Optional[str] = None

    class Config:
        from_attributes = True


# ── Billing ────────────────────────────────────────────────────────────────────

class BillItemCreate(BaseModel):
    batch_id: int
    medicine_id: int
    medicine_name: str
    batch_no: str
    qty_sold: int
    unit_price: float
    discount: float = 0.0


class BillCreate(BaseModel):
    customer_name: Optional[str] = "Walk-in"
    items: List[BillItemCreate]
    discount: float = 0.0


class BillItemResponse(BaseModel):
    id: int
    medicine_name: str
    batch_no: str
    qty_sold: int
    unit_price: float
    discount: float
    line_total: float

    class Config:
        from_attributes = True


class BillResponse(BaseModel):
    id: int
    bill_number: str
    customer_name: Optional[str]
    total_amount: float
    discount: float
    net_amount: float
    created_at: datetime
    items: List[BillItemResponse] = []
    user_name: Optional[str] = None

    class Config:
        from_attributes = True


# ── Alert ──────────────────────────────────────────────────────────────────────

class AlertResponse(BaseModel):
    id: int
    type: str
    message: str
    is_read: bool
    medicine_id: Optional[int] = None
    batch_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Donation ───────────────────────────────────────────────────────────────────

class DonationCreate(BaseModel):
    batch_id: int
    medicine_name: str
    qty_available: int
    notes: Optional[str] = None


class DonationClaim(BaseModel):
    qty_claimed: int


class DonationResponse(BaseModel):
    id: int
    org_id_donor: int
    org_id_claimer: Optional[int] = None
    donor_name: Optional[str] = None
    claimer_name: Optional[str] = None
    batch_id: int
    medicine_name: str
    qty_available: int
    qty_claimed: int
    status: str
    notes: Optional[str] = None
    listed_at: datetime
    claimed_at: Optional[datetime] = None
    picked_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    expiry_date: Optional[date] = None

    class Config:
        from_attributes = True


# ── Dashboard ──────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_skus: int = 0
    expiring_soon_30: int = 0
    expiring_soon_14: int = 0
    expiring_soon_7: int = 0
    low_stock_count: int = 0
    out_of_stock_count: int = 0
    today_sales_count: int = 0
    today_sales_amount: float = 0.0
    waste_prevented_value: float = 0.0
    total_stock_value: float = 0.0
