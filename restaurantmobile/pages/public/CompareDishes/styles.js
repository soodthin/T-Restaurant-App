import { StyleSheet, Platform } from 'react-native';
import Colors from '@styles/colors';


const cellShadow = Platform.select({
    ios: {
        shadowColor: '#271816',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
    },
    android: { elevation: 1 },
    default: {},
});

export default StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    scrollContent: {
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 24,
    },


    imageRow: {
        flexDirection: 'row',
        gap: 8,
    },
    imageCellWrap: {
        flex: 1,
        position: 'relative',
    },
    imageBg: {
        width: '100%',
        height: 90,
        backgroundColor: Colors.primaryLight,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    dishImage: {
        width: '100%',
        height: '100%',
    },
    removeBtn: {
        position: 'absolute',
        top: -6,
        right: -6,
        zIndex: 10,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#4A4A4A',
        borderWidth: 2,
        borderColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },


    nameRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
        marginBottom: 4,
    },
    nameCell: {
        flex: 1,
        paddingHorizontal: 4,
    },
    dishName: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.text,
        textAlign: 'center',
        lineHeight: 18,
        minHeight: 36,
    },


    row: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 4,
    },
    cell: {
        flex: 1,
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 14,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.outlineVariant + '40',
        ...cellShadow,
    },
    ingredientCell: {
        flex: 1,
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 14,
        padding: 10,
        alignItems: 'stretch',
        borderWidth: 1,
        borderColor: Colors.outlineVariant + '40',
        ...cellShadow,
    },


    criteriaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 6,
        paddingHorizontal: 4,
    },
    criteriaLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginLeft: 6,
    },


    value: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.text,
        textAlign: 'center',
    },
    valueBest: {
        color: Colors.success,
    },
    subValue: {
        fontSize: 11,
        color: Colors.textSecondary,
        marginTop: 2,
        fontWeight: '600',
    },
    ratingValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },


    bestBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.success + '18',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 8,
        marginTop: 6,
    },
    bestBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: Colors.success,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        marginLeft: 3,
    },


    ingredientPreview: {
        width: '100%',
        alignItems: 'stretch',
    },
    previewChip: {
        backgroundColor: Colors.surfaceContainerHigh,
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 6,
        marginBottom: 6,
    },
    previewChipText: {
        fontSize: 11,
        color: Colors.text,
        fontWeight: '600',
        textAlign: 'center',
    },
    moreBtn: {
        marginTop: 2,
        paddingVertical: 7,
        backgroundColor: Colors.primaryLight,
        borderRadius: 10,
    },
    moreBtnText: {
        fontSize: 11,
        fontWeight: '800',
        color: Colors.primary,
        textAlign: 'center',
    },
    emptyHint: {
        fontSize: 11,
        color: Colors.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 8,
    },


    buttonRow: { marginTop: 10 },
    btnCell: { flex: 1 },
    cartBtn: { width: '100%', borderRadius: 12 },
    cartBtnContent: { paddingVertical: 2 },
    cartBtnLabel: { fontSize: 13, fontWeight: '800', marginVertical: 6, marginHorizontal: 0 },


    dialog: {
        backgroundColor: Colors.card,
        borderRadius: 24,
    },
    dialogTitle: {
        fontWeight: '800',
        color: Colors.text,
    },
    dialogSection: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.7,
        marginBottom: 10,
    },
    ingredientsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    dialogChip: {
        backgroundColor: Colors.surfaceContainerLow,
    },
    dialogChipText: { fontSize: 13 },
    descriptionBlock: { marginTop: 18 },
    descriptionText: {
        fontSize: 14,
        color: Colors.text,
        lineHeight: 21,
    },


    actionBtn: { marginTop: 18, borderRadius: 20 },
    centerState: {
        flex: 1,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stateTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 18 },
    stateText: { fontSize: 15, color: Colors.textSecondary, marginTop: 10, textAlign: 'center', lineHeight: 22 },
});
