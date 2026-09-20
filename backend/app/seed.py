"""
Seed demo data for MedStock hackathon demo.
Creates realistic pharmacy inventory with varied expiry dates and stock levels.
"""
from datetime import date, timedelta, datetime, timezone
from sqlalchemy.orm import Session

from .models import Organization, User, Medicine, Batch, Bill, BillItem, Alert
from .auth import hash_password


def seed_data(db: Session):
    """Populate the database with demo data if empty."""
    if db.query(Organization).count() > 0:
        return  # Already seeded

    today = date.today()

    # ── Organizations ──────────────────────────────────────────────────────────
    pharmacy = Organization(
        name="HealthPlus Pharmacy",
        type="pharmacy",
        address="45, Anna Nagar Main Road, Chennai - 600040",
        phone="+91 98765 43210",
        license_no="TN-PH-2024-1234",
    )
    ngo = Organization(
        name="MedAid Foundation",
        type="ngo",
        address="12, Gandhi Street, Adyar, Chennai - 600020",
        phone="+91 98765 43211",
    )
    db.add_all([pharmacy, ngo])
    db.flush()

    # ── Users ──────────────────────────────────────────────────────────────────
    owner = User(
        org_id=pharmacy.id, name="Rajesh Kumar", email="demo.owner@medstock.local",
        password_hash=hash_password("DemoOwner@2026"), role="owner",
    )
    pharmacist = User(
        org_id=pharmacy.id, name="Priya Sharma", email="demo.pharmacist@medstock.local",
        password_hash=hash_password("DemoPharmacist@2026"), role="pharmacist",
    )
    ngo_user = User(
        org_id=ngo.id, name="Sanjay Verma", email="demo.ngo@medstock.local",
        password_hash=hash_password("DemoNgo@2026"), role="owner",
    )
    db.add_all([owner, pharmacist, ngo_user])
    db.flush()

    # ── Medicines ──────────────────────────────────────────────────────────────
    meds_data = [
        # (name, category, barcode, min_stock, medium_stock, unit)
        ("Paracetamol 500mg", "Painkillers", "8901234560001", 20, 50, "strips"),
        ("Amoxicillin 250mg", "Antibiotics", "8901234560002", 15, 40, "strips"),
        ("Cetirizine 10mg", "Antihistamines", "8901234560003", 10, 30, "strips"),
        ("Metformin 500mg", "Diabetes", "8901234560004", 25, 60, "strips"),
        ("ORS Sachets", "OTC", "8901234560005", 30, 80, "sachets"),
        ("Azithromycin 500mg", "Antibiotics", "8901234560006", 10, 25, "strips"),
        ("Omeprazole 20mg", "Gastrointestinal", "8901234560007", 15, 40, "capsules"),
        ("Ibuprofen 400mg", "Painkillers", "8901234560008", 20, 50, "strips"),
        ("Atorvastatin 10mg", "Cardiovascular", "8901234560009", 10, 30, "strips"),
        ("Vitamin D3 60K", "Vitamins", "8901234560010", 10, 25, "sachets"),
        ("Cough Syrup (Benadryl)", "OTC", "8901234560011", 8, 20, "bottles"),
        ("Dolo 650", "Painkillers", "8901234560012", 30, 80, "strips"),
        ("Pan-D Capsule", "Gastrointestinal", "8901234560013", 15, 35, "capsules"),
        ("Ciprofloxacin 500mg", "Antibiotics", "8901234560014", 10, 25, "strips"),
        ("Montelukast 10mg", "Respiratory", "8901234560015", 10, 30, "strips"),
        ("Amlodipine 5mg", "Cardiovascular", "8901234560016", 15, 40, "strips"),
        ("B-Complex", "Vitamins", "8901234560017", 10, 30, "strips"),
        ("Ranitidine 150mg", "Gastrointestinal", "8901234560018", 15, 35, "strips"),
        ("Diclofenac Gel", "Topical", "8901234560019", 5, 15, "tubes"),
        ("Betadine Solution", "Topical", "8901234560020", 5, 15, "bottles"),
    ]

    medicines = []
    for name, cat, barcode, min_s, med_s, unit in meds_data:
        med = Medicine(
            org_id=pharmacy.id, name=name, category=cat, barcode=barcode,
            min_stock=min_s, medium_stock=med_s, unit=unit,
        )
        db.add(med)
        medicines.append(med)
    db.flush()

    # ── Batches (with varied expiry dates for demo) ────────────────────────────
    batches_data = [
        # (medicine_index, batch_no, expiry_offset_days, qty, mrp, purchase_price)
        # Paracetamol - multiple batches, one expiring soon
        (0, "PCM-2024-A", 5, 15, 35.0, 28.0),       # Expiring in 5 days!
        (0, "PCM-2024-B", 90, 50, 35.0, 28.0),       # Good stock
        (0, "PCM-2025-A", 180, 100, 36.0, 29.0),     # Fresh batch

        # Amoxicillin - low stock
        (1, "AMX-2024-A", 12, 5, 85.0, 65.0),        # Expiring in 12 days, low qty
        (1, "AMX-2025-A", 200, 8, 88.0, 68.0),       # Low qty

        # Cetirizine - good stock
        (2, "CET-2025-A", 150, 40, 25.0, 18.0),

        # Metformin - medium stock
        (3, "MET-2024-A", 25, 20, 45.0, 35.0),       # Expiring in 25 days
        (3, "MET-2025-A", 300, 15, 48.0, 38.0),

        # ORS - out of stock
        (4, "ORS-2024-A", -5, 0, 22.0, 15.0),        # Expired, 0 qty

        # Azithromycin
        (5, "AZT-2025-A", 120, 18, 95.0, 72.0),
        (5, "AZT-2025-B", 250, 25, 98.0, 75.0),

        # Omeprazole - expiring very soon
        (6, "OMP-2024-A", 3, 30, 55.0, 42.0),        # 3 days to expiry!
        (6, "OMP-2025-A", 180, 45, 58.0, 45.0),

        # Ibuprofen
        (7, "IBU-2025-A", 200, 60, 30.0, 22.0),

        # Atorvastatin - low stock, near expiry
        (8, "ATV-2024-A", 7, 3, 120.0, 90.0),        # 7 days, only 3 left!
        (8, "ATV-2025-A", 365, 20, 125.0, 95.0),

        # Vitamin D3
        (9, "VD3-2025-A", 180, 30, 140.0, 105.0),

        # Cough Syrup - medium stock
        (10, "BEN-2025-A", 90, 12, 110.0, 85.0),

        # Dolo 650 - high volume
        (11, "DOL-2024-A", 14, 25, 32.0, 24.0),      # Expiring in 14 days
        (11, "DOL-2025-A", 300, 80, 34.0, 26.0),

        # Pan-D
        (12, "PND-2025-A", 200, 35, 75.0, 58.0),

        # Ciprofloxacin
        (13, "CIP-2025-A", 150, 20, 65.0, 48.0),

        # Montelukast
        (14, "MNT-2025-A", 250, 22, 90.0, 68.0),

        # Amlodipine
        (15, "AML-2024-A", 28, 10, 42.0, 32.0),      # Expiring in 28 days
        (15, "AML-2025-A", 365, 35, 45.0, 35.0),

        # B-Complex - low stock
        (16, "BCX-2025-A", 180, 6, 38.0, 28.0),

        # Ranitidine
        (17, "RAN-2025-A", 200, 40, 28.0, 20.0),

        # Diclofenac Gel
        (18, "DIC-2025-A", 300, 10, 85.0, 62.0),

        # Betadine
        (19, "BET-2025-A", 250, 8, 95.0, 70.0),
    ]

    batches = []
    for med_idx, batch_no, days_offset, qty, mrp, pp in batches_data:
        batch = Batch(
            medicine_id=medicines[med_idx].id,
            batch_no=batch_no,
            expiry_date=today + timedelta(days=days_offset),
            qty_received=qty + 20,  # They received more, some sold
            qty_on_hand=qty,
            mrp=mrp,
            purchase_price=pp,
        )
        db.add(batch)
        batches.append(batch)
    db.flush()

    # ── Sample Bills ───────────────────────────────────────────────────────────
    now = datetime.now(timezone.utc)

    for i in range(5):
        bill = Bill(
            org_id=pharmacy.id, user_id=pharmacist.id,
            bill_number=f"MS-1-{today.strftime('%Y%m%d')}-{i+1:04d}",
            customer_name=["Walk-in", "Arun Kumar", "Meena S", "Karthik R", "Lakshmi V"][i],
            total_amount=0, discount=0, net_amount=0,
            created_at=now - timedelta(hours=i * 2),
        )
        db.add(bill)
        db.flush()

        items_list = [
            # bill_index: [(batch_index, qty, unit_price)]
            [(1, 2, 35.0), (5, 1, 25.0)],
            [(10, 3, 95.0)],
            [(13, 2, 30.0), (17, 1, 75.0)],
            [(7, 1, 45.0), (9, 2, 140.0)],
            [(19, 1, 32.0), (5, 1, 25.0)],
        ]

        total = 0
        for batch_idx, qty, price in items_list[i]:
            if batch_idx < len(batches):
                line_total = price * qty
                total += line_total
                item = BillItem(
                    bill_id=bill.id,
                    batch_id=batches[batch_idx].id,
                    medicine_id=batches[batch_idx].medicine_id,
                    medicine_name=medicines[batches_data[batch_idx][0]].name,
                    batch_no=batches[batch_idx].batch_no,
                    qty_sold=qty,
                    unit_price=price,
                    discount=0,
                    line_total=line_total,
                )
                db.add(item)

        bill.total_amount = total
        bill.net_amount = total

    # ── Sample Alerts ──────────────────────────────────────────────────────────
    alerts_data = [
        ("low_stock", medicines[1].id, None,
         f"🔴 LOW STOCK: {medicines[1].name} has 13 strips (min: 15)"),
        ("expiry", medicines[0].id, batches[0].id,
         f"🔴 EXPIRING IN 5 DAYS: {medicines[0].name} batch {batches[0].batch_no} expires {batches[0].expiry_date}"),
        ("expiry", medicines[6].id, batches[11].id,
         f"🔴 EXPIRING IN 3 DAYS: {medicines[6].name} batch {batches[11].batch_no} expires {batches[11].expiry_date}"),
        ("out_of_stock", medicines[4].id, None,
         f"⚫ OUT OF STOCK: {medicines[4].name} has 0 sachets remaining"),
        ("expiry", medicines[8].id, batches[14].id,
         f"🔴 EXPIRING IN 7 DAYS: {medicines[8].name} batch {batches[14].batch_no} — only 3 strips left!"),
        ("medium_stock", medicines[10].id, None,
         f"🟡 MEDIUM STOCK: {medicines[10].name} has 12 bottles (threshold: 20)"),
    ]

    for atype, med_id, batch_id, msg in alerts_data:
        db.add(Alert(
            org_id=pharmacy.id, type=atype, medicine_id=med_id,
            batch_id=batch_id, message=msg, created_at=now,
        ))

    db.commit()
    print("[SUCCESS] Demo data seeded successfully!")
