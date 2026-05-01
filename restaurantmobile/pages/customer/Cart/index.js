import { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
} from 'react-native';
import { Button, ActivityIndicator, IconButton, Chip } from 'react-native-paper';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FadeInUp, FadeIn } from '@utils/animations';
import { useCart } from '@contexts/CartContext';
import Colors from '@styles/colors';
import { ConfirmDialog, Toast } from '@components/CustomDialog';
import { authFetch, endpoints, clearSession, getApiErrorMessage } from '@configs';
import styles from './styles';

const paymentOptions = [
    { key: 'cash', label: 'Ti\u1ec1n m\u1eb7t', icon: 'cash' },
    { key: 'momo', label: 'MoMo', icon: 'wallet-outline' },
    { key: 'zalopay', label: 'ZaloPay', icon: 'credit-card-outline' },
    { key: 'paypal', label: 'PayPal', icon: 'paypal' },
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
            showToast('Gi\u1ecf h\u00e0ng \u0111ang tr\u1ed1ng');
            return;
        }
        if (isGuest) {
            showToast('Vui l\u00f2ng \u0111\u0103ng nh\u1eadp \u0111\u1ec3 t\u1ea1o \u0111\u01a1n h\u00e0ng');
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
                showToast(getApiErrorMessage(orderRes, 'Kh\u00f4ng th\u1ec3 t\u1ea1o \u0111\u01a1n h\u00e0ng'));
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
                    showToast(getApiErrorMessage(detailRes, 'Kh\u00f4ng th\u1ec3 th\u00eam m\u00f3n v\u00e0o \u0111\u01a1n h\u00e0ng'));
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
                ? '\u0110\u01a1n h\u00e0ng \u0111\u00e3 \u0111\u01b0\u1ee3c t\u1ea1o v\u00e0 ph\u01b0\u01a1ng th\u1ee9c thanh to\u00e1n \u0111\u00e3 \u0111\u01b0\u1ee3c ghi nh\u1eadn.'
                : '\u0110\u01a1n h\u00e0ng \u0111\u00e3 \u0111\u01b0\u1ee3c t\u1ea1o, nh\u01b0ng h\u1ec7 th\u1ed1ng ch\u01b0a ghi nh\u1eadn thanh to\u00e1n. B\u1ea1n v\u1eabn c\u00f3 th\u1ec3 xem \u0111\u01a1n trong l\u1ecbch s\u1eed.');
            setSuccessDialog(true);
        } catch (err) {
            showToast('Kh\u00f4ng th\u1ec3 ho\u00e0n t\u1ea5t \u0111\u1eb7t m\u00f3n. Vui l\u00f2ng th\u1eed l\u1ea1i.');
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
                            <IconButton
                                icon="trash-can-outline"
                                size={18}
                                iconColor={Colors.textSecondary}
                                onPress={() => removeItem(item.id)}
                                style={{ margin: -4 }}
                            />
                        </View>

                        <Text style={styles.meta}>{item.preparation_time} {`ph\u00fat`} · {item.chef_name || 'Nh\u00e0 h\u00e0ng'}</Text>
                        <Text style={styles.price}>{Number(item.price).toLocaleString()}{`\u0111`}</Text>

                        <View style={styles.cardFooter}>
                            <View style={styles.stepper}>
                                <IconButton
                                    icon="minus"
                                    size={16}
                                    iconColor={Colors.text}
                                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                                    style={styles.stepIconBtn}
                                />
                                <Text style={styles.quantity}>{item.quantity}</Text>
                                <IconButton
                                    icon="plus"
                                    size={16}
                                    iconColor={Colors.text}
                                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                                    style={styles.stepIconBtn}
                                />
                            </View>

                            <Text style={styles.lineTotal}>
                                {(item.price * item.quantity).toLocaleString()}{`\u0111`}
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
                    <Text style={styles.emptyTitle}>{`Gi\u1ecf h\u00e0ng \u0111ang tr\u1ed1ng`}</Text>
                    <Text style={styles.emptyText}>
                        {`Th\u00eam m\u00f3n t\u1eeb trang kh\u00e1m ph\u00e1 ho\u1eb7c chi ti\u1ebft m\u00f3n \u0111\u1ec3 b\u1eaft \u0111\u1ea7u \u0111\u1eb7t m\u00f3n.`}
                    </Text>
                    <Button
                        mode="contained"
                        onPress={() => navigation.navigate('Home')}
                        buttonColor={Colors.primary}
                        textColor={Colors.onPrimary}
                        labelStyle={{ fontWeight: '800', fontSize: 15 }}
                        style={{ marginTop: 20, borderRadius: 20 }}
                    >
                        {`\u0110i kh\u00e1m ph\u00e1 m\u00f3n`}
                    </Button>
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
                        <Text style={styles.headerTitle}>{`Gi\u1ecf h\u00e0ng c\u1ee7a b\u1ea1n`}</Text>
                        <Text style={styles.headerSubtitle}>
                            {totalItems} {`m\u00f3n \u0111ang ch\u1edd x\u00e1c nh\u1eadn. Ki\u1ec3m tra l\u1ea1i tr\u01b0\u1edbc khi t\u1ea1o \u0111\u01a1n.`}
                        </Text>
                    </FadeIn>
                }
            />

            <View style={[styles.bottomSheet, { bottom: tabBarHeight }]}>
                {!isGuest ? (
                    <>
                        <Text style={styles.sheetTitle}>{'Ph\u01b0\u01a1ng th\u1ee9c thanh to\u00e1n'}</Text>
                        <View style={styles.paymentRow}>
                            {paymentOptions.map((option) => (
                                <Chip
                                    key={option.key}
                                    icon={option.icon}
                                    selected={paymentMethod === option.key}
                                    showSelectedOverlay
                                    mode="flat"
                                    onPress={() => setPaymentMethod(option.key)}
                                    style={[
                                        styles.chip,
                                        paymentMethod === option.key && { backgroundColor: Colors.primary },
                                    ]}
                                    textStyle={[
                                        styles.chipText,
                                        paymentMethod === option.key && { color: Colors.onPrimary },
                                    ]}
                                    selectedColor={paymentMethod === option.key ? Colors.onPrimary : Colors.text}
                                >
                                    {option.label}
                                </Chip>
                            ))}
                        </View>

                        <View style={styles.summaryBlock}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>{'T\u1ed5ng thanh to\u00e1n'}</Text>
                                <Text style={styles.summaryAmount}>{totalAmount.toLocaleString()}{'\u0111'}</Text>
                            </View>
                        </View>

                        {submitting ?
                            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 10 }} /> :
                            <Button
                                mode="contained"
                                icon="check-circle-outline"
                                onPress={checkout}
                                buttonColor={Colors.primary}
                                textColor={Colors.onPrimary}
                                labelStyle={{ fontWeight: '800', fontSize: 16 }}
                                style={{ marginTop: 14, borderRadius: 20 }}
                                contentStyle={{ paddingVertical: 8 }}
                            >
                                {'T\u1ea1o \u0111\u01a1n h\u00e0ng'}
                            </Button>
                        }
                    </>
                ) : (
                    <View style={styles.guestPrompt}>
                        <View style={styles.guestPromptIcon}>
                            <MaterialCommunityIcons name="account-lock-outline" size={26} color={Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.guestPromptTitle}>{'\u0110\u0103ng nh\u1eadp \u0111\u1ec3 \u0111\u1eb7t m\u00f3n'}</Text>
                            <Text style={styles.guestPromptText}>
                                {'B\u1ea1n c\u1ea7n t\u00e0i kho\u1ea3n kh\u00e1ch h\u00e0ng \u0111\u1ec3 t\u1ea1o \u0111\u01a1n h\u00e0ng v\u00e0 theo d\u00f5i tr\u1ea1ng th\u00e1i m\u00f3n.'}
                            </Text>
                        </View>
                        <View style={styles.summaryBlock}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>{'T\u1ed5ng t\u1ea1m t\u00ednh'}</Text>
                                <Text style={styles.summaryAmount}>{totalAmount.toLocaleString()}{'\u0111'}</Text>
                            </View>
                        </View>
                        <Button
                            mode="contained"
                            icon="login"
                            onPress={() => navigation.navigate('Login')}
                            buttonColor={Colors.primary}
                            textColor={Colors.onPrimary}
                            labelStyle={{ fontWeight: '800', fontSize: 16 }}
                            style={{ marginTop: 14, borderRadius: 20 }}
                            contentStyle={{ paddingVertical: 8 }}>
                            {'\u0110\u0103ng nh\u1eadp ngay'}
                        </Button>
                    </View>
                )}
            </View>

            <ConfirmDialog
                visible={confirmCheckout}
                type="confirm"
                title={"X\u00e1c nh\u1eadn t\u1ea1o \u0111\u01a1n"}
                message={`${totalItems} m\u00f3n v\u1edbi t\u1ed5ng gi\u00e1 tr\u1ecb ${totalAmount.toLocaleString()}\u0111 s\u1ebd \u0111\u01b0\u1ee3c t\u1ea1o th\u00e0nh \u0111\u01a1n h\u00e0ng m\u1edbi.`}
                onCancel={() => setConfirmCheckout(false)}
                onConfirm={doCheckout}
                confirmText={"T\u1ea1o \u0111\u01a1n"}
            />

            <ConfirmDialog
                visible={successDialog}
                type="success"
                title={"\u0110\u1eb7t m\u00f3n th\u00e0nh c\u00f4ng"}
                message={successMessage}
                confirmText={"Xem \u0111\u01a1n h\u00e0ng"}
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
