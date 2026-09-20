from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date, timedelta, timezone

from ..database import get_db
from ..models import Alert, Medicine, Batch
from ..schemas import AlertResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=List[AlertResponse])
def list_alerts(
    alert_type: str = None,
    unread_only: bool = False,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Alert).filter(Alert.org_id == current_user.org_id)
    if alert_type:
        query = query.filter(Alert.type == alert_type)
    if unread_only:
        query = query.filter(Alert.is_read == False)
    alerts = query.order_by(Alert.is_read.asc(), Alert.created_at.desc()).limit(limit).all()
    return [AlertResponse(
        id=a.id,
        type=a.type,
        message=a.message,
        is_read=a.is_read,
        medicine_id=a.medicine_id,
        batch_id=a.batch_id,
        created_at=a.created_at,
    ) for a in alerts]


@router.get("/count")
def unread_count(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    count = db.query(Alert).filter(
        Alert.org_id == current_user.org_id,
        Alert.is_read == False,
    ).count()
    return {"unread_count": count}


@router.put("/{alert_id}/read")
def mark_read(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    alert = db.query(Alert).filter(
        Alert.id == alert_id,
        Alert.org_id == current_user.org_id,
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    return {"message": "Alert marked as read"}


@router.put("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db.query(Alert).filter(
        Alert.org_id == current_user.org_id,
        Alert.is_read == False,
    ).update({Alert.is_read: True})
    db.commit()
    return {"message": "All alerts marked as read"}


@router.post("/generate")
def generate_alerts(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Scan all medicines/batches and generate alerts for the org."""
    org_id = current_user.org_id
    now = datetime.now(timezone.utc)
    today = date.today()
    generated = 0

    # Clear old unread alerts to avoid duplicates
    db.query(Alert).filter(
        Alert.org_id == org_id,
        Alert.is_read == False,
    ).delete()

    medicines = db.query(Medicine).filter(
        Medicine.org_id == org_id,
        Medicine.is_active == True,
    ).all()

    for med in medicines:
        total_stock = sum(b.qty_on_hand for b in med.batches)

        # Out of stock
        if total_stock <= 0:
            db.add(Alert(
                org_id=org_id, type="out_of_stock", medicine_id=med.id,
                message=f"⚫ OUT OF STOCK: {med.name} has 0 {med.unit} remaining",
                created_at=now,
            ))
            generated += 1

        # Low stock
        elif total_stock < med.min_stock:
            db.add(Alert(
                org_id=org_id, type="low_stock", medicine_id=med.id,
                message=f"🔴 LOW STOCK: {med.name} has {total_stock} {med.unit} (min: {med.min_stock})",
                created_at=now,
            ))
            generated += 1

        # Medium stock
        elif total_stock <= med.medium_stock:
            db.add(Alert(
                org_id=org_id, type="medium_stock", medicine_id=med.id,
                message=f"🟡 MEDIUM STOCK: {med.name} has {total_stock} {med.unit} (threshold: {med.medium_stock})",
                created_at=now,
            ))
            generated += 1

        # Expiry alerts per batch
        for batch in med.batches:
            if batch.qty_on_hand <= 0:
                continue
            days_left = (batch.expiry_date - today).days
            if days_left < 0:
                db.add(Alert(
                    org_id=org_id, type="expiry", medicine_id=med.id, batch_id=batch.id,
                    message=f"⛔ EXPIRED: {med.name} batch {batch.batch_no} expired on {batch.expiry_date} ({batch.qty_on_hand} {med.unit} remaining)",
                    created_at=now,
                ))
                generated += 1
            elif days_left <= 7:
                db.add(Alert(
                    org_id=org_id, type="expiry", medicine_id=med.id, batch_id=batch.id,
                    message=f"🔴 EXPIRING IN {days_left} DAYS: {med.name} batch {batch.batch_no} expires {batch.expiry_date} ({batch.qty_on_hand} {med.unit})",
                    created_at=now,
                ))
                generated += 1
            elif days_left <= 14:
                db.add(Alert(
                    org_id=org_id, type="expiry", medicine_id=med.id, batch_id=batch.id,
                    message=f"🟠 EXPIRING IN {days_left} DAYS: {med.name} batch {batch.batch_no} expires {batch.expiry_date} ({batch.qty_on_hand} {med.unit})",
                    created_at=now,
                ))
                generated += 1
            elif days_left <= 30:
                db.add(Alert(
                    org_id=org_id, type="expiry", medicine_id=med.id, batch_id=batch.id,
                    message=f"🟡 EXPIRING IN {days_left} DAYS: {med.name} batch {batch.batch_no} expires {batch.expiry_date} ({batch.qty_on_hand} {med.unit})",
                    created_at=now,
                ))
                generated += 1

    db.commit()
    return {"message": f"Generated {generated} alerts"}
