import hashlib
import hmac
import json
import uuid

import requests
from django.conf import settings


def _sign(raw: str) -> str:

    return hmac.new(
        settings.MOMO_SECRET_KEY.encode('utf-8'),
        raw.encode('utf-8'),
        hashlib.sha256,
    ).hexdigest()


def _ensure_configured():
    missing = [
        name for name in (
            'MOMO_PARTNER_CODE',
            'MOMO_ACCESS_KEY',
            'MOMO_SECRET_KEY',
            'MOMO_CREATE_URL',
            'MOMO_IPN_URL',
            'MOMO_REDIRECT_URL',
        )
        if not getattr(settings, name, '')
    ]
    if missing:
        raise RuntimeError(f'Chua cau hinh MoMo: {", ".join(missing)}')


def create_momo_payment(order_id: int, amount: int, order_info: str = ''):


    _ensure_configured()
    request_id = str(uuid.uuid4())
    momo_order_id = f"order-{order_id}-{uuid.uuid4().hex[:8]}"
    extra_data = ''


    request_type = 'captureWallet'

    raw_signature = (
        f"accessKey={settings.MOMO_ACCESS_KEY}"
        f"&amount={amount}"
        f"&extraData={extra_data}"
        f"&ipnUrl={settings.MOMO_IPN_URL}"
        f"&orderId={momo_order_id}"
        f"&orderInfo={order_info}"
        f"&partnerCode={settings.MOMO_PARTNER_CODE}"
        f"&redirectUrl={settings.MOMO_REDIRECT_URL}"
        f"&requestId={request_id}"
        f"&requestType={request_type}"
    )
    signature = _sign(raw_signature)

    payload = {
        'partnerCode': settings.MOMO_PARTNER_CODE,
        'partnerName': 'T-Restaurant',
        'storeId': 'TRestaurantStore',
        'requestId': request_id,
        'amount': amount,
        'orderId': momo_order_id,
        'orderInfo': order_info or f'Thanh toan don hang #{order_id}',
        'redirectUrl': settings.MOMO_REDIRECT_URL,
        'ipnUrl': settings.MOMO_IPN_URL,
        'lang': 'vi',
        'requestType': request_type,
        'autoCapture': True,
        'extraData': extra_data,
        'signature': signature,
    }

    res = requests.post(
        settings.MOMO_CREATE_URL,
        data=json.dumps(payload),
        headers={'Content-Type': 'application/json'},
        timeout=20,
    )


    if not res.ok:
        raise RuntimeError(f'MoMo HTTP {res.status_code}: {res.text[:300]}')
    body = res.json()

    if body.get('resultCode') != 0:
        raise RuntimeError(
            body.get('message') or 'MoMo tu choi tao giao dich'
        )

    return {
        'pay_url': body.get('payUrl'),
        'deeplink': body.get('deeplink'),
        'qr_code_url': body.get('qrCodeUrl'),
        'applink': body.get('applink'),
        'request_id': request_id,
        'order_id_momo': momo_order_id,
    }


def verify_ipn_signature(data: dict) -> bool:

    signature = data.get('signature', '')
    raw = (
        f"accessKey={settings.MOMO_ACCESS_KEY}"
        f"&amount={data.get('amount', '')}"
        f"&extraData={data.get('extraData', '')}"
        f"&message={data.get('message', '')}"
        f"&orderId={data.get('orderId', '')}"
        f"&orderInfo={data.get('orderInfo', '')}"
        f"&orderType={data.get('orderType', '')}"
        f"&partnerCode={data.get('partnerCode', '')}"
        f"&payType={data.get('payType', '')}"
        f"&requestId={data.get('requestId', '')}"
        f"&responseTime={data.get('responseTime', '')}"
        f"&resultCode={data.get('resultCode', '')}"
        f"&transId={data.get('transId', '')}"
    )
    expected = _sign(raw)
    return hmac.compare_digest(expected, signature)
