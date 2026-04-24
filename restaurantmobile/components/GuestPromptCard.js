import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@styles/colors';
import { editorialShadow } from '@styles/theme';

const GuestPromptCard = ({
    icon = 'account-lock-outline',
    eyebrow = 'KHÁCH VÃNG LAI',
    title,
    description,
    primaryLabel = 'Đăng nhập',
    onPrimary,
    secondaryLabel = 'Tạo tài khoản',
    onSecondary,
    style,
}) => (
    <View style={[styles.card, style]}>
        <View style={styles.iconWrap}>
            <MaterialCommunityIcons name={icon} size={24} color={Colors.primary} />
        </View>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <View style={styles.actions}>
            {onPrimary ? (
                <TouchableOpacity style={styles.primaryBtn} onPress={onPrimary} activeOpacity={0.85}>
                    <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
                </TouchableOpacity>
            ) : null}

            {onSecondary ? (
                <TouchableOpacity style={styles.secondaryBtn} onPress={onSecondary} activeOpacity={0.8}>
                    <Text style={styles.secondaryBtnText}>{secondaryLabel}</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    </View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        padding: 20,
        ...editorialShadow,
    },
    iconWrap: {
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    eyebrow: {
        color: Colors.primary,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    title: {
        marginTop: 8,
        fontSize: 22,
        lineHeight: 28,
        fontWeight: '800',
        color: Colors.text,
    },
    description: {
        marginTop: 10,
        fontSize: 14,
        lineHeight: 22,
        color: Colors.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 18,
    },
    primaryBtn: {
        backgroundColor: Colors.primary,
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 13,
        marginRight: 10,
        marginBottom: 10,
    },
    primaryBtnText: {
        color: Colors.onPrimary,
        fontSize: 14,
        fontWeight: '800',
    },
    secondaryBtn: {
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 13,
        marginBottom: 10,
    },
    secondaryBtnText: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: '700',
    },
});

export default GuestPromptCard;
