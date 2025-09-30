from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, Truck, Requirement, Bid, Order, Location, Notification


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 
                 'last_name', 'role', 'phone_number', 'address']
        extra_kwargs = {
            'email': {'required': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include username and password')
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                 'role', 'phone_number', 'address', 'is_verified', 
                 'date_joined', 'created_at']
        read_only_fields = ['id', 'username', 'role', 'is_verified', 
                          'date_joined', 'created_at']


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing user password"""
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("New passwords don't match")
        user = self.context['request'].user
        if not user.check_password(attrs['current_password']):
            raise serializers.ValidationError({'current_password': 'Current password is incorrect'})
        return attrs

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class TruckSerializer(serializers.ModelSerializer):
    """Serializer for Truck model"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    truck_type_display = serializers.CharField(source='get_truck_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Truck
        fields = ['id', 'user', 'user_name', 'truck_type', 'truck_type_display',
                 'capacity', 'registration_number', 'make_model', 'year', 
                 'status', 'status_display', 'current_location', 'is_active',
                 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def validate_registration_number(self, value):
        # Check if registration number is unique for updates
        if self.instance and Truck.objects.filter(
            registration_number=value
        ).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError("Registration number already exists")
        elif not self.instance and Truck.objects.filter(registration_number=value).exists():
            raise serializers.ValidationError("Registration number already exists")
        return value


class RequirementSerializer(serializers.ModelSerializer):
    """Serializer for Requirement model"""
    admin_name = serializers.CharField(source='admin.username', read_only=True)
    load_type_display = serializers.CharField(source='get_load_type_display', read_only=True)
    truck_type_display = serializers.CharField(source='get_truck_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_bidding_open = serializers.BooleanField(read_only=True)
    bids_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Requirement
        fields = ['id', 'admin', 'admin_name', 'title', 'description', 
                 'load_type', 'load_type_display', 'weight', 'truck_type', 
                 'truck_type_display', 'from_location', 'to_location', 
                 'pickup_date', 'delivery_date', 'budget_min', 'budget_max',
                 'status', 'status_display', 'special_instructions', 
                 'is_active', 'bidding_end_date', 'is_bidding_open',
                 'bids_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'admin', 'created_at', 'updated_at']
    
    def get_bids_count(self, obj):
        return obj.bids.filter(status='pending').count()


class BidSerializer(serializers.ModelSerializer):
    """Serializer for Bid model"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    truck_registration = serializers.CharField(source='truck.registration_number', read_only=True)
    requirement_title = serializers.CharField(source='requirement.title', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Bid
        fields = ['id', 'requirement', 'requirement_title', 'user', 'user_name',
                 'truck', 'truck_registration', 'amount', 'estimated_delivery_time',
                 'message', 'status', 'status_display', 'response_message',
                 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            # Check if requirement is still open for bidding
            requirement = attrs.get('requirement')
            if requirement and not requirement.is_bidding_open:
                raise serializers.ValidationError("Bidding is closed for this requirement")
            
            # Check if user owns the truck
            truck = attrs.get('truck')
            if truck and truck.user != request.user:
                raise serializers.ValidationError("You can only bid with your own trucks")

            # Truck must be active and available
            if truck and (not truck.is_active or truck.status != 'available'):
                raise serializers.ValidationError("Selected truck is not available for bidding")

            # Prevent duplicate bid by same user on the same requirement
            if requirement and Bid.objects.filter(requirement=requirement, user=request.user).exists():
                raise serializers.ValidationError("You have already placed a bid for this requirement")
        
        return attrs

    def validate_amount(self, value):
        try:
            if float(value) <= 0:
                raise serializers.ValidationError("Bid amount must be greater than 0")
        except (TypeError, ValueError):
            raise serializers.ValidationError("Invalid bid amount")
        return value


class BidResponseSerializer(serializers.ModelSerializer):
    """Serializer for admin to respond to bids"""
    class Meta:
        model = Bid
        fields = ['status', 'response_message']
    
    def validate_status(self, value):
        if value not in ['accepted', 'rejected']:
            raise serializers.ValidationError("Status must be either 'accepted' or 'rejected'")
        return value


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for Order model"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    truck_registration = serializers.CharField(source='truck.registration_number', read_only=True)
    requirement_title = serializers.CharField(source='requirement.title', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    bid_amount = serializers.DecimalField(source='accepted_bid.amount', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Order
        fields = ['id', 'order_number', 'requirement', 'requirement_title', 
                 'user', 'user_name', 'truck', 'truck_registration', 
                 'accepted_bid', 'bid_amount', 'status', 'status_display',
                 'payment_status', 'payment_status_display',
                 'actual_pickup_time', 'actual_delivery_time', 
                 'estimated_delivery_time', 'driver_name', 'driver_phone',
                 'driver_license', 'notes', 'rating', 'review',
                 'created_at', 'updated_at']
        read_only_fields = ['id', 'order_number', 'requirement', 'user', 
                          'truck', 'accepted_bid', 'created_at', 'updated_at']


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating order status"""
    class Meta:
        model = Order
        fields = ['status', 'driver_name', 'driver_phone', 'driver_license', 'notes']


class LocationSerializer(serializers.ModelSerializer):
    """Serializer for Location model"""
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    
    class Meta:
        model = Location
        fields = ['id', 'order', 'order_number', 'latitude', 'longitude', 
                 'address', 'speed', 'heading', 'altitude', 'accuracy', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 
                 'notification_type_display', 'is_read', 'created_at',
                 'requirement', 'order', 'bid']
        read_only_fields = ['id', 'created_at']


# Nested serializers for detailed views
class RequirementDetailSerializer(RequirementSerializer):
    """Detailed serializer for Requirement with bids"""
    bids = BidSerializer(many=True, read_only=True)
    
    class Meta(RequirementSerializer.Meta):
        fields = RequirementSerializer.Meta.fields + ['bids']


class OrderDetailSerializer(OrderSerializer):
    """Detailed serializer for Order with locations"""
    locations = LocationSerializer(many=True, read_only=True)
    requirement_details = RequirementSerializer(source='requirement', read_only=True)
    current_location = serializers.SerializerMethodField()
    
    class Meta(OrderSerializer.Meta):
        fields = OrderSerializer.Meta.fields + ['locations', 'requirement_details', 'current_location']
    
    def get_current_location(self, obj):
        latest_location = obj.locations.first()  # Already ordered by -timestamp
        return LocationSerializer(latest_location).data if latest_location else None


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    total_requirements = serializers.IntegerField()
    active_orders = serializers.IntegerField()
    completed_orders = serializers.IntegerField()
    total_bids = serializers.IntegerField()
    pending_bids = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True)


class TruckOwnerStatsSerializer(serializers.Serializer):
    """Serializer for truck owner dashboard statistics"""
    total_trucks = serializers.IntegerField()
    active_orders = serializers.IntegerField()
    completed_orders = serializers.IntegerField()
    pending_bids = serializers.IntegerField()
    total_earnings = serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True)
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2, allow_null=True)
