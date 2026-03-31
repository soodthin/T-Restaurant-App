from django.contrib import admin
from .models import (
    User, FoodCategory, Menu, Dish,
    TableBooking, Order, OrderDetail,
    Review, Payment
)

admin.site.register(User)
admin.site.register(FoodCategory)
admin.site.register(Menu)
admin.site.register(Dish)
admin.site.register(TableBooking)
admin.site.register(Order)
admin.site.register(OrderDetail)
admin.site.register(Review)
admin.site.register(Payment)
