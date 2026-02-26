# PARC Platform (Full Stack)

This repository contains a full-stack platform with:
- **Frontend**: React 18 + Vite (in `frontend/`)
- **Backend**: Django + Django REST Framework + JWT auth (in `backend/`)

## Repo Structure

```text
.
├── backend/                 # Django project
└── frontend/                # React (Vite) app
```

---

## Prerequisites

Install the following on your machine:

### Common
- Git
- (Recommended) VS Code

### Frontend
- **Node.js v16+**
- npm (comes with Node) or yarn

### Backend
- **Python 3.10+** (3.11 also OK)
- pip
- (Recommended) virtualenv / venv

### Database
Backend is configured to use **PostgreSQL**.

You need a running Postgres instance and credentials that match the Django settings (see **Database Setup** below).

---

## 1) Clone the repository

```bash
git clone https://github.com/Punith2590/parcplatformfull.git
cd parcplatformfull
```

---

## 2) Backend Setup (Django)

### 2.1 Create & activate a virtual environment

**macOS / Linux**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

**Windows (PowerShell)**
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 2.2 Install Python dependencies

```bash
pip install -r requirements.txt
```

(From `backend/requirements.txt`: Django, djangorestframework, cors headers, simplejwt, python-dotenv, psycopg2-binary, Pillow.)

---

## 3) Database Setup (PostgreSQL)

The Django settings currently use these values:

- DB Engine: `django.db.backends.postgresql`
- DB Name: `parc_db`
- DB User: `parc_user`
- DB Password: `parc@123`
- DB Host: `localhost`
- DB Port: `5432`

Create a Postgres database and user that match.

Example (using `psql`):
```sql
CREATE USER parc_user WITH PASSWORD 'parc@123';
CREATE DATABASE parc_db OWNER parc_user;
GRANT ALL PRIVILEGES ON DATABASE parc_db TO parc_user;
```

> If your Postgres credentials differ, update `backend/parc_platform/settings.py` accordingly.

---

## 4) Run Backend Migrations + Start Server

From the `backend/` folder (with venv activated):

```bash
python manage.py migrate
python manage.py runserver
```

Backend will run at:
- `http://127.0.0.1:8000/`

Useful endpoints:
- Django admin: `http://127.0.0.1:8000/admin/`
- API base: `http://127.0.0.1:8000/api/`
- JWT token: `http://127.0.0.1:8000/api/token/`
- JWT refresh: `http://127.0.0.1:8000/api/token/refresh/`

---

## 5) Frontend Setup (React + Vite)

### 5.1 Install dependencies

In a new terminal:

```bash
cd frontend
npm install
```

### 5.2 Configure environment variables

The frontend README mentions an env example file.

Create `.env.local` in `frontend/` (or copy from `.env.local.example` if present):

```bash
# from frontend/
cp .env.local.example .env.local
```

Then set at least:

- `VITE_API_BASE_URL` — backend API URL (example: `http://127.0.0.1:8000`)
- `VITE_GEMINI_API_KEY` — Gemini API key (if AI features are used)

Example:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_GEMINI_API_KEY=YOUR_KEY_HERE
```

### 5.3 Start the frontend dev server

```bash
npm run dev
```

Vite will print the local URL (commonly):
- `http://localhost:5173/`

---

## Running the Full Platform (Dev)

You typically run both servers:

### Terminal 1 (Backend)
```bash
cd backend
source .venv/bin/activate   # (or Windows activate)
python manage.py runserver
```

### Terminal 2 (Frontend)
```bash
cd frontend
npm run dev
```

---

## Common Troubleshooting

### 1) Frontend cannot call backend (CORS / wrong base URL)
- Make sure `VITE_API_BASE_URL` points to the backend (`http://127.0.0.1:8000`)
- Ensure Django CORS settings allow the frontend origin (if you see CORS errors)

### 2) Postgres connection errors
- Confirm Postgres is running on `localhost:5432`
- Confirm DB/user/password exist and match Django settings

### 3) Migrations fail
- Ensure database exists and user has permissions
- Re-run:
  ```bash
  python manage.py makemigrations
  python manage.py migrate
  ```

---

## Frontend Scripts

From `frontend/`:
- `npm run dev` — start dev server
- `npm run build` — build for production
- `npm run preview` — preview production build
- `npm run lint` — run ESLint

---

## Contributing

1. Fork the repo
2. Create a branch
3. Make changes
4. Test
5. Open a pull request

---

## License

Proprietary and confidential.
