from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)

from . import views

# Create router for ViewSets
router = DefaultRouter()
router.register(r'trucks', views.TruckViewSet, basename='truck')
router.register(r'requirements', views.RequirementViewSet, basename='requirement')
router.register(r'bids', views.BidViewSet, basename='bid')
router.register(r'orders', views.OrderViewSet, basename='order')
router.register(r'locations', views.LocationViewSet, basename='location')
router.register(r'notifications', views.NotificationViewSet, basename='notification')

# Define URL patterns
urlpatterns = [
    # Authentication URLs
    path('auth/register/', views.RegisterView.as_view(), name='auth_register'),
    path('auth/login/', views.LoginView.as_view(), name='auth_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('auth/profile/', views.ProfileView.as_view(), name='auth_profile'),
    path('auth/change-password/', views.ChangePasswordView.as_view(), name='auth_change_password'),
    
    # Dashboard URLs
    path('dashboard/admin/', views.admin_dashboard, name='admin_dashboard'),
    path('dashboard/truck-owner/', views.truck_owner_dashboard, name='truck_owner_dashboard'),
    
    # Location tracking URLs
    path('orders/<int:order_id>/current-location/', views.current_location, name='current_location'),
    
    # Search URLs
    path('search/requirements/', views.search_requirements, name='search_requirements'),
    
    # Include router URLs
    path('', include(router.urls)),
    
    # WebSocket testing endpoints
    # path('orders/<int:order_id>/simulate-location/', views.simulate_location_update, name='simulate_location_update'),
    path('orders/<str:order_id>/simulate-location/', views.simulate_location_update, name='simulate_location_update'),
    path('orders/<str:order_id>/update-status/', views.update_order_status, name='update_order_status'),
]
