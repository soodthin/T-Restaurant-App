import { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { Button, ActivityIndicator, Portal, Modal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { authFetch, endpoints, getApiErrorMessage, clearSession } from '@configs';
import { FadeInUp, FadeIn } from '@utils/animations';
import { ConfirmDialog } from '@components/CustomDialog';
import Colors from '@styles/colors';
import styles from './styles';

const statusConfig = {
    pending: { label: 'Chờ xử lý', color: Colors.star, icon: 'clock-outline' },
    paid: { label: 'Đã xác nhận', color: Colors.success, icon: 'check-decagram' },
    preparing: { label: 'Đang nấu', color: Colors.tertiary, icon: 'chef-hat' },
    served: { label: 'Đã phục vụ', color: Colors.success, icon: 'check-circle-outline' },
    payment_failed: { label: 'Thanh toán lỗi', color: Colors.primary, icon: 'cash-remove' },
    cancelled: { label: 'Đã hủy', color: Colors.primary, icon: 'close-circle-outline' },
};

const filterOptions = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ xử lý' },
    { key: 'paid', label: 'Đã xác nhận' },
    { key: 'preparing', label: 'Đang nấu' },
    { key: 'served', label: 'Đã phục vụ' },
    { key: 'payment_failed', label: 'Lỗi thanh toán' },
    { key: 'cancelled', label: 'Đã hủy' },
];

const paymentMethodConfig = {
    cash: { label: 'Tiền mặt', icon: 'cash' },
    momo: { label: 'MoMo', icon: 'wallet-outline' },
    stripe: { label: 'Stripe', icon: 'credit-card-outline' },
};

const paymentStatusConfig = {
    pending: { label: 'Chờ thanh toán', color: Colors.star },
    completed: { label: 'Đã thanh toán', color: Colors.success },
    failed: { label: 'Thanh toán lỗi', color: Colors.primary },
};

const statusActionMap = {
    pending: [
        {
            status: 'preparing',
            label: 'Bắt đầu nấu',
            description: 'Chuyển đơn sang khu vực bếp và bắt đầu chuẩn bị món.',
            icon: 'fire',
            color: Colors.tertiary,
        },
        {
            status: 'cancelled',
            label: 'Hủy đơn',
            description: 'Dùng khi bếp không thể tiếp nhận hoặc khách yêu cầu hủy.',
            icon: 'close-circle-outline',
            color: Colors.primary,
        },
    ],
    paid: [
        {
            status: 'preparing',
            label: 'Bắt đầu nấu',
            description: 'Đơn đã thanh toán, chuyển sang trạng thái đang chuẩn bị.',
            icon: 'fire',
            color: Colors.tertiary,
        },
        {
            status: 'cancelled',
            label: 'Hủy đơn',
            description: 'Chỉ dùng khi không thể phục vụ. Đơn đã thanh toán cần xử lý đối soát sau.',
            icon: 'close-circle-outline',
            color: Colors.primary,
        },
    ],
    preparing: [
        {
            status: 'served',
            label: 'Đã phục vụ',
            description: 'Món đã hoàn tất và được phục vụ cho khách.',
            icon: 'check-all',
            color: Colors.success,
        },
        {
            status: 'cancelled',
            label: 'Hủy đơn',
            description: 'Dùng khi phát sinh sự cố khiến đơn không thể hoàn tất.',
            icon: 'close-circle-outline',
            color: Colors.primary,
        },
    ],
};

const isOnlinePayment = (method) => ['momo', 'stripe'].includes(method);

const getStatusActions = (order) => {
    const actions = statusActionMap[order?.status] || [];
    return actions.map((action) => {
        const waitingOnlinePayment =
            order?.status === 'pending'
            && action.status === 'preparing'
            && isOnlinePayment(order?.payment_method)
            && order?.payment_status !== 'completed';

        return {
            ...action,
            disabled: waitingOnlinePayment,
            disabledReason: waitingOnlinePayment
                ? 'Đơn thanh toán online chưa hoàn tất, chưa thể bắt đầu nấu.'
                : '',
        };
    });
};

const formatBookingInfo = (order) => {
    if (!order?.booking_date) return '';
    const date = new Date(order.booking_date);
    if (Number.isNaN(date.getTime())) return '';
    const day = date.toLocaleDateString('vi-VN');
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const guests = order.booking_guests ? ` · ${order.booking_guests} khách` : '';
    return `${time} · ${day}${guests}`;
};

const ChefOrders = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const embeddedInTab = route?.params?.embeddedInTab === true;
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [cancelConfirm, setCancelConfirm] = useState(null);

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
        setActionLoading({ orderId, status: newStatus });
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

            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...res.data } : o));
            setSelectedOrder(null);
        } catch (err) {
            alert('Đã xảy ra lỗi mạng.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleStatusAction = (order, action) => {
        if (action.status === 'cancelled') {
            setCancelConfirm({ order, action });
            return;
        }
        updateStatus(order.id, action.status);
    };

    const renderOrder = ({ item, index }) => {
        const conf = statusConfig[item.status] || statusConfig.pending;
        const isCancelled = ['cancelled', 'payment_failed'].includes(item.status);
        const paymentMethod = paymentMethodConfig[item.payment_method] || {
            label: item.payment_method || 'Chưa ghi nhận',
            icon: 'credit-card-outline',
        };
        const paymentStatus = paymentStatusConfig[item.payment_status] || {
            label: item.payment_status || 'Chưa thanh toán',
            color: Colors.textSecondary,
        };
        const statusActions = getStatusActions(item);
        const isUpdatingOrder = actionLoading?.orderId === item.id;
        const bookingInfo = formatBookingInfo(item);

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

                    <View style={styles.serviceRow}>
                        <View style={styles.serviceIcon}>
                            <MaterialCommunityIcons
                                name={item.service_type === 'table' ? 'table-chair' : 'storefront-outline'}
                                size={16}
                                color={Colors.primary}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.serviceTitle}>
                                {item.service_label || (item.booking ? 'Phục vụ theo lịch đặt bàn' : 'Lấy tại quầy')}
                            </Text>
                            <Text style={styles.serviceSub}>
                                {item.service_type === 'table'
                                    ? (bookingInfo || `Lịch đặt bàn #${item.booking}`)
                                    : 'Khách nhận món tại quầy.'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.paymentRow}>
                        <View style={styles.paymentMethod}>
                            <MaterialCommunityIcons name={paymentMethod.icon} size={15} color={Colors.textSecondary} />
                            <Text style={styles.paymentText}>{paymentMethod.label}</Text>
                        </View>
                        <View style={[styles.paymentStatusPill, { backgroundColor: paymentStatus.color + '16' }]}>
                            <Text style={[styles.paymentStatusText, { color: paymentStatus.color }]}>
                                {paymentStatus.label}
                            </Text>
                        </View>
                    </View>

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

                    {statusActions.length > 0 ? (
                        <Button
                            mode="contained"
                            buttonColor={Colors.primary}
                            textColor="#fff"
                            style={styles.actionBtn}
                            labelStyle={styles.actionLabel}
                            loading={isUpdatingOrder}
                            disabled={isUpdatingOrder}
                            icon="playlist-edit"
                            onPress={() => setSelectedOrder(item)}>
                            Cập nhật trạng thái
                        </Button>
                    ) : (
                        <View style={styles.terminalStatus}>
                            <MaterialCommunityIcons name="lock-check-outline" size={15} color={Colors.textSecondary} />
                            <Text style={styles.terminalStatusText}>
                                Trạng thái này đã kết thúc, đầu bếp không cần cập nhật thêm.
                            </Text>
                        </View>
                    )}
                </View>
            </FadeInUp>
        );
    };

    const filteredOrders = filter === 'all'
        ? orders
        : orders.filter(o => o.status === filter);
    const selectedConf = statusConfig[selectedOrder?.status] || statusConfig.pending;
    const selectedActions = getStatusActions(selectedOrder);

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <View style={styles.headerRow}>
                    {embeddedInTab ? (
                        <View style={{ width: 28, paddingBottom: 6, paddingRight: 4 }} />
                    ) : (
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingBottom: 6, paddingRight: 4 }}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    )}
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

            <Portal>
                <Modal
                    visible={Boolean(selectedOrder)}
                    onDismiss={() => actionLoading ? null : setSelectedOrder(null)}
                    contentContainerStyle={styles.statusModal}>
                    {selectedOrder ? (
                        <>
                            <View style={styles.modalHandle} />
                            <Text style={styles.modalTitle}>Cập nhật đơn #{selectedOrder.id}</Text>
                            <View style={styles.currentStatusRow}>
                                <Text style={styles.currentStatusLabel}>Hiện tại</Text>
                                <View style={[styles.badge, { backgroundColor: selectedConf.color + '16' }]}>
                                    <MaterialCommunityIcons name={selectedConf.icon} size={14} color={selectedConf.color} />
                                    <Text style={[styles.badgeText, { color: selectedConf.color }]}>
                                        {selectedConf.label}
                                    </Text>
                                </View>
                            </View>

                            {selectedActions.length > 0 ? (
                                selectedActions.map((action) => (
                                    <TouchableOpacity
                                        key={action.status}
                                        activeOpacity={action.disabled || actionLoading ? 1 : 0.75}
                                        disabled={action.disabled || Boolean(actionLoading)}
                                        onPress={() => handleStatusAction(selectedOrder, action)}
                                        style={[
                                            styles.statusOption,
                                            action.disabled && styles.statusOptionDisabled,
                                        ]}>
                                        <View style={[styles.statusOptionIcon, { backgroundColor: action.color + '16' }]}>
                                            <MaterialCommunityIcons name={action.icon} size={22} color={action.color} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.statusOptionTitle}>{action.label}</Text>
                                            <Text style={styles.statusOptionDesc}>
                                                {action.disabled ? action.disabledReason : action.description}
                                            </Text>
                                        </View>
                                        {actionLoading?.orderId === selectedOrder.id && actionLoading?.status === action.status ? (
                                            <ActivityIndicator size="small" color={Colors.primary} />
                                        ) : (
                                            <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textSecondary} />
                                        )}
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={styles.noActionBox}>
                                    <MaterialCommunityIcons name="lock-check-outline" size={24} color={Colors.textSecondary} />
                                    <Text style={styles.noActionText}>
                                        Đơn hàng đã ở trạng thái kết thúc.
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                activeOpacity={0.75}
                                disabled={Boolean(actionLoading)}
                                onPress={() => setSelectedOrder(null)}
                                style={styles.modalCloseBtn}>
                                <Text style={styles.modalCloseText}>Đóng</Text>
                            </TouchableOpacity>
                        </>
                    ) : null}
                </Modal>
            </Portal>

            <ConfirmDialog
                visible={Boolean(cancelConfirm)}
                type="warning"
                title="Hủy đơn hàng"
                message={cancelConfirm
                    ? `Bạn chắc chắn muốn hủy đơn #${cancelConfirm.order.id}? Trạng thái này sẽ kết thúc xử lý đơn.`
                    : ''}
                confirmText="Hủy đơn"
                cancelText="Quay lại"
                loading={Boolean(actionLoading)}
                onCancel={() => !actionLoading && setCancelConfirm(null)}
                onConfirm={() => {
                    if (!cancelConfirm) return;
                    const orderId = cancelConfirm.order.id;
                    const nextStatus = cancelConfirm.action.status;
                    setCancelConfirm(null);
                    updateStatus(orderId, nextStatus);
                }}
            />
        </View>
    );
};

export default ChefOrders;
