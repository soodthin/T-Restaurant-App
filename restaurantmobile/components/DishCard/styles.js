import { StyleSheet } from 'react-native';
import Colors from '@styles/colors';
import { editorialShadow } from '@styles/theme';

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surfaceContainerLowest,
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 24,
        overflow: 'hidden',
        ...editorialShadow,
    },
    dishImg: { width: '100%', height: 190, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    placeholder: { backgroundColor: Colors.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' },
    floatingBadge: {
        position: 'absolute',
        top: 160,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest + 'E6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    floatingBadgeText: { fontSize: 13, fontWeight: '700', color: Colors.text, marginLeft: 4 },
    cardBody: { padding: 18 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    dishName: { fontSize: 20, fontWeight: '800', color: Colors.text, lineHeight: 26 },
    dishMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 6 },
    dishPrice: { fontSize: 18, color: Colors.primary, fontWeight: '800' },
    badgeRow: { flexDirection: 'row', marginTop: 14 },
    metricChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLow,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 9999,
        marginRight: 8,
    },
    metricText: { fontSize: 12, color: Colors.text, marginLeft: 6, fontWeight: '600' },
    chefText: { fontSize: 13, color: Colors.textSecondary, marginTop: 12 },
    cardActions: { flexDirection: 'row', marginTop: 16, gap: 8 },
    actionBtn: { flex: 1, borderRadius: 20 },
    actionBtnLabel: { fontWeight: '700', fontSize: 14 },
});

export default styles;
