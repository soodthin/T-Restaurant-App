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
    rangeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    rangeInput: { flex: 1, backgroundColor: Colors.surfaceContainerLowest, height: 48 },
    rangeOutline: { borderRadius: 14, borderColor: Colors.outline, borderWidth: 1.5 },
    rangeSeparator: { marginHorizontal: 10, color: Colors.textSecondary, fontWeight: '700' },
    rangeActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
});

export default styles;
