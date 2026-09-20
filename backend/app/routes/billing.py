from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone, date

from ..database import get_db
from ..models import Bill, BillItem, Batch, Medicine
from ..schemas import BillCreate, BillResponse, BillItemResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/bills", tags=["billing"])


def generate_bill_number(db: Session, org_id: int) -> str:
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    prefix = f"MS-{org_id}-{today}"
    count = db.query(Bill).filter(Bill.bill_number.like(f"{prefix}%")).count()
    return f"{prefix}-{count + 1:04d}"


@router.post("", response_model=BillResponse, status_code=201)
def create_bill(
    payload: BillCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Bill must have at least one item")

    bill_number = generate_bill_number(db, current_user.org_id)
    total = 0.0

    # Validate all items first
    for item in payload.items:
        batch = (
            db.query(Batch)
            .join(Medicine)
            .filter(
                Batch.id == item.batch_id,
                Medicine.org_id == current_user.org_id,
            )
            .first()
        )
        if not batch:
            raise HTTPException(
                status_code=404,
                detail=f"Batch {item.batch_id} not found",
            )
        if batch.qty_on_hand < item.qty_sold:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for batch {batch.batch_no}. Available: {batch.qty_on_hand}, Requested: {item.qty_sold}",
            )
        if batch.expiry_date < date.today():
            raise HTTPException(
                status_code=400,
                detail=f"Batch {batch.batch_no} has expired on {batch.expiry_date}",
            )

    # Create bill
    bill = Bill(
        org_id=current_user.org_id,
        user_id=current_user.id,
        bill_number=bill_number,
        customer_name=payload.customer_name or "Walk-in",
        discount=payload.discount,
    )
    db.add(bill)
    db.flush()

    # Create items and deduct stock
    bill_items = []
    for item in payload.items:
        batch = db.query(Batch).filter(Batch.id == item.batch_id).first()
        line_total = (item.unit_price * item.qty_sold) - item.discount
        total += line_total

        bill_item = BillItem(
            bill_id=bill.id,
            batch_id=item.batch_id,
            medicine_id=item.medicine_id,
            medicine_name=item.medicine_name,
            batch_no=item.batch_no,
            qty_sold=item.qty_sold,
            unit_price=item.unit_price,
            discount=item.discount,
            line_total=line_total,
        )
        db.add(bill_item)

        # FEFO: deduct stock from selected batch
        batch.qty_on_hand -= item.qty_sold

        bill_items.append(BillItemResponse(
            id=0,  # Will be set after commit
            medicine_name=item.medicine_name,
            batch_no=item.batch_no,
            qty_sold=item.qty_sold,
            unit_price=item.unit_price,
            discount=item.discount,
            line_total=line_total,
        ))

    bill.total_amount = total
    bill.net_amount = total - payload.discount
    db.commit()
    db.refresh(bill)

    return BillResponse(
        id=bill.id,
        bill_number=bill.bill_number,
        customer_name=bill.customer_name,
        total_amount=bill.total_amount,
        discount=bill.discount,
        net_amount=bill.net_amount,
        created_at=bill.created_at,
        items=[BillItemResponse(
            id=bi.id,
            medicine_name=bi.medicine_name,
            batch_no=bi.batch_no,
            qty_sold=bi.qty_sold,
            unit_price=bi.unit_price,
            discount=bi.discount,
            line_total=bi.line_total,
        ) for bi in bill.items],
        user_name=current_user.name,
    )


@router.get("", response_model=List[BillResponse])
def list_bills(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Bill).filter(Bill.org_id == current_user.org_id)

    if date_from:
        query = query.filter(Bill.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(Bill.created_at <= datetime.fromisoformat(date_to))

    bills = query.order_by(Bill.created_at.desc()).limit(limit).all()

    return [
        BillResponse(
            id=b.id,
            bill_number=b.bill_number,
            customer_name=b.customer_name,
            total_amount=b.total_amount,
            discount=b.discount,
            net_amount=b.net_amount,
            created_at=b.created_at,
            items=[BillItemResponse(
                id=bi.id,
                medicine_name=bi.medicine_name,
                batch_no=bi.batch_no,
                qty_sold=bi.qty_sold,
                unit_price=bi.unit_price,
                discount=bi.discount,
                line_total=bi.line_total,
            ) for bi in b.items],
            user_name=b.user.name if b.user else None,
        )
        for b in bills
    ]


@router.get("/{bill_id}", response_model=BillResponse)
def get_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    bill = db.query(Bill).filter(Bill.id == bill_id, Bill.org_id == current_user.org_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    return BillResponse(
        id=bill.id,
        bill_number=bill.bill_number,
        customer_name=bill.customer_name,
        total_amount=bill.total_amount,
        discount=bill.discount,
        net_amount=bill.net_amount,
        created_at=bill.created_at,
        items=[BillItemResponse(
            id=bi.id,
            medicine_name=bi.medicine_name,
            batch_no=bi.batch_no,
            qty_sold=bi.qty_sold,
            unit_price=bi.unit_price,
            discount=bi.discount,
            line_total=bi.line_total,
        ) for bi in bill.items],
        user_name=bill.user.name if bill.user else None,
    )
