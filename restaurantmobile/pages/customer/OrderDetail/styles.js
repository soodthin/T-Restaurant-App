import { StyleSheet } from 'react-native';
import Colors from '@styles/colors';
import { editorialShadow } from '@styles/theme';

export default StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },

    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },

    // Info section
    section: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        padding: 18,
        marginBottom: 16,
        ...editorialShadow,
        shadowOpacity: 0.08,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    label: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    value: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.text,
    },

    // Status Notice
    statusNotice: {
        borderRadius: 14,
        backgroundColor: Colors.surfaceContainerLow,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    statusNoticeText: {
        flex: 1,
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 20,
    },

    // Payment specific
    paymentTimerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 14,
        borderRadius: 12,
        backgroundColor: Colors.surfaceContainerLow,
        marginBottom: 12,
    },
    paymentTimerText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '800',
        color: Colors.textSecondary,
    },
    paymentActionBtn: {
        marginTop: 4,
        borderRadius: 14,
        paddingVertical: 4,
    },

    retryMethodBlock: {
        marginTop: 8,
    },
    retryMethodTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 10,
    },
    retryMethodRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    retryMethodChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: Colors.primaryLight,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    retryMethodText: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.primary,
    },

    // Dish details
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.outlineVariant + '40',
    },
    detailQtyBadge: {
        backgroundColor: Colors.primaryLight,
        minWidth: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailQtyText: { fontSize: 13, fontWeight: '800', color: Colors.primary },
    detailItem: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: '700' },
    detailPrice: { fontSize: 13, color: Colors.textSecondary, fontWeight: '800' },
    reviewDishBtn: {
        minHeight: 32,
        borderRadius: 10,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primaryLight,
        borderWidth: 1,
        borderColor: Colors.primary + '45',
    },
    reviewDishText: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '900',
    },
});
