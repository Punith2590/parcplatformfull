# PARC Platform

- **Backend:** Django (Python) + **PostgreSQL**
- **Frontend:** React (JavaScript) + Vite (dev server)

This README explains how to set up and run the project **locally in VS Code**.

---

## Prerequisites

Install these first:

- **Git**
- **Python 3.10+** (recommended)
- **Node.js 18+** and **npm**
- **PostgreSQL 14+**
- **VS Code**

Recommended VS Code extensions:

- **Python** (Microsoft)
- **ESLint**
- **Prettier**
- **Django** (optional)
- **PostgreSQL** (optional)

---

## 1) Clone the repository and open in VS Code

```bash
git clone https://github.com/Punith2590/parcplatformfull.git
cd parcplatformfull
code .
```

---

## 2) Open two terminals in VS Code

In VS Code:
- `Terminal` → `New Terminal` (Backend)
- `Terminal` → create a second terminal (Frontend)

You will run **backend** in one terminal and **frontend** in the other.

---

## 3) Backend (Django) setup & run

### 3.1 Go to backend folder

```bash
cd backend
```

### 3.2 Create and activate a virtual environment

**Windows (PowerShell):**
```bash
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

> If PowerShell blocks activation, run PowerShell as admin and execute:
> ```bash
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

### 3.3 Install backend dependencies

```bash
pip install -r requirements.txt
```

### 3.4 Configure environment variables (IMPORTANT)

Most Django + Postgres projects require environment variables (DB credentials, secret key, etc.).

1. Check if there is a file like:
   - `.env.example`
   - `.env.sample`
   - `backend/.env.example`

2. Create a `.env` file (commonly in `backend/`).

Example (adjust names/values to match your project settings):
```env
DJANGO_SECRET_KEY=change-me
DJANGO_DEBUG=True

DB_NAME=parc_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=127.0.0.1
DB_PORT=5432
```

> If your backend uses different variable names, update them to match `backend/settings.py`.

### 3.5 Create a PostgreSQL database

Using psql (example):
```sql
CREATE DATABASE parc_db;
```

Or create it from pgAdmin.

### 3.6 Run migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 3.7 Create a Django admin user (recommended)

```bash
python manage.py createsuperuser
```

### 3.8 Start the backend server

```bash
python manage.py runserver
```

Backend usually runs at:
- http://127.0.0.1:8000/

---

## 4) Frontend (React) setup & run

Open the **second terminal** (keep backend running in the first terminal).

### 4.1 Go to frontend folder

From the repository root:
```bash
cd frontend
```

### 4.2 Install frontend dependencies

```bash
npm install
```

### 4.3 Configure frontend environment variables (if required)

Many Vite/React apps need an API base URL.

Look for:
- `frontend/.env.example`

Common Vite pattern:
```env
VITE_API_URL=http://127.0.0.1:8000
```

### 4.4 Start the frontend dev server

```bash
npm run dev
```

Frontend usually runs at:
- http://localhost:5173/

Open the link shown in the terminal.

---

## 5) Typical development workflow (VS Code)

- Terminal 1:
  - activate venv
  - `python manage.py runserver`
- Terminal 2:
  - `npm run dev`

---

## Troubleshooting

### Port already in use
Run on a different port.

Backend:
```bash
python manage.py runserver 8001
```

Frontend:
```bash
npm run dev -- --port 5174
```

### Django can’t connect to Postgres
Check:
- Postgres is running
- DB name/user/password/host/port match your `.env` and Django settings
- You created the database

### CORS errors (frontend calling backend)
If you see CORS issues, you likely need to allow the frontend origin in Django.
Common allowed origins:
- http://localhost:5173
- http://127.0.0.1:5173

(Exact fix depends on whether the project uses `django-cors-headers`.)

---

## Production notes (optional)
For production deployments you typically:
- build frontend (`npm run build`)
- configure Django for static files, security settings, and production DB
- use a proper server (Gunicorn/Uvicorn + Nginx) rather than `runserver`

---

## Repository structure (expected)

```text
parcplatformfull/
  backend/   # Django project
  frontend/  # React app
```
