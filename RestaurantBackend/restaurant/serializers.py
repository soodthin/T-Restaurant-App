import re

from django.db.models import Avg
from django.utils import timezone
from rest_framework import serializers
from rest_framework.serializers import (
    ModelSerializer,
    SerializerMethodField,
    FloatField,
    IntegerField,
)

from .models import (
    User, FoodCategory, Menu, Dish,
    TableBooking, Order, OrderDetail,
    Review, Payment
)


PHONE_RE = re.compile(r'^\+?\d{9,15}$')
USERNAME_RE = re.compile(r'^[A-Za-z0-9_.]{3,30}$')
ALLOWED_ROLES = {'admin', 'chef', 'customer'}


class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name',
            'username', 'password', 'email',
            'role', 'avatar', 'phone', 'address', 'is_verified'
        ]
        extra_kwargs = {'password': {'write_only': True}}
        read_only_fields = ['is_verified']

    def validate_username(self, value):
        value = (value or '').strip()
        if not USERNAME_RE.match(value):
            raise serializers.ValidationError(
                'Tên đăng nhập 3-30 ký tự, chỉ chữ/số/_/.')
        # Khi tao moi: phai unique. Khi update: cho phep giu nguyen username.
        qs = User.objects.filter(username__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Tên đăng nhập đã tồn tại.')
        return value

    def validate_email(self, value):
        value = (value or '').strip().lower()
        if not value:
            raise serializers.ValidationError('Email không được để trống.')
        qs = User.objects.filter(email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Email đã được sử dụng.')
        return value

    def validate_phone(self, value):
        if value in (None, ''):
            return value
        cleaned = re.sub(r'\s+', '', value)
        if not PHONE_RE.match(cleaned):
            raise serializers.ValidationError(
                'Số điện thoại phải gồm 9-15 chữ số, có thể bắt đầu bằng "+".')
        return cleaned

    def validate_password(self, value):
        if value is None:
            return value
        if len(value) < 6:
            raise serializers.ValidationError('Mật khẩu phải ít nhất 6 ký tự.')
        return value

    def validate_role(self, value):
        if value and value not in ALLOWED_ROLES:
            raise serializers.ValidationError('Vai trò không hợp lệ.')
        return value or 'customer'

    def validate_first_name(self, value):
        if not (value or '').strip():
            raise serializers.ValidationError('Họ không được để trống.')
        return value.strip()

    def validate_last_name(self, value):
        if not (value or '').strip():
            raise serializers.ValidationError('Tên không được để trống.')
        return value.strip()

    def create(self, validated_data):
        data = validated_data.copy()
        password = data.pop('password', None)
        user = User(**data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class FoodCategorySerializer(ModelSerializer):
    class Meta:
        model = FoodCategory
        fields = '__all__'

    def validate_name(self, value):
        value = (value or '').strip()
        if len(value) < 2:
            raise serializers.ValidationError('Tên loại món tối thiểu 2 ký tự.')
        return value


class MenuSerializer(ModelSerializer):
    class Meta:
        model = Menu
        fields = '__all__'

    def validate_name(self, value):
        value = (value or '').strip()
        if len(value) < 2:
            raise serializers.ValidationError('Tên thực đơn tối thiểu 2 ký tự.')
        return value


class DishSerializer(ModelSerializer):
    avg_rating = FloatField(read_only=True)
    review_count = IntegerField(read_only=True)
    chef_name = SerializerMethodField()
    category_name = SerializerMethodField()
    menu_name = SerializerMethodField()

    class Meta:
        model = Dish
        fields = [
            'id', 'name', 'description', 'image', 'price',
            'ingredients', 'preparation_time', 'active',
            'menu', 'menu_name', 'category', 'category_name', 'chef', 'chef_name',
            'avg_rating', 'review_count',
            'created_date', 'updated_date'
        ]
        read_only_fields = ['chef']

    def validate_name(self, value):
        value = (value or '').strip()
        if len(value) < 3:
            raise serializers.ValidationError('Tên món tối thiểu 3 ký tự.')
        if len(value) > 200:
            raise serializers.ValidationError('Tên món tối đa 200 ký tự.')
        return value

    def validate_price(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError('Giá phải lớn hơn 0.')
        if value > 100_000_000:
            raise serializers.ValidationError('Giá vượt giới hạn cho phép.')
        return value

    def validate_preparation_time(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError(
                'Thời gian chuẩn bị phải lớn hơn 0 phút.')
        if value > 24 * 60:
            raise serializers.ValidationError(
                'Thời gian chuẩn bị tối đa 1440 phút (1 ngày).')
        return value

    def create(self, validated_data):
        validated_data['chef'] = self.context['request'].user
        # Mon moi LUON tao voi active=False de cho admin duyet noi dung truoc khi hien thi
        # cong khai cho khach. Chef van thay/sua/xoa duoc mon cua minh qua ?my=true
        # (xem DishViewSet.get_queryset).
        validated_data['active'] = False
        return super().create(validated_data)

    def get_chef_name(self, obj):
        if not obj.chef:
            return None
        full_name = f"{obj.chef.first_name} {obj.chef.last_name}".strip()
        return full_name or obj.chef.username

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def get_menu_name(self, obj):
        return obj.menu.name if obj.menu else None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        avg_rating = getattr(instance, 'avg_rating', None)
        if avg_rating is None:
            avg_rating = instance.reviews.aggregate(avg=Avg('rating'))['avg'] or 0
        data['avg_rating'] = round(float(avg_rating), 1) if avg_rating else 0
        review_count = getattr(instance, 'review_count', None)
        if review_count is None:
            review_count = instance.reviews.count()
        data['review_count'] = int(review_count)
        return data


class TableBookingSerializer(ModelSerializer):
    class Meta:
        model = TableBooking
        fields = '__all__'
        read_only_fields = ['customer']

    def validate_booking_date(self, value):
        if value is None:
            raise serializers.ValidationError('Vui lòng chọn thời gian đặt bàn.')
        if value <= timezone.now():
            raise serializers.ValidationError(
                'Thời gian đặt bàn phải ở tương lai.')
        # Khong cho dat truoc qua xa (90 ngay) de tranh spam.
        if value > timezone.now() + timezone.timedelta(days=90):
            raise serializers.ValidationError(
                'Chỉ được đặt bàn trong vòng 90 ngày tới.')
        return value

    def validate_guests(self, value):
        if value is None or value < 1:
            raise serializers.ValidationError('Số khách phải lớn hơn 0.')
        if value > 50:
            raise serializers.ValidationError(
                'Vượt quá sức chứa tối đa cho một bàn (50 khách).')
        return value

    def validate(self, attrs):
        # Khi cap nhat trang thai, chi cho phep cac chuyen trang thai hop le.
        if self.instance and 'status' in attrs:
            current = self.instance.status
            new = attrs['status']
            allowed = {
                'pending': {'confirmed', 'cancelled'},
                'confirmed': {'completed', 'cancelled'},
                'cancelled': set(),
                'completed': set(),
            }
            if new != current and new not in allowed.get(current, set()):
                raise serializers.ValidationError(
                    {'status': f'Không thể chuyển từ "{current}" sang "{new}".'})
        return attrs

    def create(self, validated_data):
        validated_data['customer'] = self.context['request'].user
        return super().create(validated_data)


class OrderDetailSerializer(ModelSerializer):
    dish_name = SerializerMethodField()

    class Meta:
        model = OrderDetail
        fields = ['id', 'dish', 'dish_name', 'quantity', 'unit_price']
        read_only_fields = ['unit_price']  # Server tu set theo dish.price

    def get_dish_name(self, obj):
        return obj.dish.name if obj.dish else None

    def validate_quantity(self, value):
        if value is None or value < 1:
            raise serializers.ValidationError('Số lượng tối thiểu là 1.')
        if value > 100:
            raise serializers.ValidationError(
                'Số lượng cho mỗi món tối đa là 100.')
        return value

    def validate_dish(self, value):
        if not value or not value.active:
            raise serializers.ValidationError('Món ăn không khả dụng.')
        return value

    def create(self, validated_data):
        # Lay unit_price tu dish (chong gian lan gia o client).
        dish = validated_data['dish']
        validated_data['unit_price'] = dish.price
        return super().create(validated_data)


class OrderSerializer(ModelSerializer):
    details = OrderDetailSerializer(many=True, read_only=True)
    payment_method = SerializerMethodField()
    payment_status = SerializerMethodField()
    payment_id = SerializerMethodField()
    payment_pay_url = SerializerMethodField()
    payment_deeplink_url = SerializerMethodField()
    payment_qr_code_url = SerializerMethodField()
    payment_expires_at = SerializerMethodField()
    payment_paid_at = SerializerMethodField()
    payment_failure_reason = SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'customer', 'booking', 'status',
            'total_amount', 'details', 'payment_method', 'payment_status',
            'payment_id', 'payment_pay_url', 'payment_deeplink_url',
            'payment_qr_code_url', 'payment_expires_at', 'payment_paid_at',
            'payment_failure_reason',
            'created_date', 'updated_date'
        ]
        read_only_fields = ['customer', 'total_amount']

    def validate_booking(self, value):
        if value is None:
            return value
        request = self.context.get('request')
        if request and value.customer_id != request.user.id:
            raise serializers.ValidationError(
                'Lịch đặt bàn này không thuộc về bạn.')
        return value

    def validate(self, attrs):
        # Chi cho phep chuyen trang thai theo huong xuoi.
        # paid/payment_failed la trang thai do webhook tu chuyen, khong nen cho
        # client transition truc tiep — nhung cho phep tu paid/payment_failed →
        # cancelled (admin/customer huy don) va paid → preparing (chef accept).
        if self.instance and 'status' in attrs:
            current = self.instance.status
            new = attrs['status']
            allowed = {
                'pending': {'preparing', 'cancelled'},
                'paid': {'preparing', 'cancelled'},
                'payment_failed': {'cancelled'},
                'preparing': {'served', 'cancelled'},
                'served': set(),
                'cancelled': set(),
            }
            if new != current and new not in allowed.get(current, set()):
                raise serializers.ValidationError(
                    {'status': f'Không thể chuyển từ "{current}" sang "{new}".'})
        return attrs

    def create(self, validated_data):
        validated_data['customer'] = self.context['request'].user
        return super().create(validated_data)

    def get_payment_method(self, obj):
        payment = self._get_payment(obj)
        if payment:
            return payment.method
        return None

    def get_payment_status(self, obj):
        payment = self._get_payment(obj)
        if payment:
            return payment.status
        return None

    def get_payment_id(self, obj):
        payment = self._get_payment(obj)
        if payment:
            return payment.id
        return None

    def get_payment_pay_url(self, obj):
        payment = self._get_payment(obj)
        if payment:
            return payment.pay_url
        return None

    def get_payment_deeplink_url(self, obj):
        payment = self._get_payment(obj)
        if payment:
            return payment.deeplink_url
        return None

    def get_payment_qr_code_url(self, obj):
        payment = self._get_payment(obj)
        if payment:
            return payment.qr_code_url
        return None

    def get_payment_expires_at(self, obj):
        payment = self._get_payment(obj)
        if payment:
            return payment.expires_at
        return None

    def get_payment_paid_at(self, obj):
        payment = self._get_payment(obj)
        if payment:
            return payment.paid_at
        return None

    def get_payment_failure_reason(self, obj):
        payment = self._get_payment(obj)
        if payment:
            return payment.failure_reason
        return None

    def _get_payment(self, obj):
        try:
            return obj.payment
        except Payment.DoesNotExist:
            return None


class ReviewSerializer(ModelSerializer):
    customer_name = SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            'id', 'customer', 'customer_name', 'dish',
            'rating', 'comment', 'created_date'
        ]
        read_only_fields = ['customer']

    def get_customer_name(self, obj):
        if obj.customer:
            name = f"{obj.customer.first_name} {obj.customer.last_name}".strip()
            return name or obj.customer.username
        return None

    def validate_rating(self, value):
        if value is None or value < 1 or value > 5:
            raise serializers.ValidationError('Đánh giá phải từ 1 đến 5 sao.')
        return value

    def validate_comment(self, value):
        if value and len(value) > 1000:
            raise serializers.ValidationError(
                'Nội dung đánh giá tối đa 1000 ký tự.')
        return value

    def validate(self, attrs):
        # Khi tao moi, tranh trung review (1 user / 1 dish).
        if not self.instance:
            request = self.context.get('request')
            dish = attrs.get('dish')
            if request and dish and Review.objects.filter(
                    customer=request.user, dish=dish).exists():
                raise serializers.ValidationError(
                    {'dish': 'Bạn đã đánh giá món này. Hãy cập nhật đánh giá cũ.'})
        return attrs

    def create(self, validated_data):
        validated_data['customer'] = self.context['request'].user
        return super().create(validated_data)


class PaymentSerializer(ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = [
            'status', 'transaction_id', 'amount',
            'gateway_request_id', 'gateway_order_id',
            'pay_url', 'deeplink_url', 'qr_code_url', 'current_attempt',
            'expires_at', 'paid_at', 'failure_reason',
            'created_date', 'updated_date',
        ]

    def _get_existing_payment(self, order):
        try:
            return order.payment
        except Payment.DoesNotExist:
            return None

    def validate_order(self, value):
        if value is None:
            raise serializers.ValidationError('Đơn hàng không tồn tại.')
        request = self.context.get('request')
        if request and value.customer_id != request.user.id:
            raise serializers.ValidationError(
                'Đơn hàng này không thuộc về bạn.')
        if value.status not in {'pending', 'payment_failed'}:
            raise serializers.ValidationError(
                'Chỉ có thể thanh toán đơn hàng đang chờ hoặc thanh toán lỗi.')
        existing_payment = self._get_existing_payment(value)
        if existing_payment and existing_payment.status != 'failed':
            raise serializers.ValidationError(
                'Đơn hàng đã có thanh toán.')
        return value

    def create(self, validated_data):
        # Server tu set amount = total_amount cua order de chong gian lan.
        # refresh_from_db: phong stale cache neu add-detail vua xay ra trong
        # request truoc — bao dam doc total_amount moi nhat.
        order = validated_data['order']
        order.refresh_from_db()
        if order.total_amount <= 0:
            raise serializers.ValidationError({
                'order': 'Đơn hàng chưa có món nào hoặc tổng tiền bằng 0.'
            })

        existing_payment = self._get_existing_payment(order)
        if existing_payment and existing_payment.status == 'failed':
            existing_payment.method = validated_data['method']
            existing_payment.status = 'pending'
            existing_payment.amount = order.total_amount
            existing_payment.transaction_id = None
            existing_payment.gateway_request_id = None
            existing_payment.gateway_order_id = None
            existing_payment.pay_url = None
            existing_payment.deeplink_url = None
            existing_payment.qr_code_url = None
            existing_payment.current_attempt = None
            existing_payment.expires_at = None
            existing_payment.paid_at = None
            existing_payment.failure_reason = ''
            existing_payment.save(update_fields=[
                'method', 'status', 'amount', 'transaction_id',
                'gateway_request_id', 'gateway_order_id',
                'pay_url', 'deeplink_url', 'qr_code_url', 'current_attempt',
                'expires_at', 'paid_at', 'failure_reason', 'updated_date',
            ])
            if order.status == 'payment_failed':
                order.status = 'pending'
                order.save(update_fields=['status', 'updated_date'])
            return existing_payment

        validated_data['amount'] = order.total_amount
        validated_data['failure_reason'] = ''
        return super().create(validated_data)
