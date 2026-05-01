import { StyleSheet } from 'react-native';
import Colors from '@styles/colors';
import { editorialShadow } from '@styles/theme';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    content: {
        padding: 20,
        paddingBottom: 32,
    },
    loading: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    hero: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        padding: 20,
        ...editorialShadow,
    },
    heroText: {
        marginBottom: 18,
    },
    title: {
        fontSize: 28,
        lineHeight: 34,
        fontWeight: '800',
        color: Colors.text,
    },
    subtitle: {
        marginTop: 10,
        fontSize: 14,
        lineHeight: 22,
        color: Colors.textSecondary,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    summaryCard: {
        width: '31.5%',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        padding: 16,
        ...editorialShadow,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
    },
    summaryLabel: {
        marginTop: 6,
        fontSize: 12,
        lineHeight: 18,
        color: Colors.textSecondary,
    },
    searchbar: {
        marginTop: 16,
        marginBottom: 8,
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 18,
        elevation: 0,
    },
    searchbarInput: {
        color: Colors.text,
        fontSize: 15,
    },
    errorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        padding: 16,
        marginTop: 8,
        marginBottom: 4,
        ...editorialShadow,
    },
    errorContent: {
        flex: 1,
        marginLeft: 12,
        marginRight: 10,
    },
    errorTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
    },
    errorText: {
        marginTop: 4,
        fontSize: 13,
        lineHeight: 20,
        color: Colors.textSecondary,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        marginTop: 14,
        overflow: 'hidden',
        ...editorialShadow,
    },
    dishImg: {
        width: 112,
        height: 176,
    },
    placeholder: {
        backgroundColor: Colors.surfaceContainerLow,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardBody: {
        flex: 1,
        padding: 16,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    dishName: {
        flex: 1,
        fontSize: 18,
        lineHeight: 24,
        fontWeight: '800',
        color: Colors.text,
        marginRight: 10,
    },
    dishPrice: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.primary,
    },
    dishDescription: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 20,
        color: Colors.textSecondary,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
    },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 9999,
        paddingHorizontal: 10,
        paddingVertical: 7,
        marginRight: 8,
        marginBottom: 8,
    },
    metaText: {
        marginLeft: 6,
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text,
    },
    footerRow: {
        marginTop: 4,
    },
    footerText: {
        marginTop: 4,
        fontSize: 12,
        lineHeight: 18,
        color: Colors.textSecondary,
    },
    empty: {
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        paddingHorizontal: 24,
        paddingVertical: 32,
        marginTop: 20,
        ...editorialShadow,
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
        color: Colors.text,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 14,
        lineHeight: 22,
        textAlign: 'center',
        color: Colors.textSecondary,
    },
    emptyAction: {
        marginTop: 18,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
    },
});
