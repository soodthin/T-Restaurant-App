import { useCallback, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    ScrollView,
    Modal,
    Pressable,
    StyleSheet,
} from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { FadeInUp, FadeIn } from '@utils/animations';
import { useCart } from '@contexts/CartContext';
import Colors from '@styles/colors';
import { ConfirmDialog, Toast } from '@components/CustomDialog';
import { authFetch, endpoints, clearSession, getApiErrorMessage } from '@configs';
import styles from './styles';

const serviceOptions = [
    { key: 'counter', label: 'Lấy tại quầy', icon: 'storefront-outline' },
    { key: 'table', label: 'Theo bàn đã đặt', icon: 'table-chair' },
];

const formatBookingLabel = (booking) => {
    const date = new Date(booking.booking_date);
    const validDate = !Number.isNaN(date.getTime());
    const day = validDate ? date.toLocaleDateString('vi-VN') : '';
    const time = validDate ? date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
    return `Bàn đặt #${booking.id} · ${time} ${day} · ${booking.guests} khách`;
};

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
    const [serviceMode, setServiceMode] = useState('counter');
    const [bookings, setBookings] = useState([]);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [confirmCheckout, setConfirmCheckout] = useState(false);
    const [bookingModalVisible, setBookingModalVisible] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });
    const selectedBooking = bookings.find((booking) => booking.id === selectedBookingId);

    const showToast = (message, type = 'error') => {
        setToast({ visible: true, message, type });
    };

    const loadBookings = useCallback(async () => {
        if (isGuest) return;
        setLoadingBookings(true);
        try {
            const res = await authFetch(endpoints['bookings']);
            if (res.status === 401) {
                await clearSession();
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                return;
            }
            if (!res.ok) {
                setBookings([]);
                return;
            }

            const data = res.data;
            const items = (data.results || [])
                .filter((booking) => ['pending', 'confirmed'].includes(booking.status))
                .sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());
            setBookings(items);
            setSelectedBookingId((prev) => (
                prev && items.some((booking) => booking.id === prev)
                    ? prev
                    : (items[0]?.id || null)
            ));
        } catch (err) {
            setBookings([]);
        } finally {
            setLoadingBookings(false);
        }
    }, [isGuest, navigation]);

    useFocusEffect(useCallback(() => {
        loadBookings();
    }, [loadBookings]));

    const checkout = async () => {
        if (!items.length) {
            showToast('Giỏ hàng đang trống');
            return;
        }
        if (isGuest) {
            showToast('Vui lòng đăng nhập để tạo đơn hàng');
            return;
        }
        if (serviceMode === 'table' && !selectedBookingId) {
            showToast('Vui lòng chọn lịch đặt bàn hoặc đổi sang lấy tại quầy');
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
                body: JSON.stringify(serviceMode === 'table'
                    ? { booking: selectedBookingId }
                    : {}),
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

            clearCart();
            navigation.navigate('OrderPayment', { order });
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
                contentContainerStyle={{ paddingBottom: tabBarHeight + 340 }}
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
                        <Text style={styles.sheetTitle}>CÁCH NHẬN MÓN</Text>

                        <View style={styles.serviceModeRow}>
                            {serviceOptions.map((option) => {
                                const active = serviceMode === option.key;
                                return (
                                    <TouchableOpacity
                                        key={option.key}
                                        activeOpacity={0.75}
                                        onPress={() => setServiceMode(option.key)}
                                        style={[styles.serviceModeChip, active && styles.serviceModeChipActive]}>
                                        <MaterialCommunityIcons
                                            name={option.icon}
                                            size={18}
                                            color={active ? Colors.primary : Colors.textSecondary}
                                        />
                                        <Text style={[styles.serviceModeText, active && styles.serviceModeTextActive]}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {serviceMode === 'table' ? (
                            <View style={styles.bookingSelectBlock}>
                                {loadingBookings ? (
                                    <View style={styles.bookingLoadingRow}>
                                        <ActivityIndicator size="small" color={Colors.primary} />
                                        <Text style={styles.bookingHint}>Đang tải lịch đặt bàn...</Text>
                                    </View>
                                ) : bookings.length > 0 ? (
                                    <TouchableOpacity
                                        activeOpacity={0.75}
                                        onPress={() => setBookingModalVisible(true)}
                                        style={styles.bookingSelectorBtn}>
                                        <View style={styles.bookingSelectorContent}>
                                            <MaterialCommunityIcons
                                                name="calendar-check-outline"
                                                size={20}
                                                color={selectedBookingId ? Colors.primary : Colors.textSecondary}
                                            />
                                            <Text
                                                numberOfLines={1}
                                                style={[
                                                    styles.bookingSelectorText,
                                                    !selectedBookingId && styles.bookingSelectorPlaceholder
                                                ]}>
                                                {selectedBooking
                                                    ? formatBookingLabel(selectedBooking)
                                                    : 'Chọn lịch đặt bàn'}
                                            </Text>
                                        </View>
                                        <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.noBookingBox}>
                                        <Text style={styles.bookingHint}>
                                            Bạn chưa có lịch đặt bàn đang chờ hoặc đã xác nhận.
                                        </Text>
                                        <TouchableOpacity
                                            activeOpacity={0.75}
                                            onPress={() => navigation.navigate('Booking')}
                                            style={styles.bookingAction}>
                                            <Text style={styles.bookingActionText}>Đặt bàn</Text>
                                            <MaterialCommunityIcons name="arrow-right" size={14} color={Colors.primary} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        ) : null}

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
                            Tạo đơn và thanh toán
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

            <Modal
                visible={bookingModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setBookingModalVisible(false)}
            >
                <View style={[StyleSheet.absoluteFill, styles.modalBackdrop]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setBookingModalVisible(false)} />
                </View>

                <View style={styles.modalContainer} pointerEvents="box-none">
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn lịch đặt bàn</Text>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => setBookingModalVisible(false)}
                                style={styles.modalCloseBtn}
                            >
                                <MaterialCommunityIcons name="close" size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            contentContainerStyle={styles.modalList}
                            showsVerticalScrollIndicator={false}
                        >
                            {bookings.map((booking) => {
                                const active = selectedBookingId === booking.id;
                                const date = new Date(booking.booking_date);
                                const validDate = !Number.isNaN(date.getTime());
                                const day = validDate ? date.toLocaleDateString('vi-VN') : '';
                                const time = validDate ? date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

                                return (
                                    <TouchableOpacity
                                        key={booking.id}
                                        activeOpacity={0.75}
                                        onPress={() => {
                                            setSelectedBookingId(booking.id);
                                            setBookingModalVisible(false);
                                        }}
                                        style={[styles.bookingListItem, active && styles.bookingListItemActive]}>
                                        <View style={[styles.bookingListIconWrap, active && styles.bookingListIconWrapActive]}>
                                            <MaterialCommunityIcons
                                                name={booking.status === 'confirmed' ? 'check-circle-outline' : 'clock-outline'}
                                                size={20}
                                                color={active ? Colors.onPrimary : Colors.primary}
                                            />
                                        </View>
                                        <View style={styles.bookingListBody}>
                                            <Text style={[styles.bookingListTitle, active && styles.bookingListTitleActive]}>
                                                Bàn đặt #{booking.id}
                                            </Text>
                                            <Text style={styles.bookingListSub}>
                                                {validDate ? `${time} ngày ${day}` : 'Chưa có thời gian'} • {booking.guests} khách
                                            </Text>
                                        </View>
                                        {active && (
                                            <MaterialCommunityIcons name="check" size={22} color={Colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <ConfirmDialog
                visible={confirmCheckout}
                type="confirm"
                title={'Xác nhận tạo đơn'}
                message={`${totalItems} món với tổng giá trị ${totalAmount.toLocaleString()}đ. ${serviceMode === 'table'
                    ? `Phục vụ theo ${selectedBooking
                        ? formatBookingLabel(selectedBooking)
                        : 'lịch đặt bàn đã chọn'}.`
                    : 'Nhận món tại quầy.'}`}
                onCancel={() => setConfirmCheckout(false)}
                onConfirm={doCheckout}
                confirmText={'Tạo đơn'}
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
