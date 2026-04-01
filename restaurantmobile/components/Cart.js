import { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image,
    ActivityIndicator,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FadeInUp, FadeIn } from '../utils/animations';
import { useCart } from '../contexts/CartContext';
import Colors from '../styles/colors';
import { editorialShadow } from '../styles/theme';
import { ConfirmDialog, Toast } from './CustomDialog';
import authFetch, { clearSession, getApiErrorMessage } from '../utils/api';
import { endpoints } from '../configs';

const paymentOptions = [
    { key: 'cash', label: 'Tiền mặt', icon: 'cash' },
    { key: 'momo', label: 'MoMo', icon: 'wallet-outline' },
    { key: 'zalopay', label: 'ZaloPay', icon: 'credit-card-outline' },
    { key: 'paypal', label: 'PayPal', icon: 'paypal' },
];

const Cart = ({ navigation }) => {
    const tabBarHeight = useBottomTabBarHeight();
    const {
        items,
        hydrated,
        totalItems,
        totalAmount,
        updateQuantity,
        removeItem,
        clearCart,
    } = useCart();
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [submitting, setSubmitting] = useState(false);
    const [confirmCheckout, setConfirmCheckout] = useState(false);
    const [successDialog, setSuccessDialog] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });

    const showToast = (message, type = 'error') => {
        setToast({ visible: true, message, type });
    };

    const checkout = () => {
        if (!items.length) {
            showToast('Giỏ hàng đang trống');
            return;
        }
        setConfirmCheckout(true);
    };

    const doCheckout = async () => {
        setConfirmCheckout(false);
        setSubmitting(true);
        try {
            const orderRes = await authFetch(endpoints['orders'], {
                method: 'POST',
                body: JSON.stringify({}),
            });

            if (orderRes.status === 401) {
                await clearSession();
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                return;
            }

            if (!orderRes.ok) {
                showToast(await getApiErrorMessage(orderRes, 'Không thể tạo đơn hàng'));
                return;
            }

            let order = await orderRes.json();
            for (const item of items) {
                const detailRes = await authFetch(endpoints['order-add-detail'](order.id), {
                    method: 'POST',
                    body: JSON.stringify({
                        dish: item.id,
                        quantity: item.quantity,
                        unit_price: item.price,
                    }),
                });

                if (detailRes.status === 401) {
                    await clearSession();
                    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                    return;
                }

                if (!detailRes.ok) {
                    showToast(await getApiErrorMessage(detailRes, 'Không thể thêm món vào đơn hàng'));
                    return;
                }

                order = await detailRes.json();
            }

            const paymentRes = await authFetch(endpoints['payments'], {
                method: 'POST',
                body: JSON.stringify({
                    order: order.id,
                    method: paymentMethod,
                    amount: totalAmount,
                }),
            });

            if (paymentRes.status === 401) {
                await clearSession();
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                return;
            }

            const paymentSaved = paymentRes.ok;
            clearCart();
            setSuccessMessage(paymentSaved
                ? 'Đơn hàng đã được tạo và phương thức thanh toán đã được ghi nhận.'
                : 'Đơn hàng đã được tạo, nhưng hệ thống chưa ghi nhận thanh toán. Bạn vẫn có thể xem đơn trong lịch sử.');
            setSuccessDialog(true);
        } catch (err) {
            showToast('Không thể hoàn tất đặt món. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderItem = ({ item, index }) => (
        <FadeInUp delay={index * 60} duration={400}>
            <View style={styles.card}>
                <View style={styles.cardContent}>
                    {item.image ?
                        <Image source={{ uri: item.image }} style={styles.image} /> :
                        <View style={[styles.image, styles.imagePlaceholder]}>
                            <MaterialCommunityIcons name="food-variant" size={24} color={Colors.textSecondary} />
                        </View>
                    }

                    <View style={styles.cardBody}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                            <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeBtn}>
                                <MaterialCommunityIcons name="trash-can-outline" size={18} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.meta}>{item.preparation_time} phút · {item.chef_name || 'Nhà hàng'}</Text>
                        <Text style={styles.price}>{Number(item.price).toLocaleString()}đ</Text>

                        <View style={styles.cardFooter}>
                            <View style={styles.stepper}>
                                <TouchableOpacity style={styles.stepBtn} onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                                    <MaterialCommunityIcons name="minus" size={16} color={Colors.text} />
                                </TouchableOpacity>
                                <Text style={styles.quantity}>{item.quantity}</Text>
                                <TouchableOpacity style={styles.stepBtn} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                                    <MaterialCommunityIcons name="plus" size={16} color={Colors.text} />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.lineTotal}>
                                {(item.price * item.quantity).toLocaleString()}đ
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </FadeInUp>
    );

    if (!hydrated) {
        return <ActivityIndicator size="large" color={Colors.primary} style={{ flex: 1, backgroundColor: Colors.surface }} />;
    }

    if (!items.length) {
        return (
            <View style={styles.empty}>
                <FadeIn duration={500} style={{ alignItems: 'center' }}>
                    <View style={styles.emptyIconCircle}>
                        <MaterialCommunityIcons name="cart-outline" size={40} color={Colors.primary} />
                    </View>
                    <Text style={styles.emptyTitle}>Giỏ hàng đang trống</Text>
                    <Text style={styles.emptyText}>
                        Thêm món từ trang khám phá hoặc chi tiết món để bắt đầu đặt món.
                    </Text>
                    <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Home')} activeOpacity={0.85}>
                        <Text style={styles.emptyBtnText}>Đi khám phá món</Text>
                    </TouchableOpacity>
                </FadeIn>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: tabBarHeight + 260 }}
                ListHeaderComponent={
                    <FadeIn duration={400} style={styles.headerCard}>
                        <Text style={styles.headerTitle}>Giỏ hàng của bạn</Text>
                        <Text style={styles.headerSubtitle}>
                            {totalItems} món đang chờ xác nhận. Kiểm tra lại trước khi tạo đơn.
                        </Text>
                    </FadeIn>
                }
            />

            <View style={[styles.bottomSheet, { bottom: tabBarHeight }]}>
                <Text style={styles.sheetTitle}>Phương thức thanh toán</Text>
                <View style={styles.paymentRow}>
                    {paymentOptions.map((option) => (
                        <TouchableOpacity
                            key={option.key}
                            style={[styles.paymentChip, paymentMethod === option.key && styles.paymentChipActive]}
                            onPress={() => setPaymentMethod(option.key)}
                            activeOpacity={0.8}>
                            <MaterialCommunityIcons
                                name={option.icon}
                                size={16}
                                color={paymentMethod === option.key ? Colors.onPrimary : Colors.text}
                            />
                            <Text style={[styles.paymentText, paymentMethod === option.key && styles.paymentTextActive]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.summaryBlock}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tổng thanh toán</Text>
                        <Text style={styles.summaryAmount}>{totalAmount.toLocaleString()}đ</Text>
                    </View>
                </View>

                {submitting ?
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 10 }} /> :
                    <TouchableOpacity style={styles.checkoutBtn} onPress={checkout} activeOpacity={0.85}>
                        <MaterialCommunityIcons name="check-circle-outline" size={18} color={Colors.onPrimary} />
                        <Text style={styles.checkoutText}>Tạo đơn hàng</Text>
                    </TouchableOpacity>
                }
            </View>

            <ConfirmDialog
                visible={confirmCheckout}
                type="confirm"
                title="Xác nhận tạo đơn"
                message={`${totalItems} món với tổng giá trị ${totalAmount.toLocaleString()}đ sẽ được tạo thành đơn hàng mới.`}
                onCancel={() => setConfirmCheckout(false)}
                onConfirm={doCheckout}
                confirmText="Tạo đơn"
            />

            <ConfirmDialog
                visible={successDialog}
                type="success"
                title="Đặt món thành công"
                message={successMessage}
                confirmText="Xem đơn hàng"
                onConfirm={() => {
                    setSuccessDialog(false);
                    navigation.navigate('Orders');
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    headerCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        padding: 20,
        marginBottom: 12,
        ...editorialShadow,
    },
    headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.text },
    headerSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, lineHeight: 21 },
    card: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        marginBottom: 12,
        ...editorialShadow,
    },
    cardContent: { flexDirection: 'row', padding: 14 },
    image: { width: 100, height: 100, borderRadius: 18 },
    imagePlaceholder: { backgroundColor: Colors.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' },
    cardBody: { flex: 1, marginLeft: 14 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    name: { fontSize: 16, fontWeight: '800', color: Colors.text, lineHeight: 21, flex: 1, marginRight: 8 },
    removeBtn: { padding: 4 },
    meta: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
    price: { fontSize: 16, color: Colors.primary, fontWeight: '800', marginTop: 6 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 14,
        paddingHorizontal: 4,
        paddingVertical: 4,
    },
    stepBtn: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surfaceContainerLowest },
    quantity: { minWidth: 30, textAlign: 'center', fontSize: 16, fontWeight: '800', color: Colors.text },
    lineTotal: { fontSize: 15, fontWeight: '800', color: Colors.text },
    bottomSheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: Colors.surface + 'CC',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 30,
        ...editorialShadow,
    },
    sheetTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
    paymentRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
    paymentChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLow,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 9999,
        marginRight: 8,
        marginBottom: 8,
    },
    paymentChipActive: { backgroundColor: Colors.primary },
    paymentText: { fontSize: 13, color: Colors.text, fontWeight: '700', marginLeft: 6 },
    paymentTextActive: { color: Colors.onPrimary },
    summaryBlock: {
        backgroundColor: Colors.surfaceContainerHigh,
        borderRadius: 16,
        padding: 14,
        marginTop: 8,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { fontSize: 15, color: Colors.textSecondary, fontWeight: '700' },
    summaryAmount: { fontSize: 24, fontWeight: '800', color: Colors.primary },
    checkoutBtn: {
        backgroundColor: Colors.primary,
        marginTop: 14,
        borderRadius: 20,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    checkoutText: { color: Colors.onPrimary, fontWeight: '800', fontSize: 16, marginLeft: 8 },
    empty: {
        flex: 1,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
    },
    emptyTitle: { fontSize: 24, fontWeight: '800', color: Colors.text },
    emptyText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginTop: 10, lineHeight: 22 },
    emptyBtn: { marginTop: 20, backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 20 },
    emptyBtnText: { color: Colors.onPrimary, fontWeight: '800', fontSize: 15 },
});

export default Cart;
