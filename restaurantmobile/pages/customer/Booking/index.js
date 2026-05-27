import { useCallback, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    FlatList,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { TextInput, Button, ActivityIndicator } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FadeIn, FadeInUp } from '@utils/animations';
import { useFocusEffect } from '@react-navigation/native';
import { ConfirmDialog, Toast } from '@components/CustomDialog';
import { authFetch, endpoints, clearSession, getApiErrorMessage } from '@configs';
import Colors from '@styles/colors';
import styles from './styles';

const createInitialDate = () => {
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    return nextHour;
};

const statusConfig = {
    pending: { label: 'Chờ xác nhận', color: Colors.star },
    confirmed: { label: 'Đã xác nhận', color: Colors.success },
    cancelled: { label: 'Đã hủy', color: Colors.primary },
    completed: { label: 'Hoàn thành', color: Colors.tertiary },
};

const suggestedTimes = ['11:30', '12:00', '12:30', '18:00', '18:30', '19:00', '19:30', '20:00'];
const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed'];
const MAX_ACTIVE_BOOKINGS = 3;
const MAX_GUESTS_PER_BOOKING = 50;
const DUPLICATE_BOOKING_WINDOW_MS = 2 * 60 * 60 * 1000;

const parseBookingDate = (booking) => {
    const value = new Date(booking?.booking_date);
    return Number.isNaN(value.getTime()) ? null : value;
};

const isFutureActiveBooking = (booking) => {
    const bookedAt = parseBookingDate(booking);
    return Boolean(
        bookedAt
        && bookedAt > new Date()
        && ACTIVE_BOOKING_STATUSES.includes(booking.status),
    );
};

const formatBookingSlot = (booking) => {
    const bookedAt = parseBookingDate(booking);
    if (!bookedAt) return 'lịch hiện có';
    const time = bookedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const day = bookedAt.toLocaleDateString('vi-VN');
    return `${time} ngày ${day}`;
};

