from django import forms
from django.contrib import admin
from django.db.models import Count
from django.template.response import TemplateResponse
from django.urls import path
from ckeditor_uploader.widgets import CKEditorUploadingWidget

from .models import (
    User, FoodCategory, Menu, Dish,
    TableBooking, Order, OrderDetail,
    Review, Payment
)


class DishForm(forms.ModelForm):
    description = forms.CharField(widget=CKEditorUploadingWidget, required=False)

    class Meta:
        model = Dish
        fields = '__all__'


class DishAdmin(admin.ModelAdmin):
    form = DishForm
    list_display = ['id', 'name', 'price', 'category', 'chef', 'active']
    search_fields = ['name', 'chef__username']
    list_filter = ['category', 'menu', 'active']


class RestaurantAdminSite(admin.AdminSite):
    site_header = 'T-Restaurant'

    def get_urls(self):
        return [
            path('dish-stats/', self.dish_stats),
        ] + super().get_urls()

    def dish_stats(self, request):
        stats = FoodCategory.objects.annotate(count=Count('dishes')).values('id', 'name', 'count')
        return TemplateResponse(request, 'admin/stats.html', {'stats': stats})


admin_site = RestaurantAdminSite(name='restaurant')

admin_site.register(User)
admin_site.register(FoodCategory)
admin_site.register(Menu)
admin_site.register(Dish, DishAdmin)
admin_site.register(TableBooking)
admin_site.register(Order)
admin_site.register(OrderDetail)
admin_site.register(Review)
admin_site.register(Payment)
