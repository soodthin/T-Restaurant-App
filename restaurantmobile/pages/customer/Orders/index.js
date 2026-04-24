import { useCallback, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    RefreshControl,
} from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FadeInUp, FadeIn } from '@utils/animations';
import { useFocusEffect } from '@react-navigation/native';
import authFetch, { clearSession, getApiErrorMessage } from '@utils/api';
import { endpoints } from '@configs';
import Colors from '@styles/colors';
import { Toast } from '@components/CustomDialog';
import styles from './styles';

const statusColor = {
    pending: Colors.star,
    preparing: Colors.tertiary,
    served: Colors.success,
    cancelled: Colors.primary,
};

const statusLabel = {
    pending: 'Ch\u1edd x\u1eed l\u00fd',
    preparing: '\u0110ang chu\u1ea9n b\u1ecb',
    served: '\u0110\u00e3 ph\u1ee5c v\u1ee5',
    cancelled: '\u0110\u00e3 h\u1ee7y',
};

const paymentMethodLabel = {
    cash: 'Ti\u1ec1n m\u1eb7t',
    momo: 'MoMo',
    zalopay: 'ZaloPay',
    paypal: 'PayPal',
    stripe: 'Stripe',
};

const paymentStatusLabel = {
    pending: 'Ch\u1edd thanh to\u00e1n',
    completed: '\u0110\u00e3 thanh to\u00e1n',
    failed: 'Thanh to\u00e1n l\u1ed7i',
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
                throw new Error(await getApiErrorMessage(res, 'Kh\u00f4ng th\u1ec3 t\u1ea3i \u0111\u01a1n h\u00e0ng'));
            }

            const data = await res.json();
            setOrders(data.results || []);
            setError('');
        } catch (err) {
            setOrders([]);
            setError(err.message || 'Kh\u00f4ng th\u1ec3 t\u1ea3i \u0111\u01a1n h\u00e0ng');
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
                        <Text style={styles.orderId}>{`\u0110\u01a1n`} #{item.id}</Text>
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

                <Text style={styles.amount}>{Number(item.total_amount).toLocaleString()}{`\u0111`}</Text>

                <View style={styles.paymentBlock}>
                    <View style={styles.paymentIconWrap}>
                        <MaterialCommunityIcons name="credit-card-outline" size={16} color={Colors.tertiary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.paymentText}>
                            {paymentMethodLabel[item.payment_method] || 'Ch\u01b0a ch\u1ecdn ph\u01b0\u01a1ng th\u1ee9c'}
                        </Text>
                        <Text style={styles.paymentStatus}>
                            {paymentStatusLabel[item.payment_status] || 'Ch\u01b0a ghi nh\u1eadn tr\u1ea1ng th\u00e1i'}
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
                                    {detail.dish_name || `M\u00f3n #${detail.dish}`}
                                </Text>
                                <Text style={styles.detailPrice}>
                                    {Number(detail.unit_price).toLocaleString()}{`\u0111`}
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
                    <Button mode="contained-tonal" onPress={() => loadOrders(true)}>
                        {`Th\u1eed l\u1ea1i`}
                    </Button>
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
                        <Text style={styles.headerTitle}>{`\u0110\u01a1n h\u00e0ng c\u1ee7a b\u1ea1n`}</Text>
                        <Text style={styles.headerSubtitle}>
                            {`Theo d\u00f5i ti\u1ebfn \u0111\u1ed9 chu\u1ea9n b\u1ecb m\u00f3n v\u00e0 tr\u1ea1ng th\u00e1i thanh to\u00e1n t\u1ea1i \u0111\u00e2y.`}
                        </Text>
                    </FadeIn>
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconCircle}>
                            <MaterialCommunityIcons name="receipt" size={36} color={Colors.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>{`Ch\u01b0a c\u00f3 \u0111\u01a1n h\u00e0ng n\u00e0o`}</Text>
                        <Text style={styles.emptyText}>
                            {`Sau khi t\u1ea1o \u0111\u01a1n t\u1eeb gi\u1ecf h\u00e0ng, l\u1ecbch s\u1eed \u0111\u01a1n s\u1ebd xu\u1ea5t hi\u1ec7n t\u1ea1i \u0111\u00e2y.`}
                        </Text>
                        <Button mode="contained" onPress={() => navigation.navigate('Home')} style={{ marginTop: 18, borderRadius: 20 }}>
                            {`\u0110i ch\u1ecdn m\u00f3n`}
                        </Button>
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
