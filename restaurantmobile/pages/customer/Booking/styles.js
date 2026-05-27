import { StyleSheet, Platform } from 'react-native';
import Colors from '@styles/colors';

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

export default StyleSheet.create({

    tabBar: {
        flexDirection: 'row',
        backgroundColor: Colors.surfaceContainerLow,
        marginHorizontal: 24,
        marginTop: 16,
        marginBottom: 12,
        padding: 4,
        borderRadius: 16,
    },
    tabBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
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
        color: Colors.text,
        fontWeight: '800',
    },


    formContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.textSecondary,
        marginBottom: 10,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },

    bookingRuleBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderWidth: 1,
        borderColor: Colors.success + '35',
        borderRadius: 16,
        padding: 14,
        gap: 12,
        marginBottom: 18,
        ...cardShadow,
    },
    bookingRuleBoxBlocked: {
        borderColor: Colors.primary + '40',
        backgroundColor: Colors.primaryLight,
    },
    bookingRuleIcon: {
        width: 40,
        height: 40,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.success + '14',
    },
    bookingRuleIconBlocked: {
        backgroundColor: Colors.surfaceContainerLowest,
    },
    bookingRuleTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
    },
    bookingRuleText: {
        marginTop: 3,
        fontSize: 12,
        lineHeight: 18,
        color: Colors.textSecondary,
        fontWeight: '600',
    },


    dateTimeRow: {
        flexDirection: 'row',
        gap: 16,
    },
    pickerInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: Colors.outlineVariant + '40',
        gap: 12,
        ...cardShadow,
    },
    pickerInputText: {
        fontSize: 16,
        color: Colors.text,
        fontWeight: '800',
    },


    suggestedScroll: {
        gap: 10,
        paddingRight: 4,
    },
    suggestedChip: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: Colors.surfaceContainerLowest,
        borderWidth: 1,
        borderColor: Colors.outlineVariant + '40',
    },
    suggestedChipActive: {
        backgroundColor: Colors.primaryLight,
        borderColor: Colors.primary + '50',
    },
    suggestedText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    suggestedTextActive: {
        color: Colors.primary,
        fontWeight: '800',
    },


    stepperPill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderWidth: 1,
        borderColor: Colors.outlineVariant + '40',
        borderRadius: 20,
        padding: 6,
        alignSelf: 'center',
        ...cardShadow,
        width: '60%',
        marginTop: 4,
        marginBottom: 8,
    },
    stepBtnMinus: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: Colors.surfaceContainerLow,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepBtnPlus: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    guestCount: {
        flex: 1,
        textAlign: 'center',
        fontSize: 26,
        fontWeight: '900',
        color: Colors.text,
    },


    bottomBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: Colors.surfaceContainerLowest,
        borderTopWidth: 1,
        borderTopColor: Colors.outlineVariant + '30',
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    confirmBtn: {
        borderRadius: 18,
    },


    bookingCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        marginHorizontal: 20,
        marginVertical: 8,
        borderRadius: 24,
        padding: 18,
        ...cardShadow,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '800',
    },
    cardTime: {
        fontSize: 20,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    cardDate: {
        fontSize: 13,
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
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    guestPillText: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.text,
    },
    noteBlock: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.surfaceContainerLow,
        padding: 14,
        borderRadius: 16,
        marginTop: 12,
        gap: 10,
    },
    bookingNote: {
        flex: 1,
        fontSize: 13,
        color: Colors.text,
        lineHeight: 20,
        fontWeight: '500',
    },
    cancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: Colors.primaryLight,
        gap: 8,
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.primary,
    },


    empty: {
        alignItems: 'center',
        marginTop: 80,
        paddingHorizontal: 32,
    },
    emptyIconWrap: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: Colors.surfaceContainerLow,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 15,
        color: Colors.textSecondary,
        fontWeight: '600',
    },

    warningBox: {
        flexDirection: 'row',
        backgroundColor: '#FEF3C7',
        padding: 16,
        borderRadius: 16,
        marginTop: 24,
        alignItems: 'center',
        gap: 14,
        borderWidth: 1,
        borderColor: '#FDE68A',
        shadowColor: '#D97706',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    warningTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#92400E',
        marginBottom: 4,
    },
    warningText: {
        fontSize: 13,
        color: '#B45309',
        fontWeight: '600',
        lineHeight: 20,
    },
});
