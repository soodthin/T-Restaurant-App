import { StyleSheet, Dimensions } from 'react-native';
import Colors from '@styles/colors';
import { editorialShadow } from '@styles/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_HEIGHT = 300;
const GALLERY_GAP = 8;
const GALLERY_ITEM_W = (SCREEN_W - 32 - GALLERY_GAP) / 2;

export default StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },

    // Hero carousel
    hero: {
        width: SCREEN_W,
        height: HERO_HEIGHT,
        backgroundColor: Colors.surfaceDim,
    },
    heroImage: {
        width: SCREEN_W,
        height: HERO_HEIGHT,
    },
    heroOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 90,
        backgroundColor: '#00000040',
    },
    heroCounter: {
        position: 'absolute',
        right: 16,
        top: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#00000080',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 9999,
    },
    heroCounterText: { color: Colors.onPrimary, fontSize: 11, fontWeight: '700' },
    heroDots: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 5,
    },
    heroDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ffffff66',
    },
    heroDotActive: {
        width: 18,
        backgroundColor: Colors.onPrimary,
    },

    // Floating back button
    backBtn: {
        position: 'absolute',
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surfaceContainerLowest + 'E6',
        justifyContent: 'center',
        alignItems: 'center',
        ...editorialShadow,
    },

    // Info card overlapping hero
    infoCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        marginTop: -28,
        marginHorizontal: 16,
        borderRadius: 28,
        padding: 20,
        ...editorialShadow,
    },
    cuisinePill: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 9999,
        marginBottom: 10,
    },
    cuisineText: { color: Colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
    name: {
        fontSize: 26,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: 1.5,
    },
    tagline: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4,
        fontWeight: '600',
    },

    // Stats row
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 18,
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 8,
    },
    statBlock: {
        flex: 1,
        alignItems: 'center',
    },
    statIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    statValue: { fontSize: 16, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
    statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, fontWeight: '600' },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: Colors.outlineVariant + '60',
    },

    description: {
        fontSize: 13,
        lineHeight: 21,
        color: Colors.textSecondary,
        marginTop: 16,
        fontWeight: '500',
    },

    // Sections
    section: {
        paddingTop: 24,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.3,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 3,
        fontWeight: '500',
    },
    sectionIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Branch card
    branchCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        ...editorialShadow,
    },
    branchHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    branchTitleRow: { flex: 1, paddingRight: 8 },
    branchName: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.2,
    },
    primaryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginTop: 5,
    },
    primaryBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.primary, letterSpacing: 0.3 },
    distancePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.tertiaryLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    distanceText: { fontSize: 11, fontWeight: '700', color: Colors.tertiary },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginTop: 6,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 19,
        fontWeight: '500',
    },

    branchActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 14,
    },
    branchBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 12,
    },
    branchBtnGhost: {
        backgroundColor: Colors.tertiaryLight,
    },
    branchBtnSolid: {
        backgroundColor: Colors.primary,
    },
    branchBtnText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },

    // Gallery
    gallery: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: GALLERY_GAP,
    },
    galleryItemWrap: {
        width: GALLERY_ITEM_W,
    },
    galleryItem: {
        width: GALLERY_ITEM_W,
        aspectRatio: 1,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: Colors.surfaceDim,
        ...editorialShadow,
    },
    galleryImage: {
        width: '100%',
        height: '100%',
    },

    // Bottom CTA
    bottomBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: Colors.surfaceContainerLowest + 'F2',
        borderTopWidth: 1,
        borderTopColor: Colors.outlineVariant + '40',
    },
    bottomCta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: 18,
        ...editorialShadow,
    },
    bottomCtaText: {
        color: Colors.onPrimary,
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.4,
    },

    // Lightbox
    lightbox: {
        flex: 1,
        backgroundColor: '#000',
    },
    lightboxClose: {
        position: 'absolute',
        top: 48,
        right: 16,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ffffff20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    lightboxCounter: {
        position: 'absolute',
        top: 56,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 5,
    },
    lightboxCounterText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    lightboxSlide: {
        width: SCREEN_W,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lightboxImage: {
        width: SCREEN_W,
        height: '100%',
    },
});
