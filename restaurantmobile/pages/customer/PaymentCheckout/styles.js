import { StyleSheet } from 'react-native';
import Colors from '@styles/colors';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: Colors.surfaceContainerLowest,
        borderBottomWidth: 1,
        borderBottomColor: Colors.outlineVariant + '40',
    },
    headerBtn: {
        minWidth: 56,
        paddingHorizontal: 8,
        paddingVertical: 6,
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.2,
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
    },
    loadingOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.surface,
    },
    confirmingOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.surface + 'F0',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    confirmingText: {
        marginTop: 18,
        fontSize: 17,
        fontWeight: '800',
        color: Colors.text,
    },
    confirmingSub: {
        marginTop: 6,
        fontSize: 13,
        color: Colors.textSecondary,
    },
});
