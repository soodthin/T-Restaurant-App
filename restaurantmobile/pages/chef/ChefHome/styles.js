import { StyleSheet } from 'react-native';
import Colors from '@styles/colors';
import { editorialShadow } from '@styles/theme';

const DRAWER_WIDTH = 288;

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    scroll: { flex: 1 },
    content: {
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    loading: {
        flex: 1,
        backgroundColor: Colors.surface,
    },

    // App bar
    appBar: {
        backgroundColor: Colors.surfaceContainerLowest,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.outlineVariant + '40',
    },
    appBarBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appBarTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.2,
    },

    // Error
    errorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 20,
        padding: 14,
        marginBottom: 12,
        ...editorialShadow,
    },
    errorContent: {
        flex: 1,
        marginLeft: 10,
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
        lineHeight: 19,
        color: Colors.textSecondary,
    },

    // Warning banner (chưa verified)
    warningCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.primary + '10',
        borderRadius: 14,
        paddingVertical: 14,
        paddingRight: 14,
        paddingLeft: 18,
        marginBottom: 12,
        position: 'relative',
        overflow: 'hidden',
    },
    warningStripe: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: Colors.primary,
    },
    warningContent: { flex: 1, marginLeft: 12 },
    warningTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: 0.1,
    },
    warningText: {
        marginTop: 4,
        fontSize: 12,
        lineHeight: 18,
        color: Colors.text,
    },

    // Stats grid
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 18,
        padding: 14,
        ...editorialShadow,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    statValue: {
        marginTop: 4,
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.4,
    },

    // Revenue full-width
    revenueCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 18,
        padding: 18,
        marginBottom: 16,
        position: 'relative',
        overflow: 'hidden',
        ...editorialShadow,
    },
    revenueEyebrow: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
    },
    revenueValue: {
        marginTop: 8,
        fontSize: 26,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: -0.5,
    },
    revenueCaption: {
        marginTop: 6,
        maxWidth: '78%',
        fontSize: 12,
        lineHeight: 18,
        color: Colors.textSecondary,
    },
    revenueBgIcon: {
        position: 'absolute',
        right: -12,
        bottom: -16,
        opacity: 0.6,
    },

    // Create CTA button
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        borderRadius: 18,
        padding: 16,
        marginBottom: 24,
        ...editorialShadow,
    },
    createBtnDisabled: {
        backgroundColor: Colors.surfaceDim,
    },
    createBtnContent: { flex: 1, marginLeft: 12 },
    createBtnTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.onPrimary,
        letterSpacing: 0.2,
    },
    createBtnTitleDisabled: {
        color: Colors.textSecondary,
    },
    createBtnSub: {
        marginTop: 2,
        fontSize: 11,
        color: Colors.onPrimary + 'CC',
        fontWeight: '500',
    },
    createBtnSubDisabled: {
        color: Colors.textSecondary,
    },

    // Section title
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.3,
        marginBottom: 10,
        marginTop: 4,
    },

    // Custom segmented period selector
    periodSegment: {
        flexDirection: 'row',
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 12,
        padding: 4,
        marginBottom: 12,
    },
    periodTab: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    periodTabActive: {
        backgroundColor: Colors.surfaceContainerLowest,
        ...editorialShadow,
    },
    periodTabText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    periodTabTextActive: {
        color: Colors.text,
    },

    // Chart card
    chartCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 18,
        padding: 14,
        marginBottom: 16,
        ...editorialShadow,
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    barLabel: {
        width: 60,
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    barTrack: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.surfaceContainerLow,
        marginHorizontal: 10,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 4,
    },
    barValueWrap: {
        width: 92,
        alignItems: 'flex-end',
    },
    barValue: {
        fontSize: 11,
        fontWeight: '800',
        color: Colors.text,
    },
    barSub: {
        marginTop: 2,
        fontSize: 10,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    emptyChartText: {
        fontSize: 13,
        lineHeight: 20,
        color: Colors.textSecondary,
        textAlign: 'center',
        paddingVertical: 16,
    },

    // Drawer
    backdrop: {
        backgroundColor: '#00000066',
    },
    drawer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: DRAWER_WIDTH,
        backgroundColor: Colors.surfaceContainerLowest,
        ...editorialShadow,
    },
    drawerHeader: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        paddingBottom: 22,
    },
    drawerCloseBtn: {
        position: 'absolute',
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ffffff20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    drawerAvatar: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: Colors.onPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    drawerName: {
        fontSize: 18,
        fontWeight: '900',
        color: Colors.onPrimary,
        letterSpacing: -0.2,
    },
    drawerRole: {
        marginTop: 3,
        fontSize: 12,
        color: Colors.onPrimary + 'BF',
        fontWeight: '600',
    },
    drawerStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        marginTop: 12,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 9999,
        borderWidth: 1,
    },
    drawerStatusVerified: {
        backgroundColor: '#ffffff14',
        borderColor: '#ffffff35',
    },
    drawerStatusPending: {
        backgroundColor: Colors.star + '22',
        borderColor: Colors.star + '55',
    },
    drawerStatusText: {
        fontSize: 11,
        fontWeight: '800',
        color: Colors.onPrimary,
        letterSpacing: 0.2,
    },

    // Sidebar items
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: 14,
    },
    sidebarItemText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
    },
    sidebarBadge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 9999,
        marginRight: 4,
    },
    sidebarBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.onPrimary,
        letterSpacing: 0.4,
    },
    sidebarDivider: {
        height: 1,
        marginHorizontal: 20,
        marginVertical: 6,
        backgroundColor: Colors.outlineVariant + '70',
    },
});
