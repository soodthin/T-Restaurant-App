import { StyleSheet } from 'react-native';
import Colors from '@styles/colors';
import { editorialShadow } from '@styles/theme';

export default StyleSheet.create({
    keyboard: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    scroll: {
        backgroundColor: Colors.surface,
    },
    container: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    loading: {
        flex: 1,
        backgroundColor: Colors.surface,
    },

    // Center state (loadError / not verified)
    centerState: {
        flex: 1,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
    },
    stateTitle: {
        marginTop: 16,
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
        textAlign: 'center',
    },
    stateText: {
        marginTop: 10,
        fontSize: 15,
        lineHeight: 22,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    stateBtn: { marginTop: 18 },

    // Hero
    hero: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        padding: 18,
        ...editorialShadow,
    },
    heroRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    heroEyebrow: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: Colors.primary,
    },
    heroTitle: {
        marginTop: 6,
        fontSize: 22,
        lineHeight: 27,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: -0.4,
    },
    heroIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroSubtitle: {
        marginTop: 10,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.textSecondary,
    },

    // Inline error banner (load lỗi)
    inlineError: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginTop: 12,
    },
    inlineErrorText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.text,
    },

    // Section label (above image picker / preview)
    sectionLabel: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.text,
        marginTop: 18,
        marginBottom: 10,
        marginLeft: 4,
        letterSpacing: -0.2,
    },

    // Image picker
    imagePicker: {
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: Colors.surfaceContainerLowest,
        ...editorialShadow,
    },
    imagePickerDashed: {
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: Colors.outlineVariant,
    },
    imagePreview: {
        width: '100%',
        height: 200,
    },
    imagePlaceholder: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    cameraCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    imageTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.2,
    },
    imageSubtitle: {
        marginTop: 4,
        fontSize: 12,
        lineHeight: 18,
        textAlign: 'center',
        color: Colors.textSecondary,
    },

    // Section card (Thông tin chính, Phân loại)
    sectionCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        padding: 16,
        marginTop: 16,
        ...editorialShadow,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 12,
        letterSpacing: -0.3,
    },

    // Inputs + labels
    label: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
        color: Colors.textSecondary,
        marginBottom: 6,
        marginLeft: 2,
        textTransform: 'uppercase',
    },
    formInput: {
        marginBottom: 8,
    },
    multilineInput: {
        minHeight: 90,
    },
    errorText: {
        marginBottom: 8,
        fontSize: 12,
        lineHeight: 18,
        color: Colors.primary,
        marginLeft: 4,
    },

    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    halfField: {
        flex: 1,
    },

    // Chip selection (menu / category)
    chipRow: {
        paddingVertical: 4,
        paddingRight: 4,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.outline,
        backgroundColor: Colors.surfaceContainerLowest,
    },
    chipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.text,
    },
    chipTextActive: {
        color: Colors.onPrimary,
    },

    // Preview compact card
    previewCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 20,
        padding: 12,
        ...editorialShadow,
    },
    previewThumb: {
        width: 80,
        height: 80,
        borderRadius: 16,
        backgroundColor: Colors.surfaceContainerLow,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewThumbImg: {
        width: '100%',
        height: '100%',
    },
    previewBody: {
        flex: 1,
        gap: 2,
    },
    previewName: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.2,
    },
    previewDesc: {
        fontSize: 11,
        lineHeight: 15,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    previewFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    previewPrice: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: -0.2,
    },
    previewTimePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.surfaceContainerLow,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    previewTimeText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textSecondary,
    },

    // Sticky bottom CTA
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
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: 999,
        ...editorialShadow,
    },
    submitBtnDisabled: {
        opacity: 0.7,
    },
    submitBtnText: {
        color: Colors.onPrimary,
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.4,
    },
});
