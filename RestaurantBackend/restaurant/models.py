from django.db import models
from django.contrib.auth.models import AbstractUser
from ckeditor.fields import RichTextField


class User(AbstractUser):
    ROLES = [
        ('admin', 'ADMIN'),
        ('chef', 'CHEF'),
        ('customer', 'CUSTOMER'),
    ]

    role = models.CharField(max_length=20, choices=ROLES, default='customer')
    avatar = models.ImageField(upload_to='avatars/%Y/%m/', null=True, blank=True)
    phone = models.CharField(max_length=15, null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)
    is_verified = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = 'admin'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class ModelBase(models.Model):
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    active = models.BooleanField(default=True)

    class Meta:
        abstract = True
        ordering = ['-id']


class FoodCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Food Categories'


class Menu(ModelBase):
    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name


class Dish(ModelBase):
    name = models.CharField(max_length=200)
    description = RichTextField(null=True, blank=True)
    image = models.ImageField(upload_to='dishes/%Y/%m/', null=True, blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=0)
    ingredients = models.TextField(null=True, blank=True)
    preparation_time = models.PositiveIntegerField(help_text='Thoi gian chuan bi (phut)')
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE, related_name='dishes')
    category = models.ForeignKey(FoodCategory, on_delete=models.PROTECT, related_name='dishes')
    chef = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dishes',
                             limit_choices_to={'role': 'chef'})

    def __str__(self):
        return f"{self.name} - {self.price} VND"

    class Meta:
        verbose_name_plural = 'Dishes'
        ordering = ['-id']


class TableBooking(ModelBase):
    BOOKING_STATUSES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    booking_date = models.DateTimeField()
    guests = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=BOOKING_STATUSES, default='pending')
    note = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Booking #{self.id} - {self.customer.username} ({self.get_status_display()})"


class Order(ModelBase):
    ORDER_STATUSES = [
        ('pending', 'Pending'),
        # Online payment thanh cong → webhook tu chuyen pending → paid.
        # Cash khong qua trang thai nay (chef accept truc tiep tu pending).
        ('paid', 'Paid'),
        # Online payment that bai → webhook tu chuyen pending → payment_failed.
        ('payment_failed', 'Payment Failed'),
        ('preparing', 'Preparing'),
        ('served', 'Served'),
        ('cancelled', 'Cancelled'),
    ]

    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    booking = models.ForeignKey(TableBooking, on_delete=models.SET_NULL,
                                null=True, blank=True, related_name='orders')
    status = models.CharField(max_length=20, choices=ORDER_STATUSES, default='pending')
    total_amount = models.DecimalField(max_digits=12, decimal_places=0, default=0)

    def __str__(self):
        return f"Order #{self.id} - {self.customer.username}"


class OrderDetail(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='details')
    dish = models.ForeignKey(Dish, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=0)

    def __str__(self):
        return f"{self.dish.name} x{self.quantity}"


class Review(models.Model):
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    dish = models.ForeignKey(Dish, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(null=True, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('customer', 'dish')

    def __str__(self):
        return f"{self.customer.username} - {self.dish.name}: {self.rating} stars"


class Payment(models.Model):
    PAYMENT_METHODS = [
        ('cash', 'Tiền mặt khi nhận'),
        ('momo', 'MoMo'),
        ('stripe', 'Stripe'),
    ]

    PAYMENT_STATUSES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUSES, default='pending')
    amount = models.DecimalField(max_digits=12, decimal_places=0)
    transaction_id = models.CharField(max_length=255, null=True, blank=True)
    # URL thanh toan tu cong (vi du payUrl tu MoMo). FE mo trong WebView.
    pay_url = models.URLField(max_length=500, null=True, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment #{self.id} - {self.get_method_display()} ({self.get_status_display()})"


class WebhookEvent(models.Model):
    """Audit log moi event tu cong thanh toan (MoMo IPN / Stripe webhook).

    Muc dich:
    - Minh bach tai chinh: chung minh moi state change cua Payment deu co evidence
      tu gateway (raw payload + signature verify result).
    - Idempotency: gateway co the retry → check event_id de tranh xu ly trung.
    - Debug: xem duoc payload thuc te khi gateway report khac DB (hiem khi xay ra).
    """
    PROVIDERS = [('momo', 'MoMo'), ('stripe', 'Stripe')]
    RESULTS = [
        ('updated', 'Da cap nhat payment'),
        ('duplicate', 'Trung event (bo qua)'),
        ('unknown_payment', 'Khong tim thay payment'),
        ('invalid_signature', 'Sai chu ky'),
        ('invalid_payload', 'Payload loi'),
    ]

    # Stripe gui evt.id, MoMo khong co → ta build "{requestId}:{resultCode}".
    event_id = models.CharField(max_length=255, unique=True)
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL,
                                null=True, blank=True, related_name='webhook_events')
    provider = models.CharField(max_length=10, choices=PROVIDERS)
    event_type = models.CharField(max_length=100, blank=True)
    payload = models.JSONField()
    signature_valid = models.BooleanField(default=False)
    result = models.CharField(max_length=30, choices=RESULTS)
    created_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_date']
        indexes = [models.Index(fields=['provider', 'created_date'])]

    def __str__(self):
        return f"{self.get_provider_display()} {self.event_type} [{self.result}]"
