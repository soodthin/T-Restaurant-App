import time

import stripe
from django.conf import settings


SESSION_EXPIRES_AFTER_SECONDS = 30 * 60


def _client():


    if not settings.STRIPE_SECRET_KEY:
        raise RuntimeError(
            'STRIPE_SECRET_KEY chua cau hinh. Set env hoac sua settings.py'
        )
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


def create_stripe_checkout(order_id: int, amount: int, order_info: str = ''):


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

        expires_at=int(time.time()) + SESSION_EXPIRES_AFTER_SECONDS,

        metadata={'order_id': str(order_id)},
    )
    return {
        'pay_url': session.url,
        'session_id': session.id,
    }


def construct_webhook_event(payload: bytes, sig_header: str):


    if not settings.STRIPE_WEBHOOK_SECRET:
        raise RuntimeError(
            'STRIPE_WEBHOOK_SECRET chua cau hinh. Set env tu Stripe CLI/Dashboard'
        )
    sdk = _client()
    return sdk.Webhook.construct_event(
        payload=payload,
        sig_header=sig_header,
        secret=settings.STRIPE_WEBHOOK_SECRET,
    )


def expire_stripe_checkout(session_id: str):

    if not session_id:
        return None
    sdk = _client()
    return sdk.checkout.Session.expire(session_id)
