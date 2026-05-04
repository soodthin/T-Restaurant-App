from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied


class IsChef(permissions.BasePermission):
    """
    Cho phep dau bep da duoc admin duyet.
    Phan biet thong diep loi de UI hien thi tieng Viet de hieu cho user.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if getattr(user, 'role', None) != 'chef':
            raise PermissionDenied(
                'Chỉ tài khoản đầu bếp mới có quyền thực hiện thao tác này.'
            )
        if not getattr(user, 'is_verified', False):
            raise PermissionDenied(
                'Tài khoản đầu bếp của bạn chưa được Admin phê duyệt. '
                'Vui lòng liên hệ quản trị viên để được kích hoạt.'
            )
        return True


class IsOwner(permissions.BasePermission):
    """
    Chi chinh chu moi duoc sua/xoa; ai cung doc duoc (SAFE_METHODS).
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if hasattr(obj, 'customer'):
            owner = obj.customer
        elif hasattr(obj, 'chef'):
            owner = obj.chef
        else:
            owner = obj
        if owner != request.user:
            raise PermissionDenied(
                'Bạn không có quyền chỉnh sửa hoặc xóa tài nguyên này vì không phải chủ sở hữu.'
            )
        return True
