# Render Deployment Guide

## Current Issue
The deployment is failing because:
1. Using Gunicorn (WSGI) instead of Daphne (ASGI) for WebSocket support
2. Module import errors
3. Missing database migrations

## Solution

### 1. Update Render Settings

In your Render dashboard, update these settings:

**Build Command:**
```bash
cd backend && pip install -r requirements.txt
```

**Start Command:**
```bash
cd backend && python manage.py migrate && daphne -b 0.0.0.0 -p $PORT backend_project.asgi:application
```

**Pre-Deploy Command (Optional):**
```bash
cd backend && python manage.py migrate
```

### 2. Environment Variables
Make sure these are set in Render:
- `DJANGO_SETTINGS_MODULE`: `backend_project.settings`
- `DB_NAME`: `truck_database`
- `DB_USER`: `truck_database_user`
- `DB_PASSWORD`: `CYEEcKlPMWsmpFVaSLcZ6cW3T9tJq7OC`
- `DB_HOST`: `dpg-d3ds5li4d50c739pfj70-a.oregon-postgres.render.com`
- `DB_PORT`: `5432`

### 3. Alternative: Use render.yaml
You can also use the `render.yaml` file I created, which contains all the configuration.

## Why Daphne instead of Gunicorn?
- Your app uses WebSockets (ASGI)
- Gunicorn only supports WSGI (HTTP only)
- Daphne supports both HTTP and WebSockets (ASGI)
