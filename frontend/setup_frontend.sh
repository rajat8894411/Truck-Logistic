#!/bin/bash

# Trucking Logistics Frontend Setup Script
echo "=== Trucking Logistics Frontend Setup ==="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Node.js version: $(node --version)"
echo "📦 npm version: $(npm --version)"
echo ""

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the frontend directory"
    exit 1
fi

# Install dependencies
echo "📚 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating environment file..."
    echo "REACT_APP_API_BASE_URL=http://127.0.0.1:8000/api" > .env
    echo "REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here" >> .env
    echo "📝 Please update .env file with your Google Maps API key if needed"
fi

echo ""
echo "✅ Frontend setup complete!"
echo ""
echo "🚀 To start the development server:"
echo "   npm start"
echo ""
echo "📱 The application will be available at: http://localhost:3000"
echo "🔗 Make sure the Django backend is running at: http://127.0.0.1:8000"
echo ""
echo "🔐 Demo Login Credentials:"
echo "   Admin: admin1 / admin123"
echo "   Truck Owner: truck_owner1 / user123"
echo ""
