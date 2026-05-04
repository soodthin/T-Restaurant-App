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
    paid: { label: 'Đã thanh toán', color: Colors.success, icon: 'cash-check' },
    payment_failed: { label: 'Lỗi thanh toán', color: Colors.primary, icon: 'cash-remove' },
    preparing: { label: 'Đang chuẩn bị', color: Colors.tertiary, icon: 'chef-hat' },
    served: { label: 'Đã phục vụ', color: Colors.success, icon: 'check-circle-outline' },
    cancelled: { label: 'Đã hủy', color: Colors.primary, icon: 'close-circle-outline' },
};

// Filter chip ordering follow workflow: tat ca → cho xu ly → da thanh toan →
// dang chuan bi → da phuc vu → loi thanh toan → da huy.
const filterOptions = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ xử lý' },
    { key: 'paid', label: 'Đã thanh toán' },
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

const formatDateTime = (iso) => {
    const d = new Date(iso);
    const date = d.toLocaleDateString('vi-VN');
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${date} · ${time}`;
};

const OrderCard = ({ item, index }) => {
    const [expanded, setExpanded] = useState(false);
    const status = statusConfig[item.status] || { label: item.status, color: Colors.textSecondary, icon: 'help-circle-outline' };
    const payment = paymentMethodConfig[item.payment_method] || { label: 'Chưa chọn', icon: 'credit-card-outline' };
    const payStatus = paymentStatusConfig[item.payment_status] || { label: 'Chưa ghi nhận', color: Colors.textSecondary };
    const isCancelled = item.status === 'cancelled' || item.status === 'payment_failed';
    const detailCount = item.details?.length || 0;

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(prev => !prev);
    };

    return (
        <FadeInUp delay={index * 60} duration={400}>
            <View style={[styles.card, isCancelled && styles.cardCancelled]}>
                {/* Header: ID + Status badge */}
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

                {/* Summary row: amount left, payment right */}
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

                {/* Divider */}
                {detailCount > 0 && <View style={styles.divider} />}

                {/* Details toggle */}
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

                {/* Expanded details */}
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
    const spinValue = useRef(new Animated.Value(0)).current;
    const spinAnim = useRef(null);

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

    const renderOrder = ({ item, index }) => <OrderCard item={item} index={index} />;

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
