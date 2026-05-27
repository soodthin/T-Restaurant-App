import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authFetch, endpoints, clearSession, getApiErrorMessage } from '@configs';
import { Toast } from '@components/CustomDialog';
import Colors from '@styles/colors';
import {
    statusConfig,
    statusNoticeConfig,
    paymentMethodConfig,
    paymentStatusConfig,
    formatDateTime,
    getRemainingSeconds,
    formatRemaining,
    retryPaymentMethods
} from '../Orders/orderConstants';
import styles from './styles';

const OrderDetail = ({ route, navigation }) => {
    const { orderId, initialData } = route.params;
    const [order, setOrder] = useState(initialData || null);
    const [now, setNow] = useState(Date.now());
    const [paying, setPaying] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });

    const showToast = (message, type = 'error') => {
        setToast({ visible: true, message, type });
    };

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handlePaymentForOrder = async (methodOverride = null) => {
        if (!order) return;
        const selectedMethod = methodOverride || order.payment_method;
        const isOnlineMethod = ['momo', 'stripe'].includes(selectedMethod);

        if (!methodOverride && order.payment_status === 'pending' && order.payment_pay_url && order.payment_id) {
            navigation.navigate('PaymentCheckout', {
                payUrl: order.payment_pay_url,
                paymentId: order.payment_id,
                method: order.payment_method,
                expiresAt: order.payment_expires_at,
                deeplinkUrl: order.payment_deeplink_url,
                qrCodeUrl: order.payment_qr_code_url,
            });
            return;
        }

        setPaying(true);
        try {
            const res = await authFetch(endpoints['payments'], {
                method: 'POST',
                body: JSON.stringify({
                    order: order.id,
                    method: selectedMethod,
                }),
            });

            if (res.status === 401) {
                await clearSession();
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                return;
            }

            if (!res.ok) {
                showToast(getApiErrorMessage(res, 'Không thể khởi tạo lại thanh toán'));
                return;
            }

            if (!isOnlineMethod) {
                showToast('Đã đổi sang thanh toán tiền mặt.', 'success');
                // Could refresh order here
                navigation.goBack();
                return;
            }

            if (!res.data?.pay_url) {
                showToast('Cổng thanh toán chưa trả về URL. Vui lòng thử lại sau.');
                return;
            }

            navigation.navigate('PaymentCheckout', {
                payUrl: res.data.pay_url,
                paymentId: res.data.id,
                method: res.data.method || selectedMethod,
                expiresAt: res.data.expires_at,
                deeplinkUrl: res.data.deeplink_url,
                qrCodeUrl: res.data.qr_code_url,
            });
        } catch (err) {
            showToast('Không thể khởi tạo lại thanh toán. Vui lòng thử lại.');
        } finally {
            setPaying(false);
        }
    };

    const goToReviewDish = (dishId) => {
        if (!dishId) return;
        navigation.navigate('DishDetail', { id: dishId, focusReview: true });
    };

    if (!order) {
        return <View style={styles.container} />;
    }

    const status = statusConfig[order.status] || { label: order.status, color: Colors.textSecondary, icon: 'help-circle-outline' };
    const statusNotice = statusNoticeConfig[order.status] || 'Trạng thái đơn hàng đã được cập nhật.';
    const payment = paymentMethodConfig[order.payment_method] || { label: 'Chưa chọn', icon: 'credit-card-outline' };
    const payStatus = paymentStatusConfig[order.payment_status] || { label: 'Chưa ghi nhận', color: Colors.textSecondary };
    const canReview = order.status === 'served';

    const isOnlinePayment = ['momo', 'stripe'].includes(order.payment_method);
    const remainingSeconds = getRemainingSeconds(order.payment_expires_at, now);
    const pendingOnline = isOnlinePayment && order.payment_status === 'pending';
    const paymentExpired = pendingOnline && remainingSeconds !== null && remainingSeconds <= 0;
    const canContinuePayment = pendingOnline && !paymentExpired && order.payment_pay_url;
    const canChooseMethod = order.payment_status === 'failed' || paymentExpired;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Status Notice */}
                <View style={styles.statusNotice}>
                    <MaterialCommunityIcons name={status.icon} size={20} color={status.color} />
                    <Text style={styles.statusNoticeText}>{statusNotice}</Text>
                </View>

                {/* General Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông tin chung</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Mã đơn hàng</Text>
                        <Text style={styles.value}>#{order.id}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Ngày đặt</Text>
                        <Text style={styles.value}>{formatDateTime(order.created_date)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Trạng thái</Text>
                        <Text style={[styles.value, { color: status.color }]}>{status.label}</Text>
                    </View>
                </View>

                {/* Payment Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thanh toán</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Phương thức</Text>
                        <Text style={styles.value}>{payment.label}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Trạng thái TT</Text>
                        <Text style={[styles.value, { color: payStatus.color }]}>{payStatus.label}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Tổng tiền</Text>
                        <Text style={[styles.value, { color: Colors.primary, fontSize: 16 }]}>
                            {Number(order.total_amount).toLocaleString('vi-VN')}đ
                        </Text>
                    </View>

                    {pendingOnline && remainingSeconds !== null && (
                        <View style={styles.paymentTimerRow}>
                            <MaterialCommunityIcons
                                name={paymentExpired ? 'timer-off-outline' : 'timer-outline'}
                                size={18}
                                color={paymentExpired ? Colors.primary : Colors.star}
                            />
                            <Text style={styles.paymentTimerText}>
                                {paymentExpired
                                    ? 'Phiên thanh toán đã hết hạn'
                                    : `Còn ${formatRemaining(remainingSeconds)} để thanh toán`}
                            </Text>
                        </View>
                    )}

                    {canContinuePayment && (
                        <Button
                            mode="contained-tonal"
                            icon="credit-card-refresh-outline"
                            onPress={() => handlePaymentForOrder()}
                            loading={paying}
                            disabled={paying}
                            style={styles.paymentActionBtn}
                        >
                            Tiếp tục thanh toán
                        </Button>
                    )}

                    {canChooseMethod && (
                        <View style={styles.retryMethodBlock}>
                            <Text style={styles.retryMethodTitle}>Thanh toán lại hoặc đổi phương thức:</Text>
                            <View style={styles.retryMethodRow}>
                                {retryPaymentMethods.map((method) => (
                                    <TouchableOpacity
                                        key={method.key}
                                        activeOpacity={0.75}
                                        disabled={paying}
                                        onPress={() => handlePaymentForOrder(method.key)}
                                        style={styles.retryMethodChip}>
                                        <MaterialCommunityIcons name={method.icon} size={15} color={Colors.primary} />
                                        <Text style={styles.retryMethodText}>{method.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* Dish Details */}
                {order.details && order.details.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Danh sách món</Text>
                        {order.details.map((detail) => (
                            <View key={detail.id} style={styles.detailRow}>
                                <View style={styles.detailQtyBadge}>
                                    <Text style={styles.detailQtyText}>x{detail.quantity}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.detailItem} numberOfLines={2}>
                                        {detail.dish_name || `Món #${detail.dish}`}
                                    </Text>
                                    <Text style={styles.detailPrice}>
                                        {Number(detail.unit_price).toLocaleString('vi-VN')}đ
                                    </Text>
                                </View>
                                {canReview ? (
                                    <TouchableOpacity
                                        activeOpacity={0.75}
                                        onPress={() => goToReviewDish(detail.dish)}
                                        style={styles.reviewDishBtn}>
                                        <MaterialCommunityIcons name="star-outline" size={14} color={Colors.primary} />
                                        <Text style={styles.reviewDishText}>Đánh giá</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        ))}
                    </View>
                )}

            </ScrollView>

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
            />
        </View>
    );
};

export default OrderDetail;
