from django.urls import path, include
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register('users', views.UserViewSet)
router.register('categories', views.FoodCategoryViewSet)
router.register('menus', views.MenuViewSet)
router.register('dishes', views.DishViewSet)
router.register('bookings', views.TableBookingViewSet)
router.register('orders', views.OrderViewSet)
router.register('reviews', views.ReviewViewSet)
router.register('payments', views.PaymentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', views.StatsView.as_view(), name='stats'),
]
