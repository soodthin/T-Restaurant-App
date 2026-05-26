import csv
from datetime import timedelta

from django import forms
from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.db.models import Count, Sum, F
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth
from django.http import HttpResponse
from django.template.response import TemplateResponse
from django.urls import path
from django.utils import timezone
from ckeditor_uploader.widgets import CKEditorUploadingWidget

from .models import (
    User, FoodCategory, Menu, Dish,
    TableBooking, Order, OrderDetail,
    Review, Payment, PaymentAttempt, WebhookEvent
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


class UserAdmin(DjangoUserAdmin):


    list_display = ['id', 'username', 'email', 'role', 'is_verified', 'is_staff']
    list_filter = ['role', 'is_verified', 'is_staff', 'is_active']
    actions = ['verify_chefs', 'unverify_chefs']

    fieldsets = DjangoUserAdmin.fieldsets + (
        ('Thong tin nha hang', {
            'fields': ('role', 'avatar', 'phone', 'address', 'is_verified'),
        }),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ('Thong tin nha hang', {
            'fields': ('role', 'phone', 'address'),
        }),
    )

    @admin.action(description='Duyet cac dau bep da chon')
    def verify_chefs(self, request, queryset):
        chefs = queryset.filter(role='chef')
        updated = chefs.update(is_verified=True)
        skipped = queryset.exclude(role='chef').count()
        msg = f'Da duyet {updated} dau bep.'
        if skipped:
            msg += f' Bo qua {skipped} tai khoan khong phai chef.'
        self.message_user(request, msg, level=messages.SUCCESS)

    @admin.action(description='Huy duyet cac dau bep da chon')
    def unverify_chefs(self, request, queryset):
        updated = queryset.filter(role='chef').update(is_verified=False)
        self.message_user(request, f'Da huy duyet {updated} dau bep.',
                          level=messages.WARNING)


PERIOD_TRUNC = {
    'day': TruncDay,
    'week': TruncWeek,
    'month': TruncMonth,
}


class RestaurantAdminSite(admin.AdminSite):
    site_header = 'T-Restaurant'

    def get_urls(self):
        return [
            path('dish-stats/', self.admin_view(self.dish_stats), name='dish-stats'),
        ] + super().get_urls()

    def dish_stats(self, request):
        period = request.GET.get('period', 'day')
        if period not in PERIOD_TRUNC:
            period = 'day'
        try:
            days = max(1, min(365, int(request.GET.get('days', '30'))))
        except (TypeError, ValueError):
            days = 30
        since = timezone.now() - timedelta(days=days)
        trunc = PERIOD_TRUNC[period]

        category_stats = list(
            FoodCategory.objects.annotate(count=Count('dishes')).values('id', 'name', 'count')
        )

        booking_series = list(
            TableBooking.objects.filter(created_date__gte=since)
            .annotate(bucket=trunc('created_date'))
            .values('bucket').annotate(count=Count('id'))
            .order_by('bucket')
        )
        revenue_series = list(
            Payment.objects.filter(status='completed', paid_at__gte=since)
            .annotate(bucket=trunc('paid_at'))
            .values('bucket').annotate(total=Sum('amount'))
            .order_by('bucket')
        )

        def fmt(series, key):
            return [
                {
                    'label': r['bucket'].strftime('%d/%m/%Y') if r['bucket'] else '',
                    'value': r[key] or 0,
                }
                for r in series
            ]

        top_dishes = list(
            OrderDetail.objects.filter(order__created_date__gte=since)
            .values('dish_id', 'dish__name')
            .annotate(
                orders=Sum('quantity'),
                revenue=Sum(F('unit_price') * F('quantity')),
            )
            .order_by('-revenue')[:10]
        )

        totals = {
            'dishes': Dish.objects.count(),
            'bookings': TableBooking.objects.count(),
            'orders': Order.objects.count(),
            'users': User.objects.count(),
            'chefs_pending': User.objects.filter(role='chef', is_verified=False).count(),
            'revenue': Payment.objects.filter(status='completed').aggregate(
                total=Sum('amount'))['total'] or 0,
            'pending_payments': Payment.objects.filter(status='pending').count(),
            'failed_payments': Payment.objects.filter(status='failed').count(),
        }

        ctx = {
            **self.each_context(request),
            'title': 'Bao cao tong quan',
            'period': period,
            'days': days,
            'period_options': [
                ('day', 'Theo ngay'),
                ('week', 'Theo tuan'),
                ('month', 'Theo thang'),
            ],
            'days_options': [7, 30, 90, 180, 365],
            'category_stats': category_stats,
            'booking_series': fmt(booking_series, 'count'),
            'revenue_series': fmt(revenue_series, 'total'),
            'top_dishes': top_dishes,
            'totals': totals,
        }
        return TemplateResponse(request, 'admin/stats.html', ctx)


class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'method', 'status', 'amount',
                    'transaction_id', 'paid_at', 'expires_at', 'created_date']
    list_filter = ['method', 'status', 'paid_at', 'expires_at', 'created_date']
    search_fields = [
        'transaction_id', 'gateway_request_id', 'gateway_order_id',
        'order__id', 'order__customer__username',
    ]
    readonly_fields = [
        'transaction_id', 'gateway_request_id', 'gateway_order_id',
        'pay_url', 'deeplink_url', 'qr_code_url', 'current_attempt',
        'amount', 'expires_at', 'paid_at', 'failure_reason',
        'created_date', 'updated_date',
    ]
    actions = ['export_csv']

    @admin.action(description='Xuat CSV giao dich (doi soat)')
    def export_csv(self, request, queryset):


        response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
        ts = timezone.now().strftime('%Y%m%d_%H%M%S')
        response['Content-Disposition'] = f'attachment; filename="payments_{ts}.csv"'
        response.write('﻿')
        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Order ID', 'Customer', 'Method', 'Status', 'Amount (VND)',
            'Transaction ID', 'Gateway request ID', 'Gateway order ID',
            'Paid at', 'Expires at', 'Failure reason', 'Created date',
        ])
        for p in queryset.select_related('order__customer').order_by('-created_date'):
            writer.writerow([
                p.id, p.order_id,
                p.order.customer.username if p.order and p.order.customer else '',
                p.get_method_display(), p.get_status_display(),
                p.amount, p.transaction_id or '', p.gateway_request_id or '',
                p.gateway_order_id or '',
                timezone.localtime(p.paid_at).strftime('%Y-%m-%d %H:%M:%S') if p.paid_at else '',
                timezone.localtime(p.expires_at).strftime('%Y-%m-%d %H:%M:%S') if p.expires_at else '',
                p.failure_reason or '',
                timezone.localtime(p.created_date).strftime('%Y-%m-%d %H:%M:%S'),
            ])
        self.message_user(
            request,
            f'Da xuat {queryset.count()} giao dich ra CSV.',
            level=messages.SUCCESS,
        )
        return response


