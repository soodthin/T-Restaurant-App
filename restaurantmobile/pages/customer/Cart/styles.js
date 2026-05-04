import { StyleSheet, Platform } from 'react-native';
import Colors from '@styles/colors';

const cardShadow = Platform.select({
    ios: {
        shadowColor: '#271816',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
    },
    android: { elevation: 1 },
    default: {},
});

const sheetShadow = Platform.select({
    ios: {
        shadowColor: '#271816',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.06,
        shadowRadius: 24,
    },
    android: { elevation: 12 },
    default: {},
});

export default StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },

    // === Header card ===
    headerCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        paddingHorizontal: 24,
        paddingTop: 18,
        paddingBottom: 22,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        marginBottom: 14,
        ...cardShadow,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 8,
        fontWeight: '600',
    },
    headerCount: {
        fontWeight: '800',
        color: Colors.primary,
    },

    // === Item card ===
    itemCard: {
        flexDirection: 'row',
        backgroundColor: Colors.surfaceContainerLowest,
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 12,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: Colors.outlineVariant + '40',
        gap: 14,
        ...cardShadow,
    },
    itemImage: {
        width: 100,
        height: 100,
        borderRadius: 16,
    },
    itemImagePlaceholder: {
        backgroundColor: Colors.surfaceContainerLow,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemBody: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 2,
    },
    itemTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    itemName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '800',
        color: Colors.text,
        lineHeight: 19,
        marginRight: 6,
    },
    removeBtn: {
        padding: 4,
        marginRight: -4,
        marginTop: -4,
    },
    itemMeta: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '600',
        marginTop: 4,
    },
    itemBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '900',
        color: Colors.primary,
    },

    // === Stepper pill ===
    stepperPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: Colors.outlineVariant + '30',
    },
    stepperBtn: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: Colors.surfaceContainerLowest,
        justifyContent: 'center',
        alignItems: 'center',
        ...cardShadow,
    },
    stepperValue: {
        minWidth: 32,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '800',
        color: Colors.text,
    },

    // === Bottom sheet ===
    bottomSheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: Colors.surfaceContainerLowest,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 22,
        paddingTop: 22,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: Colors.outlineVariant + '30',
        ...sheetShadow,
    },
    sheetTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 14,
    },

    // === Payment chips ===
    paymentScroll: {
        gap: 10,
        paddingRight: 4,
    },
    paymentChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 9999,
        borderWidth: 2,
        borderColor: Colors.outlineVariant + '50',
        backgroundColor: Colors.surfaceContainerLowest,
    },
    paymentChipActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
    },
    paymentChipText: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.textSecondary,
    },
    paymentChipTextActive: {
        color: Colors.primary,
    },

    // === Summary ===
    summaryBlock: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginTop: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.outlineVariant + '30',
    },
    summaryLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '700',
    },
    summaryAmount: {
        fontSize: 22,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: -0.3,
    },

    // === Checkout button ===
    checkoutBtn: {
        borderRadius: 16,
    },

    // === Empty state ===
    emptyWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingBottom: 80,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 20,
    },

    // === Guest prompt ===
    guestPrompt: { paddingTop: 4 },
    guestPromptIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    guestPromptTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: Colors.text,
    },
    guestPromptText: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 6,
        lineHeight: 19,
    },
});
