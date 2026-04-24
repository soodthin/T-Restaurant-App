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
        padding: 20,
        paddingBottom: 36,
    },
    loading: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
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
    stateBtn: {
        marginTop: 18,
    },
    hero: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        padding: 20,
        ...editorialShadow,
    },
    heroEyebrow: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        color: Colors.primary,
    },
    heroTitle: {
        marginTop: 8,
        fontSize: 28,
        lineHeight: 34,
        fontWeight: '800',
        color: Colors.text,
    },
    heroSubtitle: {
        marginTop: 10,
        fontSize: 14,
        lineHeight: 22,
        color: Colors.textSecondary,
    },
    inlineError: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginTop: 12,
    },
    inlineErrorText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.text,
    },
    imagePicker: {
        marginTop: 16,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: Colors.surfaceContainerLowest,
        ...editorialShadow,
    },
    imagePreview: {
        width: '100%',
        height: 220,
    },
    imagePlaceholder: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    imageTitle: {
        marginTop: 10,
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    imageSubtitle: {
        marginTop: 6,
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
        color: Colors.textSecondary,
    },
    sectionCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        padding: 18,
        marginTop: 16,
        ...editorialShadow,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 14,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.7,
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    formInput: {
        marginBottom: 10,
    },
    multilineInput: {
        minHeight: 100,
    },
    errorText: {
        marginBottom: 10,
        fontSize: 12,
        lineHeight: 18,
        color: Colors.primary,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfField: {
        width: '48%',
    },
    chipRow: {
        paddingBottom: 4,
    },
    selectionChip: {
        marginRight: 8,
    },
    previewCard: {
        marginTop: 16,
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        padding: 20,
        ...editorialShadow,
    },
    previewEyebrow: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    previewName: {
        marginTop: 8,
        fontSize: 24,
        lineHeight: 30,
        fontWeight: '800',
        color: Colors.text,
    },
    previewSubtitle: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 22,
        color: Colors.textSecondary,
    },
    previewMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        marginBottom: 8,
    },
    previewMetaCard: {
        width: '48%',
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 18,
        padding: 14,
    },
    previewMetaLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    previewMetaValue: {
        marginTop: 6,
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
    },
    previewInfo: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 20,
        color: Colors.textSecondary,
    },
    submitAction: {
        marginTop: 18,
    },
});
