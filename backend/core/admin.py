from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, Truck, Requirement, Bid, Order, Location, Notification


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model"""
    list_display = ['username', 'email', 'role', 'is_verified', 'is_active', 'date_joined']
    list_filter = ['role', 'is_verified', 'is_active', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('role', 'phone_number', 'address', 'is_verified')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {
            'fields': ('role', 'phone_number', 'address')
        }),
    )


@admin.register(Truck)
class TruckAdmin(admin.ModelAdmin):
    """Admin configuration for Truck model"""
    list_display = ['registration_number', 'user', 'truck_type', 'capacity', 'status', 'is_active']
    list_filter = ['truck_type', 'status', 'is_active', 'year']
    search_fields = ['registration_number', 'make_model', 'user__username']
    list_editable = ['status', 'is_active']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'registration_number', 'truck_type', 'capacity', 'make_model', 'year')
        }),
        ('Status', {
            'fields': ('status', 'current_location', 'is_active')
        }),
    )


@admin.register(Requirement)
class RequirementAdmin(admin.ModelAdmin):
    """Admin configuration for Requirement model"""
    list_display = ['title', 'admin', 'load_type', 'truck_type', 'weight', 'status', 'pickup_date', 'created_at']
    list_filter = ['load_type', 'truck_type', 'status', 'pickup_date', 'created_at']
    search_fields = ['title', 'from_location', 'to_location', 'admin__username']
    list_editable = ['status']
    ordering = ['-created_at']
    date_hierarchy = 'pickup_date'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('admin', 'title', 'description', 'load_type', 'weight', 'truck_type')
        }),
        ('Location & Time', {
            'fields': ('from_location', 'to_location', 'pickup_date', 'delivery_date', 'bidding_end_date')
        }),
        ('Budget', {
            'fields': ('budget_min', 'budget_max')
        }),
        ('Status & Additional Info', {
            'fields': ('status', 'special_instructions', 'is_active')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('admin')


class BidInline(admin.TabularInline):
    """Inline admin for bids"""
    model = Bid
    extra = 0
    readonly_fields = ['created_at']
    fields = ['user', 'truck', 'amount', 'status', 'created_at']


@admin.register(Bid)
class BidAdmin(admin.ModelAdmin):
    """Admin configuration for Bid model"""
    list_display = ['__str__', 'user', 'truck', 'amount', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['requirement__title', 'user__username', 'truck__registration_number']
    list_editable = ['status']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Bid Information', {
            'fields': ('requirement', 'user', 'truck', 'amount', 'estimated_delivery_time')
        }),
        ('Messages', {
            'fields': ('message', 'response_message')
        }),
        ('Status', {
            'fields': ('status',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('requirement', 'user', 'truck')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Admin configuration for Order model"""
    list_display = ['order_number', 'user', 'truck', 'status', 'payment_status', 'created_at']
    list_filter = ['status', 'payment_status', 'created_at']
    search_fields = ['order_number', 'user__username', 'truck__registration_number', 'requirement__title']
    list_editable = ['status', 'payment_status']
    ordering = ['-created_at']
    readonly_fields = ['order_number', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Order Information', {
            'fields': ('order_number', 'requirement', 'user', 'truck', 'accepted_bid')
        }),
        ('Status', {
            'fields': ('status', 'payment_status')
        }),
        ('Timing', {
            'fields': ('actual_pickup_time', 'actual_delivery_time', 'estimated_delivery_time')
        }),
        ('Driver Information', {
            'fields': ('driver_name', 'driver_phone', 'driver_license')
        }),
        ('Feedback', {
            'fields': ('rating', 'review', 'notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('requirement', 'user', 'truck')


class LocationInline(admin.TabularInline):
    """Inline admin for locations"""
    model = Location
    extra = 0
    readonly_fields = ['timestamp']
    fields = ['latitude', 'longitude', 'address', 'speed', 'timestamp']
    ordering = ['-timestamp']


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    """Admin configuration for Location model"""
    list_display = ['order', 'latitude', 'longitude', 'speed', 'timestamp']
    list_filter = ['timestamp']
    search_fields = ['order__order_number', 'address']
    ordering = ['-timestamp']
    readonly_fields = ['timestamp']
    
    fieldsets = (
        ('Location Information', {
            'fields': ('order', 'latitude', 'longitude', 'address')
        }),
        ('Additional Data', {
            'fields': ('speed', 'heading', 'altitude', 'accuracy')
        }),
        ('Timestamp', {
            'fields': ('timestamp',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('order')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin configuration for Notification model"""
    list_display = ['title', 'user', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'user__username']
    list_editable = ['is_read']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Notification Information', {
            'fields': ('user', 'title', 'message', 'notification_type')
        }),
        ('Status', {
            'fields': ('is_read',)
        }),
        ('Related Objects', {
            'fields': ('requirement', 'order', 'bid'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


# Add inlines to related models
RequirementAdmin.inlines = [BidInline]
OrderAdmin.inlines = [LocationInline]
