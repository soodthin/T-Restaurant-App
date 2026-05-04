import { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    ScrollView,
} from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FadeInUp, FadeIn } from '@utils/animations';
import { useCart } from '@contexts/CartContext';
import Colors from '@styles/colors';
import { ConfirmDialog, Toast } from '@components/CustomDialog';
import { authFetch, endpoints, clearSession, getApiErrorMessage } from '@configs';
import styles from './styles';

const paymentOptions = [
    { key: 'cash', label: 'Tiền mặt khi nhận', icon: 'cash' },
    { key: 'momo', label: 'MoMo', icon: 'wallet-outline' },
    { key: 'stripe', label: 'Stripe', icon: 'credit-card-outline' },
];

const Cart = ({ navigation, route }) => {
    const isGuest = route.params?.isGuest || false;
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

    const checkout = async () => {
        if (!items.length) {
            showToast('Giỏ hàng đang trống');
            return;
        }
        if (isGuest) {
            showToast('Vui lòng đăng nhập để tạo đơn hàng');
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
                showToast(getApiErrorMessage(orderRes, 'Không thể tạo đơn hàng'));
                return;
            }

            let order = orderRes.data;
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
                    showToast(getApiErrorMessage(detailRes, 'Không thể thêm món vào đơn hàng'));
                    return;
                }

                order = detailRes.data;
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
        <FadeInUp delay={index * 80} duration={400}>
            <View style={styles.itemCard}>
                {item.image ?
                    <Image source={{ uri: item.image }} style={styles.itemImage} /> :
                    <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                        <MaterialCommunityIcons name="food-variant" size={28} color={Colors.textSecondary} />
                    </View>
                }

                <View style={styles.itemBody}>
                    <View style={styles.itemTopRow}>
                        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                        <TouchableOpacity
                            style={styles.removeBtn}
                            activeOpacity={0.7}
                            hitSlop={6}
                            onPress={() => removeItem(item.id)}>
                            <MaterialCommunityIcons name="trash-can-outline" size={18} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.itemMeta}>
                        {item.preparation_time} phút chuẩn bị
                    </Text>

                    <View style={styles.itemBottomRow}>
                        <Text style={styles.itemPrice}>
                            {Number(item.price).toLocaleString()}đ
                        </Text>

                        <View style={styles.stepperPill}>
                            <TouchableOpacity
                                style={styles.stepperBtn}
                                activeOpacity={0.7}
                                onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                                <MaterialCommunityIcons name="minus" size={16} color={Colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.stepperValue}>{item.quantity}</Text>
                            <TouchableOpacity
                                style={styles.stepperBtn}
                                activeOpacity={0.7}
                                onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                                <MaterialCommunityIcons name="plus" size={16} color={Colors.text} />
                            </TouchableOpacity>
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
            <View style={styles.container}>
                <FadeInUp duration={400} style={styles.headerCard}>
                    <Text style={styles.headerTitle}>Giỏ hàng của bạn</Text>
                </FadeInUp>
                <View style={styles.emptyWrap}>
                    <FadeIn duration={500} style={{ alignItems: 'center' }}>
                        <View style={styles.emptyIconCircle}>
                            <MaterialCommunityIcons name="shopping-outline" size={36} color={Colors.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
                        <Text style={styles.emptyText}>
                            Hãy khám phá thêm menu để chọn cho mình những món ăn ngon nhé!
                        </Text>
                        <Button
                            mode="contained"
                            onPress={() => navigation.navigate('Home')}
                            buttonColor={Colors.primary}
                            textColor={Colors.onPrimary}
                            labelStyle={{ fontWeight: '800', fontSize: 14 }}
                            style={{ marginTop: 22, borderRadius: 16 }}
                            contentStyle={{ paddingVertical: 4, paddingHorizontal: 12 }}
                        >
                            Đi khám phá
                        </Button>
                    </FadeIn>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: tabBarHeight + 320 }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <FadeIn duration={400} style={styles.headerCard}>
                        <Text style={styles.headerTitle}>Giỏ hàng của bạn</Text>
                        <Text style={styles.headerSubtitle}>
                            <Text style={styles.headerCount}>{totalItems} món</Text>
                            {' đang chờ xác nhận. Kiểm tra lại trước khi tạo đơn.'}
                        </Text>
                    </FadeIn>
                }
            />

            <View style={[styles.bottomSheet, { bottom: tabBarHeight }]}>
                {!isGuest ? (
                    <>
                        <Text style={styles.sheetTitle}>PHƯƠNG THỨC THANH TOÁN</Text>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.paymentScroll}>
                            {paymentOptions.map((option) => {
                                const active = paymentMethod === option.key;
                                return (
                                    <TouchableOpacity
                                        key={option.key}
                                        activeOpacity={0.7}
                                        onPress={() => setPaymentMethod(option.key)}
                                        style={[styles.paymentChip, active && styles.paymentChipActive]}>
                                        <MaterialCommunityIcons
                                            name={option.icon}
                                            size={18}
                                            color={active ? Colors.primary : Colors.textSecondary}
                                        />
                                        <Text style={[styles.paymentChipText, active && styles.paymentChipTextActive]}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <View style={styles.summaryBlock}>
                            <Text style={styles.summaryLabel}>Tổng thanh toán</Text>
                            <Text style={styles.summaryAmount}>{totalAmount.toLocaleString()}đ</Text>
                        </View>

                        <Button
                            mode="contained"
                            icon="chevron-right"
                            onPress={checkout}
                            disabled={submitting}
                            loading={submitting}
                            buttonColor={Colors.primary}
                            textColor={Colors.onPrimary}
                            contentStyle={{ paddingVertical: 8, flexDirection: 'row-reverse' }}
                            style={styles.checkoutBtn}
                            labelStyle={{ fontWeight: '800', fontSize: 16 }}>
                            Tạo đơn hàng
                        </Button>
                    </>
                ) : (
                    <View style={styles.guestPrompt}>
                        <View style={styles.guestPromptIcon}>
                            <MaterialCommunityIcons name="account-lock-outline" size={26} color={Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.guestPromptTitle}>Đăng nhập để đặt món</Text>
                            <Text style={styles.guestPromptText}>
                                Bạn cần tài khoản khách hàng để tạo đơn hàng và theo dõi trạng thái món.
                            </Text>
                        </View>
                        <View style={styles.summaryBlock}>
                            <Text style={styles.summaryLabel}>Tổng tạm tính</Text>
                            <Text style={styles.summaryAmount}>{totalAmount.toLocaleString()}đ</Text>
                        </View>
                        <Button
                            mode="contained"
                            icon="login"
                            onPress={() => navigation.navigate('Login')}
                            buttonColor={Colors.primary}
                            textColor={Colors.onPrimary}
                            labelStyle={{ fontWeight: '800', fontSize: 16 }}
                            style={styles.checkoutBtn}
                            contentStyle={{ paddingVertical: 8 }}>
                            Đăng nhập ngay
                        </Button>
                    </View>
                )}
            </View>

            <ConfirmDialog
                visible={confirmCheckout}
                type="confirm"
                title={'Xác nhận tạo đơn'}
                message={`${totalItems} món với tổng giá trị ${totalAmount.toLocaleString()}đ sẽ được tạo thành đơn hàng mới.`}
                onCancel={() => setConfirmCheckout(false)}
                onConfirm={doCheckout}
                confirmText={'Tạo đơn'}
            />

            <ConfirmDialog
                visible={successDialog}
                type="success"
                title={'Đặt món thành công'}
                message={successMessage}
                confirmText={'Xem đơn hàng'}
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

export default Cart;
