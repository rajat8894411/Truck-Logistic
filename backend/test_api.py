#!/usr/bin/env python3
"""
Test script for Trucking Logistics API
This script demonstrates basic API functionality
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://127.0.0.1:8000/api"
ADMIN_USER = {"username": "admin1", "password": "admin123"}
TRUCK_OWNER_USER = {"username": "truck_owner1", "password": "user123"}

def make_request(method, endpoint, data=None, headers=None):
    """Make HTTP request to API"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method == "PATCH":
            response = requests.patch(url, json=data, headers=headers)
        
        return response.status_code, response.json() if response.content else {}
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to API. Make sure the Django server is running.")
        print("   Run: python manage.py runserver")
        return None, None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None, None

def login(credentials):
    """Login and get access token"""
    print(f"🔐 Logging in as {credentials['username']}...")
    status, response = make_request("POST", "/auth/login/", credentials)
    
    if status == 200:
        print(f"✅ Login successful!")
        return response['tokens']['access']
    else:
        print(f"❌ Login failed: {response}")
        return None

def test_api():
    """Test various API endpoints"""
    print("=== Trucking Logistics API Test ===\n")
    
    # Test 1: Admin Login
    admin_token = login(ADMIN_USER)
    if not admin_token:
        return
    
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test 2: Get Admin Dashboard
    print("\n📊 Getting admin dashboard...")
    status, dashboard = make_request("GET", "/dashboard/admin/", headers=admin_headers)
    if status == 200:
        print("✅ Admin Dashboard:")
        print(f"   Total Requirements: {dashboard['total_requirements']}")
        print(f"   Active Orders: {dashboard['active_orders']}")
        print(f"   Total Revenue: ${dashboard['total_revenue']}")
    else:
        print(f"❌ Dashboard failed: {status}")
    
    # Test 3: Get Requirements
    print("\n📋 Getting requirements...")
    status, requirements = make_request("GET", "/requirements/", headers=admin_headers)
    if status == 200:
        print(f"✅ Found {requirements['count']} requirements")
        if requirements['results']:
            req = requirements['results'][0]
            print(f"   First requirement: {req['title']}")
            print(f"   From: {req['from_location']} → To: {req['to_location']}")
    else:
        print(f"❌ Requirements failed: {status}")
    
    # Test 4: Truck Owner Login
    print(f"\n🚚 Testing truck owner access...")
    truck_owner_token = login(TRUCK_OWNER_USER)
    if not truck_owner_token:
        return
    
    truck_owner_headers = {"Authorization": f"Bearer {truck_owner_token}"}
    
    # Test 5: Get Truck Owner Dashboard
    print("\n📊 Getting truck owner dashboard...")
    status, dashboard = make_request("GET", "/dashboard/truck-owner/", headers=truck_owner_headers)
    if status == 200:
        print("✅ Truck Owner Dashboard:")
        print(f"   Total Trucks: {dashboard['total_trucks']}")
        print(f"   Active Orders: {dashboard['active_orders']}")
        print(f"   Total Earnings: ${dashboard['total_earnings']}")
    else:
        print(f"❌ Dashboard failed: {status}")
    
    # Test 6: Get Trucks
    print("\n🚛 Getting trucks...")
    status, trucks = make_request("GET", "/trucks/", headers=truck_owner_headers)
    if status == 200:
        print(f"✅ Found {len(trucks['results'])} trucks")
        if trucks['results']:
            truck = trucks['results'][0]
            print(f"   First truck: {truck['registration_number']}")
            print(f"   Type: {truck['truck_type_display']}")
            print(f"   Status: {truck['status_display']}")
    else:
        print(f"❌ Trucks failed: {status}")
    
    # Test 7: Search Requirements
    print("\n🔍 Searching requirements...")
    status, search_results = make_request("GET", "/search/requirements/?search=electronics", 
                                         headers=truck_owner_headers)
    if status == 200:
        print(f"✅ Search found {search_results['count']} requirements with 'electronics'")
    else:
        print(f"❌ Search failed: {status}")
    
    # Test 8: Create a Bid (if requirements exist)
    if 'requirements' in locals() and requirements['results']:
        req_id = requirements['results'][0]['id']
        truck_id = trucks['results'][0]['id'] if 'trucks' in locals() and trucks['results'] else 1
        
        print(f"\n💰 Creating a bid...")
        bid_data = {
            "requirement": req_id,
            "truck": truck_id,
            "amount": 18000.00,
            "estimated_delivery_time": "2 days, 0:00:00",
            "message": "I can deliver efficiently and on time!"
        }
        
        status, bid_response = make_request("POST", "/bids/", bid_data, truck_owner_headers)
        if status == 201:
            print("✅ Bid created successfully!")
            print(f"   Bid Amount: ${bid_response['amount']}")
            print(f"   Status: {bid_response['status_display']}")
        else:
            print(f"❌ Bid creation failed: {status} - {bid_response}")
    
    print("\n🎉 API test completed!")

def check_server():
    """Check if Django server is running"""
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        return True
    except:
        return False

if __name__ == "__main__":
    if not check_server():
        print("❌ Django server is not running!")
        print("Please start the server with: python manage.py runserver")
        print("Then run this test script again.")
    else:
        test_api()
