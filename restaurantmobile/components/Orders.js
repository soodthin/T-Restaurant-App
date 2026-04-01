import { useCallback, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FadeInUp, FadeIn } from '../utils/animations';
import { useFocusEffect } from '@react-navigation/native';
import authFetch, { clearSession, getApiErrorMessage } from '../utils/api';
import { endpoints } from '../configs';
import Colors from '../styles/colors';
import { editorialShadow } from '../styles/theme';
import { Toast } from './CustomDialog';

const statusColor = {
    pending: Colors.star,
    preparing: Colors.tertiary,
    served: Colors.success,
    cancelled: Colors.primary,
};

const statusLabel = {
    pending: 'Chờ xử lý',
    preparing: 'Đang chuẩn bị',
    served: 'Đã phục vụ',
    cancelled: 'Đã hủy',
};

const paymentMethodLabel = {
    cash: 'Tiền mặt',
    momo: 'MoMo',
    zalopay: 'ZaloPay',
    paypal: 'PayPal',
    stripe: 'Stripe',
};

const paymentStatusLabel = {
    pending: 'Chờ thanh toán',
    completed: 'Đã thanh toán',
    failed: 'Thanh toán lỗi',
};

const Orders = ({ navigation }) => {
    const tabBarHeight = useBottomTabBarHeight();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });

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
                throw new Error(await getApiErrorMessage(res, 'Không thể tải đơn hàng'));
            }

            const data = await res.json();
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

    const renderOrder = ({ item, index }) => (
        <FadeInUp delay={index * 60} duration={400}>
            <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.orderId}>Đơn #{item.id}</Text>
                        <Text style={styles.date}>
                            {new Date(item.created_date).toLocaleDateString('vi-VN')} · {new Date(item.created_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: (statusColor[item.status] || Colors.textSecondary) + '18' }]}>
                        <View style={[styles.badgeDot, { backgroundColor: statusColor[item.status] || Colors.textSecondary }]} />
                        <Text style={[styles.badgeText, { color: statusColor[item.status] || Colors.textSecondary }]}>
                            {statusLabel[item.status] || item.status}
                        </Text>
                    </View>
                </View>

                <Text style={styles.amount}>{Number(item.total_amount).toLocaleString()}đ</Text>

                <View style={styles.paymentBlock}>
                    <View style={styles.paymentIconWrap}>
                        <MaterialCommunityIcons name="credit-card-outline" size={16} color={Colors.tertiary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.paymentText}>
                            {paymentMethodLabel[item.payment_method] || 'Chưa chọn phương thức'}
                        </Text>
                        <Text style={styles.paymentStatus}>
                            {paymentStatusLabel[item.payment_status] || 'Chưa ghi nhận trạng thái'}
                        </Text>
                    </View>
                </View>

                {item.details && item.details.length > 0 &&
                    <View style={styles.detailList}>
                        {item.details.map((detail) => (
                            <View key={detail.id} style={styles.detailRow}>
                                <View style={styles.detailQtyBadge}>
                                    <Text style={styles.detailQtyText}>x{detail.quantity}</Text>
                                </View>
                                <Text style={styles.detailItem}>
                                    {detail.dish_name || `Món #${detail.dish}`}
                                </Text>
                                <Text style={styles.detailPrice}>
                                    {Number(detail.unit_price).toLocaleString()}đ
                                </Text>
                            </View>
                        ))}
                    </View>
                }
            </View>
        </FadeInUp>
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
                    <TouchableOpacity style={styles.retryBtn} onPress={() => loadOrders(true)}>
                        <Text style={styles.retryText}>Thử lại</Text>
                    </TouchableOpacity>
                </View> :
                null
            }

            <FlatList
                data={orders}
                renderItem={renderOrder}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => loadOrders(false)} tintColor={Colors.primary} />
                }
                ListHeaderComponent={
                    <FadeIn duration={400} style={styles.header}>
                        <Text style={styles.headerTitle}>Đơn hàng của bạn</Text>
                        <Text style={styles.headerSubtitle}>
                            Theo dõi tiến độ chuẩn bị món và trạng thái thanh toán tại đây.
                        </Text>
                    </FadeIn>
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconCircle}>
                            <MaterialCommunityIcons name="receipt" size={36} color={Colors.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>Chưa có đơn hàng nào</Text>
                        <Text style={styles.emptyText}>
                            Sau khi tạo đơn từ giỏ hàng, lịch sử đơn sẽ xuất hiện tại đây.
                        </Text>
                        <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Home')} activeOpacity={0.85}>
                            <Text style={styles.emptyBtnText}>Đi chọn món</Text>
                        </TouchableOpacity>
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    header: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 10 },
    headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.text },
    headerSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, lineHeight: 21 },
    errorCard: {
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 4,
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 20,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        ...editorialShadow,
    },
    errorText: { flex: 1, marginLeft: 10, color: Colors.text, fontSize: 14, lineHeight: 20 },
    retryBtn: { backgroundColor: Colors.surfaceContainerLow, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
    retryText: { color: Colors.text, fontSize: 13, fontWeight: '700' },
    card: {
        backgroundColor: Colors.surfaceContainerLowest,
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 24,
        padding: 18,
        ...editorialShadow,
    },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    orderId: { fontSize: 18, fontWeight: '800', color: Colors.text },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 9999,
        marginLeft: 12,
    },
    badgeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    badgeText: { fontSize: 12, fontWeight: '700' },
    amount: { fontSize: 24, fontWeight: '800', color: Colors.primary, marginTop: 12 },
    date: { fontSize: 13, color: Colors.textSecondary, marginTop: 6 },
    paymentBlock: {
        marginTop: 16,
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 18,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },
    paymentIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: Colors.tertiaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    paymentText: { fontSize: 15, fontWeight: '700', color: Colors.text },
    paymentStatus: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
    detailList: { marginTop: 16 },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    detailQtyBadge: {
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginRight: 10,
    },
    detailQtyText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
    detailItem: { flex: 1, paddingRight: 12, fontSize: 14, color: Colors.text, fontWeight: '600' },
    detailPrice: { fontSize: 13, color: Colors.textSecondary, fontWeight: '700' },
    empty: { alignItems: 'center', marginTop: 40, paddingHorizontal: 32 },
    emptyIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 18 },
    emptyText: { fontSize: 14, color: Colors.textSecondary, marginTop: 10, lineHeight: 22, textAlign: 'center' },
    emptyBtn: { marginTop: 18, backgroundColor: Colors.primary, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 14 },
    emptyBtnText: { color: Colors.onPrimary, fontWeight: '800' },
});

export default Orders;
