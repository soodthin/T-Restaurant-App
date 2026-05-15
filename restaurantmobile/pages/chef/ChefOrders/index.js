import { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { authFetch, endpoints, getApiErrorMessage, clearSession } from '@configs';
import { FadeInUp, FadeIn } from '@utils/animations';
import Colors from '@styles/colors';
import styles from './styles';

const statusConfig = {
    pending: { label: 'Chờ xử lý', color: Colors.star, icon: 'clock-outline' },
    paid: { label: 'Đã xác nhận', color: Colors.success, icon: 'check-decagram' },
    preparing: { label: 'Đang nấu', color: Colors.tertiary, icon: 'chef-hat' },
    served: { label: 'Đã phục vụ', color: Colors.success, icon: 'check-circle-outline' },
    payment_failed: { label: 'Hủy (Lỗi TT)', color: Colors.primary, icon: 'cash-remove' },
    cancelled: { label: 'Đã hủy', color: Colors.primary, icon: 'close-circle-outline' },
};

const filterOptions = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ xử lý' },
    { key: 'paid', label: 'Đã xác nhận' },
    { key: 'preparing', label: 'Đang nấu' },
    { key: 'served', label: 'Đã phục vụ' },
];

const ChefOrders = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState(null);

    const loadOrders = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true);
        else setRefreshing(true);
        setError('');

        try {
            const res = await authFetch(endpoints['orders'] + 'chef-orders/');
            if (res.status === 401) {
                await clearSession();
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                return;
            }
            if (!res.ok) {
                setError(getApiErrorMessage(res, 'Không thể tải danh sách đơn hàng.'));
                return;
            }
            setOrders(res.data?.results || res.data || []);
        } catch (err) {
            setError('Đã xảy ra lỗi mạng. Vui lòng kiểm tra lại kết nối.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [navigation]);

    useFocusEffect(
        useCallback(() => {
            loadOrders(true);
        }, [loadOrders])
    );

    const updateStatus = async (orderId, newStatus) => {
        setActionLoading(orderId);
        try {
            const res = await authFetch(endpoints['orders'] + `${orderId}/chef-update-status/`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.status === 401) {
                await clearSession();
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                return;
            }
            if (!res.ok) {
                alert(getApiErrorMessage(res, 'Không thể cập nhật trạng thái.'));
                return;
            }
            // Update local state
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (err) {
            alert('Đã xảy ra lỗi mạng.');
        } finally {
            setActionLoading(null);
        }
    };

    const renderOrder = ({ item, index }) => {
        const conf = statusConfig[item.status] || statusConfig.pending;
        const isCancelled = ['cancelled', 'payment_failed'].includes(item.status);
        
        // Show action buttons based on status
        const canStartCooking = ['pending', 'paid'].includes(item.status);
        const canFinishCooking = item.status === 'preparing';

        return (
            <FadeInUp delay={index * 50} duration={400}>
                <View style={[styles.card, isCancelled && styles.cardCancelled]}>
                    <View style={styles.cardHeaderRow}>
                        <View>
                            <Text style={styles.orderId}>Đơn #{item.id}</Text>
                            <Text style={styles.date}>
                                {new Date(item.created_date).toLocaleString('vi-VN', {
                                    hour: '2-digit', minute: '2-digit',
                                    day: '2-digit', month: '2-digit', year: 'numeric'
                                })}
                            </Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: conf.color + '16' }]}>
                            <MaterialCommunityIcons name={conf.icon} size={14} color={conf.color} />
                            <Text style={[styles.badgeText, { color: conf.color }]}>{conf.label}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailsCard}>
                        {item.details.map((d, i) => (
                            <View key={i} style={styles.detailRow}>
                                <View style={styles.detailQtyBadge}>
                                    <Text style={styles.detailQtyText}>{d.quantity}x</Text>
                                </View>
                                <Text style={styles.detailItem} numberOfLines={2}>
                                    {d.dish_name}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {canStartCooking && (
                        <Button
                            mode="contained"
                            buttonColor={Colors.tertiary}
                            textColor="#fff"
                            style={styles.actionBtn}
                            labelStyle={styles.actionLabel}
                            loading={actionLoading === item.id}
                            disabled={actionLoading === item.id}
                            icon="fire"
                            onPress={() => updateStatus(item.id, 'preparing')}>
                            Bắt đầu nấu
                        </Button>
                    )}

                    {canFinishCooking && (
                        <Button
                            mode="contained"
                            buttonColor={Colors.success}
                            textColor="#fff"
                            style={styles.actionBtn}
                            labelStyle={styles.actionLabel}
                            loading={actionLoading === item.id}
                            disabled={actionLoading === item.id}
                            icon="check-all"
                            onPress={() => updateStatus(item.id, 'served')}>
                            Đã nấu xong
                        </Button>
                    )}
                </View>
            </FadeInUp>
        );
    };

    const filteredOrders = filter === 'all' 
        ? orders 
        : orders.filter(o => o.status === filter);

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingBottom: 6, paddingRight: 4 }}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Quản lý Đơn hàng</Text>
                        <Text style={styles.headerSubtitle}>
                            Tiếp nhận và cập nhật tiến độ các món do bạn phụ trách.
                        </Text>
                    </View>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.refreshBtn}
                        onPress={() => loadOrders(true)}>
                        <MaterialCommunityIcons name="refresh" size={22} color={Colors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}>
                    {filterOptions.map((opt) => {
                        const active = filter === opt.key;
                        return (
                            <TouchableOpacity
                                key={opt.key}
                                activeOpacity={0.7}
                                onPress={() => setFilter(opt.key)}
                                style={[styles.filterChip, active && styles.filterChipActive]}>
                                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {error ? (
                <View style={styles.errorCard}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={20} color={Colors.primary} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : null}

            {loading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ flex: 1 }} />
            ) : (
                <FlatList
                    data={filteredOrders}
                    renderItem={renderOrder}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                    refreshing={refreshing}
                    onRefresh={() => loadOrders(false)}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <FadeIn duration={500} style={{ alignItems: 'center' }}>
                                <View style={styles.emptyIconCircle}>
                                    <MaterialCommunityIcons name="receipt" size={36} color={Colors.primary} />
                                </View>
                                <Text style={styles.emptyTitle}>Chưa có đơn hàng nào</Text>
                                <Text style={styles.emptyText}>
                                    {filter === 'all' 
                                        ? 'Các đơn hàng có chứa món của bạn sẽ hiển thị tại đây.'
                                        : 'Không có đơn hàng nào phù hợp với bộ lọc hiện tại.'}
                                </Text>
                            </FadeIn>
                        </View>
                    }
                />
            )}
        </View>
    );
};

export default ChefOrders;
