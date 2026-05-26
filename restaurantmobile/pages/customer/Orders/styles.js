import { StyleSheet } from 'react-native';
import Colors from '@styles/colors';
import { editorialShadow } from '@styles/theme';

export default StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    header: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 10 },
    headerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
    headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
    headerSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 6, lineHeight: 20 },
    refreshBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surfaceContainerLow,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterScroll: {
        gap: 8,
        paddingTop: 14,
        paddingRight: 4,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 9999,
        backgroundColor: Colors.surfaceContainerLow,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    filterChipActive: {
        backgroundColor: Colors.primaryLight,
        borderColor: Colors.primary,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    filterChipTextActive: {
        color: Colors.primary,
    },
    errorCard: {
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 4,
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 20,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        ...editorialShadow,
    },
    errorText: { flex: 1, marginLeft: 10, color: Colors.text, fontSize: 14, lineHeight: 20 },


    card: {
        backgroundColor: Colors.surfaceContainerLowest,
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 24,
        padding: 18,
        ...editorialShadow,
    },
    cardCancelled: { opacity: 0.7 },


    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    orderId: { fontSize: 18, fontWeight: '800', color: Colors.text, letterSpacing: -0.2 },
    date: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, fontWeight: '500' },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 9999,
        marginLeft: 12,
    },
    badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.1 },


    summaryRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginTop: 16,
        gap: 12,
    },
    summaryAmount: { flex: 1 },
    summaryLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    amount: { fontSize: 22, fontWeight: '800', color: Colors.primary, letterSpacing: -0.5 },
    summaryPayment: { alignItems: 'flex-end' },
    paymentMethodRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    paymentMethodText: { fontSize: 13, fontWeight: '700', color: Colors.text },
    payPill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    payPillText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    paymentActionBtn: {
        marginTop: 14,
        borderRadius: 14,
    },
    paymentActionLabel: {
        fontSize: 13,
        fontWeight: '800',
    },
    paymentTimerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: Colors.surfaceContainerLow,
    },
    paymentTimerText: {
        flex: 1,
        fontSize: 12,
        fontWeight: '800',
        color: Colors.textSecondary,
    },
    retryMethodBlock: {
        marginTop: 14,
        gap: 8,
    },
    retryMethodTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.text,
    },
    retryMethodRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    retryMethodChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minHeight: 36,
        paddingHorizontal: 11,
        borderRadius: 10,
        backgroundColor: Colors.primaryLight,
        borderWidth: 1,
        borderColor: Colors.primary + '50',
    },
    retryMethodText: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.primary,
    },


    divider: {
        height: 1,
        backgroundColor: Colors.outlineVariant + '60',
        marginTop: 14,
    },


    detailsToggle: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailsToggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailsToggleText: { fontSize: 13, fontWeight: '700', color: Colors.text },
    detailsTogglePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.surfaceContainerLow,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    detailsTogglePillText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },


    detailsCard: {
        marginTop: 12,
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 16,
        padding: 12,
        gap: 4,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        gap: 10,
    },
    detailQtyBadge: {
        backgroundColor: Colors.primaryLight,
        minWidth: 28,
        height: 24,
        paddingHorizontal: 6,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailQtyText: { fontSize: 11, fontWeight: '800', color: Colors.primary },
    detailItem: { flex: 1, fontSize: 13, color: Colors.text, fontWeight: '600' },
    detailPrice: { fontSize: 12, color: Colors.textSecondary, fontWeight: '700' },


    empty: { alignItems: 'center', marginTop: 40, paddingHorizontal: 32 },
    emptyIconCircle: {
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
