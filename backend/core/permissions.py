from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Permission class to allow only admin users"""
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'admin'
        )


class IsTruckOwner(BasePermission):
    """Permission class to allow only truck owner users"""
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'user'
        )


class IsAdminOrTruckOwner(BasePermission):
    """Permission class to allow both admin and truck owner users"""
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['admin', 'user']
        )


class IsOwnerOrAdmin(BasePermission):
    """Permission class to allow object owner or admin"""
    
    def has_object_permission(self, request, view, obj):
        # Admin has full access
        if request.user.role == 'admin':
            return True
        
        # Check if user owns the object
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # For User model
        if hasattr(obj, 'username'):
            return obj == request.user
        
        return False


class IsTruckOwnerOrReadOnly(BasePermission):
    """Permission class to allow truck owners or read-only access"""
    
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return request.user and request.user.is_authenticated
        
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'user'
        )


class IsAdminOrReadOnly(BasePermission):
    """Permission class to allow admin write access or read-only for others"""
    
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return request.user and request.user.is_authenticated
        
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'admin'
        )


class CanBidOnRequirement(BasePermission):
    """Permission class to check if user can bid on requirement"""
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'user'
        )
    
    def has_object_permission(self, request, view, obj):
        # Truck owners can bid on requirements
        if request.user.role == 'user':
            # Check if requirement is still open for bidding
            if hasattr(obj, 'is_bidding_open'):
                return obj.is_bidding_open
            return True
        
        return False


class CanManageBids(BasePermission):
    """Permission class for bid management"""
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated
        )
    
    def has_object_permission(self, request, view, obj):
        # Admin can manage all bids on their requirements
        if request.user.role == 'admin' and hasattr(obj, 'requirement'):
            return obj.requirement.admin == request.user
        
        # Truck owners can view/modify their own bids
        if request.user.role == 'user' and hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False


class CanManageOrder(BasePermission):
    """Permission class for order management"""
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated
        )
    
    def has_object_permission(self, request, view, obj):
        # Admin can manage orders from their requirements
        if request.user.role == 'admin' and hasattr(obj, 'requirement'):
            return obj.requirement.admin == request.user
        
        # Truck owners can manage their own orders
        if request.user.role == 'user' and hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False
