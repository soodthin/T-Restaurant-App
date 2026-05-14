from rest_framework import viewsets, generics, permissions, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from django.db.models import Sum, F, Avg, Count, FloatField, Value, DecimalField
from django.db.models.functions import Coalesce, TruncDay, TruncWeek, TruncMonth
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from datetime import timedelta
import json
import logging

logger = logging.getLogger(__name__)

from .models import (
    User, FoodCategory, Menu, Dish,
    TableBooking, Order, OrderDetail,
    Review, Payment, PaymentAttempt, WebhookEvent
)
from .serializers import (
    UserSerializer, FoodCategorySerializer, MenuSerializer,
    DishSerializer, TableBookingSerializer,
    OrderSerializer, OrderDetailSerializer,
    ReviewSerializer, PaymentSerializer
)
from .perms import IsChef, IsOwner
from .paginators import ItemPaginator, ReviewPaginator


ONLINE_PAYMENT_METHODS = {'momo', 'stripe'}
PAYMENT_ATTEMPT_TTL = timedelta(minutes=10)


def _payment_expires_at(method):
    if method in ONLINE_PAYMENT_METHODS:
        return timezone.now() + PAYMENT_ATTEMPT_TTL
    return None


def _is_current_attempt(payment, attempt):
    return payment.current_attempt_id == getattr(attempt, 'id', None)


def _copy_attempt_to_payment(payment, attempt):
    payment.method = attempt.method
    payment.status = attempt.status
    payment.amount = attempt.amount
    payment.transaction_id = attempt.transaction_id
    payment.gateway_request_id = attempt.gateway_request_id
    payment.gateway_order_id = attempt.gateway_order_id
    payment.pay_url = attempt.pay_url
    payment.deeplink_url = attempt.deeplink_url
    payment.qr_code_url = attempt.qr_code_url
    payment.current_attempt = attempt
    payment.expires_at = attempt.expires_at
    payment.paid_at = attempt.paid_at
    payment.failure_reason = attempt.failure_reason
    payment.save(update_fields=[
        'method', 'status', 'amount', 'transaction_id',
        'gateway_request_id', 'gateway_order_id',
        'pay_url', 'deeplink_url', 'qr_code_url', 'current_attempt',
        'expires_at', 'paid_at', 'failure_reason', 'updated_date',
    ])


def _mark_attempt_failed(attempt, reason):
    if attempt.status == 'completed':
        return attempt.payment
    attempt.status = 'failed'
    attempt.failure_reason = reason
    attempt.save(update_fields=['status', 'failure_reason', 'updated_date'])

    payment = attempt.payment
    if payment.status != 'completed' and _is_current_attempt(payment, attempt):
        _copy_attempt_to_payment(payment, attempt)
        _sync_order_status_from_payment(payment)
    return payment


def _mark_attempt_completed(attempt, transaction_id=None):
    now = timezone.now()
    attempt.status = 'completed'
    attempt.transaction_id = str(transaction_id or attempt.transaction_id or '')
    attempt.paid_at = now
    attempt.failure_reason = ''
    attempt.save(update_fields=[
        'status', 'transaction_id', 'paid_at', 'failure_reason', 'updated_date'
    ])

    payment = attempt.payment
    if payment.status != 'completed' or _is_current_attempt(payment, attempt):
        _copy_attempt_to_payment(payment, attempt)
        _sync_order_status_from_payment(payment)
    return payment


def _expire_gateway_session(attempt):
    if attempt.method != 'stripe' or not attempt.gateway_request_id:
        return
    try:
        from .stripe_gw import expire_stripe_checkout
        expire_stripe_checkout(attempt.gateway_request_id)
    except Exception as e:
        logger.info(
            '[payment] Cannot expire Stripe session %s: %s',
            attempt.gateway_request_id, e,
        )


