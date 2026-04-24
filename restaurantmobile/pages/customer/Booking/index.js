import { useCallback, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    FlatList,
    RefreshControl,
} from 'react-native';
import { TextInput, Button, ActivityIndicator, IconButton, Chip, SegmentedButtons } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FadeInDown, FadeInUp, FadeIn } from '@utils/animations';
import { useFocusEffect } from '@react-navigation/native';
import { ConfirmDialog, Toast } from '@components/CustomDialog';
import authFetch, { clearSession, getApiErrorMessage } from '@utils/api';
import { endpoints } from '@configs';
import Colors from '@styles/colors';
import styles from './styles';

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
    pending: 'Ch\u1edd x\u00e1c nh\u1eadn',
    confirmed: '\u0110\u00e3 x\u00e1c nh\u1eadn',
    cancelled: '\u0110\u00e3 h\u1ee7y',
    completed: 'Ho\u00e0n th\u00e0nh',
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
                throw new Error(await getApiErrorMessage(res, 'Kh\u00f4ng th\u1ec3 t\u1ea3i l\u1ecbch \u0111\u1eb7t b\u00e0n'));
            }
            const data = await res.json();
            setBookings(data.results || []);
        } catch (err) {
            setBookings([]);
            showToast(err.message || 'Kh\u00f4ng th\u1ec3 t\u1ea3i l\u1ecbch \u0111\u1eb7t b\u00e0n');
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
            showToast('S\u1ed1 kh\u00e1ch ph\u1ea3i l\u1edbn h\u01a1n 0');
            return;
        }
        if (date <= new Date()) {
            showToast('Vui l\u00f2ng ch\u1ecdn th\u1eddi gian trong t\u01b0\u01a1ng lai');
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
                showToast(await getApiErrorMessage(res, 'Kh\u00f4ng th\u1ec3 \u0111\u1eb7t b\u00e0n'));
                return;
            }

            setGuests(2);
            setNote('');
            setDate(createInitialDate());
            setSuccessDialog(true);
            loadBookings(false);
        } catch (err) {
            showToast('Kh\u00f4ng th\u1ec3 k\u1ebft n\u1ed1i server');
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
                showToast(await getApiErrorMessage(res, 'Kh\u00f4ng th\u1ec3 h\u1ee7y l\u1ecbch \u0111\u1eb7t b\u00e0n'));
                return;
            }

            setBookings((prev) => prev.map((booking) => booking.id === cancelBookingId
                ? { ...booking, status: 'cancelled' }
                : booking));
            showToast('\u0110\u00e3 h\u1ee7y l\u1ecbch \u0111\u1eb7t b\u00e0n', 'success');
        } catch (err) {
            showToast('Kh\u00f4ng th\u1ec3 h\u1ee7y l\u1ecbch \u0111\u1eb7t b\u00e0n');
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
                                <Text style={styles.bookingInfoText}>{item.guests} {`kh\u00e1ch`}</Text>
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
                        {`H\u1ee7y l\u1ecbch n\u00e0y`}
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
                        { value: 'new', label: '\u0110\u1eb7t b\u00e0n m\u1edbi', icon: 'calendar-plus' },
                        { value: 'history', label: 'L\u1ecbch s\u1eed', icon: 'history' },
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
                                <Text style={styles.summaryTitle}>{`Khung gi\u1edd b\u1ea1n \u0111ang ch\u1ecdn`}</Text>
                                <Text style={styles.summaryValue}>{fmt(date)} · {fmtTime(date)}</Text>
                                <Text style={styles.summaryHint}>{`B\u1ea1n c\u00f3 th\u1ec3 \u0111\u1ed5i ng\u00e0y, gi\u1edd v\u00e0 s\u1ed1 l\u01b0\u1ee3ng kh\u00e1ch ngay b\u00ean d\u01b0\u1edbi.`}</Text>
                            </FadeInDown>

                            <FadeInUp delay={200} duration={400}>
                                <Text style={styles.label}>{`NG\u00c0Y`}</Text>
                                <TouchableOpacity style={styles.pickerBtn} onPress={() => setMode('date')} activeOpacity={0.8}>
                                    <MaterialCommunityIcons name="calendar" size={22} color={Colors.primary} />
                                    <Text style={styles.pickerText}>{fmt(date)}</Text>
                                    <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.textSecondary} style={{ marginLeft: 'auto' }} />
                                </TouchableOpacity>

                                <Text style={styles.label}>{`GI\u1ede`}</Text>
                                <TouchableOpacity style={styles.pickerBtn} onPress={() => setMode('time')} activeOpacity={0.8}>
                                    <MaterialCommunityIcons name="clock-outline" size={22} color={Colors.primary} />
                                    <Text style={styles.pickerText}>{fmtTime(date)}</Text>
                                    <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.textSecondary} style={{ marginLeft: 'auto' }} />
                                </TouchableOpacity>

                                <Text style={styles.suggestedLabel}>{`Gi\u1edd g\u1ee3i \u00fd`}</Text>
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

                                <Text style={styles.label}>{`S\u1ed0 KH\u00c1CH`}</Text>
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

                                <Text style={styles.label}>{`GHI CH\u00da`}</Text>
                                <TextInput
                                    mode="outlined"
                                    placeholder="Y\u00eau c\u1ea7u \u0111\u1eb7c bi\u1ec7t, d\u1ecb \u1ee9ng, gh\u1ebf tr\u1ebb em..."
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
                                        {`X\u00e1c nh\u1eadn \u0111\u1eb7t b\u00e0n`}
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
                                <Text style={styles.historyTitle}>{`L\u1ecbch s\u1eed \u0111\u1eb7t b\u00e0n`}</Text>
                                <Text style={styles.historySubtitle}>{`Theo d\u00f5i tr\u1ea1ng th\u00e1i x\u00e1c nh\u1eadn v\u00e0 h\u1ee7y l\u1ecbch khi c\u00f2n \u0111ang ch\u1edd.`}</Text>
                            </FadeIn>
                        }
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <View style={styles.emptyIconWrap}>
                                    <MaterialCommunityIcons name="calendar-blank" size={36} color={Colors.primary} />
                                </View>
                                <Text style={styles.emptyTitle}>{`Ch\u01b0a c\u00f3 l\u1ecbch \u0111\u1eb7t b\u00e0n`}</Text>
                                <Text style={styles.emptyText}>{`Khi b\u1ea1n t\u1ea1o l\u1ecbch m\u1edbi, th\u00f4ng tin s\u1ebd hi\u1ec3n th\u1ecb t\u1ea1i \u0111\u00e2y.`}</Text>
                            </View>
                        }
                    />
            )}

            <ConfirmDialog
                visible={confirm}
                type="confirm"
                title="X\u00e1c nh\u1eadn \u0111\u1eb7t b\u00e0n"
                message={`${guests} kh\u00e1ch v\u00e0o ${fmt(date)} l\u00fac ${fmtTime(date)}`}
                onCancel={() => setConfirm(false)}
                onConfirm={doBook}
                confirmText="\u0110\u1eb7t b\u00e0n"
            />

            <ConfirmDialog
                visible={Boolean(cancelBookingId)}
                type="warning"
                title="H\u1ee7y l\u1ecbch \u0111\u1eb7t b\u00e0n"
                message="B\u1ea1n ch\u1eafc ch\u1eafn mu\u1ed1n h\u1ee7y l\u1ecbch \u0111\u1eb7t b\u00e0n n\u00e0y?"
                onCancel={() => setCancelBookingId(null)}
                onConfirm={cancelBooking}
                confirmText="H\u1ee7y l\u1ecbch"
            />

            <ConfirmDialog
                visible={successDialog}
                type="success"
                title="\u0110\u1eb7t b\u00e0n th\u00e0nh c\u00f4ng"
                message="Nh\u00e0 h\u00e0ng s\u1ebd x\u00e1c nh\u1eadn l\u1ecbch \u0111\u1eb7t b\u00e0n c\u1ee7a b\u1ea1n trong th\u1eddi gian s\u1edbm nh\u1ea5t."
                confirmText="Xem l\u1ecbch s\u1eed"
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
