from rest_framework import viewsets, generics, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from django.db.models import Sum, F, Avg, Count, FloatField, Value
from django.db.models.functions import Coalesce

from .models import (
    User, FoodCategory, Menu, Dish,
    TableBooking, Order, OrderDetail,
    Review, Payment
)
from .serializers import (
    UserSerializer, FoodCategorySerializer, MenuSerializer,
    DishSerializer, TableBookingSerializer,
    OrderSerializer, OrderDetailSerializer,
    ReviewSerializer, PaymentSerializer
)
from .perms import IsChef, IsOwner


class UserViewSet(viewsets.ViewSet, generics.CreateAPIView,
                  generics.ListAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    parser_classes = [MultiPartParser]

    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get', 'patch'], url_path='current-user',
            parser_classes=[MultiPartParser])
    def current_user(self, request):
        if request.method == 'PATCH':
            serializer = UserSerializer(request.user, data=request.data,
                                        partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return Response(UserSerializer(request.user).data)

    @action(detail=True, methods=['patch'], url_path='verify-chef')
    def verify_chef(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'detail': 'Khong co quyen'},
                            status=status.HTTP_403_FORBIDDEN)
        user = self.get_object()
        if user.role != 'chef':
            return Response({'detail': 'User nay khong phai dau bep'},
                            status=status.HTTP_400_BAD_REQUEST)
        user.is_verified = True
        user.save()
        return Response(UserSerializer(user).data)


class FoodCategoryViewSet(viewsets.ModelViewSet):
    queryset = FoodCategory.objects.all()
    serializer_class = FoodCategorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class MenuViewSet(viewsets.ModelViewSet):
    queryset = Menu.objects.filter(active=True)
    serializer_class = MenuSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class DishViewSet(viewsets.ModelViewSet):
    queryset = Dish.objects.filter(active=True)
    serializer_class = DishSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'name', 'chef__username', 'chef__first_name', 'chef__last_name',
        'category__name', 'menu__name'
    ]
    ordering_fields = ['name', 'price', 'preparation_time', 'avg_rating']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'reviews', 'compare']:
            return [permissions.AllowAny()]
        return [IsChef()]

    def get_queryset(self):
        qs = Dish.objects.filter(active=True).select_related('chef', 'category', 'menu').annotate(
            avg_rating=Coalesce(Avg('reviews__rating'), Value(0.0), output_field=FloatField()),
            review_count=Count('reviews', distinct=True),
        )
        # loc theo category_id neu co truyen
        cat_id = self.request.query_params.get('category_id')
        if cat_id:
            qs = qs.filter(category_id=cat_id)
        menu_id = self.request.query_params.get('menu_id')
        if menu_id:
            qs = qs.filter(menu_id=menu_id)
        # neu la chef dang dang nhap, chi hien mon cua chef do
        if (self.request.user.is_authenticated
                and self.request.user.role == 'chef'
                and self.action == 'list'
                and self.request.query_params.get('my') == 'true'):
            qs = qs.filter(chef=self.request.user)
        return qs

    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        dish = self.get_object()
        return Response(ReviewSerializer(dish.reviews.all(), many=True).data)

    @action(detail=False, methods=['get'], url_path='compare')
    def compare(self, request):
        ids = request.query_params.get('ids', '')
        if not ids:
            return Response({'detail': 'Truyen tham so ids'},
                            status=status.HTTP_400_BAD_REQUEST)
        id_list = [int(i) for i in ids.split(',') if i.isdigit()]
        dishes = self.get_queryset().filter(id__in=id_list)
        return Response(DishSerializer(dishes, many=True).data)


class TableBookingViewSet(viewsets.ModelViewSet):
    queryset = TableBooking.objects.all()
    serializer_class = TableBookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return TableBooking.objects.all()
        return TableBooking.objects.filter(customer=user)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Order.objects.select_related('payment').prefetch_related('details__dish')
        return Order.objects.filter(customer=user).select_related('payment').prefetch_related('details__dish')

    @action(detail=True, methods=['post'], url_path='add-detail')
    def add_detail(self, request, pk=None):
        order = self.get_object()
        serializer = OrderDetailSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(order=order)
            order.total_amount = sum(
                d.unit_price * d.quantity for d in order.details.all()
            )
            order.save()
            return Response(OrderSerializer(order).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Payment.objects.all()
        return Payment.objects.filter(order__customer=user)


class StatsView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {}

        if user.role == 'chef' and user.is_verified:
            dishes = Dish.objects.filter(chef=user)
            order_details = OrderDetail.objects.filter(dish__chef=user)
            data['total_dishes'] = dishes.count()
            data['total_orders'] = order_details.aggregate(
                total=Sum('quantity'))['total'] or 0
            data['revenue'] = order_details.aggregate(
                total=Sum(F('unit_price') * F('quantity')))['total'] or 0

        if user.is_staff:
            data['total_dishes'] = Dish.objects.count()
            data['total_bookings'] = TableBooking.objects.count()
            data['total_orders'] = Order.objects.count()
            data['revenue'] = Payment.objects.filter(
                status='completed'
            ).aggregate(total=Sum('amount'))['total'] or 0
            data['total_users'] = User.objects.count()

        return Response(data)
