import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)

class TrackingConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time location tracking"""

    async def connect(self):
        """Handle WebSocket connection"""
        from django.contrib.auth import get_user_model
        User = get_user_model()

        self.order_id = self.scope['url_route']['kwargs']['order_id']
        self.room_group_name = f'tracking_{self.order_id}'

        print(f"=== WebSocket Connection Attempt ===")
        print(f"Order ID: {self.order_id}")
        print(f"User: {self.scope['user']}")
        print(f"Authenticated: {self.scope['user'].is_authenticated}")

        user = self.scope['user']

        # Temporary: Allow connection without authentication for testing
        if not user.is_authenticated:
            print("⚠️ User not authenticated, but allowing connection for testing")
            # await self.close()
            # return

        # Check if user can access this order
        can_access = await self.check_order_access(user, self.order_id)
        print(f"Can access order: {can_access}")

        if not can_access:
            print("⚠️ User cannot access this order, but allowing connection for testing")
            # await self.close()
            # return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        print("✅ WebSocket connection accepted")

        # Send initial location data
        await self.send_initial_data()

        logger.info(f"User {user.username} connected to tracking for order {self.order_id}")

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        logger.info(f"Disconnected from tracking for order {self.order_id}")

    async def receive(self, text_data):
        """Handle messages received from WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
            elif message_type == 'get_locations':
                await self.send_locations()
            elif message_type == 'update_location':
                await self.handle_location_update(data)

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
        except Exception as e:
            logger.error(f"Error in receive: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Internal server error'
            }))

    async def location_update(self, event):
        """Send location update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'location_update',
            'data': event['data']
        }))

    async def order_status_update(self, event):
        """Send order status update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'order_status_update',
            'data': event['data']
        }))

    @database_sync_to_async
    def check_order_access(self, user, order_id):
        """Check if user has permission to access this order"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        from .models import Order

        print(f"Checking access for order_id: {order_id}, type: {type(order_id)}")

        try:
            # Try to get order by ID first
            try:
                order = Order.objects.get(id=int(order_id))
                print(f"Found order by ID: {order.order_number}")
            except (ValueError, Order.DoesNotExist):
                # Try to get order by order_number
                order = Order.objects.get(order_number=order_id)
                print(f"Found order by order_number: {order.order_number}")

            # Check if user is authenticated and has access
            if not user.is_authenticated:
                print("User not authenticated, allowing access for testing")
                return True  # Allow access for testing

            can_access = user.is_admin or order.user == user
            print(f"User {user.username} can access: {can_access}")
            return can_access
        except ObjectDoesNotExist:
            print(f"Order not found: {order_id}")
            return False

    @database_sync_to_async
    def get_order(self):
        """Get order details"""
        from .models import Order
        try:
            # Try to get order by ID first
            try:
                return Order.objects.select_related('requirement', 'truck', 'user').get(id=int(self.order_id))
            except (ValueError, Order.DoesNotExist):
                # Try to get order by order_number
                return Order.objects.select_related('requirement', 'truck', 'user').get(order_number=self.order_id)
        except Order.DoesNotExist:
            return None

    @database_sync_to_async
    def get_current_location(self):
        """Get current location for the order"""
        from .models import Location, Order
        from .serializers import LocationSerializer
        try:
            # Get order first to get the correct order ID
            try:
                order = Order.objects.get(id=int(self.order_id))
            except (ValueError, Order.DoesNotExist):
                order = Order.objects.get(order_number=self.order_id)

            location = Location.objects.filter(order=order).first()
            if location:
                return LocationSerializer(location).data
            return None
        except Exception as e:
            logger.error(f"Error getting current location: {str(e)}")
            return None

    @database_sync_to_async
    def get_recent_locations(self, limit=50):
        """Get recent location history"""
        from .models import Location, Order
        from .serializers import LocationSerializer
        try:
            # Get order first to get the correct order ID
            try:
                order = Order.objects.get(id=int(self.order_id))
            except (ValueError, Order.DoesNotExist):
                order = Order.objects.get(order_number=self.order_id)
            
            locations = Location.objects.filter(order=order).order_by('-timestamp')[:limit]
            return LocationSerializer(locations, many=True).data
        except Exception as e:
            logger.error(f"Error getting recent locations: {str(e)}")
            return []

    async def send_initial_data(self):
        """Send initial data when client connects"""
        order = await self.get_order()
        if not order:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Order not found'
            }))
            return

        current_location = await self.get_current_location()
        recent_locations = await self.get_recent_locations()

        await self.send(text_data=json.dumps({
            'type': 'initial_data',
            'data': {
                'order': {
                    'id': order.id,
                    'order_number': order.order_number,
                    'status': order.status,
                    'status_display': order.get_status_display(),
                    'driver_name': order.driver_name,
                    'truck_registration': order.truck.registration_number,
                    'requirement': {
                        'title': order.requirement.title,
                        'from_location': order.requirement.from_location,
                        'to_location': order.requirement.to_location,
                    }
                },
                'current_location': current_location,
                'recent_locations': recent_locations
            }
        }))

    async def send_locations(self):
        """Send recent locations"""
        recent_locations = await self.get_recent_locations()
        await self.send(text_data=json.dumps({
            'type': 'locations',
            'data': recent_locations
        }))

    async def handle_location_update(self, data):
        """Handle location update from client (for mobile apps)"""
        await self.send(text_data=json.dumps({
            'type': 'location_update_ack',
            'message': 'Location update received'
        }))
