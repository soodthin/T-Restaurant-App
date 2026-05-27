import { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    Animated,
    Easing,
    ScrollView,
} from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FadeIn, FadeInUp } from '@utils/animations';
import { useFocusEffect } from '@react-navigation/native';
import { authFetch, endpoints, clearSession, getApiErrorMessage } from '@configs';
import Colors from '@styles/colors';
import { Toast } from '@components/CustomDialog';
import OrderCard from './OrderCard';
import { filterOptions } from './orderConstants';
import styles from './styles';

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

    const goToOrderDetail = useCallback((order) => {
        navigation.navigate('OrderDetail', { orderId: order.id, initialData: order });
    }, [navigation]);

    const renderOrder = ({ item, index }) => (
        <OrderCard
            item={item}
            index={index}
            onViewDetail={goToOrderDetail}
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
                                        size={22}
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
                    <FadeInUp style={styles.empty}>
                        <View style={styles.emptyIconCircle}>
                            <MaterialCommunityIcons name="receipt-outline" size={40} color={Colors.primary} />
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
                            <Button mode="contained" onPress={() => navigation.navigate('Home')} style={{ marginTop: 24, borderRadius: 20 }}>
                                {`Đi chọn món`}
                            </Button>
                        )}
                    </FadeInUp>
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
