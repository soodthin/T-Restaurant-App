import { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    Animated,
    Easing,
    LayoutAnimation,
    Platform,
    UIManager,
    ScrollView,
} from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FadeInUp, FadeIn } from '@utils/animations';
import { useFocusEffect } from '@react-navigation/native';
import { authFetch, endpoints, clearSession, getApiErrorMessage } from '@configs';
import Colors from '@styles/colors';
import { Toast } from '@components/CustomDialog';
import styles from './styles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const statusConfig = {
    pending: { label: 'Chờ xử lý', color: Colors.star, icon: 'clock-outline' },
    paid: { label: 'Đã xác nhận', color: Colors.success, icon: 'check-decagram' },
    payment_failed: { label: 'Hủy (Lỗi TT)', color: Colors.primary, icon: 'cash-remove' },
    preparing: { label: 'Đang chuẩn bị', color: Colors.tertiary, icon: 'chef-hat' },
    served: { label: 'Đã phục vụ', color: Colors.success, icon: 'check-circle-outline' },
    cancelled: { label: 'Đã hủy', color: Colors.primary, icon: 'close-circle-outline' },
};


const filterOptions = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ xử lý' },
    { key: 'paid', label: 'Đã xác nhận' },
    { key: 'preparing', label: 'Đang chuẩn bị' },
    { key: 'served', label: 'Đã phục vụ' },
    { key: 'payment_failed', label: 'Lỗi thanh toán' },
    { key: 'cancelled', label: 'Đã hủy' },
];

const paymentMethodConfig = {
    cash: { label: 'Tiền mặt khi nhận', icon: 'cash' },
    momo: { label: 'MoMo', icon: 'wallet-outline' },
    stripe: { label: 'Stripe', icon: 'credit-card-outline' },
};

const paymentStatusConfig = {
    pending: { label: 'Chờ thanh toán', color: Colors.star },
    completed: { label: 'Đã thanh toán', color: Colors.success },
    failed: { label: 'Thanh toán lỗi', color: Colors.primary },
};

const retryPaymentMethods = [
    { key: 'momo', label: 'MoMo', icon: 'wallet-outline' },
    { key: 'stripe', label: 'Stripe', icon: 'credit-card-outline' },
    { key: 'cash', label: 'Tiền mặt', icon: 'cash' },
];

const getRemainingSeconds = (expiresAt, now) => {
    if (!expiresAt) return null;
    const expiresAtMs = new Date(expiresAt).getTime();
    if (Number.isNaN(expiresAtMs)) return null;
    return Math.max(0, Math.ceil((expiresAtMs - now) / 1000));
};

