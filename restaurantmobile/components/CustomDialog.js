import { useEffect, useRef } from 'react';
import { Portal, Dialog, Button, Text } from 'react-native-paper';
import { View, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@styles/colors';

const ConfirmDialog = ({ visible, title, message, onCancel, onConfirm, confirmText, cancelText, type, loading }) => {
    const iconMap = {
        success: { name: 'check-circle', color: Colors.success },
        error: { name: 'alert-circle', color: Colors.primary },
        confirm: { name: 'help-circle', color: Colors.primary },
        warning: { name: 'alert', color: Colors.star },
    };
    const icon = iconMap[type || 'confirm'];

    return (
        <Portal>
            <Dialog
                visible={visible}
                onDismiss={loading ? undefined : (onCancel || onConfirm)}
                dismissable={!loading}
                style={styles.dialog}
            >
                <Dialog.Content style={styles.dialogContent}>
                    <View style={[styles.iconWrap, { backgroundColor: icon.color + '15' }]}>
                        <MaterialCommunityIcons name={icon.name} size={36} color={icon.color} />
                    </View>
                    <Text variant="headlineSmall" style={styles.title}>{title}</Text>
                    <Text variant="bodyMedium" style={styles.message}>{message}</Text>
                </Dialog.Content>
                <Dialog.Actions style={styles.btnRow}>
                    {onCancel &&
                        <Button
                            mode="outlined"
                            onPress={onCancel}
                            disabled={loading}
                            style={styles.cancelBtn}
                            labelStyle={styles.cancelLabel}
                            textColor={Colors.text}>
                            {cancelText || 'Hủy'}
                        </Button>
                    }
                    <Button
                        mode="contained"
                        onPress={onConfirm}
                        loading={loading}
                        disabled={loading}
                        style={[styles.confirmBtn, !onCancel && { flex: 1 }]}
                        labelStyle={styles.confirmLabel}>
                        {confirmText || 'Đồng ý'}
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
};

const Toast = ({ visible, message, type, onHide }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-20)).current;
    const isError = type === 'error';

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
            ]).start();
            const timer = setTimeout(() => {
                Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => onHide());
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }], backgroundColor: isError ? Colors.primary : Colors.success }]}>
            <MaterialCommunityIcons name={isError ? 'close-circle' : 'check-circle'} size={20} color={Colors.onPrimary} />
            <Text style={styles.toastText} numberOfLines={2}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    dialog: {
        backgroundColor: Colors.card,
        borderRadius: 28,
    },
    dialogContent: { alignItems: 'center', paddingTop: 28 },
    iconWrap: { width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
    title: { fontWeight: '800', color: Colors.text, textAlign: 'center' },
    message: { color: Colors.textSecondary, textAlign: 'center', lineHeight: 23, marginTop: 10 },
    btnRow: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 6 },
    cancelBtn: {
        flex: 1,
        borderRadius: 20,
        borderColor: Colors.outlineVariant,
        marginRight: 8,
    },
    cancelLabel: { fontWeight: '700' },
    confirmBtn: {
        flex: 1,
        borderRadius: 20,
        backgroundColor: Colors.primary,
    },
    confirmLabel: { fontWeight: '700', color: Colors.onPrimary },
    toast: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        zIndex: 9999,
    },
    toastText: { color: Colors.onPrimary, fontSize: 14, fontWeight: '600', marginLeft: 10, flex: 1 },
});

export { ConfirmDialog, Toast };
