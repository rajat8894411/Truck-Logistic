#!/bin/bash

# Trucking Logistics Backend Setup Script
echo "=== Trucking Logistics Backend Setup ==="
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "📚 Installing Python packages..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating environment file..."
    cp .env.example .env
    echo "📝 Please update .env file with your settings"
fi

# Run migrations
echo "🗄️  Running database migrations..."
python manage.py makemigrations
python manage.py migrate

# Create superuser if it doesn't exist
echo "👤 Creating superuser..."
python manage.py shell -c "
from core.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123', role='admin')
    print('Superuser created: admin / admin123')
else:
    print('Superuser already exists: admin / admin123')
"

# Create sample data
echo "📊 Creating sample data..."
python manage.py create_sample_data

echo ""
echo "✅ Backend setup complete!"
echo ""
echo "🚀 To start the development server:"
echo "   python manage.py runserver"
echo ""
echo "🔐 Login credentials:"
echo "   Superuser: admin / admin123"
echo "   Admin users: admin1, admin2 / admin123"
echo "   Truck owners: truck_owner1, truck_owner2, etc. / user123"
echo ""
echo "📱 API Base URL: http://127.0.0.1:8000/api/"
echo "🔧 Admin Panel: http://127.0.0.1:8000/admin/"
echo ""
