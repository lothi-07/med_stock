from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta

from ..database import get_db
from ..models import Batch, Medicine
from ..schemas import BatchCreate, BatchUpdate, BatchResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/batches", tags=["batches"])


def batch_to_response(batch: Batch, medicine_name: str = None) -> BatchResponse:
    today = date.today()
    days = (batch.expiry_date - today).days
    if days < 0:
        expiry_status = "expired"
    elif days <= 7:
        expiry_status = "critical"
    elif days <= 14:
        expiry_status = "warning"
    elif days <= 30:
        expiry_status = "caution"
    else:
        expiry_status = "ok"

    return BatchResponse(
        id=batch.id,
        medicine_id=batch.medicine_id,
        medicine_name=medicine_name or (batch.medicine.name if batch.medicine else None),
        batch_no=batch.batch_no,
        expiry_date=batch.expiry_date,
        qty_received=batch.qty_received,
        qty_on_hand=batch.qty_on_hand,
        mrp=batch.mrp,
        purchase_price=batch.purchase_price,
        days_to_expiry=days,
        expiry_status=expiry_status,
    )


@router.get("/medicine/{medicine_id}", response_model=List[BatchResponse])
def list_batches_for_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    med = db.query(Medicine).filter(
        Medicine.id == medicine_id,
        Medicine.org_id == current_user.org_id,
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")

    batches = (
        db.query(Batch)
        .filter(Batch.medicine_id == medicine_id)
        .order_by(Batch.expiry_date.asc())
        .all()
    )
    return [batch_to_response(b, med.name) for b in batches]


@router.get("/fefo/{medicine_id}", response_model=List[BatchResponse])
def fefo_batches(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get FEFO-ranked batches (soonest expiry first) that have stock and are not expired."""
    today = date.today()
    med = db.query(Medicine).filter(
        Medicine.id == medicine_id,
        Medicine.org_id == current_user.org_id,
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")

    batches = (
        db.query(Batch)
        .filter(
            Batch.medicine_id == medicine_id,
            Batch.qty_on_hand > 0,
            Batch.expiry_date >= today,
        )
        .order_by(Batch.expiry_date.asc())
        .all()
    )
    return [batch_to_response(b, med.name) for b in batches]


@router.get("/expiring", response_model=List[BatchResponse])
def expiring_batches(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get all batches expiring within N days for the user's organization."""
    today = date.today()
    cutoff = today + timedelta(days=days)

    batches = (
        db.query(Batch)
        .join(Medicine)
        .filter(
            Medicine.org_id == current_user.org_id,
            Medicine.is_active == True,
            Batch.qty_on_hand > 0,
            Batch.expiry_date >= today,
            Batch.expiry_date <= cutoff,
        )
        .order_by(Batch.expiry_date.asc())
        .all()
    )
    return [batch_to_response(b) for b in batches]


@router.post("/medicine/{medicine_id}", response_model=BatchResponse, status_code=201)
def add_batch(
    medicine_id: int,
    payload: BatchCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    med = db.query(Medicine).filter(
        Medicine.id == medicine_id,
        Medicine.org_id == current_user.org_id,
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")

    batch = Batch(
        medicine_id=medicine_id,
        batch_no=payload.batch_no,
        expiry_date=payload.expiry_date,
        qty_received=payload.qty_received,
        qty_on_hand=payload.qty_received,
        mrp=payload.mrp,
        purchase_price=payload.purchase_price,
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch_to_response(batch, med.name)


@router.put("/{batch_id}", response_model=BatchResponse)
def update_batch(
    batch_id: int,
    payload: BatchUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    batch = (
        db.query(Batch)
        .join(Medicine)
        .filter(Batch.id == batch_id, Medicine.org_id == current_user.org_id)
        .first()
    )
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(batch, field, value)

    db.commit()
    db.refresh(batch)
    return batch_to_response(batch)