class PaymentAttemptAdmin(admin.ModelAdmin):

    list_display = [
        'id', 'payment', 'method', 'status', 'amount',
        'gateway_request_id', 'transaction_id', 'expires_at', 'paid_at',
        'created_date',
    ]
    list_filter = ['method', 'status', 'expires_at', 'paid_at', 'created_date']
    search_fields = [
        'payment__id', 'payment__order__id', 'gateway_request_id',
        'gateway_order_id', 'transaction_id',
    ]
    readonly_fields = [
        'payment', 'method', 'status', 'amount',
        'gateway_request_id', 'gateway_order_id', 'transaction_id',
        'pay_url', 'deeplink_url', 'qr_code_url',
        'expires_at', 'paid_at', 'failure_reason',
        'created_date', 'updated_date',
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class WebhookEventAdmin(admin.ModelAdmin):


    list_display = ['id', 'created_date', 'provider', 'event_type',
                    'payment', 'attempt', 'signature_valid', 'result']
    list_filter = ['provider', 'result', 'signature_valid', 'created_date']
    search_fields = ['event_id', 'payment__id', 'payment__transaction_id']
    readonly_fields = ['event_id', 'payment', 'attempt', 'provider', 'event_type',
                       'payload', 'signature_valid', 'result', 'created_date']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


admin_site = RestaurantAdminSite(name='restaurant')

admin_site.register(User, UserAdmin)
admin_site.register(FoodCategory)
admin_site.register(Menu)
admin_site.register(Dish, DishAdmin)
admin_site.register(TableBooking)
class OrderDetailInline(admin.TabularInline):
    model = OrderDetail
    extra = 0

class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'status', 'get_payment_method', 'get_payment_status', 'total_amount', 'created_date']
    list_filter = ['status', 'created_date']
    search_fields = ['id', 'customer__username']
    inlines = [OrderDetailInline]

    @admin.display(description='P.Thức T.Toán')
    def get_payment_method(self, obj):
        try:
            return obj.payment.get_method_display()
        except Payment.DoesNotExist:
            return '-'

    @admin.display(description='T.Thái T.Toán')
    def get_payment_status(self, obj):
        try:
            return obj.payment.get_status_display()
        except Payment.DoesNotExist:
            return '-'

admin_site.register(Order, OrderAdmin)
admin_site.register(OrderDetail)
admin_site.register(Review)
admin_site.register(Payment, PaymentAdmin)
admin_site.register(PaymentAttempt, PaymentAttemptAdmin)
admin_site.register(WebhookEvent, WebhookEventAdmin)
