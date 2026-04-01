import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../styles/colors';

const ChefVerificationBanner = ({
    verified,
    title,
    message,
    actionLabel,
    onAction,
    style,
}) => {
    const config = verified
        ? {
            icon: 'check-decagram-outline',
            color: Colors.success,
            bg: `${Colors.success}14`,
            title: title || 'Tài khoản đầu bếp đã được duyệt',
            message: message || 'Bạn có thể tạo món mới và quản lý khu vực bếp bình thường.',
        }
        : {
            icon: 'clock-outline',
            color: Colors.star,
            bg: `${Colors.star}16`,
            title: title || 'Tài khoản đang chờ duyệt',
            message: message || 'Hoàn thiện hồ sơ liên hệ và chờ quản trị viên kích hoạt quyền vận hành bếp.',
        };

    return (
        <View style={[styles.banner, { backgroundColor: config.bg }, style]}>
            <View style={[styles.iconWrap, { backgroundColor: `${config.color}24` }]}>
                <MaterialCommunityIcons name={config.icon} size={22} color={config.color} />
            </View>

            <View style={styles.content}>
                <Text style={[styles.title, { color: config.color }]}>{config.title}</Text>
                <Text style={styles.message}>{config.message}</Text>

                {actionLabel && onAction ?
                    <TouchableOpacity style={styles.actionBtn} onPress={onAction} activeOpacity={0.8}>
                        <Text style={styles.actionText}>{actionLabel}</Text>
                    </TouchableOpacity> :
                    null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderRadius: 20,
        padding: 16,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: { flex: 1 },
    title: { fontSize: 15, fontWeight: '800' },
    message: {
        marginTop: 6,
        fontSize: 13,
        lineHeight: 20,
        color: Colors.textSecondary,
    },
    actionBtn: {
        alignSelf: 'flex-start',
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 9999,
        backgroundColor: Colors.surfaceContainerLowest,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
    },
});

export default ChefVerificationBanner;
