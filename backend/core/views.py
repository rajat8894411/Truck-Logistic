from rest_framework import generics, viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Avg, Sum
from django.utils import timezone
from datetime import timedelta

from .models import User, Truck, Requirement, Bid, Order, Location, Notification
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    TruckSerializer, RequirementSerializer, RequirementDetailSerializer,
    BidSerializer, BidResponseSerializer, OrderSerializer, OrderDetailSerializer,
    OrderStatusUpdateSerializer, LocationSerializer, NotificationSerializer,
    DashboardStatsSerializer, TruckOwnerStatsSerializer
)
from .permissions import (
    IsAdmin, IsTruckOwner, IsAdminOrTruckOwner, IsOwnerOrAdmin,
    IsAdminOrReadOnly, IsTruckOwnerOrReadOnly, CanBidOnRequirement,
    CanManageBids, CanManageOrder
)

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Order, Location
from .serializers import LocationSerializer
import random
import time


# Authentication Views
class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]


class LoginView(generics.GenericAPIView):
    """User login endpoint"""
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserProfileSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    """User profile endpoint"""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    """User change password endpoint"""
    serializer_class = None
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        from .serializers import ChangePasswordSerializer
        return ChangePasswordSerializer

    def get_object(self):
        return self.request.user


# Truck Management Views
class TruckViewSet(viewsets.ModelViewSet):
    """ViewSet for truck management"""
    serializer_class = TruckSerializer
    permission_classes = [IsTruckOwnerOrReadOnly, IsOwnerOrAdmin]
    
    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Truck.objects.all()
        return Truck.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# Requirement Management Views