def _expire_payment_if_needed(payment):
    if payment.status != 'pending' or not payment.expires_at:
        return payment
    if payment.expires_at > timezone.now():
        return payment
    attempt = payment.current_attempt
    if attempt and attempt.status == 'pending':
        _expire_gateway_session(attempt)
        return _mark_attempt_failed(attempt, 'Het thoi gian thanh toan 10 phut.')
    payment.status = 'failed'
    payment.failure_reason = 'Het thoi gian thanh toan 10 phut.'
    payment.save(update_fields=['status', 'failure_reason', 'updated_date'])
    _sync_order_status_from_payment(payment)
    return payment


def _expire_stale_payments_for_user(user):
    qs = Payment.objects.filter(status='pending', expires_at__lte=timezone.now())
    if not user.is_staff:
        qs = qs.filter(order__customer=user)
    for payment in qs.select_related('current_attempt', 'order')[:100]:
        _expire_payment_if_needed(payment)


class UserViewSet(viewsets.ViewSet, generics.CreateAPIView,
                  generics.ListAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    parser_classes = [MultiPartParser]
    pagination_class = ItemPaginator

    def get_permissions(self):
        if self.action in ['create', 'chefs']:
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

    @action(detail=False, methods=['get'], url_path='chefs',
            permission_classes=[permissions.AllowAny])
    def chefs(self, request):
        # Danh sach dau bep da duyet, de FE lam filter "dau bep phu trach"
        # tren trang kham pha. Tra it field cho nhe payload.
        qs = User.objects.filter(role='chef', is_verified=True, is_active=True).order_by('first_name', 'last_name', 'username')
        data = [
            {
                'id': u.id,
                'username': u.username,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'avatar': request.build_absolute_uri(u.avatar.url) if u.avatar else None,
            }
            for u in qs
        ]
        return Response(data)

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
    pagination_class = ItemPaginator
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    # Search chi theo ten mon. Loc theo category/menu da co query param rieng
    # (category_id, menu_id) o get_queryset.
    search_fields = ['name']
    ordering_fields = ['name', 'price', 'preparation_time', 'avg_rating']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'reviews', 'compare']:
            return [permissions.AllowAny()]
        if self.action in ['update', 'partial_update', 'destroy']:
            # Chef da duyet va dung la chu cua mon do.
            return [IsChef(), IsOwner()]
        return [IsChef()]

    def get_queryset(self):
        user = self.request.user
        qs = Dish.objects.all().select_related('chef', 'category', 'menu').annotate(
            avg_rating=Coalesce(Avg('reviews__rating'), Value(0.0), output_field=FloatField()),
            review_count=Count('reviews', distinct=True),
        )
        # Chef can thay ca mon active=False khi (a) ?my=true hoac (b) PATCH/DELETE
        # mon cua minh. Cac context khac chi tra ve mon active=True.
        is_chef_owner_action = (
            user.is_authenticated
            and getattr(user, 'role', None) == 'chef'
            and (
                self.request.query_params.get('my') == 'true'
                or self.action in ('partial_update', 'update', 'destroy')
            )
        )
        if not is_chef_owner_action:
            qs = qs.filter(active=True)
        params = self.request.query_params
        # loc theo category_id neu co truyen
        cat_id = params.get('category_id')
        if cat_id:
            qs = qs.filter(category_id=cat_id)
        menu_id = params.get('menu_id')
        if menu_id:
            qs = qs.filter(menu_id=menu_id)
        # loc theo khoang gia
        price_min = params.get('price_min')
        if price_min:
            qs = qs.filter(price__gte=price_min)
        price_max = params.get('price_max')
        if price_max:
            qs = qs.filter(price__lte=price_max)
        # loc theo thoi gian chuan bi (phut)
        prep_min = params.get('prep_min')
        if prep_min:
            qs = qs.filter(preparation_time__gte=prep_min)
        prep_max = params.get('prep_max')
        if prep_max:
            qs = qs.filter(preparation_time__lte=prep_max)
        # loc theo dau bep phu trach (de tai yeu cau)
        chef_id = params.get('chef_id')
        if chef_id:
            qs = qs.filter(chef_id=chef_id)
        # neu la chef dang dang nhap, chi hien mon cua chef do
        if (self.request.user.is_authenticated
                and self.request.user.role == 'chef'
                and self.action == 'list'
                and params.get('my') == 'true'):
            qs = qs.filter(chef=self.request.user)
        return qs

    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        reviews = self.get_object().reviews.all()
        p = ReviewPaginator()
        page = p.paginate_queryset(reviews, request)
        if page is not None:
            return p.get_paginated_response(ReviewSerializer(page, many=True).data)
        return Response(ReviewSerializer(reviews, many=True).data)

    @action(detail=False, methods=['get'], url_path='compare')
    def compare(self, request):
        ids = request.query_params.get('ids', '')
        if not ids:
            return Response({'detail': 'Truyen tham so ids'},
                            status=status.HTTP_400_BAD_REQUEST)
        id_list = [int(i) for i in ids.split(',') if i.isdigit()]
        dishes = self.get_queryset().filter(id__in=id_list)
        return Response(DishSerializer(dishes, many=True).data)

    @action(detail=False, methods=['get'], url_path='my-reviews',
            permission_classes=[IsChef])
    def my_reviews(self, request):
        # Tat ca review cho cac mon do chef hien tai phu trach.
        reviews = Review.objects.filter(
            dish__chef=request.user
        ).select_related('customer', 'dish').order_by('-created_date')
        # loc theo so sao chinh xac (1..5)
        rating = request.query_params.get('rating')
        if rating and rating.isdigit():
            reviews = reviews.filter(rating=int(rating))
        # loc theo mon cu the cua chef
        dish_id = request.query_params.get('dish')
        if dish_id and dish_id.isdigit():
            reviews = reviews.filter(dish_id=int(dish_id))
        p = ReviewPaginator()
        page = p.paginate_queryset(reviews, request)
        data = ReviewSerializer(page if page is not None else reviews, many=True).data
        # bo sung ten mon vao moi review de FE hien thi
        review_map = {r.id: r for r in (page if page is not None else reviews)}
        for item in data:
            review = review_map.get(item['id'])
            if review:
                item['dish_name'] = review.dish.name
        if page is not None:
            return p.get_paginated_response(data)
        return Response(data)