const formatRemaining = (seconds) => {
    if (seconds === null) return '';
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

const formatDateTime = (iso) => {
    const d = new Date(iso);
    const date = d.toLocaleDateString('vi-VN');
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${date} · ${time}`;
};

const OrderCard = ({ item, index, now, onPayAgain, onChangeMethod, paying }) => {
    const [expanded, setExpanded] = useState(false);
    const status = statusConfig[item.status] || { label: item.status, color: Colors.textSecondary, icon: 'help-circle-outline' };
    const payment = paymentMethodConfig[item.payment_method] || { label: 'Chưa chọn', icon: 'credit-card-outline' };
    const payStatus = paymentStatusConfig[item.payment_status] || { label: 'Chưa ghi nhận', color: Colors.textSecondary };
    const isCancelled = item.status === 'cancelled' || item.status === 'payment_failed';
    const detailCount = item.details?.length || 0;
    const isOnlinePayment = ['momo', 'stripe'].includes(item.payment_method);
    const remainingSeconds = getRemainingSeconds(item.payment_expires_at, now);
    const pendingOnline = isOnlinePayment && item.payment_status === 'pending';
    const paymentExpired = pendingOnline && remainingSeconds !== null && remainingSeconds <= 0;
    const canContinuePayment = pendingOnline && !paymentExpired && item.payment_pay_url;
    const canChooseMethod = item.payment_status === 'failed' || paymentExpired;
    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(prev => !prev);
    };

    return (
        <FadeInUp delay={index * 60} duration={400}>
            <View style={[styles.card, isCancelled && styles.cardCancelled]}>

                <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.orderId}>{`Đơn #${item.id}`}</Text>
                        <Text style={styles.date}>{formatDateTime(item.created_date)}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: status.color + '18' }]}>
                        <MaterialCommunityIcons name={status.icon} size={13} color={status.color} />
                        <Text style={[styles.badgeText, { color: status.color }]}>
                            {status.label}
                        </Text>
                    </View>
                </View>


                <View style={styles.summaryRow}>
                    <View style={styles.summaryAmount}>
                        <Text style={styles.summaryLabel}>{`Tổng tiền`}</Text>
                        <Text style={styles.amount}>
                            {Number(item.total_amount).toLocaleString('vi-VN')}đ
                        </Text>
                    </View>
                    <View style={styles.summaryPayment}>
                        <View style={styles.paymentMethodRow}>
                            <MaterialCommunityIcons name={payment.icon} size={14} color={Colors.textSecondary} />
                            <Text style={styles.paymentMethodText}>{payment.label}</Text>
                        </View>
                        <View style={[styles.payPill, { backgroundColor: payStatus.color + '18' }]}>
                            <Text style={[styles.payPillText, { color: payStatus.color }]}>
                                {payStatus.label}
                            </Text>
                        </View>
                    </View>
                </View>

                {pendingOnline && remainingSeconds !== null && (
                    <View style={styles.paymentTimerRow}>
                        <MaterialCommunityIcons
                            name={paymentExpired ? 'timer-off-outline' : 'timer-outline'}
                            size={15}
                            color={paymentExpired ? Colors.primary : Colors.star}
                        />
                        <Text style={styles.paymentTimerText}>
                            {paymentExpired
                                ? 'Phiên thanh toán đã hết hạn'
                                : `Còn ${formatRemaining(remainingSeconds)} để tiếp tục thanh toán`}
                        </Text>
                    </View>
                )}

                {canContinuePayment && (
                    <Button
                        mode="contained-tonal"
                        icon="credit-card-refresh-outline"
                        onPress={() => onPayAgain(item)}
                        loading={paying}
                        disabled={paying}
                        style={styles.paymentActionBtn}
                        labelStyle={styles.paymentActionLabel}
                    >
                        Tiếp tục thanh toán
                    </Button>
                )}

                {canChooseMethod && (
                    <View style={styles.retryMethodBlock}>
                        <Text style={styles.retryMethodTitle}>Thanh toán lại hoặc đổi phương thức</Text>
                        <View style={styles.retryMethodRow}>
                            {retryPaymentMethods.map((method) => (
                                <TouchableOpacity
                                    key={method.key}
                                    activeOpacity={0.75}
                                    disabled={paying}
                                    onPress={() => onChangeMethod(item, method.key)}
                                    style={styles.retryMethodChip}>
                                    <MaterialCommunityIcons name={method.icon} size={15} color={Colors.primary} />
                                    <Text style={styles.retryMethodText}>{method.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}


                {detailCount > 0 && <View style={styles.divider} />}


                {detailCount > 0 && (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={toggleExpand}
                        style={styles.detailsToggle}
                    >
                        <View style={styles.detailsToggleLeft}>
                            <MaterialCommunityIcons name="receipt" size={16} color={Colors.textSecondary} />
                            <Text style={styles.detailsToggleText}>{`${detailCount} món ăn`}</Text>
                        </View>
                        <View style={styles.detailsTogglePill}>
                            <Text style={styles.detailsTogglePillText}>
                                {expanded ? 'Thu gọn' : 'Chi tiết'}
                            </Text>
                            <MaterialCommunityIcons
                                name={expanded ? 'chevron-up' : 'chevron-down'}
                                size={14}
                                color={Colors.textSecondary}
                            />
                        </View>
                    </TouchableOpacity>
                )}


                {expanded && detailCount > 0 && (
                    <View style={styles.detailsCard}>
                        {item.details.map((detail) => (
                            <View key={detail.id} style={styles.detailRow}>
                                <View style={styles.detailQtyBadge}>
                                    <Text style={styles.detailQtyText}>x{detail.quantity}</Text>
                                </View>
                                <Text style={styles.detailItem} numberOfLines={1}>
                                    {detail.dish_name || `Món #${detail.dish}`}
                                </Text>
                                <Text style={styles.detailPrice}>
                                    {Number(detail.unit_price).toLocaleString('vi-VN')}đ
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </FadeInUp>
    );
};

const Orders = ({ navigation }) => {
    const tabBarHeight = useBottomTabBarHeight();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });
    const [statusFilter, setStatusFilter] = useState('all');
    const [payingOrderId, setPayingOrderId] = useState(null);
    const [now, setNow] = useState(Date.now());
    const spinValue = useRef(new Animated.Value(0)).current;
    const spinAnim = useRef(null);

    const showToast = (message, type = 'error') => {
        setToast({ visible: true, message, type });
    };

    const startSpin = () => {
        spinValue.setValue(0);
        spinAnim.current = Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 900,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        spinAnim.current.start();
    };

    const stopSpin = () => {
        if (spinAnim.current) {
            spinAnim.current.stop();
            spinAnim.current = null;
        }
        spinValue.setValue(0);
    };

    useEffect(() => {
        if (refreshing) startSpin();
        else stopSpin();
        return () => stopSpin();
    }, [refreshing]);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const loadOrders = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        else setRefreshing(true);

        try {
            const res = await authFetch(endpoints['orders']);
            if (res.status === 401) {
                await clearSession();
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                return;
            }
            if (!res.ok) {
                throw new Error(getApiErrorMessage(res, 'Không thể tải đơn hàng'));
            }

            const data = res.data;
            setOrders(data.results || []);
            setError('');
        } catch (err) {
            setOrders([]);
            setError(err.message || 'Không thể tải đơn hàng');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => {
        loadOrders(true);
    }, []));

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const filteredOrders = statusFilter === 'all'
        ? orders
        : orders.filter((o) => o.status === statusFilter);

    const handlePaymentForOrder = async (order, methodOverride = null) => {
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

        setPayingOrderId(order.id);
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
                loadOrders(false);
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
            setPayingOrderId(null);
        }
    };

    const renderOrder = ({ item, index }) => (
        <OrderCard
            item={item}
            index={index}
            now={now}
            onPayAgain={handlePaymentForOrder}
            onChangeMethod={handlePaymentForOrder}
            paying={payingOrderId === item.id}
        />
    );

    if (loading) {
        return <ActivityIndicator size="large" color={Colors.primary} style={{ flex: 1, backgroundColor: Colors.surface }} />;
    }

    return (
        <View style={styles.container}>
            {error ?
                <View style={styles.errorCard}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={20} color={Colors.primary} />
                    <Text style={styles.errorText}>{error}</Text>
                    <Button mode="contained-tonal" onPress={() => loadOrders(true)}>
                        {`Thử lại`}
                    </Button>
                </View> :
                null
            }

            <FlatList
                data={filteredOrders}
                renderItem={renderOrder}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => loadOrders(false)} tintColor={Colors.primary} />
                }
                ListHeaderComponent={
                    <FadeIn duration={400} style={styles.header}>
                        <View style={styles.headerRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.headerTitle}>{`Đơn hàng của bạn`}</Text>
                                <Text style={styles.headerSubtitle}>
                                    {`Theo dõi tiến độ chuẩn bị món và trạng thái thanh toán.`}
                                </Text>
                            </View>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => loadOrders(false)}
                                style={styles.refreshBtn}
                                disabled={refreshing}
                            >
                                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                    <MaterialCommunityIcons
                                        name="refresh"
                                        size={20}
                                        color={refreshing ? Colors.primary : Colors.textSecondary}
                                    />
                                </Animated.View>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filterScroll}>
                            {filterOptions.map((opt) => {
                                const active = statusFilter === opt.key;
                                return (
                                    <TouchableOpacity
                                        key={opt.key}
                                        activeOpacity={0.7}
                                        onPress={() => setStatusFilter(opt.key)}
                                        style={[styles.filterChip, active && styles.filterChipActive]}>
                                        <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </FadeIn>
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconCircle}>
                            <MaterialCommunityIcons name="receipt" size={36} color={Colors.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>
                            {statusFilter === 'all' ? `Chưa có đơn hàng nào` : `Không có đơn ở trạng thái này`}
                        </Text>
                        <Text style={styles.emptyText}>
                            {statusFilter === 'all'
                                ? `Sau khi tạo đơn từ giỏ hàng, lịch sử đơn sẽ xuất hiện tại đây.`
                                : `Thử chọn bộ lọc khác hoặc xem "Tất cả".`}
                        </Text>
                        {statusFilter === 'all' && (
                            <Button mode="contained" onPress={() => navigation.navigate('Home')} style={{ marginTop: 18, borderRadius: 20 }}>
                                {`Đi chọn món`}
                            </Button>
                        )}
                    </View>
                }
            />

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
            />
        </View>
    );
};

export default Orders;
