# Trucking Logistics API Documentation

## Overview
This is a comprehensive REST API for a trucking logistics system built with Django REST Framework. It supports admin and user roles, bidding system, order management, and real-time location tracking.

## Base URL
```
http://127.0.0.1:8000/api/
```

## Authentication
The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-access-token>
```

## User Roles
- **Admin**: Can post requirements, manage bids, and track orders
- **User (Truck Owner)**: Can view requirements, place bids, and update truck status

## API Endpoints

### Authentication

#### Register
```http
POST /api/auth/register/
```
**Body:**
```json
{
    "username": "string",
    "email": "string",
    "password": "string",
    "password_confirm": "string",
    "first_name": "string",
    "last_name": "string",
    "role": "admin|user",
    "phone_number": "string",
    "address": "string"
}
```

#### Login
```http
POST /api/auth/login/
```
**Body:**
```json
{
    "username": "string",
    "password": "string"
}
```
**Response:**
```json
{
    "user": {
        "id": 1,
        "username": "string",
        "email": "string",
        "role": "admin|user",
        ...
    },
    "tokens": {
        "refresh": "string",
        "access": "string"
    }
}
```

#### Refresh Token
```http
POST /api/auth/refresh/
```
**Body:**
```json
{
    "refresh": "string"
}
```

#### User Profile
```http
GET /api/auth/profile/
PUT /api/auth/profile/
```

### Dashboard Statistics

#### Admin Dashboard
```http
GET /api/dashboard/admin/
```
**Response:**
```json
{
    "total_requirements": 10,
    "active_orders": 5,
    "completed_orders": 15,
    "total_bids": 25,
    "pending_bids": 8,
    "total_revenue": 50000.00
}
```

#### Truck Owner Dashboard
```http
GET /api/dashboard/truck-owner/
```
**Response:**
```json
{
    "total_trucks": 3,
    "active_orders": 2,
    "completed_orders": 8,
    "pending_bids": 4,
    "total_earnings": 25000.00,
    "average_rating": 4.5
}
```

### Truck Management

#### List/Create Trucks
```http
GET /api/trucks/
POST /api/trucks/
```
**POST Body:**
```json
{
    "truck_type": "mini|small|medium|large|trailer",
    "capacity": 10.5,
    "registration_number": "TN01AB1234",
    "make_model": "Tata 407",
    "year": 2023,
    "status": "available|busy|maintenance|inactive",
    "current_location": "Mumbai, India"
}
```

#### Truck Detail
```http
GET /api/trucks/{id}/
PUT /api/trucks/{id}/
DELETE /api/trucks/{id}/
```

### Requirement Management

#### List/Create Requirements
```http
GET /api/requirements/
POST /api/requirements/
```
**Query Parameters:**
- `truck_type`: Filter by truck type
- `load_type`: Filter by load type
- `status`: Filter by status
- `from_location`: Filter by pickup location

**POST Body (Admin only):**
```json
{
    "title": "Transport Electronics from Mumbai to Delhi",
    "description": "Urgent delivery required",
    "load_type": "electronics",
    "weight": 5.5,
    "truck_type": "medium",
    "from_location": "Mumbai, India",
    "to_location": "Delhi, India",
    "pickup_date": "2024-01-15T10:00:00Z",
    "delivery_date": "2024-01-17T18:00:00Z",
    "budget_min": 15000.00,
    "budget_max": 25000.00,
    "bidding_end_date": "2024-01-14T18:00:00Z",
    "special_instructions": "Handle with care"
}
```

#### Requirement Detail
```http
GET /api/requirements/{id}/
PUT /api/requirements/{id}/
DELETE /api/requirements/{id}/
```

#### Get Bids for Requirement
```http
GET /api/requirements/{id}/bids/
```

### Bid Management

#### List/Create Bids
```http
GET /api/bids/
POST /api/bids/
```
**POST Body (Truck Owner only):**
```json
{
    "requirement": 1,
    "truck": 1,
    "amount": 20000.00,
    "estimated_delivery_time": "2 days",
    "message": "I can deliver on time with careful handling"
}
```

#### Bid Detail
```http
GET /api/bids/{id}/
PUT /api/bids/{id}/
DELETE /api/bids/{id}/
```

#### Respond to Bid (Admin only)
```http
PATCH /api/bids/{id}/respond/
```
**Body:**
```json
{
    "status": "accepted|rejected",
    "response_message": "Your bid has been accepted!"
}
```

### Order Management

#### List Orders
```http
GET /api/orders/
```

#### Order Detail
```http
GET /api/orders/{id}/
```
**Response includes:**
- Order details
- Requirement information
- Location history
- Current location

#### Update Order Status
```http
PATCH /api/orders/{id}/update_status/
```
**Body:**
```json
{
    "status": "pending|confirmed|pickup_scheduled|loaded|on_the_way|delivered|completed|cancelled",
    "driver_name": "John Doe",
    "driver_phone": "+1234567890",
    "driver_license": "DL123456789",
    "notes": "Pickup completed successfully"
}
```

### Location Tracking

#### List/Create Locations
```http
GET /api/locations/
POST /api/locations/
```
**Query Parameters:**
- `order_id`: Filter by order

**POST Body (Truck Owner only):**
```json
{
    "order": 1,
    "latitude": 19.0760,
    "longitude": 72.8777,
    "address": "Mumbai, Maharashtra, India",
    "speed": 60.5,
    "heading": 45.0,
    "altitude": 14.0,
    "accuracy": 5.0
}
```

#### Current Location
```http
GET /api/orders/{order_id}/current-location/
```

### Notifications

#### List Notifications
```http
GET /api/notifications/
```

#### Mark Notification as Read
```http
PATCH /api/notifications/{id}/mark_read/
```

#### Mark All Notifications as Read
```http
PATCH /api/notifications/mark_all_read/
```

### Search

#### Search Requirements
```http
GET /api/search/requirements/
```
**Query Parameters:**
- `search`: General search query
- `truck_type`: Filter by truck type
- `load_type`: Filter by load type
- `from_location`: Pickup location
- `to_location`: Delivery location
- `min_budget`: Minimum budget
- `max_budget`: Maximum budget
- `pickup_date_from`: Pickup date range start
- `pickup_date_to`: Pickup date range end
- `page`: Page number for pagination

## Data Models

### User
```json
{
    "id": 1,
    "username": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "role": "admin|user",
    "phone_number": "string",
    "address": "string",
    "is_verified": false,
    "date_joined": "2024-01-01T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z"
}
```

### Truck
```json
{
    "id": 1,
    "user": 1,
    "user_name": "truck_owner1",
    "truck_type": "medium",
    "truck_type_display": "Medium Truck",
    "capacity": 10.50,
    "registration_number": "TN01AB1234",
    "make_model": "Tata 407",
    "year": 2023,
    "status": "available",
    "status_display": "Available",
    "current_location": "Mumbai, India",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
}
```

### Requirement
```json
{
    "id": 1,
    "admin": 1,
    "admin_name": "admin1",
    "title": "Transport Electronics",
    "description": "Urgent delivery required",
    "load_type": "electronics",
    "load_type_display": "Electronics",
    "weight": 5.50,
    "truck_type": "medium",
    "truck_type_display": "Medium Truck",
    "from_location": "Mumbai, India",
    "to_location": "Delhi, India",
    "pickup_date": "2024-01-15T10:00:00Z",
    "delivery_date": "2024-01-17T18:00:00Z",
    "budget_min": 15000.00,
    "budget_max": 25000.00,
    "status": "open",
    "status_display": "Open for Bidding",
    "special_instructions": "Handle with care",
    "is_active": true,
    "bidding_end_date": "2024-01-14T18:00:00Z",
    "is_bidding_open": true,
    "bids_count": 3,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
}
```

### Order
```json
{
    "id": 1,
    "order_number": "ORD-ABC123",
    "requirement": 1,
    "requirement_title": "Transport Electronics",
    "user": 2,
    "user_name": "truck_owner1",
    "truck": 1,
    "truck_registration": "TN01AB1234",
    "accepted_bid": 1,
    "bid_amount": 20000.00,
    "status": "on_the_way",
    "status_display": "On The Way",
    "payment_status": "pending",
    "payment_status_display": "Pending",
    "actual_pickup_time": "2024-01-15T10:30:00Z",
    "actual_delivery_time": null,
    "estimated_delivery_time": "2024-01-17T18:00:00Z",
    "driver_name": "John Doe",
    "driver_phone": "+1234567890",
    "driver_license": "DL123456789",
    "notes": "On route to destination",
    "rating": null,
    "review": null,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
}
```

## Error Responses

### Authentication Required
```json
{
    "detail": "Authentication credentials were not provided."
}
```

### Permission Denied
```json
{
    "detail": "You do not have permission to perform this action."
}
```

### Validation Error
```json
{
    "field_name": [
        "This field is required."
    ]
}
```

### Not Found
```json
{
    "detail": "Not found."
}
```

## Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Rate Limiting
The API implements standard rate limiting to prevent abuse. Default limits:
- 100 requests per minute for authenticated users
- 30 requests per minute for anonymous users

## Pagination
List endpoints support pagination with the following parameters:
- `page`: Page number (default: 1)
- `page_size`: Number of items per page (default: 20, max: 100)

Response format:
```json
{
    "count": 100,
    "next": "http://api/endpoint/?page=2",
    "previous": null,
    "results": [...]
}
```

## Development Setup

1. Clone the repository
2. Run the setup script: `./setup_backend.sh`
3. Start the server: `python manage.py runserver`
4. Access the API at `http://127.0.0.1:8000/api/`

## Testing Credentials

### Superuser
- Username: `admin`
- Password: `admin123`

### Admin Users
- Username: `admin1`, `admin2`
- Password: `admin123`

### Truck Owners
- Username: `truck_owner1`, `truck_owner2`, etc.
- Password: `user123`
