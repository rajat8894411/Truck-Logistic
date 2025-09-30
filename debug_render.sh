#!/bin/bash
echo "=== RENDER DEBUG SCRIPT ==="
echo "Current directory: $(pwd)"
echo "Contents of current directory:"
ls -la
echo ""
echo "Checking if backend directory exists:"
if [ -d "backend" ]; then
    echo "✅ backend directory exists"
    echo "Contents of backend directory:"
    ls -la backend/
    echo ""
    echo "Checking if manage.py exists:"
    if [ -f "backend/manage.py" ]; then
        echo "✅ manage.py exists"
    else
        echo "❌ manage.py not found"
    fi
else
    echo "❌ backend directory does not exist"
    echo "Available directories:"
    find . -type d -maxdepth 2
fi
