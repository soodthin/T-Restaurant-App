import { StyleSheet, Platform } from 'react-native';
import Colors from '@styles/colors';

const cardShadow = Platform.select({
    ios: {
        shadowColor: '#271816',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    android: { elevation: 1 },
    default: {},
});

export default StyleSheet.create({
    // === Tab segment ===
    tabBar: {
        flexDirection: 'row',
        backgroundColor: Colors.surfaceContainerLow,
        marginHorizontal: 20,
        marginTop: 12,
        marginBottom: 6,
        padding: 4,
        borderRadius: 14,
    },
    tabBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    tabBtnActive: {
        backgroundColor: Colors.surfaceContainerLowest,
        ...cardShadow,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    tabTextActive: {
        color: Colors.primary,
    },

    // === Form layout ===
    formContent: {
        paddingHorizontal: 20,
        paddingTop: 14,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: Colors.textSecondary,
        marginBottom: 8,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

    // === Date/Time picker side-by-side ===
    dateTimeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    pickerInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderWidth: 1.5,
        borderColor: Colors.outline,
        gap: 10,
    },
    pickerInputText: {
        fontSize: 15,
        color: Colors.text,
        fontWeight: '700',
    },

    // === Suggested times horizontal scroll ===
    suggestedScroll: {
        gap: 8,
        paddingRight: 4,
    },
    suggestedChip: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 9999,
        backgroundColor: Colors.surfaceContainerLowest,
        borderWidth: 1,
        borderColor: Colors.outline,
    },
    suggestedChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
        ...cardShadow,
    },
    suggestedText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    suggestedTextActive: {
        color: Colors.onPrimary,
    },

    // === Stepper số khách compact pill ===
    stepperPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderWidth: 1,
        borderColor: Colors.outline,
        borderRadius: 16,
        padding: 6,
        alignSelf: 'flex-start',
    },
    stepBtnMinus: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.surfaceContainerLow,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepBtnPlus: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    guestCount: {
        minWidth: 60,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
    },

    // === Sticky bottom bar ===
    bottomBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: Colors.surfaceContainerLowest,
        borderTopWidth: 1,
        borderTopColor: Colors.outlineVariant + '40',
        paddingHorizontal: 20,
        paddingTop: 14,
    },
    confirmBtn: {
        borderRadius: 16,
    },

    // === History card ===
    bookingCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        marginHorizontal: 20,
        marginVertical: 6,
        borderRadius: 22,
        padding: 18,
        borderWidth: 1,
        borderColor: Colors.outlineVariant + '40',
        ...cardShadow,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 9999,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
    },
    cardTime: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
        lineHeight: 22,
    },
    cardDate: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '600',
        marginTop: 2,
    },
    guestPill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: Colors.surfaceContainerLow,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 9999,
        gap: 6,
    },
    guestPillText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
    },
    noteBlock: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.surfaceContainerLow,
        borderWidth: 1,
        borderColor: Colors.outlineVariant + '30',
        padding: 12,
        borderRadius: 14,
        marginTop: 10,
        gap: 8,
    },
    bookingNote: {
        flex: 1,
        fontSize: 13,
        color: Colors.text,
        lineHeight: 19,
        fontStyle: 'italic',
    },
    cancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 14,
        paddingVertical: 11,
        borderRadius: 12,
        backgroundColor: Colors.primaryLight,
        gap: 8,
    },
    cancelBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.primary,
    },

    // === Empty state ===
    empty: {
        alignItems: 'center',
        marginTop: 60,
        paddingHorizontal: 32,
    },
    emptyIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.surfaceContainerLow,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
});
