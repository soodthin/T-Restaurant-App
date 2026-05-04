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

const floatShadow = Platform.select({
    ios: {
        shadowColor: '#271816',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
    },
    android: { elevation: 4 },
    default: {},
});

export default StyleSheet.create({
    keyboard: { flex: 1, backgroundColor: Colors.surface },
    scroll: { flex: 1 },
    container: {},
    loading: { flex: 1, backgroundColor: Colors.surface },

    // === Cover ===
    cover: {
        height: 150,
        backgroundColor: Colors.primary,
        position: 'relative',
        overflow: 'hidden',
    },
    coverOverlay: {
        backgroundColor: Colors.primary + 'B3',
    },
    editFloatBtn: {
        position: 'absolute',
        top: 14,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.surfaceContainerLowest + 'F2',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 9999,
        ...floatShadow,
    },
    editFloatBtnSave: {
        backgroundColor: Colors.primaryContainer,
    },
    editFloatBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.text,
    },

    // === Avatar floating overlap ===
    avatarWrap: {
        marginTop: -50,
        marginLeft: 24,
        position: 'relative',
        width: 100,
        height: 100,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: Colors.surface,
        backgroundColor: Colors.surfaceContainerLow,
    },
    avatarPlaceholder: {
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarLetter: {
        fontSize: 38,
        fontWeight: '900',
        color: Colors.onPrimary,
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: Colors.surface,
    },

    // === Profile header (name + badges) ===
    profileHeader: {
        paddingHorizontal: 24,
        paddingTop: 14,
        paddingBottom: 22,
    },
    name: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: -0.3,
    },
    usernameHint: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '600',
        marginTop: 2,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
        flexWrap: 'wrap',
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 9999,
    },
    roleBadgeText: {
        fontSize: 11,
        fontWeight: '800',
    },
    verifyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 9999,
    },
    verifyBadgeOn: { backgroundColor: Colors.success + '20' },
    verifyBadgeOff: { backgroundColor: Colors.textSecondary + '15' },
    verifyBadgeText: {
        fontSize: 11,
        fontWeight: '800',
    },

    // === Section label ===
    cardLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: Colors.textSecondary,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 12,
        paddingHorizontal: 4,
    },

    // === Contact card ===
    contactCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        marginHorizontal: 16,
        marginBottom: 18,
        padding: 18,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.outlineVariant + '40',
        ...cardShadow,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    contactIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.surfaceContainerLow,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginBottom: 2,
        letterSpacing: 0.4,
    },
    contactValue: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
        lineHeight: 19,
    },
    contactInput: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
        backgroundColor: Colors.surfaceContainerLow,
        borderWidth: 1,
        borderColor: Colors.outline,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginTop: 4,
    },

    // === Menu section ===
    menuSection: {
        marginHorizontal: 16,
        marginBottom: 18,
    },
    menuList: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.outlineVariant + '40',
        overflow: 'hidden',
        ...cardShadow,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
    },
    menuItemBorder: {
        borderTopWidth: 1,
        borderTopColor: Colors.outlineVariant + '20',
    },
    menuIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
    },

    // === Logout ===
    logoutBtn: {
        marginHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primaryLight,
        paddingVertical: 16,
        borderRadius: 16,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.primary,
    },

    // === Cancel link ===
    cancelLinkBtn: {
        alignSelf: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    cancelLinkText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textSecondary,
        textDecorationLine: 'underline',
    },

    // === Empty / center state ===
    centerState: {
        flex: 1,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    centerText: {
        fontSize: 16,
        color: Colors.textSecondary,
    },
});
