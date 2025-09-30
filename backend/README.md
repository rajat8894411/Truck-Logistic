# Backend - Trucking Logistics Management System

Django REST API backend for the trucking logistics management system.

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run migrations:**
   ```bash
   python3 manage.py migrate
   ```

4. **Create sample data:**
   ```bash
   python3 manage.py create_sample_data
   ```

5. **Start server:**
   ```bash
   python3 manage.py runserver
   ```

## API Documentation

- **API Docs**: [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
- **Base URL**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/

## Project Structure

```
backend/
├── manage.py
├── requirements.txt
├── .env.example
├── core/                   # Main Django app
│   ├── models.py          # Database models
│   ├── views.py           # API views
│   ├── serializers.py     # Data serializers
│   ├── urls.py           # URL patterns
│   ├── admin.py          # Admin configuration
│   ├── consumers.py      # WebSocket consumers
│   └── management/       # Custom commands
├── backend_project/       # Django project settings
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
└── docs/                 # Documentation
    └── API_DOCUMENTATION.md
```

## Features

- **User Management**: Admin and Truck Owner roles
- **Truck Management**: Register and manage trucks
- **Requirement Posting**: Post transport requirements
- **Bidding System**: Bid on requirements
- **Order Management**: Complete order lifecycle
- **Real-time Tracking**: WebSocket location tracking
- **Dashboard APIs**: Role-based statistics
- **Notifications**: Real-time notifications

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
SECRET_KEY=your-django-secret-key-here
DEBUG=True
DB_NAME=trucking_logistics
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432
REDIS_URL=redis://localhost:6379/1
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

## Demo Credentials

- **Admin**: admin1 / admin123
- **Truck Owner**: truck_owner1 / user123

## Development

- **Database**: SQLite (development), PostgreSQL (production)
- **Cache**: Redis for WebSocket channels
- **Authentication**: JWT tokens
- **API**: Django REST Framework
- **WebSockets**: Django Channels
