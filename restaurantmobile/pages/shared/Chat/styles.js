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

    // Header avatar
    headerAvatar: {
        marginRight: 4,
    },
    headerAvatarImg: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    headerAvatarPlaceholder: {
        backgroundColor: Colors.surfaceContainerHigh,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerAvatarLetter: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.primary,
    },

    // Message list
    messageList: {
        flex: 1,
    },
    messageListContent: {
        paddingHorizontal: 14,
        paddingVertical: 16,
    },

    // Date separator
    dateSeparator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
        paddingHorizontal: 8,
    },
    dateSeparatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.outlineVariant + '60',
    },
    dateSeparatorText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textSecondary,
        paddingHorizontal: 12,
    },

    // Bubble
    bubbleRow: {
        flexDirection: 'row',
        marginBottom: 6,
        justifyContent: 'flex-start',
    },
    bubbleRowMe: {
        justifyContent: 'flex-end',
    },
    bubble: {
        maxWidth: '78%',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
    },
    bubbleMe: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 6,
    },
    bubbleOther: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderBottomLeftRadius: 6,
        borderWidth: 1,
        borderColor: Colors.outlineVariant + '50',
        ...editorialShadow,
    },
    bubbleText: {
        fontSize: 14,
        lineHeight: 20,
    },
    bubbleTextMe: {
        color: Colors.onPrimary,
    },
    bubbleTextOther: {
        color: Colors.text,
    },
    bubbleTime: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    bubbleTimeMe: {
        color: Colors.onPrimary + 'AA',
    },
    bubbleTimeOther: {
        color: Colors.textSecondary,
    },

    // Input bar
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 10,
        paddingBottom: 14,
        backgroundColor: Colors.surfaceContainerLowest,
        borderTopWidth: 1,
        borderTopColor: Colors.outlineVariant + '40',
    },
    inputWrap: {
        flex: 1,
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 8,
        minHeight: 44,
        justifyContent: 'center',
        marginRight: 10,
    },
    textInput: {
        fontSize: 14,
        color: Colors.text,
        maxHeight: 100,
        lineHeight: 20,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: Colors.surfaceContainerHigh,
    },

    // Empty state
    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
        // Inverted FlatList: empty component hien nguoc, transform lai.
        transform: [{ scaleY: -1 }],
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        marginTop: 18,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
});
