# Trucking Logistics Management System

A comprehensive trucking logistics management system built with Django REST Framework and React.

## Project Structure

```
trucking_latest_logistics/
├── backend/                    # Django backend
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── README.md
│   ├── core/                   # Django app
│   ├── backend_project/        # Django project settings
│   └── docs/                   # Backend documentation
│       └── API_DOCUMENTATION.md
├── frontend/                   # React frontend
│   ├── src/
│   ├── package.json
│   ├── .env.example
│   ├── README.md
│   └── docs/                   # Frontend documentation
│       └── FRONTEND_COMPLETE.md
├── PROJECT_SUMMARY.md          # Project overview
└── README.md                   # This file
```

## Features

- **User Management**: Admin and Truck Owner roles
- **Truck Management**: Register and manage trucks
- **Requirement Posting**: Admins can post transport requirements
- **Bidding System**: Truck owners can bid on requirements
- **Order Management**: Complete order lifecycle management
- **Real-time Tracking**: WebSocket-based location tracking
- **Dashboard**: Role-based dashboards with statistics
- **Notifications**: Real-time notifications system

## Quick Start

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Setup environment:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run migrations:
   ```bash
   python3 manage.py migrate
   ```

5. Create sample data:
   ```bash
   python3 manage.py create_sample_data
   ```

6. Start the server:
   ```bash
   python3 manage.py runserver
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Setup environment:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/

## Demo Credentials

- **Admin**: admin1 / admin123
- **Truck Owner**: truck_owner1 / user123

## Documentation

- **Project Overview**: [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
- **Backend API**: [backend/docs/API_DOCUMENTATION.md](backend/docs/API_DOCUMENTATION.md)
- **Frontend Guide**: [frontend/docs/FRONTEND_COMPLETE.md](frontend/docs/FRONTEND_COMPLETE.md)
- **Backend Setup**: [backend/README.md](backend/README.md)
- **Frontend Setup**: [frontend/README.md](frontend/README.md)

## Technologies Used

- **Backend**: Django, Django REST Framework, Django Channels, Redis
- **Frontend**: React, React Router, Axios, Leaflet Maps
- **Database**: SQLite (development), PostgreSQL (production ready)
- **Real-time**: WebSockets for location tracking

## Development

### Backend Development

All backend code is in the `backend/` directory. The Django project structure is:

- `backend/backend/` - Django project settings
- `backend/core/` - Main Django app with all models, views, serializers
- `backend/manage.py` - Django management script

### Frontend Development

All frontend code is in the `frontend/` directory. The React app structure is:

- `frontend/src/` - React source code
- `frontend/src/components/` - Reusable components
- `frontend/src/pages/` - Page components
- `frontend/src/services/` - API services

## License

This project is for educational purposes.
