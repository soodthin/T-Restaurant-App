import { StyleSheet } from 'react-native';
import Colors from '@styles/colors';

const styles = StyleSheet.create({
    sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
    sheetContainer: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingBottom: 40,
        maxHeight: '70%',
    },
    sheetHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.outlineVariant,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 20,
    },
    sheetSection: { marginBottom: 24 },
    sheetSectionTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 8 },
    sheetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.outlineVariant + '30',
    },
    sheetRowText: { fontSize: 16, color: Colors.text },
    sheetRowTextActive: { fontWeight: '700', color: Colors.primary },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: Colors.outlineVariant,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioActive: { borderColor: Colors.primary },
    radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },

    selectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginBottom: 12,
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.outlineVariant + '40',
    },
    selectRowLabel: { fontSize: 15, fontWeight: '700', color: Colors.text, flexShrink: 1 },
    selectRowValueWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        maxWidth: '60%',
    },
    selectRowValue: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
    selectRowActive: {
        borderColor: Colors.primary,
        borderWidth: 1.5,
        backgroundColor: Colors.primary + '12',
    },

    selectRowValueWrapActive: {
        flex: 1,
        maxWidth: '100%',
        justifyContent: 'space-between',
    },
    selectRowValueActive: { fontSize: 15, fontWeight: '700', flexShrink: 1 },


    dualRow: { flexDirection: 'row', gap: 10 },
    dualCol: { flex: 1 },


    sheetTopBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    sheetTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
    clearAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 9999,
        backgroundColor: Colors.primary,
    },
    clearAllText: { fontSize: 13, fontWeight: '700', color: Colors.onPrimary },


    subSheetContainer: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingBottom: 40,
        maxHeight: '60%',
        marginTop: 'auto',
    },
});

export default styles;
