from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class User(AbstractUser):
    """Custom User model with role-based access"""
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('user', 'Truck Owner'),
    ]
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def is_truck_owner(self):
        return self.role == 'user'


class Truck(models.Model):
    """Truck model for truck owners"""
    TRUCK_TYPE_CHOICES = [
        ('mini', 'Mini Truck'),
        ('small', 'Small Truck'),
        ('medium', 'Medium Truck'),
        ('large', 'Large Truck'),
        ('trailer', 'Trailer'),
    ]
    
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('busy', 'Busy'),
        ('maintenance', 'Under Maintenance'),
        ('inactive', 'Inactive'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trucks')
    truck_type = models.CharField(max_length=20, choices=TRUCK_TYPE_CHOICES)
    capacity = models.DecimalField(max_digits=10, decimal_places=2, help_text="Capacity in tons")
    registration_number = models.CharField(max_length=20, unique=True)
    make_model = models.CharField(max_length=100, help_text="e.g., Tata 407")
    year = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    current_location = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['truck_type', 'status']),
        ]

    def __str__(self):
        return f"{self.registration_number} - {self.get_truck_type_display()}"


class Requirement(models.Model):
    """Truck requirement posted by admin"""
    LOAD_TYPE_CHOICES = [
        ('electronics', 'Electronics'),
        ('furniture', 'Furniture'),
        ('food_items', 'Food Items'),
        ('construction', 'Construction Materials'),
        ('automotive', 'Automotive Parts'),
        ('textiles', 'Textiles'),
        ('chemicals', 'Chemicals'),
        ('machinery', 'Machinery'),
        ('other', 'Other'),
    ]
    
    TRUCK_TYPE_CHOICES = [
        ('mini', 'Mini Truck'),
        ('small', 'Small Truck'),
        ('medium', 'Medium Truck'),
        ('large', 'Large Truck'),
        ('trailer', 'Trailer'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open for Bidding'),
        ('closed', 'Bidding Closed'),
        ('assigned', 'Assigned'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requirements')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    load_type = models.CharField(max_length=20, choices=LOAD_TYPE_CHOICES)
    weight = models.DecimalField(max_digits=10, decimal_places=2, help_text="Weight in tons")
    truck_type = models.CharField(max_length=20, choices=TRUCK_TYPE_CHOICES)
    from_location = models.CharField(max_length=255)
    to_location = models.CharField(max_length=255)
    pickup_date = models.DateTimeField()
    delivery_date = models.DateTimeField()
    budget_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    budget_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    special_instructions = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    bidding_end_date = models.DateTimeField()

    class Meta:
        indexes = [
            models.Index(fields=['status', 'pickup_date']),
            models.Index(fields=['truck_type', 'status']),
            models.Index(fields=['admin', 'status']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.from_location} to {self.to_location}"

    @property
    def is_bidding_open(self):
        return self.status == 'open' and self.bidding_end_date > timezone.now()


class Bid(models.Model):
    """Bid placed by truck owners on requirements"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    ]
    
    requirement = models.ForeignKey(Requirement, on_delete=models.CASCADE, related_name='bids')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bids')
    truck = models.ForeignKey(Truck, on_delete=models.CASCADE, related_name='bids')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    estimated_delivery_time = models.DurationField(help_text="Estimated delivery duration")
    message = models.TextField(blank=True, null=True, help_text="Additional message to admin")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    response_message = models.TextField(blank=True, null=True, help_text="Admin response message")

    class Meta:
        indexes = [
            models.Index(fields=['requirement', 'status']),
            models.Index(fields=['user', 'status']),
        ]
        unique_together = ['requirement', 'user', 'truck']
        ordering = ['amount']  # Lowest bid first

    def __str__(self):
        return f"Bid ${self.amount} by {self.user.username} for {self.requirement.title}"


class Order(models.Model):
    """Order created when a bid is accepted"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('pickup_scheduled', 'Pickup Scheduled'),
        ('loaded', 'Loaded'),
        ('on_the_way', 'On The Way'),
        ('delivered', 'Delivered'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('partial', 'Partial Payment'),
        ('paid', 'Paid'),
        ('refunded', 'Refunded'),
    ]
    
    requirement = models.OneToOneField(Requirement, on_delete=models.CASCADE, related_name='order')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    truck = models.ForeignKey(Truck, on_delete=models.CASCADE, related_name='orders')
    accepted_bid = models.OneToOneField(Bid, on_delete=models.CASCADE, related_name='order')
    order_number = models.CharField(max_length=20, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    actual_pickup_time = models.DateTimeField(null=True, blank=True)
    actual_delivery_time = models.DateTimeField(null=True, blank=True)
    estimated_delivery_time = models.DateTimeField(null=True, blank=True)
    driver_name = models.CharField(max_length=100, blank=True, null=True)
    driver_phone = models.CharField(max_length=15, blank=True, null=True)
    driver_license = models.CharField(max_length=20, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)], 
        null=True, blank=True,
        help_text="Rating out of 5"
    )
    review = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.order_number:
            # Generate unique order number
            import uuid
            self.order_number = f"ORD-{str(uuid.uuid4())[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order {self.order_number} - {self.requirement.title}"


class Location(models.Model):
    """Real-time location tracking for orders"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='locations')
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    address = models.CharField(max_length=255, blank=True, null=True)
    speed = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Speed in km/h")
    heading = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Direction in degrees")
    altitude = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text="Altitude in meters")
    accuracy = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text="GPS accuracy in meters")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['order', 'timestamp']),
        ]
        ordering = ['-timestamp']

    def __str__(self):
        return f"Location for {self.order.order_number} at {self.timestamp}"


class Notification(models.Model):
    """Notification system for users"""
    TYPE_CHOICES = [
        ('bid_placed', 'Bid Placed'),
        ('bid_accepted', 'Bid Accepted'),
        ('bid_rejected', 'Bid Rejected'),
        ('order_status_changed', 'Order Status Changed'),
        ('new_requirement', 'New Requirement'),
        ('payment_received', 'Payment Received'),
        ('system', 'System Notification'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Optional foreign key relations for context
    requirement = models.ForeignKey(Requirement, on_delete=models.CASCADE, null=True, blank=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, null=True, blank=True)
    bid = models.ForeignKey(Bid, on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['user', 'created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"
