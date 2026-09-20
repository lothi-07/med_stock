from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, date, timedelta, timezone
import csv
import io

from ..database import get_db
from ..models import Medicine, Batch, Bill, BillItem, Alert
from ..schemas import DashboardStats, BatchResponse
from ..auth import get_current_user
from .batches import batch_to_response

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/dashboard", response_model=DashboardStats)
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    org_id = current_user.org_id
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())

    # Total SKUs
    total_skus = db.query(Medicine).filter(
        Medicine.org_id == org_id, Medicine.is_active == True
    ).count()

    # Expiring batches counts
    medicines = db.query(Medicine).filter(
        Medicine.org_id == org_id, Medicine.is_active == True
    ).all()

    expiring_7 = 0
    expiring_14 = 0
    expiring_30 = 0
    low_stock = 0
    out_of_stock = 0
    total_stock_value = 0.0
    waste_prevented = 0.0

    for med in medicines:
        total = sum(b.qty_on_hand for b in med.batches)
        if total <= 0:
            out_of_stock += 1
        elif total < med.min_stock:
            low_stock += 1

        for batch in med.batches:
            if batch.qty_on_hand > 0:
                total_stock_value += batch.qty_on_hand * batch.mrp
                days_left = (batch.expiry_date - today).days
                if 0 <= days_left <= 7:
                    expiring_7 += 1
                if 0 <= days_left <= 14:
                    expiring_14 += 1
                if 0 <= days_left <= 30:
                    expiring_30 += 1

    # Today's sales
    today_bills = db.query(Bill).filter(
        Bill.org_id == org_id,
        Bill.created_at >= today_start,
    ).all()
    today_sales_count = len(today_bills)
    today_sales_amount = sum(b.net_amount for b in today_bills)

    # Waste prevented: value of bill items that used near-expiry batches (<=30 days)
    for bill in today_bills:
        for item in bill.items:
            batch = db.query(Batch).filter(Batch.id == item.batch_id).first()
            if batch:
                days_left = (batch.expiry_date - today).days
                if days_left <= 30:
                    waste_prevented += item.line_total

    return DashboardStats(
        total_skus=total_skus,
        expiring_soon_30=expiring_30,
        expiring_soon_14=expiring_14,
        expiring_soon_7=expiring_7,
        low_stock_count=low_stock,
        out_of_stock_count=out_of_stock,
        today_sales_count=today_sales_count,
        today_sales_amount=round(today_sales_amount, 2),
        waste_prevented_value=round(waste_prevented, 2),
        total_stock_value=round(total_stock_value, 2),
    )


@router.get("/top-movers")
def top_movers(
    days: int = 7,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    results = (
        db.query(
            BillItem.medicine_name,
            func.sum(BillItem.qty_sold).label("total_sold"),
            func.sum(BillItem.line_total).label("total_revenue"),
        )
        .join(Bill)
        .filter(Bill.org_id == current_user.org_id, Bill.created_at >= cutoff)
        .group_by(BillItem.medicine_name)
        .order_by(func.sum(BillItem.qty_sold).desc())
        .limit(limit)
        .all()
    )
    return [
        {"medicine_name": r[0], "total_sold": r[1], "total_revenue": round(r[2], 2)}
        for r in results
    ]


@router.get("/export/inventory")
def export_inventory(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    medicines = db.query(Medicine).filter(
        Medicine.org_id == current_user.org_id,
        Medicine.is_active == True,
    ).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Medicine", "Category", "Barcode", "Unit", "Min Stock", "Medium Stock",
        "Batch No", "Expiry Date", "Qty Received", "Qty On Hand", "MRP", "Purchase Price",
    ])

    for med in medicines:
        for batch in med.batches:
            writer.writerow([
                med.name, med.category or "", med.barcode or "", med.unit,
                med.min_stock, med.medium_stock,
                batch.batch_no, batch.expiry_date.isoformat(),
                batch.qty_received, batch.qty_on_hand,
                batch.mrp, batch.purchase_price,
            ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=inventory_{date.today().isoformat()}.csv"},
    )


@router.get("/export/sales")
def export_sales(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Bill).filter(Bill.org_id == current_user.org_id)
    if date_from:
        query = query.filter(Bill.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(Bill.created_at <= datetime.fromisoformat(date_to))

    bills = query.order_by(Bill.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Bill Number", "Date", "Customer", "Medicine", "Batch",
        "Qty", "Unit Price", "Discount", "Line Total", "Bill Total",
    ])

    for bill in bills:
        for item in bill.items:
            writer.writerow([
                bill.bill_number,
                bill.created_at.strftime("%Y-%m-%d %H:%M"),
                bill.customer_name,
                item.medicine_name,
                item.batch_no,
                item.qty_sold,
                item.unit_price,
                item.discount,
                item.line_total,
                bill.net_amount,
            ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=sales_{date.today().isoformat()}.csv"},
    )
