import { useEffect, useRef, useState } from 'react';
import { AppState, Image, View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authFetch, endpoints } from '@configs';
import { ConfirmDialog, Toast } from '@components/CustomDialog';
import Colors from '@styles/colors';
import styles from './styles';

// Detect khi cong thanh toan redirect ve URL minh dat → biet user da xong thao tac,
// chuyen sang man hinh poll status. Cover ca MoMo va Stripe.
const isRedirectUrl = (url) =>
    url && (url.includes('/api/momo/redirect') || url.includes('/api/stripe/return'));

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_TRIES = 45;  // 45 tries × 2s = ~90s max, đủ cho Render cold start

const METHOD_TITLES = {
    momo: 'Thanh toán MoMo',
    stripe: 'Thanh toán Stripe',
};

const getRemainingSeconds = (expiresAt) => {
    if (!expiresAt) return null;
    const expiresAtMs = new Date(expiresAt).getTime();
    if (Number.isNaN(expiresAtMs)) return null;
    return Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));
};

const formatRemaining = (seconds) => {
    if (seconds === null) return '';
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

const MOMO_WEB_QR_USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const PaymentCheckout = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const { payUrl, paymentId, method, expiresAt, deeplinkUrl, qrCodeUrl } = route.params || {};
    const headerTitle = METHOD_TITLES[method] || 'Thanh toán';

    const [paid, setPaid] = useState(false);
    const [polling, setPolling] = useState(false);
    const [pollTimedOut, setPollTimedOut] = useState(false);
    const [externalBlocked, setExternalBlocked] = useState(null);
    const [remainingSeconds, setRemainingSeconds] = useState(getRemainingSeconds(expiresAt));
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });
    const triesRef = useRef(0);
    const externalOpenedRef = useRef(false);
    const paymentExpired = remainingSeconds !== null && remainingSeconds <= 0 && !paid;

    const showToast = (message, type = 'error') => setToast({ visible: true, message, type });

    const goToOrders = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'Main', params: { role: 'customer', initialScreen: 'Orders' } }],
        });
    };

    useEffect(() => {
        if (!expiresAt) return undefined;
        const tick = () => setRemainingSeconds(getRemainingSeconds(expiresAt));
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [expiresAt]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active' && externalOpenedRef.current) {
                externalOpenedRef.current = false;
                setPaid(true);
            }
        });
        return () => subscription.remove();
    }, []);

    const pollStatus = async () => {
        if (!paymentId) return;
        triesRef.current += 1;

        try {
            const res = await authFetch(endpoints['payment-detail'](paymentId));
            if (res.ok) {
                const status = res.data?.status;
                if (status === 'completed') {
                    setPolling(false);
                    showToast('Thanh toán thành công!', 'success');
                    setTimeout(goToOrders, 1200);
                    return;
                }
                if (status === 'failed') {
                    setPolling(false);
                    showToast('Thanh toán thất bại. Vui lòng thử lại.', 'error');
                    setTimeout(goToOrders, 1500);
                    return;
                }
            }
        } catch (_) {
            // Network error — tiep tuc poll
        }

        if (triesRef.current >= POLL_MAX_TRIES) {
            setPolling(false);
            setPollTimedOut(true);
            return;
        }

        setTimeout(pollStatus, POLL_INTERVAL_MS);
    };

    useEffect(() => {
        if (paid && !polling && !pollTimedOut) {
            setPolling(true);
            setPollTimedOut(false);
            triesRef.current = 0;
            pollStatus();
        }
    }, [paid]);

    useEffect(() => {
        if (paymentExpired) {
            setPolling(false);
        }
    }, [paymentExpired]);

    const onNavigationStateChange = (navState) => {
        if (isRedirectUrl(navState.url) && !paid) {
            setPaid(true);
        }
    };

    const handlePaymentNavigation = (request) => {
        const url = request.url || '';
        if (url === 'about:blank') return true;
        const isHttp = url.startsWith('http://') || url.startsWith('https://');
        const isStorePage = url.includes('apps.apple.com') || url.includes('play.google.com');

        if (isStorePage) {
            setExternalBlocked({ url, type: 'store' });
            showToast('MoMo đang cố mở ứng dụng. Màn hình này ưu tiên thanh toán bằng QR.', 'error');
            return false;
        }

        if (!isHttp) {
            if (method === 'momo') {
                setExternalBlocked({ url, type: 'deeplink' });
                showToast('Đã chặn mở ứng dụng MoMo để giữ luồng quét QR trên web.', 'error');
                return false;
            }
            Linking.canOpenURL(url).then((supported) => {
                if (supported) {
                    externalOpenedRef.current = true;
                    Linking.openURL(url);
                    return;
                }
                setExternalBlocked({ url, type: 'deeplink' });
                showToast('Không mở được ứng dụng thanh toán trên thiết bị này.', 'error');
            }).catch(() => {
                setExternalBlocked({ url, type: 'deeplink' });
                showToast('Không mở được ứng dụng thanh toán trên thiết bị này.', 'error');
            });
            return false;
        }

        return true;
    };

    const openExternalUrl = async (url) => {
        if (!url) return;
        try {
            externalOpenedRef.current = true;
            await Linking.openURL(url);
        } catch (_) {
            showToast('Không mở được liên kết thanh toán.', 'error');
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerBtn}
                    activeOpacity={0.7}
                    onPress={() => setConfirmCancel(true)}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{headerTitle}</Text>
                <TouchableOpacity
                    style={styles.headerBtn}
                    activeOpacity={0.7}
                    onPress={() => setConfirmCancel(true)}>
                    <Text style={styles.cancelText}>Hủy</Text>
                </TouchableOpacity>
            </View>

            {remainingSeconds !== null && !paymentExpired &&
                <View style={styles.countdownBar}>
                    <MaterialCommunityIcons name="timer-outline" size={16} color={Colors.primary} />
                    <Text style={styles.countdownText}>
                        Phiên thanh toán còn {formatRemaining(remainingSeconds)}
                    </Text>
                </View>
            }

            {payUrl ?
                <WebView
                    source={{ uri: payUrl }}
                    onNavigationStateChange={onNavigationStateChange}
                    onShouldStartLoadWithRequest={handlePaymentNavigation}
                    userAgent={method === 'momo' ? MOMO_WEB_QR_USER_AGENT : undefined}
                    startInLoadingState
                    renderLoading={() => (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    )}
                /> :
                <View style={styles.loadingOverlay}>
                    <Text style={{ color: Colors.text }}>Không có URL thanh toán.</Text>
                </View>
            }

            {externalBlocked && !paid && !paymentExpired &&
                <View style={styles.gatewayHelpPanel}>
                    <TouchableOpacity
                        style={styles.gatewayHelpClose}
                        activeOpacity={0.7}
                        onPress={() => setExternalBlocked(null)}>
                        <MaterialCommunityIcons name="close" size={18} color={Colors.textSecondary} />
                    </TouchableOpacity>
                    <MaterialCommunityIcons name="cellphone-link" size={34} color={Colors.primary} />
                    <Text style={styles.gatewayHelpTitle}>Không mở được ứng dụng thanh toán</Text>
                    <Text style={styles.gatewayHelpText}>
                        Luồng MoMo đang chạy bằng trang web QR giống FlexiConnect. Nếu QR chưa hiện, bấm Mở trình duyệt để tải lại trang thanh toán.
                    </Text>
                    {qrCodeUrl ?
                        <Image source={{ uri: qrCodeUrl }} style={styles.qrImage} /> :
                        null
                    }
                    <View style={styles.gatewayHelpActions}>
                        {deeplinkUrl ?
                            <TouchableOpacity
                                style={styles.secondaryAction}
                                activeOpacity={0.7}
                                onPress={() => openExternalUrl(deeplinkUrl)}>
                                <Text style={styles.secondaryActionText}>Mở MoMo</Text>
                            </TouchableOpacity> :
                            null
                        }
                        <TouchableOpacity
                            style={styles.primaryAction}
                            activeOpacity={0.7}
                            onPress={() => openExternalUrl(payUrl)}>
                            <Text style={styles.primaryActionText}>Mở trình duyệt</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            }

            {paymentExpired && !paid &&
                <View style={styles.confirmingOverlay}>
                    <MaterialCommunityIcons name="timer-off-outline" size={48} color={Colors.primary} />
                    <Text style={styles.confirmingText}>Phiên thanh toán đã hết hạn</Text>
                    <Text style={[styles.confirmingSub, { textAlign: 'center', marginHorizontal: 24 }]}>
                        Quay lại Đơn hàng để thanh toán lại hoặc đổi phương thức.
                    </Text>
                    <TouchableOpacity
                        style={[styles.primaryAction, { marginTop: 20 }]}
                        activeOpacity={0.7}
                        onPress={goToOrders}>
                        <Text style={styles.primaryActionText}>Xem đơn hàng</Text>
                    </TouchableOpacity>
                </View>
            }

            {!paymentExpired && (paid || pollTimedOut) &&
                <View style={styles.confirmingOverlay}>
                    {polling && !pollTimedOut && <>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.confirmingText}>Đang xác nhận thanh toán...</Text>
                        <Text style={styles.confirmingSub}>Vui lòng chờ trong giây lát</Text>
                    </>}
                    {pollTimedOut && <>
                        <MaterialCommunityIcons name="clock-alert-outline" size={48} color={Colors.star} />
                        <Text style={styles.confirmingText}>Chưa nhận được xác nhận</Text>
                        <Text style={[styles.confirmingSub, { textAlign: 'center', marginHorizontal: 24 }]}>
                            Hệ thống đang xử lý. Bạn có thể thử kiểm tra lại hoặc xem trong mục Đơn hàng.
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                            <TouchableOpacity
                                style={[styles.headerBtn, { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }]}
                                activeOpacity={0.7}
                                onPress={() => {
                                    setPollTimedOut(false);
                                    setPolling(true);
                                    triesRef.current = 0;
                                    pollStatus();
                                }}>
                                <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 14 }}>Thử lại</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.headerBtn, { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }]}
                                activeOpacity={0.7}
                                onPress={goToOrders}>
                                <Text style={{ color: Colors.onPrimary, fontWeight: '700', fontSize: 14 }}>Xem đơn hàng</Text>
                            </TouchableOpacity>
                        </View>
                    </>}
                </View>
            }

            <ConfirmDialog
                visible={confirmCancel}
                type="warning"
                title="Hủy thanh toán?"
                message="Đơn hàng của bạn vẫn được tạo. Nếu đã thanh toán xong, vui lòng kiểm tra lại trong mục Đơn hàng."
                confirmText="Hủy thanh toán"
                cancelText="Tiếp tục"
                onCancel={() => setConfirmCancel(false)}
                onConfirm={async () => {
                    setConfirmCancel(false);
                    // Bao BE mark failed luon (thay vi cho 30 phut Stripe expired hoac
                    // never voi MoMo). BE idempotent: 400 neu da thanh toan xong → bo qua.
                    if (paymentId) {
                        try {
                            await authFetch(endpoints['payment-cancel'](paymentId), { method: 'POST' });
                        } catch (_) {
                            // Network error — ke ca khong call duoc thi user van quay lai duoc
                        }
                    }
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

export default PaymentCheckout;
