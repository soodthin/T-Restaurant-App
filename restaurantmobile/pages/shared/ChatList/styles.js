import { StyleSheet } from 'react-native';
import Colors from '@styles/colors';
import { editorialShadow } from '@styles/theme';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Header
    header: {
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 6,
        lineHeight: 20,
    },

    // Chat item
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        marginHorizontal: 16,
        marginVertical: 5,
        borderRadius: 20,
        padding: 14,
        ...editorialShadow,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 14,
    },
    avatarPlaceholder: {
        backgroundColor: Colors.surfaceContainerHigh,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarLetter: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.primary,
    },
    chatContent: {
        flex: 1,
        minWidth: 0,
    },
    chatTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chatName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '800',
        color: Colors.text,
        marginRight: 8,
    },
    chatTime: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    chatBottomRow: {
        marginTop: 6,
        gap: 4,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
    },
    roleText: {
        fontSize: 10,
        fontWeight: '700',
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 2,
    },
    lastMessage: {
        flex: 1,
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '500',
        lineHeight: 18,
        paddingRight: 8,
    },
    lastMessageUnread: {
        color: Colors.text,
        fontWeight: '800',
    },
    unreadBadge: {
        backgroundColor: Colors.error,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
    },

    // Empty state
    empty: {
        alignItems: 'center',
        marginTop: 60,
        paddingHorizontal: 32,
    },
    emptyIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
        marginTop: 18,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 10,
        lineHeight: 22,
        textAlign: 'center',
    },
});
