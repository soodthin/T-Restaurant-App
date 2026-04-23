import { useCallback, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    FlatList,
    RefreshControl,
} from 'react-native';
import { TextInput, Button, ActivityIndicator, IconButton, Chip, SegmentedButtons } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FadeInDown, FadeInUp, FadeIn } from '../utils/animations';
import { useFocusEffect } from '@react-navigation/native';
import { ConfirmDialog, Toast } from './CustomDialog';
import authFetch, { clearSession, getApiErrorMessage } from '../utils/api';
import { endpoints } from '../configs';
import Colors from '../styles/colors';
import { editorialShadow } from '../styles/theme';

const createInitialDate = () => {
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    return nextHour;
};

const statusColor = {
    pending: Colors.star,
    confirmed: Colors.success,
    cancelled: Colors.primary,
    completed: Colors.tertiary,
};

const statusLabel = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    cancelled: 'Đã hủy',
    completed: 'Hoàn thành',
};

const suggestedTimes = ['11:30', '12:00', '12:30', '18:00', '18:30', '19:00', '19:30', '20:00'];

const Booking = ({ navigation }) => {
    const tabBarHeight = useBottomTabBarHeight();
    const [tab, setTab] = useState('new');
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
                throw new Error(await getApiErrorMessage(res, 'Không thể tải lịch đặt bàn'));
            }
            const data = await res.json();
            setBookings(data.results || []);
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
    }, []));

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

    const book = () => {
        if (guests < 1) {
            showToast('Số khách phải lớn hơn 0');
            return;
        }
        if (date <= new Date()) {
            showToast('Vui lòng chọn thời gian trong tương lai');
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
                showToast(await getApiErrorMessage(res, 'Không thể đặt bàn'));
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
                showToast(await getApiErrorMessage(res, 'Không thể hủy lịch đặt bàn'));
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

    const renderBooking = ({ item, index }) => (
        <FadeInUp delay={index * 60} duration={400}>
            <View style={[styles.bookingCard, item.status === 'cancelled' && { opacity: 0.6 }]}>
                <View style={styles.bookingHeader}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                        <Text style={styles.bookingDate}>
                            {new Date(item.booking_date).toLocaleDateString('vi-VN')} · {new Date(item.booking_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <View style={styles.bookingInfoRow}>
                            <View style={styles.bookingInfoChip}>
                                <MaterialCommunityIcons name="account-group-outline" size={14} color={Colors.text} />
                                <Text style={styles.bookingInfoText}>{item.guests} khách</Text>
                            </View>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: (statusColor[item.status] || Colors.textSecondary) + '18' }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor[item.status] || Colors.textSecondary }]} />
                        <Text style={[styles.statusText, { color: statusColor[item.status] || Colors.textSecondary }]}>
                            {statusLabel[item.status] || item.status}
                        </Text>
                    </View>
                </View>

                {item.note ?
                    <View style={styles.noteBlock}>
                        <MaterialCommunityIcons name="note-text-outline" size={14} color={Colors.textSecondary} />
                        <Text style={styles.bookingNote}>{item.note}</Text>
                    </View> : null}

                {item.status === 'pending' ?
                    <Button
                        mode="contained-tonal"
                        onPress={() => setCancelBookingId(item.id)}
                        style={{ alignSelf: 'flex-start', marginTop: 14, borderRadius: 9999 }}
                        labelStyle={{ fontWeight: '700', fontSize: 13 }}
                    >
                        Hủy lịch này
                    </Button> :
                    null
                }
            </View>
        </FadeInUp>
    );

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: Colors.surface }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <FadeIn duration={300} style={styles.segmentedRow}>
                <SegmentedButtons
                    value={tab}
                    onValueChange={setTab}
                    buttons={[
                        { value: 'new', label: 'Đặt bàn mới', icon: 'calendar-plus' },
                        { value: 'history', label: 'Lịch sử', icon: 'history' },
                    ]}
                    style={{ flex: 1 }}
                />
            </FadeIn>

            {tab === 'new' ? (
                <FlatList
                    data={[]}
                    renderItem={null}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: tabBarHeight + 32 }}
                    ListHeaderComponent={
                        <View style={styles.form}>
                            <FadeInDown delay={100} duration={400} style={styles.summaryCard}>
                                <View style={styles.summaryIcon}>
                                    <MaterialCommunityIcons name="calendar-check" size={24} color={Colors.primary} />
                                </View>
                                <Text style={styles.summaryTitle}>Khung giờ bạn đang chọn</Text>
                                <Text style={styles.summaryValue}>{fmt(date)} · {fmtTime(date)}</Text>
                                <Text style={styles.summaryHint}>Bạn có thể đổi ngày, giờ và số lượng khách ngay bên dưới.</Text>
                            </FadeInDown>

                            <FadeInUp delay={200} duration={400}>
                                <Text style={styles.label}>NGÀY</Text>
                                <TouchableOpacity style={styles.pickerBtn} onPress={() => setMode('date')} activeOpacity={0.8}>
                                    <MaterialCommunityIcons name="calendar" size={22} color={Colors.primary} />
                                    <Text style={styles.pickerText}>{fmt(date)}</Text>
                                    <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.textSecondary} style={{ marginLeft: 'auto' }} />
                                </TouchableOpacity>

                                <Text style={styles.label}>GIỜ</Text>
                                <TouchableOpacity style={styles.pickerBtn} onPress={() => setMode('time')} activeOpacity={0.8}>
                                    <MaterialCommunityIcons name="clock-outline" size={22} color={Colors.primary} />
                                    <Text style={styles.pickerText}>{fmtTime(date)}</Text>
                                    <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.textSecondary} style={{ marginLeft: 'auto' }} />
                                </TouchableOpacity>

                                <Text style={styles.suggestedLabel}>Giờ gợi ý</Text>
                                <View style={styles.suggestedRow}>
                                    {suggestedTimes.map((time) => (
                                        <Chip
                                            key={time}
                                            selected={fmtTime(date) === time}
                                            mode="flat"
                                            onPress={() => selectSuggestedTime(time)}
                                            style={[
                                                styles.suggestedChip,
                                                fmtTime(date) === time && styles.suggestedChipActive,
                                            ]}
                                            textStyle={[
                                                styles.suggestedText,
                                                fmtTime(date) === time && styles.suggestedTextActive,
                                            ]}
                                            showSelectedOverlay
                                        >
                                            {time}
                                        </Chip>
                                    ))}
                                </View>

                                {mode &&
                                    <DateTimePicker
                                        value={date}
                                        mode={mode}
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        minimumDate={mode === 'date' ? new Date() : undefined}
                                        onChange={onChange}
                                    />
                                }

                                <Text style={styles.label}>SỐ KHÁCH</Text>
                                <View style={styles.guestStepper}>
                                    <IconButton
                                        icon="minus"
                                        size={20}
                                        iconColor={Colors.text}
                                        onPress={() => setGuests((prev) => Math.max(1, prev - 1))}
                                        style={styles.guestStepIconBtn}
                                    />
                                    <Text style={styles.guestCount}>{guests}</Text>
                                    <IconButton
                                        icon="plus"
                                        size={20}
                                        iconColor={Colors.text}
                                        onPress={() => setGuests((prev) => prev + 1)}
                                        style={styles.guestStepIconBtn}
                                    />
                                </View>

                                <Text style={styles.label}>GHI CHÚ</Text>
                                <TextInput
                                    mode="outlined"
                                    placeholder="Yêu cầu đặc biệt, dị ứng, ghế trẻ em..."
                                    placeholderTextColor={Colors.placeholder}
                                    value={note}
                                    onChangeText={setNote}
                                    multiline
                                    textAlignVertical="top"
                                    outlineStyle={{ borderRadius: 20, borderColor: Colors.outline, borderWidth: 1.5 }}
                                    style={{ backgroundColor: Colors.surfaceContainerLowest, height: 90, marginBottom: 18 }}
                                    activeOutlineColor={Colors.primary}
                                    textColor={Colors.text}
                                />

                                {loading ?
                                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 16 }} /> :
                                    <Button
                                        mode="contained"
                                        icon="chevron-right"
                                        onPress={book}
                                        buttonColor={Colors.primary}
                                        textColor={Colors.onPrimary}
                                        labelStyle={{ fontWeight: '800', fontSize: 17 }}
                                        style={{ borderRadius: 20, marginTop: 8 }}
                                        contentStyle={{ paddingVertical: 8, flexDirection: 'row-reverse' }}
                                    >
                                        Xác nhận đặt bàn
                                    </Button>
                                }
                            </FadeInUp>
                        </View>
                    }
                />
            ) : (
                loadingList ?
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} /> :
                    <FlatList
                        data={bookings}
                        renderItem={renderBooking}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ paddingTop: 12, paddingBottom: tabBarHeight + 24 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={() => loadBookings(false)} tintColor={Colors.primary} />
                        }
                        ListHeaderComponent={
                            <FadeIn duration={400} style={styles.historyHeader}>
                                <Text style={styles.historyTitle}>Lịch sử đặt bàn</Text>
                                <Text style={styles.historySubtitle}>Theo dõi trạng thái xác nhận và hủy lịch khi còn đang chờ.</Text>
                            </FadeIn>
                        }
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <View style={styles.emptyIconWrap}>
                                    <MaterialCommunityIcons name="calendar-blank" size={36} color={Colors.primary} />
                                </View>
                                <Text style={styles.emptyTitle}>Chưa có lịch đặt bàn</Text>
                                <Text style={styles.emptyText}>Khi bạn tạo lịch mới, thông tin sẽ hiển thị tại đây.</Text>
                            </View>
                        }
                    />
            )}

            <ConfirmDialog
                visible={confirm}
                type="confirm"
                title="Xác nhận đặt bàn"
                message={`${guests} khách vào ${fmt(date)} lúc ${fmtTime(date)}`}
                onCancel={() => setConfirm(false)}
                onConfirm={doBook}
                confirmText="Đặt bàn"
            />

            <ConfirmDialog
                visible={Boolean(cancelBookingId)}
                type="warning"
                title="Hủy lịch đặt bàn"
                message="Bạn chắc chắn muốn hủy lịch đặt bàn này?"
                onCancel={() => setCancelBookingId(null)}
                onConfirm={cancelBooking}
                confirmText="Hủy lịch"
            />

            <ConfirmDialog
                visible={successDialog}
                type="success"
                title="Đặt bàn thành công"
                message="Nhà hàng sẽ xác nhận lịch đặt bàn của bạn trong thời gian sớm nhất."
                confirmText="Xem lịch sử"
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

