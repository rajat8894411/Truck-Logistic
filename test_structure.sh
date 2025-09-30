#!/bin/bash
echo "Current directory: $(pwd)"
echo "Contents of current directory:"
ls -la
echo ""
echo "Checking if backend directory exists:"
if [ -d "backend" ]; then
    echo "✅ backend directory exists"
    echo "Contents of backend directory:"
    ls -la backend/
else
    echo "❌ backend directory does not exist"
fi