class TableBookingViewSet(viewsets.ModelViewSet):
    queryset = TableBooking.objects.all()
    serializer_class = TableBookingSerializer
    pagination_class = ItemPaginator
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return TableBooking.objects.all()
        return TableBooking.objects.filter(customer=user)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    pagination_class = ItemPaginator
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Order.objects.select_related('payment').prefetch_related('details__dish')
        return Order.objects.filter(customer=user).select_related('payment').prefetch_related('details__dish')

    def list(self, request, *args, **kwargs):
        _expire_stale_payments_for_user(request.user)
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        _expire_stale_payments_for_user(request.user)
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='add-detail')
    def add_detail(self, request, pk=None):
        order = self.get_object()
        if order.customer_id != request.user.id:
            return Response({'detail': 'Đơn hàng này không thuộc về bạn.'},
                            status=status.HTTP_403_FORBIDDEN)
        if order.status != 'pending':
            return Response(
                {'detail': 'Chỉ có thể thêm món khi đơn còn ở trạng thái chờ.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = OrderDetailSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(order=order)
        # Khong dung order.details.all() vi get_queryset co prefetch_related('details__dish'),
        # cache details rong tu luc get_object() — detail vua save khong vao cache → sum = 0.
        # Truy van truc tiep de bypass cache.
        order.total_amount = sum(
            d.unit_price * d.quantity
            for d in OrderDetail.objects.filter(order=order)
        )
        order.save()
        return Response(OrderSerializer(order, context={'request': request}).data)


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.select_related('customer', 'dish').all()
    serializer_class = ReviewSerializer
    pagination_class = ReviewPaginator

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsOwner()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'], url_path='mine',
            permission_classes=[permissions.IsAuthenticated])
    def mine(self, request):
        # Tat ca review do user hien tai da viet, kem ten + anh mon de FE hien thi.
        reviews = Review.objects.filter(
            customer=request.user
        ).select_related('dish').order_by('-created_date')
        p = ReviewPaginator()
        page = p.paginate_queryset(reviews, request)
        items = page if page is not None else reviews
        data = ReviewSerializer(items, many=True).data
        review_map = {r.id: r for r in items}
        for item in data:
            review = review_map.get(item['id'])
            if review and review.dish:
                item['dish_name'] = review.dish.name
                if review.dish.image:
                    item['dish_image'] = request.build_absolute_uri(review.dish.image.url)
                else:
                    item['dish_image'] = None
        if page is not None:
            return p.get_paginated_response(data)
        return Response(data)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    pagination_class = ItemPaginator
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Payment.objects.all()
        return Payment.objects.filter(order__customer=user)

    def list(self, request, *args, **kwargs):
        _expire_stale_payments_for_user(request.user)
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        payment = self.get_object()
        _expire_payment_if_needed(payment)
        serializer = self.get_serializer(payment)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        order_id = request.data.get('order')
        if order_id:
            stale = Payment.objects.filter(order_id=order_id).select_related(
                'current_attempt', 'order'
            ).first()
            if stale:
                _expire_payment_if_needed(stale)

        # Tao payment qua serializer (validate order, set amount tu order.total_amount).
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()
        logger.info(
            '[payment] id=%s order=%s method=%s amount=%s',
            payment.id, payment.order_id, payment.method, payment.amount,
        )

        # Dispatcher theo cong thanh toan. Cash khong can goi gateway, danh dau pending
        # cho nha hang xac nhan. Online gateway tao session/payUrl roi tra ve cho FE.
        if payment.method == 'momo':
            from .momo import create_momo_payment
            attempt = PaymentAttempt.objects.create(
                payment=payment,
                method=payment.method,
                amount=payment.amount,
                expires_at=_payment_expires_at(payment.method),
            )
            try:
                result = create_momo_payment(
                    order_id=payment.order_id,
                    amount=int(payment.amount),
                    order_info=f'Thanh toan don hang #{payment.order_id}',
                )
                attempt.pay_url = result.get('pay_url')
                if not attempt.pay_url:
                    raise RuntimeError('MoMo khong tra ve payUrl')
                attempt.deeplink_url = result.get('deeplink') or result.get('applink')
                attempt.qr_code_url = result.get('qr_code_url')
                attempt.gateway_request_id = result['request_id']
                attempt.gateway_order_id = result.get('order_id_momo')
                attempt.save(update_fields=[
                    'pay_url', 'deeplink_url', 'qr_code_url',
                    'gateway_request_id', 'gateway_order_id', 'updated_date',
                ])
                _copy_attempt_to_payment(payment, attempt)
            except Exception as e:
                _mark_attempt_failed(attempt, f'Khong tao duoc giao dich MoMo: {e}')
                return Response(
                    {'detail': f'Khong tao duoc giao dich MoMo: {e}'},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
        elif payment.method == 'stripe':
            from .stripe_gw import create_stripe_checkout
            attempt = PaymentAttempt.objects.create(
                payment=payment,
                method=payment.method,
                amount=payment.amount,
                expires_at=_payment_expires_at(payment.method),
            )
            try:
                result = create_stripe_checkout(
                    order_id=payment.order_id,
                    amount=int(payment.amount),
                    order_info=f'Thanh toan don hang #{payment.order_id}',
                )
                attempt.pay_url = result.get('pay_url')
                if not attempt.pay_url:
                    raise RuntimeError('Stripe khong tra ve Checkout URL')
                # Luu session_id de webhook tra cuu Payment (Stripe khong gui
                # Payment.id ve, chi gui session.id va metadata).
                attempt.gateway_request_id = result['session_id']
                attempt.gateway_order_id = result['session_id']
                attempt.save(update_fields=[
                    'pay_url', 'gateway_request_id', 'gateway_order_id',
                    'updated_date',
                ])
                _copy_attempt_to_payment(payment, attempt)
            except Exception as e:
                _mark_attempt_failed(attempt, f'Khong tao duoc giao dich Stripe: {e}')
                return Response(
                    {'detail': f'Khong tao duoc giao dich Stripe: {e}'},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
        else:
            payment.expires_at = None
            payment.failure_reason = ''
            payment.save(update_fields=['expires_at', 'failure_reason', 'updated_date'])

        return Response(
            self.get_serializer(payment).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        """User chu dong huy thanh toan tu app (vd: dong WebView).

        Idempotent: chi mark failed neu dang pending. Dam bao webhook 'completed'
        chay sau (race) khong bi ghi de — webhook se thay payment.failed va bo qua
        sync, hoac neu webhook chay truoc thi cancel nay khong lam gi.
        """
        payment = self.get_object()
        if payment.status != 'pending':
            return Response(
                {'detail': f'Khong the huy: payment dang o trang thai "{payment.status}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        attempt = payment.current_attempt
        if attempt:
            _expire_gateway_session(attempt)
            payment = _mark_attempt_failed(attempt, 'Khach hang huy thanh toan trong app.')
        else:
            payment.status = 'failed'
            payment.failure_reason = 'Khach hang huy thanh toan trong app.'
            payment.save(update_fields=['status', 'failure_reason', 'updated_date'])
            _sync_order_status_from_payment(payment)
        return Response(self.get_serializer(payment).data)


@csrf_exempt
@require_POST
def momo_ipn(request):
    """Webhook MoMo callback ve sau khi user thanh toan xong tren cong MoMo.

    Dung raw Django view (khong dung DRF @api_view) de dam bao request.body
    khong bi consume truoc — nhat quan voi stripe_webhook.
    Verify chu ky → cap nhat Payment.status va transaction_id.
    MoMo chi can HTTP 204.

    Audit: moi event log vao WebhookEvent (raw payload + ket qua xu ly) phuc vu
    minh bach tai chinh. Idempotency theo event_id de tranh xu ly trung khi MoMo
    retry.
    """
    from .momo import verify_ipn_signature

    try:
        data = json.loads(request.body)
    except Exception:
        logger.warning('[momo_ipn] Invalid JSON payload')
        WebhookEvent.objects.create(
            event_id=f'momo:invalid:{timezone.now().timestamp()}',
            provider='momo', event_type='momo.ipn',
            payload={'raw': request.body.decode('utf-8', errors='replace')[:1000]},
            signature_valid=False, result='invalid_payload',
        )
        return JsonResponse({'detail': 'Invalid payload'}, status=400)

    sig_valid = verify_ipn_signature(data)
    request_id = data.get('requestId') or ''
    result_code = data.get('resultCode')
    # MoMo khong co event_id, ta build tu requestId + resultCode (deterministic
    # cho cung 1 event, retry cua MoMo se trung).
    event_id = f'momo:{request_id}:{result_code}'

    # Idempotency check: neu da xu ly roi → tra 204 ngay, log nhu duplicate.
    if WebhookEvent.objects.filter(event_id=event_id).exists():
        WebhookEvent.objects.create(
            event_id=f'{event_id}:dup:{timezone.now().timestamp()}',
            provider='momo', event_type='momo.ipn',
            payload=data, signature_valid=sig_valid, result='duplicate',
        )
        logger.info('[momo_ipn] Duplicate event %s ignored', event_id)
        return HttpResponse(status=204)

    if not sig_valid:
        logger.warning('[momo_ipn] Invalid signature for orderId=%s', data.get('orderId'))
        WebhookEvent.objects.create(
            event_id=event_id, provider='momo', event_type='momo.ipn',
            payload=data, signature_valid=False, result='invalid_signature',
        )
        return JsonResponse({'detail': 'Invalid signature'}, status=400)

    if not request_id:
        return JsonResponse({'detail': 'Missing requestId'}, status=400)

    try:
        attempt = PaymentAttempt.objects.select_related('payment').get(
            gateway_request_id=request_id,
            method='momo',
        )
        payment = attempt.payment
    except PaymentAttempt.DoesNotExist:
        logger.warning('[momo_ipn] Payment not found for requestId=%s', request_id)
        WebhookEvent.objects.create(
            event_id=event_id, provider='momo', event_type='momo.ipn',
            payload=data, signature_valid=True, result='unknown_payment',
        )
        return JsonResponse({'detail': 'Payment not found'}, status=404)

    if str(result_code) == '0':
        # Luu transId thuc te tu MoMo de tra cuu doi soat sau nay.
        trans_id = data.get('transId')
        payment = _mark_attempt_completed(attempt, trans_id)
        logger.info('[momo_ipn] Payment %d completed (transId=%s)', payment.id, trans_id)
    else:
        if payment.status != 'completed':
            payment = _mark_attempt_failed(
                attempt,
                data.get('message') or f'MoMo resultCode={result_code}',
            )
            logger.info('[momo_ipn] Payment %d failed (resultCode=%s)', payment.id, result_code)
        else:
            logger.info(
                '[momo_ipn] Ignore failed result for already completed payment %d',
                payment.id,
            )

    WebhookEvent.objects.create(
        event_id=event_id, payment=payment, attempt=attempt,
        provider='momo', event_type='momo.ipn',
        payload=data, signature_valid=True, result='updated',
    )

    return HttpResponse(status=204)


def _sync_order_status_from_payment(payment):
    """Chuyen order.status theo ket qua payment online.

    Chi auto-transition tu trang thai 'pending' (don moi tao, chua co ai dong vao):
    - completed → paid neu order con pending/payment_failed. Case payment_failed
      cover race: user bam huy/dong WebView truoc khi webhook success ve.
    - failed → payment_failed chi khi order con pending.
    Cac trang thai khac (preparing/served/cancelled) khong dong vao de tranh
    ghi de logic chef/admin.
    """
    order = payment.order
    if payment.status == 'completed' and order.status in ('pending', 'payment_failed'):
        order.status = 'paid'
    elif payment.status == 'failed' and order.status == 'pending':
        order.status = 'payment_failed'
    else:
        return
    order.save(update_fields=['status', 'updated_date'])


def momo_redirect(request):
    """Trang HTML toi gian MoMo redirect ve sau khi user thanh toan.

    FE WebView phat hien URL nay → dong webview → poll /payments/{id}/ de biet ket qua.
    """
    return HttpResponse(
        '<html><body style="font-family:sans-serif;text-align:center;padding:40px">'
        '<h2>Dang xu ly thanh toan...</h2>'
        '<p>Ban co the dong cua so nay neu khong tu dong chuyen.</p>'
        '</body></html>'
    )


@csrf_exempt
@require_POST
def stripe_webhook(request):
    """Webhook Stripe gui ve khi co event tren Checkout Session.

    QUAN TRONG: Phai dung raw Django view (khong dung DRF @api_view) vi Stripe
    SDK can doc request.body nguyen ban de verify signature. DRF @api_view se
    consume body stream khi parse request.data → request.body tra ve rong →
    construct_webhook_event() crash voi "cannot access body after reading from
    request's data stream".

    Verify signature qua header `Stripe-Signature` → cap nhat Payment.status
    dua tren event type. Lang nghe `checkout.session.completed` (success) va
    `checkout.session.expired` (timeout/cancel).
    """
    from .stripe_gw import construct_webhook_event

    # Doc body TRUOC — truoc khi bat ky middleware/parser nao dong vao.
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
    try:
        event = construct_webhook_event(payload, sig_header)
    except Exception as e:
        # Stripe se retry neu nhan 400 → giup phuc hoi neu transient.
        logger.warning('[stripe_webhook] Signature verification failed: %s', e)
        WebhookEvent.objects.create(
            event_id=f'stripe:invalid:{timezone.now().timestamp()}',
            provider='stripe', event_type='unknown',
            payload={'raw': payload.decode('utf-8', errors='replace')[:1000]},
            signature_valid=False, result='invalid_signature',
        )
        return JsonResponse({'detail': f'Invalid webhook: {e}'}, status=400)

    event_id = event.id  # Stripe luon gui evt_xxx unique
    event_type = event.type
    session = event.data.object
    session_id = session.id
    raw_payload = json.loads(payload.decode('utf-8'))

    # Idempotency: Stripe co the retry → check event_id da xu ly chua.
    if WebhookEvent.objects.filter(event_id=event_id).exists():
        WebhookEvent.objects.create(
            event_id=f'{event_id}:dup:{timezone.now().timestamp()}',
            provider='stripe', event_type=event_type,
            payload=raw_payload, signature_valid=True, result='duplicate',
        )
        logger.info('[stripe_webhook] Duplicate event %s ignored', event_id)
        return HttpResponse(status=200)

    if not session_id:
        return JsonResponse({'detail': 'Missing session id'}, status=400)

    try:
        attempt = PaymentAttempt.objects.select_related('payment').get(
            gateway_request_id=session_id,
            method='stripe',
        )
        payment = attempt.payment
    except PaymentAttempt.DoesNotExist:
        # Stripe co the gui webhook truoc khi session.id kip luu vao DB —
        # tra 200 de Stripe khong retry vo han, va vi day la edge case hiem.
        logger.info('[stripe_webhook] Payment not found for session=%s (race condition)', session_id)
        WebhookEvent.objects.create(
            event_id=event_id, provider='stripe', event_type=event_type,
            payload=raw_payload, signature_valid=True, result='unknown_payment',
        )
        return HttpResponse(status=200)

    if event_type == 'checkout.session.completed' and getattr(session, 'payment_status', None) == 'paid':
        # Luu payment_intent thuc te de doi soat sau nay.
        intent = getattr(session, 'payment_intent', None)
        payment = _mark_attempt_completed(attempt, intent)
        logger.info('[stripe_webhook] Payment %d completed (intent=%s)', payment.id, intent)
    elif event_type in ('checkout.session.expired', 'checkout.session.async_payment_failed'):
        if payment.status != 'completed':
            payment = _mark_attempt_failed(attempt, f'Stripe event {event_type}')
            logger.info('[stripe_webhook] Payment %d failed (event=%s)', payment.id, event_type)
        else:
            logger.info(
                '[stripe_webhook] Ignore failed event for already completed payment %d',
                payment.id,
            )

    WebhookEvent.objects.create(
        event_id=event_id, payment=payment, attempt=attempt,
        provider='stripe', event_type=event_type,
        payload=raw_payload, signature_valid=True, result='updated',
    )

    return HttpResponse(status=200)


def stripe_return(request):
    """Trang HTML Stripe redirect ve sau khi user hoan tat (hoac huy) thanh toan.

    FE WebView phat hien URL nay → dong webview → poll /payments/{id}/ de biet ket qua.
    Stripe gui them query `status=success|cancel` (xem STRIPE_SUCCESS_URL/CANCEL_URL).

    Neu user click "Cancel" tren trang Stripe → query co `status=cancel&session_id=...`
    → mark Payment failed ngay, khong cho user / FE phai cho 30 phut tu Stripe expired
    webhook. Chi mark khi payment van pending de tranh ghi de webhook completed
    (truong hop user thanh toan thanh cong roi van bam Cancel — race hiem nhung co the).
    """
    if request.GET.get('status') == 'cancel':
        session_id = request.GET.get('session_id')
        if session_id:
            try:
                attempt = PaymentAttempt.objects.select_related('payment').get(
                    gateway_request_id=session_id,
                    method='stripe',
                )
                payment = attempt.payment
                if payment.status == 'pending' and attempt.status == 'pending':
                    payment = _mark_attempt_failed(attempt, 'Khach hang huy tren Stripe Checkout.')
                    logger.info('[stripe_return] Payment %d cancelled by user', payment.id)
            except PaymentAttempt.DoesNotExist:
                logger.warning('[stripe_return] Payment not found for session=%s', session_id)
    return HttpResponse(
        '<html><body style="font-family:sans-serif;text-align:center;padding:40px">'
        '<h2>Dang xu ly thanh toan...</h2>'
        '<p>Ban co the dong cua so nay neu khong tu dong chuyen.</p>'
        '</body></html>'
    )


PERIOD_TRUNC = {
    'day': TruncDay,
    'week': TruncWeek,
    'month': TruncMonth,
}


def _parse_period(request, default='day'):
    period = request.query_params.get('period', default)
    if period not in PERIOD_TRUNC:
        period = default
    return period


def _series_for_chef(user, period, since):
    trunc = PERIOD_TRUNC[period]
    qs = OrderDetail.objects.filter(
        dish__chef=user,
        order__created_date__gte=since,
    ).annotate(bucket=trunc('order__created_date')).values('bucket').annotate(
        orders=Sum('quantity'),
        # output_field bat buoc khi nhan F-expression Decimal x Integer tren MySQL,
        # neu khong Django se raise FieldError luc evaluate aggregate.
        revenue=Sum(F('unit_price') * F('quantity'), output_field=DecimalField(max_digits=14, decimal_places=2)),
    ).order_by('bucket')
    return [
        {
            'period': row['bucket'].date().isoformat() if row['bucket'] else None,
            'orders': row['orders'] or 0,
            'revenue': row['revenue'] or 0,
        }
        for row in qs
    ]


def _series_for_admin(period, since):
    trunc = PERIOD_TRUNC[period]
    bookings = TableBooking.objects.filter(
        created_date__gte=since,
    ).annotate(bucket=trunc('created_date')).values('bucket').annotate(
        count=Count('id'),
    ).order_by('bucket')
    revenue = Payment.objects.filter(
        status='completed', paid_at__gte=since,
    ).annotate(bucket=trunc('paid_at')).values('bucket').annotate(
        total=Sum('amount'),
    ).order_by('bucket')

    booking_map = {row['bucket']: row['count'] for row in bookings}
    revenue_map = {row['bucket']: row['total'] for row in revenue}
    keys = sorted(set(booking_map) | set(revenue_map))
    return [
        {
            'period': k.date().isoformat() if k else None,
            'bookings': booking_map.get(k, 0),
            'revenue': revenue_map.get(k, 0) or 0,
        }
        for k in keys
    ]


class StatsView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {}

        period = _parse_period(request)
        # mac dinh nhin lai 90 ngay (du de xem theo ngay/tuan/thang)
        days = int(request.query_params.get('days') or 90)
        since = timezone.now() - timedelta(days=days)

        if user.role == 'chef' and user.is_verified:
            dishes = Dish.objects.filter(chef=user)
            order_details = OrderDetail.objects.filter(dish__chef=user)
            # Khai bao output_field cho phep nhan Decimal*Int de tranh FieldError tren MySQL.
            revenue_expr = Sum(
                F('unit_price') * F('quantity'),
                output_field=DecimalField(max_digits=14, decimal_places=2),
            )
            data['total_dishes'] = dishes.count()
            data['total_orders'] = order_details.aggregate(
                total=Sum('quantity'))['total'] or 0
            data['revenue'] = order_details.aggregate(total=revenue_expr)['total'] or 0
            # doanh thu va so suat theo tung mon
            data['by_dish'] = list(
                order_details.values('dish_id', 'dish__name').annotate(
                    orders=Sum('quantity'),
                    revenue=Sum(
                        F('unit_price') * F('quantity'),
                        output_field=DecimalField(max_digits=14, decimal_places=2),
                    ),
                ).order_by('-revenue')
            )
            # bieu do theo ngay/tuan/thang
            data['series'] = _series_for_chef(user, period, since)
            data['period'] = period

        if user.is_staff:
            payments_by_method = list(
                Payment.objects.filter(status='completed')
                .values('method')
                .annotate(total=Sum('amount'), count=Count('id'))
                .order_by('method')
            )
            data['total_dishes'] = Dish.objects.count()
            data['total_bookings'] = TableBooking.objects.count()
            data['total_orders'] = Order.objects.count()
            data['revenue'] = Payment.objects.filter(
                status='completed'
            ).aggregate(total=Sum('amount'))['total'] or 0
            data['pending_payments'] = Payment.objects.filter(status='pending').count()
            data['failed_payments'] = Payment.objects.filter(status='failed').count()
            data['payments_by_method'] = payments_by_method
            data['total_users'] = User.objects.count()
            data['series'] = _series_for_admin(period, since)
            data['period'] = period

        return Response(data)
