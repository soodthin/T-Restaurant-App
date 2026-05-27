import Colors from '@styles/colors';

export const statusConfig = {
    pending: { label: 'Chờ xử lý', color: Colors.star, icon: 'clock-outline' },
    paid: { label: 'Đã xác nhận', color: Colors.success, icon: 'check-decagram' },
    payment_failed: { label: 'Thanh toán lỗi', color: Colors.primary, icon: 'cash-remove' },
    preparing: { label: 'Đang chuẩn bị', color: Colors.tertiary, icon: 'chef-hat' },
    served: { label: 'Đã phục vụ', color: Colors.success, icon: 'check-circle-outline' },
    cancelled: { label: 'Đã hủy', color: Colors.primary, icon: 'close-circle-outline' },
};

export const statusNoticeConfig = {
    pending: 'Đơn đã được ghi nhận. Nhà bếp sẽ tiếp nhận sau khi kiểm tra thanh toán.',
    paid: 'Thanh toán đã xác nhận. Đơn đang chờ đầu bếp tiếp nhận.',
    preparing: 'Đầu bếp đang chuẩn bị món. Vui lòng theo dõi trạng thái phục vụ.',
    served: 'Món đã được phục vụ. Bạn có thể đánh giá món sau khi trải nghiệm.',
    payment_failed: 'Thanh toán chưa hoàn tất. Bạn có thể thanh toán lại hoặc đổi phương thức.',
    cancelled: 'Đơn đã bị hủy và không còn được xử lý.',
};

export const filterOptions = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ xử lý' },
    { key: 'paid', label: 'Đã xác nhận' },
    { key: 'preparing', label: 'Đang chuẩn bị' },
    { key: 'served', label: 'Đã phục vụ' },
    { key: 'payment_failed', label: 'Lỗi thanh toán' },
    { key: 'cancelled', label: 'Đã hủy' },
];

export const paymentMethodConfig = {
    cash: { label: 'Tiền mặt khi nhận', icon: 'cash' },
    momo: { label: 'MoMo', icon: 'wallet-outline' },
    stripe: { label: 'Stripe', icon: 'credit-card-outline' },
};

export const paymentStatusConfig = {
    pending: { label: 'Chờ thanh toán', color: Colors.star },
    completed: { label: 'Đã thanh toán', color: Colors.success },
    failed: { label: 'Thanh toán lỗi', color: Colors.primary },
};

export const retryPaymentMethods = [
    { key: 'momo', label: 'MoMo', icon: 'wallet-outline' },
    { key: 'stripe', label: 'Stripe', icon: 'credit-card-outline' },
    { key: 'cash', label: 'Tiền mặt', icon: 'cash' },
];

export const getRemainingSeconds = (expiresAt, now) => {
    if (!expiresAt) return null;
    const expiresAtMs = new Date(expiresAt).getTime();
    if (Number.isNaN(expiresAtMs)) return null;
    return Math.max(0, Math.ceil((expiresAtMs - now) / 1000));
};

export const formatRemaining = (seconds) => {
    if (seconds === null) return '';
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

export const formatDateTime = (iso) => {
    const d = new Date(iso);
    const date = d.toLocaleDateString('vi-VN');
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${date} · ${time}`;
};

export const formatBookingInfo = (order) => {
    if (!order.booking_date) return '';
    const date = new Date(order.booking_date);
    if (Number.isNaN(date.getTime())) return '';
    const day = date.toLocaleDateString('vi-VN');
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const guests = order.booking_guests ? ` · ${order.booking_guests} khách` : '';
    return `${time} · ${day}${guests}`;
};
