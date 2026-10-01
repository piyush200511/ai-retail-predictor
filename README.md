# AI Retail Demand & Inventory Predictor

A full-stack retail intelligence platform with **ML-powered demand forecasting**, **inventory management**, **sales & purchases**, and **real-time analytics**.

> Built as a Python Full-Stack Internship Project (Team 2)

---

## 🎯 Key Features

| Module | Description |
|--------|-------------|
| **Authentication** | JWT-based auth with 5-role RBAC (Admin, Inventory Mgr, Sales Mgr, Purchase Mgr, Analyst) |
| **Master Data** | Products, Categories, Brands, Units, Suppliers, Warehouses |
| **Inventory** | Atomic stock updates, immutable movement ledger, row-level locking |
| **Purchases** | Purchase Orders → Submit → Approve → Receive (Goods Receipt) |
| **Sales** | Sales Orders → Confirm (reserve) → Complete (deduct) → Return |
| **Transfers** | Warehouse-to-warehouse with state machine |
| **Alerts** | Auto low-stock / stock-out / overstock detection |
| **ML Forecasting** | Random Forest, Exponential Smoothing, Moving Average |
| **Reorder Recs** | ROP + SOQ with urgency scoring + explainability |
| **Analytics** | KPIs, sales trend, top products, inventory distribution |
| **Reports** | CSV exports for sales, inventory, movements, forecasts |

---

## 🧠 Tech Stack

**Backend**
- Python 3.11+
- Django 4.2 + Django REST Framework
- SimpleJWT for auth
- MySQL 8.x
- pandas, numpy, scikit-learn, statsmodels (ML)
- drf-spectacular (OpenAPI docs)

**Frontend**
- React 18 + Vite
- React Router v6
- Tailwind CSS 3
- Axios (with JWT interceptor + auto-refresh)
- Recharts (visualizations)
- lucide-react (icons)

**DevOps**
- Docker + docker-compose
- Nginx (production frontend serve)
- Gunicorn (production backend)

---

## 🗂️ Project Structure
ai-retail-predictor/
├── backend/
│ ├── apps/
│ │ ├── authentication/ # User + JWT + RBAC
│ │ ├── products/ # Product master data
│ │ ├── suppliers/ # Supplier master data
│ │ ├── warehouses/ # Warehouse + assignments
│ │ ├── inventory/ # Stock + movements + transfers
│ │ ├── purchases/ # Purchase orders + receipts
│ │ ├── sales/ # Sales orders + customers
│ │ ├── alerts/ # Inventory alerts
│ │ ├── forecasting/ # Demand history + forecasts
│ │ ├── analytics/ # KPI aggregations
│ │ └── reports/ # CSV exports
│ ├── ml_engine/
│ │ ├── pipelines/ # Data + forecast pipeline
│ │ └── models/ # 4 forecasting models
│ ├── config/ # Django settings + URLs
│ ├── manage.py
│ └── requirements.txt
├── frontend/
│ ├── src/
│ │ ├── api/ # Axios client + endpoints
│ │ ├── components/ # Reusable UI
│ │ ├── context/ # Auth context
│ │ ├── layouts/ # App shell
│ │ └── pages/ # 11 feature pages
│ └── package.json
├── docker-compose.yml
└── README.md

TEXT
---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 18+
- MySQL 8.x

### 1. Clone + setup database

```sql
CREATE DATABASE ai_retail_predictor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'retail_user'@'localhost' IDENTIFIED BY 'Retail@123';
GRANT ALL PRIVILEGES ON ai_retail_predictor.* TO 'retail_user'@'localhost';
FLUSH PRIVILEGES;


2..BACKEND --->>>>

cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate      # Mac/Linux

pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

Backend: http://127.0.0.1:8000

3..FRONTEND ---->>>>

cd frontend
npm install
npm run dev
Frontend: http://localhost:5173


4. Login
Use your superuser credentials, or create demo users via Django admin.

🐳 Docker (Production-like)
bash
docker compose up --build
Frontend: http://localhost:5173

Backend: http://localhost:8000


5...API---->>>

Full API docs: http://127.0.0.1:8000/api/docs/

6...
🧪 Testing
bash
# Backend
cd backend
python manage.py test

# Frontend
cd frontend
npm run build   # verify production build