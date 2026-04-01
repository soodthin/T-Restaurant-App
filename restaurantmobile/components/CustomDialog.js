import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../styles/colors';
import { editorialShadow } from '../styles/theme';

const ConfirmDialog = ({ visible, title, message, onCancel, onConfirm, confirmText, cancelText, type }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.85)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.spring(scale, { toValue: 1, damping: 14, stiffness: 300, useNativeDriver: true }),
            ]).start();
        } else {
            opacity.setValue(0);
            scale.setValue(0.85);
        }
    }, [visible, opacity, scale]);

    const iconMap = {
        success: { name: 'check-circle', color: Colors.success },
        error: { name: 'alert-circle', color: Colors.primary },
        confirm: { name: 'help-circle', color: Colors.primary },
        warning: { name: 'alert', color: Colors.star },
    };
    const icon = iconMap[type || 'confirm'];

    return (
        <Modal transparent={true} visible={visible} animationType="none">
            <View style={styles.overlay}>
                <Animated.View style={[styles.dialog, { opacity, transform: [{ scale }] }]}>
                    <View style={[styles.iconWrap, { backgroundColor: icon.color + '15' }]}>
                        <MaterialCommunityIcons name={icon.name} size={36} color={icon.color} />
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <View style={styles.btnRow}>
                        {onCancel &&
                            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
                                <Text style={styles.cancelText}>{cancelText || 'Hủy'}</Text>
                            </TouchableOpacity>
                        }
                        <TouchableOpacity
                            style={[styles.confirmBtn, !onCancel && { flex: 1 }]}
                            onPress={onConfirm}
                            activeOpacity={0.8}>
                            <Text style={styles.confirmText}>{confirmText || 'Đồng ý'}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const Toast = ({ visible, message, type, onHide }) => {
    const translateY = useRef(new Animated.Value(-120)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(translateY, { toValue: 0, damping: 16, stiffness: 300, useNativeDriver: true }).start();
            const timer = setTimeout(() => {
                Animated.timing(translateY, { toValue: -120, duration: 300, useNativeDriver: true })
                    .start(() => onHide && onHide());
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [visible, translateY, onHide]);

    if (!visible) return null;
    const isError = type === 'error';

    return (
        <Animated.View
            style={[
                styles.toast,
                { transform: [{ translateY }], backgroundColor: isError ? Colors.primary : Colors.success },
                editorialShadow,
            ]}>
            <MaterialCommunityIcons
                name={isError ? 'close-circle' : 'check-circle'}
                size={22}
                color={Colors.onPrimary}
            />
            <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(39,24,22,0.35)', justifyContent: 'center', alignItems: 'center', padding: 30 },
    dialog: {
        backgroundColor: Colors.card,
        borderRadius: 28,
        padding: 28,
        width: '100%',
        alignItems: 'center',
        ...editorialShadow,
    },
    iconWrap: { width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
    title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 10, textAlign: 'center' },
    message: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 23, marginBottom: 26 },
    btnRow: { flexDirection: 'row', width: '100%' },
    cancelBtn: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        backgroundColor: Colors.surfaceContainerLow,
        alignItems: 'center',
        marginRight: 8,
    },
    cancelText: { fontSize: 16, fontWeight: '700', color: Colors.text },
    confirmBtn: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        marginLeft: 8,
    },
    confirmText: { fontSize: 16, fontWeight: '700', color: Colors.onPrimary },
    toast: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
    },
    toastText: { color: Colors.onPrimary, fontSize: 15, fontWeight: '600', marginLeft: 10, flex: 1 },
});

export { ConfirmDialog, Toast };
