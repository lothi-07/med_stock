from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from ..database import get_db
from ..models import Donation, Batch, Medicine, Organization
from ..schemas import DonationCreate, DonationClaim, DonationResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/donations", tags=["donations"])


def donation_to_response(d: Donation, db: Session) -> DonationResponse:
    donor = db.query(Organization).filter(Organization.id == d.org_id_donor).first()
    claimer = db.query(Organization).filter(Organization.id == d.org_id_claimer).first() if d.org_id_claimer else None
    batch = db.query(Batch).filter(Batch.id == d.batch_id).first()

    return DonationResponse(
        id=d.id,
        org_id_donor=d.org_id_donor,
        org_id_claimer=d.org_id_claimer,
        donor_name=donor.name if donor else None,
        claimer_name=claimer.name if claimer else None,
        batch_id=d.batch_id,
        medicine_name=d.medicine_name,
        qty_available=d.qty_available,
        qty_claimed=d.qty_claimed,
        status=d.status,
        notes=d.notes,
        listed_at=d.listed_at,
        claimed_at=d.claimed_at,
        picked_at=d.picked_at,
        completed_at=d.completed_at,
        expiry_date=batch.expiry_date if batch else None,
    )


@router.post("", response_model=DonationResponse, status_code=201)
def create_donation(
    payload: DonationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    batch = (
        db.query(Batch)
        .join(Medicine)
        .filter(Batch.id == payload.batch_id, Medicine.org_id == current_user.org_id)
        .first()
    )
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    if batch.qty_on_hand < payload.qty_available:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot donate more than available ({batch.qty_on_hand})",
        )

    donation = Donation(
        org_id_donor=current_user.org_id,
        batch_id=payload.batch_id,
        medicine_name=payload.medicine_name,
        qty_available=payload.qty_available,
        notes=payload.notes,
    )
    db.add(donation)
    db.commit()
    db.refresh(donation)
    return donation_to_response(donation, db)


@router.get("/available", response_model=List[DonationResponse])
def list_available(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Browse available donations (for NGOs or any org)."""
    donations = (
        db.query(Donation)
        .filter(Donation.status == "listed")
        .order_by(Donation.listed_at.desc())
        .all()
    )
    return [donation_to_response(d, db) for d in donations]


@router.get("/my", response_model=List[DonationResponse])
def my_donations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List donations created by my org."""
    donations = (
        db.query(Donation)
        .filter(Donation.org_id_donor == current_user.org_id)
        .order_by(Donation.listed_at.desc())
        .all()
    )
    return [donation_to_response(d, db) for d in donations]


@router.put("/{donation_id}/claim", response_model=DonationResponse)
def claim_donation(
    donation_id: int,
    payload: DonationClaim,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    if donation.status != "listed":
        raise HTTPException(status_code=400, detail="Donation is not available for claiming")
    if payload.qty_claimed > donation.qty_available:
        raise HTTPException(status_code=400, detail="Claimed quantity exceeds available")

    donation.org_id_claimer = current_user.org_id
    donation.qty_claimed = payload.qty_claimed
    donation.status = "claimed"
    donation.claimed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(donation)
    return donation_to_response(donation, db)


@router.put("/{donation_id}/status")
def update_donation_status(
    donation_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")

    valid_transitions = {
        "claimed": ["picked"],
        "picked": ["completed"],
    }
    allowed = valid_transitions.get(donation.status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from '{donation.status}' to '{new_status}'",
        )

    now = datetime.now(timezone.utc)
    donation.status = new_status
    if new_status == "picked":
        donation.picked_at = now
    elif new_status == "completed":
        donation.completed_at = now
        # Deduct from batch on completion
        batch = db.query(Batch).filter(Batch.id == donation.batch_id).first()
        if batch:
            batch.qty_on_hand = max(0, batch.qty_on_hand - donation.qty_claimed)

    db.commit()
    return {"message": f"Donation status updated to {new_status}"}
