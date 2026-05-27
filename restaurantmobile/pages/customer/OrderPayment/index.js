import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ActivityIndicator, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authFetch, endpoints, clearSession, getApiErrorMessage } from '@configs';
import { ConfirmDialog, Toast } from '@components/CustomDialog';
import Colors from '@styles/colors';
import styles from './styles';

const paymentOptions = [
    {
        key: 'cash',
        label: 'Tiền mặt khi nhận',
        desc: 'Ghi nhận đơn, thanh toán trực tiếp tại quầy hoặc khi phục vụ.',
        icon: 'cash',
    },
    {
        key: 'momo',
        label: 'MoMo',
        desc: 'Thanh toán online qua ví MoMo.',
        icon: 'wallet-outline',
    },
    {
        key: 'stripe',
        label: 'Stripe',
        desc: 'Thanh toán online bằng thẻ qua Stripe Checkout.',
        icon: 'credit-card-outline',
    },
];

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const formatBookingInfo = (order) => {
    if (!order?.booking_date) return '';
    const date = new Date(order.booking_date);
    if (Number.isNaN(date.getTime())) return '';
    const day = date.toLocaleDateString('vi-VN');
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const guests = order.booking_guests ? ` · ${order.booking_guests} khách` : '';
    return `${time} · ${day}${guests}`;
};

const OrderPayment = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const order = route.params?.order || null;
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [submitting, setSubmitting] = useState(false);
    const [successDialog, setSuccessDialog] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });

    const showToast = (message, type = 'error') => setToast({ visible: true, message, type });

    const goToOrders = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'Main', params: { role: 'customer', initialScreen: 'Orders' } }],
        });
    };

    const pay = async () => {
        if (!order?.id) {
            showToast('Không tìm thấy đơn hàng để thanh toán.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await authFetch(endpoints['payments'], {
                method: 'POST',
                body: JSON.stringify({
                    order: order.id,
                    method: paymentMethod,
                }),
            });

            if (res.status === 401) {
                await clearSession();
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                return;
            }

            if (!res.ok) {
                showToast(getApiErrorMessage(res, 'Không thể ghi nhận thanh toán'));
                return;
            }

            if (['momo', 'stripe'].includes(paymentMethod)) {
                if (!res.data?.pay_url) {
                    showToast('Cổng thanh toán chưa trả về URL. Bạn có thể thanh toán lại trong mục Đơn hàng.');
                    return;
                }
                navigation.navigate('PaymentCheckout', {
                    payUrl: res.data.pay_url,
                    paymentId: res.data.id,
                    method: paymentMethod,
                    expiresAt: res.data.expires_at,
                    deeplinkUrl: res.data.deeplink_url,
                    qrCodeUrl: res.data.qr_code_url,
                });
                return;
            }

            setSuccessDialog(true);
        } catch (err) {
            showToast('Không thể kết nối server để thanh toán.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!order) {
        return (
            <View style={[styles.centerState, { paddingTop: insets.top }]}>
                <MaterialCommunityIcons name="receipt-text-remove-outline" size={52} color={Colors.primary} />
                <Text style={styles.stateTitle}>Không tìm thấy đơn hàng</Text>
                <Text style={styles.stateText}>Bạn có thể kiểm tra lại trong mục Đơn hàng.</Text>
                <Button mode="contained" onPress={goToOrders} style={styles.stateBtn}>
                    Xem đơn hàng
                </Button>
            </View>
        );
    }

    const selectedOption = paymentOptions.find((option) => option.key === paymentMethod);
    const bookingInfo = formatBookingInfo(order);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn} activeOpacity={0.75} onPress={goToOrders}>
                    <MaterialCommunityIcons name="close" size={22} color={Colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Thanh toán đơn hàng</Text>
                    <Text style={styles.subtitle}>Đơn #{order.id} đã được tạo. Chọn phương thức thanh toán để hoàn tất.</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}>
                <View style={styles.summaryCard}>
                    <View style={styles.summaryTop}>
                        <View>
                            <Text style={styles.summaryLabel}>Tổng thanh toán</Text>
                            <Text style={styles.amount}>{formatCurrency(order.total_amount)}</Text>
                        </View>
                        <View style={styles.orderBadge}>
                            <Text style={styles.orderBadgeText}>#{order.id}</Text>
                        </View>
                    </View>

                    <View style={styles.serviceRow}>
                        <View style={styles.serviceIcon}>
                            <MaterialCommunityIcons
                                name={order.service_type === 'table' ? 'table-chair' : 'storefront-outline'}
                                size={18}
                                color={Colors.primary}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.serviceTitle}>
                                {order.service_label || (order.booking ? 'Phục vụ theo lịch đặt bàn' : 'Lấy tại quầy')}
                            </Text>
                            <Text style={styles.serviceSub}>
                                {order.service_type === 'table'
                                    ? (bookingInfo || `Lịch đặt bàn #${order.booking}`)
                                    : 'Nhận món tại quầy khi món đã sẵn sàng.'}
                            </Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>

                {paymentOptions.map((option) => {
                    const active = paymentMethod === option.key;
                    return (
                        <TouchableOpacity
                            key={option.key}
                            activeOpacity={0.78}
                            onPress={() => setPaymentMethod(option.key)}
                            style={[styles.paymentOption, active && styles.paymentOptionActive]}>
                            <View style={[styles.paymentIcon, active && styles.paymentIconActive]}>
                                <MaterialCommunityIcons
                                    name={option.icon}
                                    size={24}
                                    color={active ? Colors.primary : Colors.textSecondary}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.paymentTitle, active && styles.paymentTitleActive]}>
                                    {option.label}
                                </Text>
                                <Text style={styles.paymentDesc}>{option.desc}</Text>
                            </View>
                            <MaterialCommunityIcons
                                name={active ? 'radiobox-marked' : 'radiobox-blank'}
                                size={22}
                                color={active ? Colors.primary : Colors.outlineVariant}
                            />
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
                <View style={styles.paySummary}>
                    <Text style={styles.paySummaryLabel}>Đã chọn</Text>
                    <Text style={styles.paySummaryValue}>{selectedOption?.label}</Text>
                </View>
                <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={submitting}
                    onPress={pay}
                    style={[styles.payBtn, submitting && styles.payBtnDisabled]}>
                    {submitting ? (
                        <ActivityIndicator size="small" color={Colors.onPrimary} />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="credit-card-check-outline" size={20} color={Colors.onPrimary} />
                            <Text style={styles.payBtnText}>Tiếp tục thanh toán</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <ConfirmDialog
                visible={successDialog}
                type="success"
                title="Đã ghi nhận phương thức"
                message="Đơn hàng đã được tạo và phương thức thanh toán tiền mặt đã được ghi nhận."
                confirmText="Xem đơn hàng"
                onConfirm={() => {
                    setSuccessDialog(false);
                    goToOrders();
                }}
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

export default OrderPayment;
