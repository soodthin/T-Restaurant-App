"""Helper goi Stripe Checkout (test mode).

Doc tham khao: https://docs.stripe.com/api/checkout/sessions/create
Dung Checkout Session (hosted page) thay cho PaymentIntent de FE chi can mo
`pay_url` trong WebView — tuong tu flow MoMo, khong phai tich hop Stripe SDK
phia mobile.
"""
import time

import stripe
from django.conf import settings


# Stripe default expires_at = 24h. Rut xuong 30 phut de webhook checkout.session.expired
# fire som hon → mark Payment.failed va Order.payment_failed → user thay status dung
# thay vi cho 24h. Min cho phep cua Stripe la 30 phut (1800s) tinh tu thoi diem tao.
SESSION_EXPIRES_AFTER_SECONDS = 30 * 60


def _client():
    """Khoi tao Stripe client moi lan goi de pick up key tu env neu thay doi
    runtime (vi du khi test). Stripe SDK la stateless nen khong ton kem."""
    if not settings.STRIPE_SECRET_KEY:
        raise RuntimeError(
            'STRIPE_SECRET_KEY chua cau hinh. Set env hoac sua settings.py'
        )
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


def create_stripe_checkout(order_id: int, amount: int, order_info: str = ''):
    """Tao Stripe Checkout Session, tra ve dict {pay_url, session_id}.

    `amount` la VND nguyen (zero-decimal currency tren Stripe → khong nhan 100).
    `order_id` luu vao metadata de tra cuu khi nhan webhook.
    """
    sdk = _client()
    session = sdk.checkout.Session.create(
        mode='payment',
        payment_method_types=['card'],
        line_items=[{
            'price_data': {
                'currency': settings.STRIPE_CURRENCY,
                'product_data': {
                    'name': order_info or f'Don hang #{order_id}',
                },
                'unit_amount': int(amount),
            },
            'quantity': 1,
        }],
        success_url=settings.STRIPE_SUCCESS_URL,
        cancel_url=settings.STRIPE_CANCEL_URL,
        # Expire som de webhook bao failed nhanh hon (xem comment hang dau file).
        expires_at=int(time.time()) + SESSION_EXPIRES_AFTER_SECONDS,
        # Metadata se duoc Stripe gui kem trong webhook event → tra cuu Payment.
        metadata={'order_id': str(order_id)},
    )
    return {
        'pay_url': session.url,
        'session_id': session.id,
    }


def construct_webhook_event(payload: bytes, sig_header: str):
    """Verify chu ky webhook va tra ve event object.

    Raise stripe.error.SignatureVerificationError neu khong hop le. View se
    catch va tra 400 cho Stripe (Stripe se retry).
    """
    sdk = _client()
    return sdk.Webhook.construct_event(
        payload=payload,
        sig_header=sig_header,
        secret=settings.STRIPE_WEBHOOK_SECRET,
    )
