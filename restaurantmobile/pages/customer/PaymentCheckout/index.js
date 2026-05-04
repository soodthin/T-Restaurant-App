import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
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

const POLL_INTERVAL = 2000;
const POLL_MAX_TRIES = 8;

const METHOD_TITLES = {
    momo: 'Thanh toán MoMo',
    stripe: 'Thanh toán Stripe',
};

const PaymentCheckout = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const { payUrl, paymentId, method } = route.params || {};
    const headerTitle = METHOD_TITLES[method] || 'Thanh toán';

    const [paid, setPaid] = useState(false);
    const [polling, setPolling] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });
    const triesRef = useRef(0);

    const showToast = (message, type = 'error') => setToast({ visible: true, message, type });

    const goToOrders = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'Main', params: { role: 'customer' } }],
        });
        // Sau khi reset, navigate sang tab Orders.
        setTimeout(() => navigation.navigate('Main', { screen: 'Orders' }), 100);
    };

    const pollStatus = async () => {
        if (!paymentId) return;
        triesRef.current += 1;

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
                setTimeout(() => navigation.goBack(), 1500);
                return;
            }
        }

        if (triesRef.current >= POLL_MAX_TRIES) {
            setPolling(false);
            showToast('Chưa nhận được xác nhận. Bạn có thể kiểm tra trong Đơn hàng.', 'info');
            setTimeout(goToOrders, 1500);
            return;
        }

        setTimeout(pollStatus, POLL_INTERVAL);
    };

    useEffect(() => {
        if (paid && !polling) {
            setPolling(true);
            triesRef.current = 0;
            pollStatus();
        }
    }, [paid]);

    const onNavigationStateChange = (navState) => {
        if (isRedirectUrl(navState.url) && !paid) {
            setPaid(true);
        }
    };

    // MoMo (va mot so cong khac) co the redirect sang custom scheme (momo://, momoapp://)
    // de mo app native, hoac sang App Store/Play Store neu app chua cai. WebView khong
    // tu xu ly duoc — phai chan o day va ban giao cho he dieu hanh qua Linking.
    const onShouldStartLoadWithRequest = (request) => {
        const url = request.url || '';
        const isHttp = url.startsWith('http://') || url.startsWith('https://');
        const isStorePage = url.includes('apps.apple.com') || url.includes('play.google.com');

        if (!isHttp || isStorePage) {
            Linking.openURL(url).catch(() => {
                showToast('Không mở được ứng dụng. Hãy cài đặt trước rồi thử lại.', 'error');
            });
            return false;
        }
        return true;
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

            {payUrl ?
                <WebView
                    source={{ uri: payUrl }}
                    onNavigationStateChange={onNavigationStateChange}
                    onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
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

            {paid &&
                <View style={styles.confirmingOverlay}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.confirmingText}>Đang xác nhận thanh toán...</Text>
                    <Text style={styles.confirmingSub}>Vui lòng chờ trong giây lát</Text>
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
                onConfirm={() => {
                    setConfirmCancel(false);
                    navigation.goBack();
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