class RequirementViewSet(viewsets.ModelViewSet):
    """ViewSet for requirement management"""
    permission_classes = [IsAdminOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RequirementDetailSerializer
        return RequirementSerializer
    
    def get_queryset(self):
        queryset = Requirement.objects.filter(is_active=True)
        
        # Filter parameters
        truck_type = self.request.query_params.get('truck_type', None)
        load_type = self.request.query_params.get('load_type', None)
        status = self.request.query_params.get('status', None)
        from_location = self.request.query_params.get('from_location', None)
        
        if truck_type:
            queryset = queryset.filter(truck_type=truck_type)
        if load_type:
            queryset = queryset.filter(load_type=load_type)
        if status:
            queryset = queryset.filter(status=status)
        if from_location:
            queryset = queryset.filter(from_location__icontains=from_location)
        
        # Show only open requirements for truck owners
        if self.request.user.role == 'user':
            queryset = queryset.filter(status='open')
        elif self.request.user.role == 'admin':
            # Admin can see their own requirements
            if self.action in ['list', 'retrieve']:
                pass  # Show all requirements
            else:
                queryset = queryset.filter(admin=self.request.user)
        
        return queryset.select_related('admin').prefetch_related('bids')
    
    def perform_create(self, serializer):
        serializer.save(admin=self.request.user)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def bids(self, request, pk=None):
        """Get all bids for a requirement"""
        requirement = self.get_object()
        
        # Only admin who created the requirement can see bids
        if request.user.role == 'admin' and requirement.admin == request.user:
            bids = requirement.bids.all().select_related('user', 'truck')
            serializer = BidSerializer(bids, many=True)
            return Response(serializer.data)
        
        return Response({'detail': 'Permission denied'}, 
                       status=status.HTTP_403_FORBIDDEN)


# Bid Management Views
class BidViewSet(viewsets.ModelViewSet):
    """ViewSet for bid management"""
    serializer_class = BidSerializer
    permission_classes = [CanManageBids]
    
    def get_queryset(self):
        if self.request.user.role == 'admin':
            # Admin sees bids on their requirements
            return Bid.objects.filter(
                requirement__admin=self.request.user
            ).select_related('requirement', 'user', 'truck')
        else:
            # Truck owners see their own bids
            return Bid.objects.filter(
                user=self.request.user
            ).select_related('requirement', 'user', 'truck')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def respond(self, request, pk=None):
        """Admin responds to a bid (accept/reject)"""
        bid = self.get_object()
        
        # Check if admin owns the requirement
        if bid.requirement.admin != request.user:
            return Response({'detail': 'Permission denied'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        serializer = BidResponseSerializer(bid, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # If bid is accepted, create an order
            if serializer.validated_data['status'] == 'accepted':
                # Mark requirement as assigned
                bid.requirement.status = 'assigned'
                bid.requirement.save()
                
                # Reject all other bids for this requirement
                Bid.objects.filter(
                    requirement=bid.requirement
                ).exclude(id=bid.id).update(
                    status='rejected',
                    response_message='Another bid was selected'
                )
                
                # Create order
                order = Order.objects.create(
                    requirement=bid.requirement,
                    user=bid.user,
                    truck=bid.truck,
                    accepted_bid=bid,
                    estimated_delivery_time=timezone.now() + bid.estimated_delivery_time
                )
                
                # Create notification for truck owner
                Notification.objects.create(
                    user=bid.user,
                    title='Bid Accepted',
                    message=f'Your bid for "{bid.requirement.title}" has been accepted!',
                    notification_type='bid_accepted',
                    requirement=bid.requirement,
                    order=order,
                    bid=bid
                )
            
            # Create notification for bid rejection
            elif serializer.validated_data['status'] == 'rejected':
                Notification.objects.create(
                    user=bid.user,
                    title='Bid Rejected',
                    message=f'Your bid for "{bid.requirement.title}" has been rejected.',
                    notification_type='bid_rejected',
                    requirement=bid.requirement,
                    bid=bid
                )
            
            return Response(BidSerializer(bid).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Order Management Views
class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet for order management"""
    permission_classes = [CanManageOrder]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OrderDetailSerializer
        elif self.action == 'update_status':
            return OrderStatusUpdateSerializer
        return OrderSerializer
    
    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Order.objects.filter(
                requirement__admin=self.request.user
            ).select_related('requirement', 'user', 'truck', 'accepted_bid')
        else:
            return Order.objects.filter(
                user=self.request.user
            ).select_related('requirement', 'user', 'truck', 'accepted_bid')
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):
        """Update order status"""
        order = self.get_object()
        serializer = OrderStatusUpdateSerializer(order, data=request.data, partial=True)
        
        if serializer.is_valid():
            old_status = order.status
            serializer.save()
            
            # Update actual times based on status
            new_status = serializer.validated_data.get('status', order.status)
            
            if new_status == 'loaded' and old_status != 'loaded':
                order.actual_pickup_time = timezone.now()
            elif new_status == 'delivered' and old_status != 'delivered':
                order.actual_delivery_time = timezone.now()
            
            order.save()
            
            # Create notification for status change
            if old_status != new_status:
                # Notify admin
                if request.user.role == 'user':
                    Notification.objects.create(
                        user=order.requirement.admin,
                        title='Order Status Updated',
                        message=f'Order {order.order_number} status changed to {order.get_status_display()}',
                        notification_type='order_status_changed',
                        requirement=order.requirement,
                        order=order
                    )
                # Notify truck owner
                else:
                    Notification.objects.create(
                        user=order.user,
                        title='Order Status Updated',
                        message=f'Order {order.order_number} status changed to {order.get_status_display()}',
                        notification_type='order_status_changed',
                        requirement=order.requirement,
                        order=order
                    )
            
            return Response(OrderSerializer(order).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Location Tracking Views
class LocationViewSet(viewsets.ModelViewSet):
    """ViewSet for location tracking"""
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        order_id = self.request.query_params.get('order_id', None)
        queryset = Location.objects.all().select_related('order')
        
        if order_id:
            queryset = queryset.filter(order_id=order_id)
        
        # Filter based on user role
        if self.request.user.role == 'admin':
            queryset = queryset.filter(order__requirement__admin=self.request.user)
        else:
            queryset = queryset.filter(order__user=self.request.user)
        
        return queryset
    
    def perform_create(self, serializer):
        order = serializer.validated_data['order']
        
        # Check if user can add location to this order
        if self.request.user.role == 'user' and order.user == self.request.user:
            serializer.save()
        else:
            raise PermissionError("You can only add location to your own orders")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_location(request, order_id):
    """Get current location of an order"""
    try:
        order = Order.objects.get(id=order_id)
        
        # Check permissions
        if (request.user.role == 'admin' and order.requirement.admin == request.user) or \
           (request.user.role == 'user' and order.user == request.user):
            
            latest_location = order.locations.first()
            if latest_location:
                serializer = LocationSerializer(latest_location)
                return Response(serializer.data)
            else:
                return Response({'detail': 'No location data available'}, 
                               status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'detail': 'Permission denied'}, 
                           status=status.HTTP_403_FORBIDDEN)
    
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found'}, 
                       status=status.HTTP_404_NOT_FOUND)


# Notification Views
class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for notifications"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user
        ).select_related('requirement', 'order', 'bid')
    
    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'})
    
    @action(detail=False, methods=['patch'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        self.get_queryset().update(is_read=True)
        return Response({'status': 'all notifications marked as read'})


# Dashboard Views
@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_dashboard(request):
    """Admin dashboard statistics"""
    user = request.user
    
    # Calculate statistics
    total_requirements = Requirement.objects.filter(admin=user).count()
    active_orders = Order.objects.filter(
        requirement__admin=user, 
        status__in=['pending', 'confirmed', 'pickup_scheduled', 'loaded', 'on_the_way']
    ).count()
    completed_orders = Order.objects.filter(
        requirement__admin=user, 
        status='completed'
    ).count()
    total_bids = Bid.objects.filter(requirement__admin=user).count()
    pending_bids = Bid.objects.filter(
        requirement__admin=user, 
        status='pending'
    ).count()
    
    # Calculate total revenue from completed orders
    total_revenue = Order.objects.filter(
        requirement__admin=user,
        status='completed'
    ).aggregate(
        total=Sum('accepted_bid__amount')
    )['total'] or 0
    
    stats = {
        'total_requirements': total_requirements,
        'active_orders': active_orders,
        'completed_orders': completed_orders,
        'total_bids': total_bids,
        'pending_bids': pending_bids,
        'total_revenue': total_revenue,
    }
    
    serializer = DashboardStatsSerializer(stats)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsTruckOwner])
def truck_owner_dashboard(request):
    """Truck owner dashboard statistics"""
    user = request.user
    
    # Calculate statistics
    total_trucks = Truck.objects.filter(user=user, is_active=True).count()
    active_orders = Order.objects.filter(
        user=user, 
        status__in=['pending', 'confirmed', 'pickup_scheduled', 'loaded', 'on_the_way']
    ).count()
    completed_orders = Order.objects.filter(user=user, status='completed').count()
    pending_bids = Bid.objects.filter(user=user, status='pending').count()
    
    # Calculate total earnings
    total_earnings = Order.objects.filter(
        user=user,
        status='completed'
    ).aggregate(
        total=Sum('accepted_bid__amount')
    )['total'] or 0
    
    # Calculate average rating
    average_rating = Order.objects.filter(
        user=user,
        status='completed',
        rating__isnull=False
    ).aggregate(
        avg_rating=Avg('rating')
    )['avg_rating']
    
    stats = {
        'total_trucks': total_trucks,
        'active_orders': active_orders,
        'completed_orders': completed_orders,
        'pending_bids': pending_bids,
        'total_earnings': total_earnings,
        'average_rating': average_rating,
    }
    
    serializer = TruckOwnerStatsSerializer(stats)
    return Response(serializer.data)


# Search and Filter Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_requirements(request):
    """Search requirements with advanced filters"""
    queryset = Requirement.objects.filter(is_active=True, status='open')
    
    # Search parameters
    search_query = request.GET.get('search', '')
    truck_type = request.GET.get('truck_type', '')
    load_type = request.GET.get('load_type', '')
    from_location = request.GET.get('from_location', '')
    to_location = request.GET.get('to_location', '')
    min_budget = request.GET.get('min_budget', '')
    max_budget = request.GET.get('max_budget', '')
    pickup_date_from = request.GET.get('pickup_date_from', '')
    pickup_date_to = request.GET.get('pickup_date_to', '')
    
    # Apply filters
    if search_query:
        queryset = queryset.filter(
            Q(title__icontains=search_query) |
            Q(description__icontains=search_query) |
            Q(from_location__icontains=search_query) |
            Q(to_location__icontains=search_query)
        )
    
    if truck_type:
        queryset = queryset.filter(truck_type=truck_type)
    
    if load_type:
        queryset = queryset.filter(load_type=load_type)
    
    if from_location:
        queryset = queryset.filter(from_location__icontains=from_location)
    
    if to_location:
        queryset = queryset.filter(to_location__icontains=to_location)
    
    if min_budget:
        try:
            min_budget = float(min_budget)
            queryset = queryset.filter(budget_min__gte=min_budget)
        except ValueError:
            pass
    
    if max_budget:
        try:
            max_budget = float(max_budget)
            queryset = queryset.filter(budget_max__lte=max_budget)
        except ValueError:
            pass
    
    if pickup_date_from:
        try:
            from datetime import datetime
            pickup_date_from = datetime.fromisoformat(pickup_date_from)
            queryset = queryset.filter(pickup_date__gte=pickup_date_from)
        except ValueError:
            pass
    
    if pickup_date_to:
        try:
            from datetime import datetime
            pickup_date_to = datetime.fromisoformat(pickup_date_to)
            queryset = queryset.filter(pickup_date__lte=pickup_date_to)
        except ValueError:
            pass
    
    # Paginate results
    from django.core.paginator import Paginator
    
    paginator = Paginator(queryset.select_related('admin'), 20)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)
    
    serializer = RequirementSerializer(page_obj, many=True)
    
    return Response({
        'results': serializer.data,
        'count': paginator.count,
        'num_pages': paginator.num_pages,
        'current_page': page_obj.number,
        'has_next': page_obj.has_next(),
        'has_previous': page_obj.has_previous(),
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def simulate_location_update(request, order_id):
    """Simulate location update for testing WebSocket functionality"""
    try:
        # Try to get order by ID first, then by order_number
        try:
            order = Order.objects.get(id=int(order_id))
        except (ValueError, Order.DoesNotExist):
            order = Order.objects.get(order_number=order_id)
        
        # Get source and destination from order requirement
        from_location = order.requirement.from_location
        to_location = order.requirement.to_location
        # Define coordinates for major cities (you can expand this)
        city_coordinates = {
            'Chandigarh': {'lat': 30.7333, 'lng': 76.7794},
            'Delhi': {'lat': 28.6139, 'lng': 77.2090},
            'Mumbai': {'lat': 19.0760, 'lng': 72.8777},
            'Bangalore': {'lat': 12.9716, 'lng': 77.5946},
            'Chennai': {'lat': 13.0827, 'lng': 80.2707},
            'Kolkata': {'lat': 22.5726, 'lng': 88.3639},
            'Pune': {'lat': 18.5204, 'lng': 73.8567},
            'Hyderabad': {'lat': 17.3850, 'lng': 78.4867},
            'Ahmedabad': {'lat': 23.0225, 'lng': 72.5714},
            'Jaipur': {'lat': 26.9124, 'lng': 75.7873},
            'Gujrat': {'lat': 23.0225, 'lng': 72.5714},  # Gujarat
            'Nagpur': {'lat': 21.1458, 'lng': 79.0882},
        }

        # Normalize the from/to locations
        from_location_key = from_location.split(",")[0].strip()
        to_location_key = to_location.split(",")[0].strip()
        # Lookup coordinates
        source_coords = city_coordinates.get(from_location_key, {'lat': 30.7333, 'lng': 76.7794})
        dest_coords = city_coordinates.get(to_location_key, {'lat': 28.6139, 'lng': 77.2090})
        #print(f"Source coords: {source_coords}, Dest coords: {dest_coords}")
        
        # Generate location between source and destination
        # Calculate progress (0 to 1) based on current time or random
        progress = random.uniform(0.1, 0.9)  # Between 10% to 90% of journey
        
        # Interpolate between source and destination
        lat = source_coords['lat'] + (dest_coords['lat'] - source_coords['lat']) * progress
        lng = source_coords['lng'] + (dest_coords['lng'] - source_coords['lng']) * progress
        
        # Add some random variation to simulate real movement
        lat += random.uniform(-0.01, 0.01)
        lng += random.uniform(-0.01, 0.01)
        
        # Create location record
        location = Location.objects.create(
            order=order,
            latitude=lat,
            longitude=lng,
            address=f"En route from {from_location} to {to_location}",
            speed=random.uniform(30, 80),
            heading=random.uniform(0, 360),
            accuracy=random.uniform(5, 20)
        )
        
        # Send WebSocket update
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'tracking_{order_id}',
            {
                'type': 'location_update',
                'data': LocationSerializer(location).data
            }
        )
        
        return Response({
            'message': 'Location update sent',
            'location': LocationSerializer(location).data,
            'source': from_location,
            'destination': to_location,
            'progress': f"{progress*100:.1f}%"
        })
        
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_order_status(request, order_id):
    """Update order status and notify via WebSocket"""
    try:
        # Try to get order by ID first, then by order_number
        try:
            order = Order.objects.get(id=int(order_id))
        except (ValueError, Order.DoesNotExist):
            order = Order.objects.get(order_number=order_id)
        
        new_status = request.data.get('status')
        
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=400)
        
        order.status = new_status
        order.save()
        
        # Send WebSocket update
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'tracking_{order_id}',
            {
                'type': 'order_status_update',
                'data': {
                    'status': order.status,
                    'status_display': order.get_status_display()
                }
            }
        )
        
        return Response({
            'message': 'Order status updated',
            'order': {
                'id': order.id,
                'status': order.status,
                'status_display': order.get_status_display()
            }
        })
        
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
