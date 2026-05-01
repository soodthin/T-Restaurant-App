from rest_framework import permissions


class IsChef(permissions.BasePermission):
    # cho phep dau bep da duoc admin duyet
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == 'chef'
            and request.user.is_verified
        )


class IsOwner(permissions.BasePermission):
    # chi chinh chu moi duoc sua/xoa, ai cung doc duoc
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if hasattr(obj, 'customer'):
            return obj.customer == request.user
        if hasattr(obj, 'chef'):
            return obj.chef == request.user
        return obj == request.user
