import { Portal, Dialog, Button, Text, Snackbar } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../styles/colors';

const ConfirmDialog = ({ visible, title, message, onCancel, onConfirm, confirmText, cancelText, type }) => {
    const iconMap = {
        success: { name: 'check-circle', color: Colors.success },
        error: { name: 'alert-circle', color: Colors.primary },
        confirm: { name: 'help-circle', color: Colors.primary },
        warning: { name: 'alert', color: Colors.star },
    };
    const icon = iconMap[type || 'confirm'];

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onCancel || onConfirm} style={styles.dialog}>
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
                            style={styles.cancelBtn}
                            labelStyle={styles.cancelLabel}
                            textColor={Colors.text}>
                            {cancelText || 'Hủy'}
                        </Button>
                    }
                    <Button
                        mode="contained"
                        onPress={onConfirm}
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
    const isError = type === 'error';

    return (
        <Snackbar
            visible={visible}
            onDismiss={onHide}
            duration={2500}
            style={[styles.snackbar, { backgroundColor: isError ? Colors.primary : Colors.success }]}
            wrapperStyle={styles.snackbarWrapper}>
            <View style={styles.snackbarContent}>
                <MaterialCommunityIcons
                    name={isError ? 'close-circle' : 'check-circle'}
                    size={22}
                    color={Colors.onPrimary}
                />
                <Text style={styles.snackbarText}>{message}</Text>
            </View>
        </Snackbar>
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
    snackbar: {
        borderRadius: 20,
    },
    snackbarWrapper: {
        top: 60,
        bottom: undefined,
    },
    snackbarContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    snackbarText: { color: Colors.onPrimary, fontSize: 15, fontWeight: '600', marginLeft: 10, flex: 1 },
});

export { ConfirmDialog, Toast };
