# MedStock

MedStock is a smart pharmacy inventory and billing system built for the
hackathon. It helps pharmacies reduce medicine wastage through FEFO
(First-Expiry-First-Out) dispensing, expiry and stock alerts, billing,
reporting, and surplus medicine donations to verified NGOs.

## Features

- Pharmacy operations dashboard
- FEFO-aware billing and point of sale
- Medicine and batch inventory management
- Barcode lookup and scanning support
- Expiry monitoring with T-30/T-14/T-7 alerts
- Low-stock and out-of-stock alerts
- NGO surplus donation marketplace
- Sales, stock, and waste-prevention reports
- CSV inventory and sales exports
- Role-based demo accounts for pharmacy owners, pharmacists, and NGOs

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Tailwind CSS
- Axios
- Recharts
- Lucide React
- HTML5 QR Code

### Backend

- Python
- FastAPI
- SQLAlchemy
- SQLite
- JWT authentication

## Project Structure

```text
HACKDAY/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── seed.py
│   ├── requirements.txt
│   └── medstock.db              # local database, ignored by Git
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── vite.config.js
└── .gitignore
```

## Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer
- npm

## Installation

### Backend

Open PowerShell:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

If the virtual environment does not exist, create it first:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### Frontend

```powershell
cd frontend
npm install
```

## Running the Application

Start the backend in one PowerShell window:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

Start the frontend in a second PowerShell window:

```powershell
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173
```
