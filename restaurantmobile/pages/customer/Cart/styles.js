import { StyleSheet, Platform } from 'react-native';
import Colors from '@styles/colors';
import { editorialShadow } from '@styles/theme';

const cardShadow = Platform.select({
    ios: {
        shadowColor: '#271816',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
    },
    android: { elevation: 3 },
    default: {},
});

const sheetShadow = Platform.select({
    ios: {
        shadowColor: '#271816',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
    },
    android: { elevation: 12 },
    default: {},
});

export default StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },

    headerCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        paddingHorizontal: 24,
        paddingTop: 18,
        paddingBottom: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 16,
        ...cardShadow,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 8,
        fontWeight: '600',
        lineHeight: 20,
    },
    headerCount: {
        fontWeight: '800',
        color: Colors.primary,
    },

    itemCard: {
        flexDirection: 'row',
        backgroundColor: Colors.surfaceContainerLowest,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 12,
        borderRadius: 24,
        gap: 16,
        ...cardShadow,
    },
    itemImage: {
        width: 96,
        height: 96,
        borderRadius: 18,
    },
    itemImagePlaceholder: {
        backgroundColor: Colors.surfaceContainerLow,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemBody: {
        flex: 1,
        justifyContent: 'center',
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
        lineHeight: 20,
        marginRight: 8,
    },
    removeBtn: {
        padding: 6,
        marginRight: -6,
        marginTop: -6,
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 16,
    },
    itemMeta: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '600',
        marginTop: 6,
    },
    itemBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    itemPrice: {
        fontSize: 17,
        fontWeight: '900',
        color: Colors.primary,
    },

    stepperPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 20,
        padding: 4,
    },
    stepperBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
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

    bottomSheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: Colors.surfaceContainerLowest,
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 28,
        ...sheetShadow,
    },
    sheetTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.textSecondary,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 12,
    },

    serviceModeRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    serviceModeChip: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 9999,
        backgroundColor: Colors.surfaceContainerLow,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    serviceModeChipActive: {
        backgroundColor: Colors.primaryLight,
        borderColor: Colors.primary + '40',
    },
    serviceModeText: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: '800',
    },
    serviceModeTextActive: {
        color: Colors.primary,
    },

    bookingSelectBlock: {
        marginBottom: 16,
    },
    bookingScroll: {
        gap: 12,
        paddingRight: 4,
    },
    bookingChip: {
        minWidth: 240,
        maxWidth: 280,
        minHeight: 46,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.outlineVariant + '40',
        backgroundColor: Colors.surfaceContainerLowest,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        ...cardShadow,
    },
    bookingChipActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
        shadowColor: Colors.primary,
        shadowOpacity: 0.1,
    },
    bookingChipText: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: '700',
        flexShrink: 1,
    },
    bookingChipTextActive: {
        color: Colors.primary,
        fontWeight: '800',
    },
    bookingLoadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
    },
    noBookingBox: {
        borderRadius: 16,
        backgroundColor: Colors.surfaceContainerLow,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    bookingHint: {
        color: Colors.textSecondary,
        fontSize: 13,
        lineHeight: 20,
        fontWeight: '600',
        flex: 1,
    },
    bookingAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: Colors.primaryLight,
    },
    bookingActionText: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '900',
    },

    summaryBlock: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 8,
        marginBottom: 20,
    },
    summaryLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '700',
        marginBottom: 4,
    },
    summaryAmount: {
        fontSize: 26,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: -0.5,
    },

    checkoutBtn: {
        borderRadius: 18,
    },

    emptyWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingBottom: 80,
    },
    emptyIconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: Colors.surfaceContainerLow,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 22,
        fontWeight: '500',
    },

    guestPrompt: { paddingTop: 4 },
    guestPromptIcon: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    guestPromptTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
    },
    guestPromptText: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 8,
        lineHeight: 22,
        fontWeight: '500',
    },
});
