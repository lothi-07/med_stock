from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date

from ..database import get_db
from ..models import Medicine, Batch
from ..schemas import MedicineCreate, MedicineUpdate, MedicineResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/medicines", tags=["medicines"])


def compute_stock_status(total_stock: int, min_stock: int, medium_stock: int) -> str:
    if total_stock <= 0:
        return "out_of_stock"
    elif total_stock < min_stock:
        return "low"
    elif total_stock <= medium_stock:
        return "medium"
    return "ok"


@router.get("", response_model=List[MedicineResponse])
def list_medicines(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Medicine).filter(
        Medicine.org_id == current_user.org_id,
        Medicine.is_active == True,
    )
    if category:
        query = query.filter(Medicine.category == category)
    if search:
        query = query.filter(Medicine.name.ilike(f"%{search}%"))

    medicines = query.order_by(Medicine.name).all()
    result = []
    for med in medicines:
        total = sum(b.qty_on_hand for b in med.batches)
        status = compute_stock_status(total, med.min_stock, med.medium_stock)
        result.append(MedicineResponse(
            id=med.id,
            name=med.name,
            category=med.category,
            barcode=med.barcode,
            min_stock=med.min_stock,
            medium_stock=med.medium_stock,
            unit=med.unit,
            description=med.description,
            total_stock=total,
            stock_status=status,
            is_active=med.is_active,
        ))
    return result


@router.get("/categories", response_model=List[str])
def list_categories(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    cats = (
        db.query(Medicine.category)
        .filter(Medicine.org_id == current_user.org_id, Medicine.is_active == True)
        .distinct()
        .all()
    )
    return [c[0] for c in cats if c[0]]


@router.get("/search", response_model=List[MedicineResponse])
def search_medicines(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    medicines = (
        db.query(Medicine)
        .filter(
            Medicine.org_id == current_user.org_id,
            Medicine.is_active == True,
            (Medicine.name.ilike(f"%{q}%") | Medicine.barcode.ilike(f"%{q}%")),
        )
        .limit(10)
        .all()
    )
    result = []
    for med in medicines:
        total = sum(b.qty_on_hand for b in med.batches)
        status = compute_stock_status(total, med.min_stock, med.medium_stock)
        result.append(MedicineResponse(
            id=med.id,
            name=med.name,
            category=med.category,
            barcode=med.barcode,
            min_stock=med.min_stock,
            medium_stock=med.medium_stock,
            unit=med.unit,
            description=med.description,
            total_stock=total,
            stock_status=status,
            is_active=med.is_active,
        ))
    return result


@router.get("/barcode/{code}", response_model=MedicineResponse)
def lookup_barcode(
    code: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    med = (
        db.query(Medicine)
        .filter(
            Medicine.org_id == current_user.org_id,
            Medicine.barcode == code,
            Medicine.is_active == True,
        )
        .first()
    )
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found for barcode")
    total = sum(b.qty_on_hand for b in med.batches)
    status = compute_stock_status(total, med.min_stock, med.medium_stock)
    return MedicineResponse(
        id=med.id,
        name=med.name,
        category=med.category,
        barcode=med.barcode,
        min_stock=med.min_stock,
        medium_stock=med.medium_stock,
        unit=med.unit,
        description=med.description,
        total_stock=total,
        stock_status=status,
        is_active=med.is_active,
    )


@router.get("/{medicine_id}", response_model=MedicineResponse)
def get_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    med = db.query(Medicine).filter(Medicine.id == medicine_id, Medicine.org_id == current_user.org_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    total = sum(b.qty_on_hand for b in med.batches)
    status = compute_stock_status(total, med.min_stock, med.medium_stock)
    return MedicineResponse(
        id=med.id,
        name=med.name,
        category=med.category,
        barcode=med.barcode,
        min_stock=med.min_stock,
        medium_stock=med.medium_stock,
        unit=med.unit,
        description=med.description,
        total_stock=total,
        stock_status=status,
        is_active=med.is_active,
    )


@router.post("", response_model=MedicineResponse, status_code=201)
def create_medicine(
    payload: MedicineCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    med = Medicine(
        org_id=current_user.org_id,
        name=payload.name,
        category=payload.category,
        barcode=payload.barcode,
        min_stock=payload.min_stock,
        medium_stock=payload.medium_stock,
        unit=payload.unit,
        description=payload.description,
    )
    db.add(med)
    db.commit()
    db.refresh(med)
    return MedicineResponse(
        id=med.id,
        name=med.name,
        category=med.category,
        barcode=med.barcode,
        min_stock=med.min_stock,
        medium_stock=med.medium_stock,
        unit=med.unit,
        description=med.description,
        total_stock=0,
        stock_status="out_of_stock",
        is_active=med.is_active,
    )


@router.put("/{medicine_id}", response_model=MedicineResponse)
def update_medicine(
    medicine_id: int,
    payload: MedicineUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    med = db.query(Medicine).filter(Medicine.id == medicine_id, Medicine.org_id == current_user.org_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(med, field, value)

    db.commit()
    db.refresh(med)
    total = sum(b.qty_on_hand for b in med.batches)
    status = compute_stock_status(total, med.min_stock, med.medium_stock)
    return MedicineResponse(
        id=med.id,
        name=med.name,
        category=med.category,
        barcode=med.barcode,
        min_stock=med.min_stock,
        medium_stock=med.medium_stock,
        unit=med.unit,
        description=med.description,
        total_stock=total,
        stock_status=status,
        is_active=med.is_active,
    )


@router.delete("/{medicine_id}")
def delete_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    med = db.query(Medicine).filter(Medicine.id == medicine_id, Medicine.org_id == current_user.org_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    med.is_active = False
    db.commit()
    return {"message": "Medicine deactivated"}
