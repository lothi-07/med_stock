from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Date, Boolean, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from .database import Base


# ── Enums ──────────────────────────────────────────────────────────────────────

class OrgType(str, enum.Enum):
    PHARMACY = "pharmacy"
    NGO = "ngo"


class UserRole(str, enum.Enum):
    OWNER = "owner"
    PHARMACIST = "pharmacist"
    MANAGER = "manager"


class AlertType(str, enum.Enum):
    LOW_STOCK = "low_stock"
    MEDIUM_STOCK = "medium_stock"
    EXPIRY = "expiry"
    OUT_OF_STOCK = "out_of_stock"


class DonationStatus(str, enum.Enum):
    LISTED = "listed"
    CLAIMED = "claimed"
    PICKED = "picked"
    COMPLETED = "completed"


# ── Models ─────────────────────────────────────────────────────────────────────

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    type = Column(String(20), nullable=False, default=OrgType.PHARMACY.value)
    address = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    license_no = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    users = relationship("User", back_populates="organization")
    medicines = relationship("Medicine", back_populates="organization")
    bills = relationship("Bill", back_populates="organization")
    alerts = relationship("Alert", back_populates="organization")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default=UserRole.PHARMACIST.value)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="users")
    bills = relationship("Bill", back_populates="user")


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    name = Column(String(200), nullable=False, index=True)
    category = Column(String(100), nullable=True)
    barcode = Column(String(100), nullable=True, index=True)
    min_stock = Column(Integer, default=10)
    medium_stock = Column(Integer, default=25)
    unit = Column(String(30), default="strips")
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="medicines")
    batches = relationship("Batch", back_populates="medicine", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="medicine")


class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    batch_no = Column(String(50), nullable=False)
    expiry_date = Column(Date, nullable=False)
    qty_received = Column(Integer, nullable=False, default=0)
    qty_on_hand = Column(Integer, nullable=False, default=0)
    mrp = Column(Float, nullable=False, default=0.0)
    purchase_price = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    medicine = relationship("Medicine", back_populates="batches")
    bill_items = relationship("BillItem", back_populates="batch")
    donations = relationship("Donation", back_populates="batch")


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    bill_number = Column(String(30), unique=True, nullable=False, index=True)
    customer_name = Column(String(100), nullable=True, default="Walk-in")
    total_amount = Column(Float, nullable=False, default=0.0)
    discount = Column(Float, nullable=False, default=0.0)
    net_amount = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="bills")
    user = relationship("User", back_populates="bills")
    items = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")


class BillItem(Base):
    __tablename__ = "bill_items"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    medicine_name = Column(String(200), nullable=False)
    batch_no = Column(String(50), nullable=False)
    qty_sold = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    line_total = Column(Float, nullable=False)

    bill = relationship("Bill", back_populates="items")
    batch = relationship("Batch", back_populates="bill_items")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    type = Column(String(20), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="alerts")
    medicine = relationship("Medicine", back_populates="alerts")


class Donation(Base):
    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, index=True)
    org_id_donor = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    org_id_claimer = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    medicine_name = Column(String(200), nullable=False)
    qty_available = Column(Integer, nullable=False)
    qty_claimed = Column(Integer, default=0)
    status = Column(String(20), default=DonationStatus.LISTED.value)
    notes = Column(Text, nullable=True)
    listed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    claimed_at = Column(DateTime, nullable=True)
    picked_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    batch = relationship("Batch", back_populates="donations")
    donor_org = relationship("Organization", foreign_keys=[org_id_donor])
    claimer_org = relationship("Organization", foreign_keys=[org_id_claimer])