const styles = StyleSheet.create({
    segmentedRow: { paddingHorizontal: 16, paddingTop: 12 },
    form: { padding: 20 },
    summaryCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        ...editorialShadow,
    },
    summaryIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryTitle: { fontSize: 12, color: Colors.textSecondary, fontWeight: '700', letterSpacing: 1 },
    summaryValue: { fontSize: 24, fontWeight: '800', color: Colors.text, marginTop: 8 },
    summaryHint: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, lineHeight: 21 },
    label: { fontSize: 11, color: Colors.textSecondary, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
    pickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 20,
        padding: 16,
        marginBottom: 18,
        borderWidth: 1.5,
        borderColor: Colors.outline,
    },
    pickerText: { fontSize: 17, color: Colors.text, fontWeight: '700', marginLeft: 12 },
    suggestedLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
    suggestedRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 18 },
    suggestedChip: {
        marginRight: 8,
        marginBottom: 8,
    },
    suggestedChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
    suggestedText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
    suggestedTextActive: { color: Colors.primary, fontWeight: '700' },
    guestStepper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 20,
        paddingHorizontal: 6,
        paddingVertical: 6,
        marginBottom: 18,
        alignSelf: 'flex-start',
        borderWidth: 1.5,
        borderColor: Colors.outline,
    },
    guestStepIconBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: Colors.surfaceContainerLow,
        margin: 0,
    },
    guestCount: { minWidth: 50, textAlign: 'center', fontSize: 20, fontWeight: '800', color: Colors.text },
    historyHeader: { paddingHorizontal: 18, paddingBottom: 8 },
    historyTitle: { fontSize: 26, fontWeight: '800', color: Colors.text },
    historySubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, lineHeight: 21 },
    bookingCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 24,
        padding: 18,
        ...editorialShadow,
    },
    bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    bookingDate: { fontSize: 16, fontWeight: '800', color: Colors.text, lineHeight: 22 },
    bookingInfoRow: { flexDirection: 'row', marginTop: 8 },
    bookingInfoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLow,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 9999,
    },
    bookingInfoText: { fontSize: 13, color: Colors.text, fontWeight: '600', marginLeft: 4 },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 9999,
        marginLeft: 10,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusText: { fontSize: 12, fontWeight: '700' },
    noteBlock: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.surfaceContainerLow,
        padding: 12,
        borderRadius: 14,
        marginTop: 12,
    },
    bookingNote: { fontSize: 14, color: Colors.text, marginLeft: 8, flex: 1, lineHeight: 20, fontStyle: 'italic' },
    empty: { alignItems: 'center', marginTop: 40, paddingHorizontal: 32 },
    emptyIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 18 },
    emptyText: { fontSize: 14, color: Colors.textSecondary, marginTop: 10, lineHeight: 22, textAlign: 'center' },
});

export default Booking;
