import { StyleSheet } from 'react-native';
import Colors from '@styles/colors';
import { editorialShadow } from '@styles/theme';

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surfaceContainerLowest,
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 20,
        overflow: 'hidden',
        ...editorialShadow,
    },
    cardContent: {
        flexDirection: 'row',
        padding: 12,
    },
    dishImg: {
        width: 100,
        height: 100,
        borderRadius: 16,
    },
    placeholder: {
        backgroundColor: Colors.surfaceContainerLow,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardBody: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    dishName: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.text,
        lineHeight: 20,
        flex: 1,
        marginRight: 8,
    },
    dishPrice: {
        fontSize: 15,
        color: Colors.primary,
        fontWeight: '800',
    },
    metaRow: {
        flexDirection: 'row',
        marginTop: 6,
    },
    metricChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLow,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 9999,
        marginRight: 6,
    },
    metricText: {
        fontSize: 11,
        color: Colors.text,
        marginLeft: 4,
        fontWeight: '700',
    },
    cardActions: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 6,
    },
    actionBtn: {
        flex: 1,
        borderRadius: 14,
    },
    actionBtnLabel: {
        fontWeight: '700',
        fontSize: 12,
        marginVertical: 4,
        marginHorizontal: 0,
    },
    featuredCard: {
        width: 260,
        backgroundColor: Colors.surfaceContainerLowest,
        marginLeft: 16,
        marginVertical: 8,
        borderRadius: 24,
        overflow: 'hidden',
        ...editorialShadow,
    },
    featuredImg: {
        width: '100%',
        height: 140,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    featuredPlaceholder: {
        width: '100%',
        height: 140,
        backgroundColor: Colors.surfaceContainerLow,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    featuredBody: {
        padding: 14,
    },
    featuredTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    featuredDishName: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
        lineHeight: 22,
        flex: 1,
        marginRight: 8,
    },
    featuredDishPrice: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: '800',
    },
    featuredMetaRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
});

export default styles;
