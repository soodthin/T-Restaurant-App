from django.db.models import Avg
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

    def create(self, validated_data):
        data = validated_data.copy()
        user = User(**data)
        user.set_password(user.password)
        user.save()
        return user


class FoodCategorySerializer(ModelSerializer):
    class Meta:
        model = FoodCategory
        fields = '__all__'


class MenuSerializer(ModelSerializer):
    class Meta:
        model = Menu
        fields = '__all__'


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

    def create(self, validated_data):
        validated_data['chef'] = self.context['request'].user
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

    def create(self, validated_data):
        validated_data['customer'] = self.context['request'].user
        return super().create(validated_data)


class OrderDetailSerializer(ModelSerializer):
    dish_name = SerializerMethodField()

    class Meta:
        model = OrderDetail
        fields = ['id', 'dish', 'dish_name', 'quantity', 'unit_price']

    def get_dish_name(self, obj):
        return obj.dish.name if obj.dish else None


class OrderSerializer(ModelSerializer):
    details = OrderDetailSerializer(many=True, read_only=True)
    payment_method = SerializerMethodField()
    payment_status = SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'customer', 'booking', 'status',
            'total_amount', 'details', 'payment_method', 'payment_status',
            'created_date', 'updated_date'
        ]
        read_only_fields = ['customer', 'total_amount']

    def create(self, validated_data):
        validated_data['customer'] = self.context['request'].user
        return super().create(validated_data)

    def get_payment_method(self, obj):
        if hasattr(obj, 'payment'):
            return obj.payment.method
        return None

    def get_payment_status(self, obj):
        if hasattr(obj, 'payment'):
            return obj.payment.status
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

    def create(self, validated_data):
        validated_data['customer'] = self.context['request'].user
        return super().create(validated_data)


class PaymentSerializer(ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['status', 'transaction_id']
