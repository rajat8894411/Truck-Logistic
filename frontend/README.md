# Frontend - Trucking Logistics Management System

React frontend for the trucking logistics management system.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Documentation

- **Frontend Guide**: [FRONTEND_COMPLETE.md](docs/FRONTEND_COMPLETE.md)
- **Live URL**: http://localhost:3000

## Project Structure

```
frontend/
├── public/                 # Static files
├── src/
│   ├── components/        # Reusable components
│   │   ├── common/       # Common components
│   │   ├── forms/        # Form components
│   │   └── layout/       # Layout components
│   ├── pages/            # Page components
│   │   ├── admin/        # Admin pages
│   │   └── orders/       # Order pages
│   ├── services/         # API services
│   ├── contexts/         # React contexts
│   ├── hooks/           # Custom hooks
│   └── assets/          # Images and assets
├── package.json
├── .env.example
└── docs/                # Documentation
    └── FRONTEND_COMPLETE.md
```

## Features

- **Responsive Design**: Mobile-first approach
- **Real-time Tracking**: WebSocket integration
- **Interactive Maps**: Leaflet map integration
- **Role-based UI**: Different views for Admin/Truck Owner
- **Authentication**: JWT-based auth
- **State Management**: React Context API
- **Modern UI**: Clean and intuitive interface

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
REACT_APP_API_BASE_URL=http://localhost:8000/api
REACT_APP_WS_BASE_URL=ws://localhost:8000/ws
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Technologies Used

- **React 18** - Frontend framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Leaflet** - Interactive maps
- **WebSocket** - Real-time communication
- **CSS3** - Styling
- **JavaScript ES6+** - Modern JavaScript

## Demo Credentials

- **Admin**: admin1 / admin123
- **Truck Owner**: truck_owner1 / user123