const Booking = ({ navigation, route }) => {
    const tabBarHeight = useBottomTabBarHeight();
    const [tab, setTab] = useState(route.params?.initialTab || 'new');
    const [date, setDate] = useState(createInitialDate());
    const [mode, setMode] = useState(null);
    const [guests, setGuests] = useState(2);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });
    const [confirm, setConfirm] = useState(false);
    const [successDialog, setSuccessDialog] = useState(false);
    const [cancelBookingId, setCancelBookingId] = useState(null);

    const showToast = (msg, type = 'error') => setToast({ visible: true, message: msg, type });

    const loadBookings = async (showLoading = true) => {
        if (showLoading) setLoadingList(true);
        else setRefreshing(true);

        try {
            const res = await authFetch(endpoints['bookings']);
            if (res.status === 401) {
                await clearSession();
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                return;
            }
            if (!res.ok) {
                throw new Error(getApiErrorMessage(res, 'Không thể tải lịch đặt bàn'));
            }
            const data = res.data;
            setBookings(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            setBookings([]);
            showToast(err.message || 'Không thể tải lịch đặt bàn');
        } finally {
            setLoadingList(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => {
        loadBookings(true);


        if (route.params?.initialTab) {
            setTab(route.params.initialTab);
            navigation.setParams({ initialTab: undefined });
        }
    }, [route.params?.initialTab]));

    const onChange = (event, selected) => {
        if (event.type === 'dismissed') {
            setMode(null);
            return;
        }
        if (selected) {
            const updated = new Date(date);
            if (mode === 'date') {
                updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
            } else {
                updated.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
            }
            setDate(updated);
        }
        setMode(null);
    };

    const fmt = (value) => `${value.getDate().toString().padStart(2, '0')}/${(value.getMonth() + 1).toString().padStart(2, '0')}/${value.getFullYear()}`;
    const fmtTime = (value) => `${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}`;

    const selectSuggestedTime = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const updated = new Date(date);
        updated.setHours(hours, minutes, 0, 0);
        setDate(updated);
    };

    const activeBookings = bookings.filter(isFutureActiveBooking);
    const activeBookingCount = activeBookings.length;
    const nearbyBooking = activeBookings.find((booking) => {
        const bookedAt = parseBookingDate(booking);
        return bookedAt && Math.abs(bookedAt.getTime() - date.getTime()) <= DUPLICATE_BOOKING_WINDOW_MS;
    });
    const activeLimitReached = activeBookingCount >= MAX_ACTIVE_BOOKINGS;
    const bookingGuard = activeLimitReached
        ? {
            icon: 'calendar-alert',
            title: 'Đã đủ lịch đặt bàn',
            message: `Bạn đang có ${MAX_ACTIVE_BOOKINGS} lịch đang hoạt động. Vui lòng hủy hoặc chờ hoàn tất một lịch trước khi tạo thêm.`,
        }
        : nearbyBooking
            ? {
                icon: 'clock-alert-outline',
                title: 'Khung giờ quá gần lịch cũ',
                message: `Bạn đã có lịch vào ${formatBookingSlot(nearbyBooking)}. Vui lòng chọn giờ khác.`,
            }
            : null;

    const book = () => {
        if (loading || loadingList) {
            showToast('Đang kiểm tra lịch đặt bàn, vui lòng thử lại sau giây lát.');
            return;
        }
        if (guests < 1) {
            showToast('Số khách phải lớn hơn 0');
            return;
        }
        if (guests > MAX_GUESTS_PER_BOOKING) {
            showToast(`Mỗi lịch đặt bàn tối đa ${MAX_GUESTS_PER_BOOKING} khách`);
            return;
        }
        if (date <= new Date()) {
            showToast('Vui lòng chọn thời gian trong tương lai');
            return;
        }
        if (activeLimitReached) {
            showToast('Bạn đã đạt giới hạn lịch đặt bàn đang hoạt động.');
            return;
        }
        if (nearbyBooking) {
            showToast('Bạn đã có lịch đặt bàn gần thời điểm này.');
            return;
        }
        setConfirm(true);
    };

    const doBook = async () => {
        setConfirm(false);
        setLoading(true);
        try {
            const res = await authFetch(endpoints['bookings'], {
                method: 'POST',
                body: JSON.stringify({
                    booking_date: date.toISOString(),
                    guests,
                    note,
                }),
            });

            if (res.status === 401) {
                await clearSession();
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                return;
            }

            if (!res.ok) {
                const message = res.status === 429
                    ? 'Bạn thao tác đặt bàn quá nhanh. Vui lòng thử lại sau.'
                    : getApiErrorMessage(res, 'Không thể đặt bàn');
                showToast(message);
                return;
            }

            setGuests(2);
            setNote('');
            setDate(createInitialDate());
            setSuccessDialog(true);
            loadBookings(false);
        } catch (err) {
            showToast('Không thể kết nối server');
        } finally {
            setLoading(false);
        }
    };

    const cancelBooking = async () => {
        if (!cancelBookingId) return;
        setLoading(true);
        try {
            const res = await authFetch(`${endpoints['bookings']}${cancelBookingId}/`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'cancelled' }),
            });

            if (res.status === 401) {
                await clearSession();
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                return;
            }

            if (!res.ok) {
                showToast(getApiErrorMessage(res, 'Không thể hủy lịch đặt bàn'));
                return;
            }

            setBookings((prev) => prev.map((booking) => booking.id === cancelBookingId
                ? { ...booking, status: 'cancelled' }
                : booking));
            showToast('Đã hủy lịch đặt bàn', 'success');
        } catch (err) {
            showToast('Không thể hủy lịch đặt bàn');
        } finally {
            setCancelBookingId(null);
            setLoading(false);
        }
    };

    const renderBooking = ({ item, index }) => {
        const conf = statusConfig[item.status] || { label: item.status, color: Colors.textSecondary };
        return (
            <FadeInUp delay={index * 60} duration={400}>
                <View style={[styles.bookingCard, item.status === 'cancelled' && { opacity: 0.6 }]}>
                    <View style={styles.cardTopRow}>
                        <View style={[styles.statusBadge, { backgroundColor: conf.color + '18' }]}>
                            <View style={[styles.statusDot, { backgroundColor: conf.color }]} />
                            <Text style={[styles.statusText, { color: conf.color }]}>{conf.label}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.cardTime}>
                                {new Date(item.booking_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            <Text style={styles.cardDate}>
                                {new Date(item.booking_date).toLocaleDateString('vi-VN')}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.guestPill}>
                        <MaterialCommunityIcons name="account-group-outline" size={15} color={Colors.textSecondary} />
                        <Text style={styles.guestPillText}>{item.guests} khách</Text>
                    </View>

                    {item.note ?
                        <View style={styles.noteBlock}>
                            <MaterialCommunityIcons name="note-text-outline" size={15} color={Colors.textSecondary} style={{ marginTop: 2 }} />
                            <Text style={styles.bookingNote}>{item.note}</Text>
                        </View> : null
                    }

                    {item.status === 'pending' ?
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            activeOpacity={0.7}
                            onPress={() => setCancelBookingId(item.id)}>
                            <MaterialCommunityIcons name="close-circle-outline" size={16} color={Colors.primary} />
                            <Text style={styles.cancelBtnText}>Hủy lịch này</Text>
                        </TouchableOpacity> :
                        null
                    }
                </View>
            </FadeInUp>
        );
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: Colors.surface }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>


            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tabBtn, tab === 'new' && styles.tabBtnActive]}
                    activeOpacity={0.7}
                    onPress={() => setTab('new')}>
                    <MaterialCommunityIcons
                        name="calendar-plus"
                        size={18}
                        color={tab === 'new' ? Colors.primary : Colors.textSecondary}
                    />
                    <Text style={[styles.tabText, tab === 'new' && styles.tabTextActive]}>Tạo mới</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabBtn, tab === 'history' && styles.tabBtnActive]}
                    activeOpacity={0.7}
                    onPress={() => setTab('history')}>
                    <MaterialCommunityIcons
                        name="history"
                        size={18}
                        color={tab === 'history' ? Colors.primary : Colors.textSecondary}
                    />
                    <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>Lịch sử</Text>
                </TouchableOpacity>
            </View>

            {tab === 'new' ? (
                <>
                    <ScrollView
                        contentContainerStyle={[styles.formContent, { paddingBottom: tabBarHeight + 110 }]}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}>

                        <FadeIn duration={300}>
                            <View style={[
                                styles.bookingRuleBox,
                                bookingGuard && styles.bookingRuleBoxBlocked,
                            ]}>
                                <View style={[
                                    styles.bookingRuleIcon,
                                    bookingGuard && styles.bookingRuleIconBlocked,
                                ]}>
                                    <MaterialCommunityIcons
                                        name={bookingGuard?.icon || 'calendar-check-outline'}
                                        size={20}
                                        color={bookingGuard ? Colors.primary : Colors.success}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.bookingRuleTitle}>
                                        {bookingGuard?.title || `${activeBookingCount}/${MAX_ACTIVE_BOOKINGS} lịch đang hoạt động`}
                                    </Text>
                                    <Text style={styles.bookingRuleText}>
                                        {loadingList
                                            ? 'Đang kiểm tra lịch đặt bàn của bạn.'
                                            : bookingGuard?.message || 'Bạn có thể tạo thêm lịch cho khung giờ phù hợp.'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.dateTimeRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.fieldLabel}>NGÀY</Text>
                                    <TouchableOpacity
                                        style={styles.pickerInput}
                                        activeOpacity={0.8}
                                        onPress={() => setMode('date')}>
                                        <MaterialCommunityIcons name="calendar" size={20} color={Colors.primary} />
                                        <Text style={styles.pickerInputText}>{fmt(date)}</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.fieldLabel}>GIỜ</Text>
                                    <TouchableOpacity
                                        style={styles.pickerInput}
                                        activeOpacity={0.8}
                                        onPress={() => setMode('time')}>
                                        <MaterialCommunityIcons name="clock-outline" size={20} color={Colors.primary} />
                                        <Text style={styles.pickerInputText}>{fmtTime(date)}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>


                            <Text style={[styles.fieldLabel, { marginTop: 22 }]}>KHUNG GIỜ GỢI Ý</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.suggestedScroll}>
                                {suggestedTimes.map((time) => {
                                    const active = fmtTime(date) === time;
                                    return (
                                        <TouchableOpacity
                                            key={time}
                                            activeOpacity={0.7}
                                            onPress={() => selectSuggestedTime(time)}
                                            style={[styles.suggestedChip, active && styles.suggestedChipActive]}>
                                            <Text style={[styles.suggestedText, active && styles.suggestedTextActive]}>
                                                {time}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            {mode &&
                                <DateTimePicker
                                    value={date}
                                    mode={mode}
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    minimumDate={mode === 'date' ? new Date() : undefined}
                                    onChange={onChange}
                                />
                            }


                            <Text style={[styles.fieldLabel, { marginTop: 22 }]}>SỐ LƯỢNG KHÁCH</Text>
                            <View style={styles.stepperPill}>
                                <TouchableOpacity
                                    style={styles.stepBtnMinus}
                                    activeOpacity={0.7}
                                    onPress={() => setGuests((prev) => Math.max(1, prev - 1))}>
                                    <MaterialCommunityIcons name="minus" size={20} color={Colors.text} />
                                </TouchableOpacity>
                                <Text style={styles.guestCount}>{guests}</Text>
                                <TouchableOpacity
                                    style={styles.stepBtnPlus}
                                    activeOpacity={0.7}
                                    onPress={() => setGuests((prev) => Math.min(MAX_GUESTS_PER_BOOKING, prev + 1))}>
                                    <MaterialCommunityIcons name="plus" size={20} color={Colors.primary} />
                                </TouchableOpacity>
                            </View>


                            <Text style={[styles.fieldLabel, { marginTop: 22 }]}>GHI CHÚ THÊM</Text>
                            <TextInput
                                mode="outlined"
                                placeholder={'Yêu cầu đặc biệt, dị ứng, ghế trẻ em...'}
                                placeholderTextColor={Colors.placeholder}
                                value={note}
                                onChangeText={setNote}
                                multiline
                                textAlignVertical="top"
                                left={<TextInput.Icon icon="note-text-outline" />}
                                outlineStyle={{ borderRadius: 16, borderColor: Colors.outline, borderWidth: 1.5 }}
                                style={{ backgroundColor: Colors.surfaceContainerLowest, height: 100 }}
                                activeOutlineColor={Colors.primary}
                                textColor={Colors.text}
                            />

                            <View style={styles.warningBox}>
                                <MaterialCommunityIcons name="bell-ring-outline" size={24} color="#D97706" />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.warningTitle}>Lưu ý quan trọng</Text>
                                    <Text style={styles.warningText}>
                                        Nhà hàng chỉ hỗ trợ giữ bàn tối đa 10 phút so với giờ hẹn. Quý khách vui lòng đến đúng giờ nhé!
                                    </Text>
                                </View>
                            </View>
                        </FadeIn>
                    </ScrollView>


                    <View style={[styles.bottomBar, { paddingBottom: tabBarHeight + 16 }]}>
                        <Button
                            mode="contained"
                            icon="chevron-right"
                            onPress={book}
                            disabled={loading || loadingList || Boolean(bookingGuard)}
                            loading={loading}
                            buttonColor={Colors.primary}
                            textColor={Colors.onPrimary}
                            contentStyle={{ paddingVertical: 8, flexDirection: 'row-reverse' }}
                            style={styles.confirmBtn}
                            labelStyle={{ fontWeight: '800', fontSize: 16 }}>
                            Xác nhận đặt bàn
                        </Button>
                    </View>
                </>
            ) : (
                loadingList ?
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} /> :
                    <FlatList
                        data={bookings}
                        renderItem={renderBooking}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ paddingTop: 8, paddingBottom: tabBarHeight + 24 }}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => loadBookings(false)}
                                tintColor={Colors.primary}
                                colors={[Colors.primary]}
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <View style={styles.emptyIconWrap}>
                                    <MaterialCommunityIcons name="calendar-blank" size={32} color={Colors.textSecondary} />
                                </View>
                                <Text style={styles.emptyText}>Chưa có lịch đặt bàn nào.</Text>
                            </View>
                        }
                    />
            )}

            <ConfirmDialog
                visible={confirm}
                type="confirm"
                title={'Xác nhận đặt bàn'}
                message={`${guests} khách vào ${fmt(date)} lúc ${fmtTime(date)}`}
                onCancel={() => setConfirm(false)}
                onConfirm={doBook}
                confirmText={'Đặt bàn'}
            />

            <ConfirmDialog
                visible={Boolean(cancelBookingId)}
                type="warning"
                title={'Hủy lịch đặt bàn'}
                message={'Bạn chắc chắn muốn hủy lịch đặt bàn này?'}
                onCancel={() => setCancelBookingId(null)}
                onConfirm={cancelBooking}
                confirmText={'Hủy lịch'}
            />

            <ConfirmDialog
                visible={successDialog}
                type="success"
                title={'Đặt bàn thành công'}
                message={'Nhà hàng đã nhận được yêu cầu. Quý khách vui lòng đến đúng giờ hoặc trễ nhất 10 phút để nhà hàng giữ bàn.'}
                confirmText={'Xem lịch sử'}
                onConfirm={() => {
                    setSuccessDialog(false);
                    setTab('history');
                }}
            />

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
            />
        </KeyboardAvoidingView>
    );
};

export default Booking;
