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
    },
    loading: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    hero: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        ...editorialShadow,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: Colors.text,
    },
    subtitle: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 22,
        color: Colors.textSecondary,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 16,
        padding: 12,
        marginTop: 14,
    },
    errorText: {
        flex: 1,
        marginHorizontal: 10,
        fontSize: 13,
        color: Colors.text,
    },
    card: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        ...editorialShadow,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dishName: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
    },
    customerName: {
        marginTop: 4,
        fontSize: 13,
        color: Colors.textSecondary,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLow,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 9999,
    },
    ratingText: {
        marginLeft: 4,
        fontSize: 13,
        fontWeight: '800',
        color: Colors.text,
    },
    comment: {
        marginTop: 10,
        fontSize: 14,
        lineHeight: 20,
        color: Colors.text,
    },
    commentEmpty: {
        marginTop: 10,
        fontSize: 13,
        color: Colors.textSecondary,
        fontStyle: 'italic',
    },
    date: {
        marginTop: 10,
        fontSize: 12,
        color: Colors.textSecondary,
    },
    empty: {
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        paddingHorizontal: 24,
        paddingVertical: 32,
        ...editorialShadow,
    },
    emptyTitle: {
        marginTop: 14,
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
        textAlign: 'center',
    },
    emptyText: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 22,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
});
