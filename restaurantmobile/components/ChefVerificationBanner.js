import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
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
                <Text variant="labelLarge" style={{ color: config.color }}>{config.title}</Text>
                <Text variant="bodySmall" style={styles.message}>{config.message}</Text>

                {actionLabel && onAction ?
                    <Button
                        mode="contained-tonal"
                        onPress={onAction}
                        compact
                        style={styles.actionBtn}
                        labelStyle={styles.actionLabel}
                        buttonColor={Colors.surfaceContainerLowest}
                        textColor={Colors.text}>
                        {actionLabel}
                    </Button> :
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
    message: {
        marginTop: 6,
        lineHeight: 20,
        color: Colors.textSecondary,
    },
    actionBtn: {
        alignSelf: 'flex-start',
        marginTop: 12,
        borderRadius: 9999,
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: '700',
    },
});

export default ChefVerificationBanner;
