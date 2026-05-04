import { StyleSheet } from 'react-native';
import Colors from '@styles/colors';
import { editorialShadow } from '@styles/theme';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 32,
    },
    loading: {
        flex: 1,
        backgroundColor: Colors.surface,
    },

    // Hero
    hero: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 20,
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
        ...editorialShadow,
    },
    heroText: { flex: 1 },
    title: {
        fontSize: 20,
        lineHeight: 26,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.3,
    },
    subtitle: {
        marginTop: 4,
        fontSize: 12,
        lineHeight: 17,
        color: Colors.textSecondary,
    },

    // Summary
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        gap: 8,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 12,
        ...editorialShadow,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.3,
    },
    summaryLabel: {
        marginTop: 2,
        fontSize: 11,
        lineHeight: 15,
        color: Colors.textSecondary,
        fontWeight: '500',
    },

    // Search
    searchbar: {
        marginTop: 12,
        marginBottom: 4,
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 14,
        elevation: 0,
        height: 44,
    },
    searchbarInput: {
        color: Colors.text,
        fontSize: 14,
        minHeight: 0,
    },

    // Error
    errorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 16,
        padding: 12,
        marginTop: 8,
        ...editorialShadow,
    },
    errorContent: {
        flex: 1,
        marginLeft: 10,
        marginRight: 8,
    },
    errorTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
    },
    errorText: {
        marginTop: 3,
        fontSize: 12,
        lineHeight: 18,
        color: Colors.textSecondary,
    },

    // Dish card (compact horizontal)
    card: {
        flexDirection: 'row',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 16,
        marginTop: 10,
        overflow: 'hidden',
        ...editorialShadow,
    },
    dishImg: {
        width: 96,
        height: 96,
    },
    placeholder: {
        backgroundColor: Colors.surfaceContainerLow,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardBody: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
        justifyContent: 'space-between',
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8,
    },
    dishName: {
        flex: 1,
        fontSize: 14,
        lineHeight: 19,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.2,
    },
    dishPrice: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.primary,
    },
    dishDescription: {
        marginTop: 2,
        fontSize: 11,
        lineHeight: 15,
        color: Colors.textSecondary,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 6,
        gap: 6,
    },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 999,
        paddingHorizontal: 7,
        paddingVertical: 3,
    },
    metaText: {
        marginLeft: 4,
        fontSize: 10,
        fontWeight: '700',
        color: Colors.text,
    },
    // Badge "Chờ duyệt" cho món chưa được admin active.
    pendingChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.star + '20',
        borderRadius: 999,
        paddingHorizontal: 7,
        paddingVertical: 3,
    },
    pendingText: {
        marginLeft: 4,
        fontSize: 10,
        fontWeight: '800',
        color: Colors.star,
        letterSpacing: 0.2,
    },
    // Footer + actions trên cùng 1 hàng
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    footerText: {
        fontSize: 10,
        lineHeight: 14,
        color: Colors.textSecondary,
        fontWeight: '500',
        flex: 1,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 4,
    },
    iconBtn: {
        margin: 0,
        width: 28,
        height: 28,
    },

    // Empty
    empty: {
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 20,
        paddingHorizontal: 22,
        paddingVertical: 28,
        marginTop: 16,
        ...editorialShadow,
    },
    emptyTitle: {
        marginTop: 12,
        fontSize: 17,
        fontWeight: '800',
        textAlign: 'center',
        color: Colors.text,
    },
    emptyText: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 19,
        textAlign: 'center',
        color: Colors.textSecondary,
    },
    emptyAction: {
        marginTop: 14,
    },
});
