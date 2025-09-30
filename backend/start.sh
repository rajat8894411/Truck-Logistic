#!/bin/bash
set -e

echo "Running database migrations..."
python manage.py migrate

echo "Starting Daphne ASGI server..."
daphne -b 0.0.0.0 -p $PORT backend_project.asgi:application
