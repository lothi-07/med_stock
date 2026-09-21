from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import engine, Base, SessionLocal
from .models import *  # noqa: F401 — Import all models so Base knows about them
from .seed import seed_data
from .schemas import OwnerSignup, UserLogin, Token, UserResponse
from .auth import hash_password, verify_password, create_access_token, get_current_user

from .routes.medicines import router as medicines_router
from .routes.batches import router as batches_router
from .routes.billing import router as billing_router
from .routes.alerts import router as alerts_router
from .routes.donations import router as donations_router
from .routes.reports import router as reports_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)
    # Seed demo data
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="MedStock API",
    description="Smart Pharmacy Inventory + Billing with FEFO, Expiry/Low-Stock Alerts, and Surplus Donation",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Auth Routes (inline for simplicity) ───────────────────────────────────────

@app.post("/api/auth/login", response_model=Token)
def login(payload: UserLogin):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == payload.email).first()
        if not user or not verify_password(payload.password, user.password_hash):
            from fastapi import HTTPException
            raise HTTPException(status_code=401, detail="Invalid email or password")
        token = create_access_token(data={"sub": user.id, "role": user.role, "org_id": user.org_id})
        return Token(access_token=token)
    finally:
        db.close()


@app.post("/api/auth/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(payload: OwnerSignup):
    db = SessionLocal()
    try:
        email = str(payload.email).lower()
        if db.query(User).filter(User.email == email).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )

        organization = Organization(
            name=payload.pharmacy_name,
            type="pharmacy",
            address=payload.address,
            phone=payload.phone,
            license_no=payload.license_no,
        )
        db.add(organization)
        db.flush()

        user = User(
            org_id=organization.id,
            name=payload.owner_name,
            email=email,
            password_hash=hash_password(payload.password),
            role="owner",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_access_token(
            data={"sub": user.id, "role": user.role, "org_id": user.org_id}
        )
        return Token(access_token=token)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create the owner account",
        )
    finally:
        db.close()


@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        org_id=current_user.org_id,
        org_name=current_user.organization.name if current_user.organization else None,
        org_type=current_user.organization.type if current_user.organization else None,
        is_active=current_user.is_active,
    )


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "MedStock", "version": "1.0.0"}


# ── Mount Routers ─────────────────────────────────────────────────────────────
app.include_router(medicines_router)
app.include_router(batches_router)
app.include_router(billing_router)
app.include_router(alerts_router)
app.include_router(donations_router)
app.include_router(reports_router)
