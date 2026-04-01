import { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import authFetch, {
    clearSession,
    getApiErrorMessage,
    storeUser,
} from '../utils/api';
import { endpoints } from '../configs';
import { FadeInDown } from '../utils/animations';
import Colors from '../styles/colors';
import { editorialShadow } from '../styles/theme';
import { formatCurrency, getDisplayName } from '../utils/format';

const defaultStats = {
    total_dishes: 0,
    total_orders: 0,
    revenue: 0,
};

const ChefHome = ({ navigation }) => {
    const tabBarHeight = useBottomTabBarHeight();
    const [stats, setStats] = useState(defaultStats);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const resetToLogin = useCallback(async () => {
        await clearSession();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }, [navigation]);

    const loadDashboard = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true);
        else setRefreshing(true);

        try {
            const [userRes, statsRes] = await Promise.all([
                authFetch(endpoints['current-user']),
                authFetch(endpoints['stats']),
            ]);

            if (userRes.status === 401 || statsRes.status === 401) {
                await resetToLogin();
                return;
            }

            if (!userRes.ok) {
                throw new Error(await getApiErrorMessage(userRes, 'Không thể tải thông tin đầu bếp'));
            }
            if (!statsRes.ok) {
                throw new Error(await getApiErrorMessage(statsRes, 'Không thể tải bảng điều khiển bếp'));
            }

            const [userData, statsData] = await Promise.all([userRes.json(), statsRes.json()]);
            setUser(userData);
            await storeUser(userData);
            setStats({ ...defaultStats, ...statsData });
            setError('');
        } catch (err) {
            setStats(defaultStats);
            setError(err.message || 'Không thể tải bảng điều khiển bếp');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [resetToLogin]);

    useFocusEffect(useCallback(() => {
        loadDashboard(true);
    }, [loadDashboard]));

    if (loading) {
        return (
            <ActivityIndicator
                size="large"
                color={Colors.primary}
                style={styles.loading}
            />
        );
    }

    const portionsSold = Number(stats.total_orders) || 0;
    const averageRevenue = portionsSold > 0 ? Number(stats.revenue) / portionsSold : 0;

    const statCards = [
        {
            key: 'dishes',
            icon: 'silverware-fork-knife',
            label: 'Món đang quản lý',
            value: `${Number(stats.total_dishes) || 0}`,
            tone: Colors.primary,
        },
        {
            key: 'portions',
            icon: 'food-takeout-box-outline',
            label: 'Suất đã bán',
            value: `${portionsSold}`,
            tone: Colors.success,
        },
        {
            key: 'avg',
            icon: 'cash-fast',
            label: 'Doanh thu / suất',
            value: formatCurrency(averageRevenue),
            tone: Colors.text,
        },
    ];

    const quickActions = [
        {
            key: 'create',
            icon: 'plus-circle-outline',
            title: user?.is_verified ? 'Tạo món mới' : 'Mở hồ sơ',
            subtitle: user?.is_verified
                ? 'Thêm món mới vào menu đang vận hành.'
                : 'Quyền tạo món được quản lý trong phần hồ sơ đầu bếp.',
            onPress: () => navigation.navigate(user?.is_verified ? 'CreateDish' : 'Profile'),
        },
        {
            key: 'dishes',
            icon: 'clipboard-text-outline',
            title: 'Quản lý món',
            subtitle: 'Rà soát giá, thời gian chuẩn bị và nội dung hiển thị.',
            onPress: () => navigation.navigate('MyDishes'),
        },
        {
            key: 'profile',
            icon: 'account-cog-outline',
            title: 'Cập nhật hồ sơ',
            subtitle: 'Kiểm tra số điện thoại, địa chỉ và trạng thái tài khoản.',
            onPress: () => navigation.navigate('Profile'),
        },
    ];

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 32 }]}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => loadDashboard(false)}
                    tintColor={Colors.primary}
                />
            }>
            <FadeInDown duration={500} style={styles.hero}>
                <View style={styles.heroTop}>
                    <View style={styles.heroBadge}>
                        <MaterialCommunityIcons
                            name="chef-hat"
                            size={18}
                            color={Colors.onPrimary}
                        />
                        <Text style={styles.heroBadgeText}>Khu vực bếp</Text>
                    </View>
                </View>

                <Text style={styles.greeting}>
                    Xin chào, {getDisplayName(user, 'đầu bếp')}.
                </Text>
                <Text style={styles.subGreeting}>
                    Theo dõi hiệu suất món ăn, trạng thái tài khoản và doanh thu từ các món bạn phụ trách.
                </Text>
            </FadeInDown>

            {error ?
                <View style={styles.errorCard}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={20} color={Colors.primary} />
                    <View style={styles.errorContent}>
                        <Text style={styles.errorTitle}>Không tải được bảng điều khiển</Text>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => loadDashboard(true)}>
                        <Text style={styles.retryText}>Thử lại</Text>
                    </TouchableOpacity>
                </View> :
                null}

            <FadeInDown duration={500} style={styles.statsSection}>
                {statCards.map((card) => (
                    <View
                        key={card.key}
                        style={[styles.statCard, card.key === 'avg' && styles.statCardWide]}>
                        <View style={[styles.statIcon, { backgroundColor: `${card.tone}16` }]}>
                            <MaterialCommunityIcons name={card.icon} size={22} color={card.tone} />
                        </View>
                        <Text style={styles.statValue}>{card.value}</Text>
                        <Text style={styles.statLabel}>{card.label}</Text>
                    </View>
                ))}
            </FadeInDown>

            <FadeInDown duration={500} style={styles.revenueCard}>
                <View>
                    <Text style={styles.sectionEyebrow}>Doanh thu hiện có</Text>
                    <Text style={styles.revenueValue}>{formatCurrency(stats.revenue)}</Text>
                    <Text style={styles.revenueCaption}>
                        Số liệu được cộng từ các món do bạn trực tiếp phụ trách trong đơn hàng.
                    </Text>
                </View>
                <View style={styles.revenueIconWrap}>
                    <MaterialCommunityIcons name="cash-register" size={28} color={Colors.primary} />
                </View>
            </FadeInDown>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Tác vụ nên làm tiếp theo</Text>
                <Text style={styles.sectionSubtitle}>
                    Chuẩn hóa menu theo đúng thông tin món, giá bán và thời gian chuẩn bị.
                </Text>
            </View>

            {quickActions.map((action) => (
                <TouchableOpacity
                    key={action.key}
                    style={styles.actionCard}
                    activeOpacity={0.8}
                    onPress={action.onPress}>
                    <View style={styles.actionIcon}>
                        <MaterialCommunityIcons name={action.icon} size={22} color={Colors.primary} />
                    </View>
                    <View style={styles.actionContent}>
                        <Text style={styles.actionTitle}>{action.title}</Text>
                        <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textSecondary} />
                </TouchableOpacity>
            ))}

            <View style={styles.noteCard}>
                <Text style={styles.noteTitle}>Chuẩn nghiệp vụ đang áp dụng</Text>
                <Text style={styles.noteItem}>Tên món, giá bán và thời gian chuẩn bị phải đầy đủ, dễ hiểu.</Text>
                <Text style={styles.noteItem}>Danh mục và menu cần khớp với món để khách tìm kiếm chính xác.</Text>
                <Text style={styles.noteItem}>Quyền tạo món và thông tin xác minh tài khoản được quản lý tập trung trong phần hồ sơ.</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    content: {
        padding: 20,
        paddingBottom: 32,
    },
    loading: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    hero: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        ...editorialShadow,
    },
    heroTop: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        borderRadius: 9999,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    heroBadgeText: {
        marginLeft: 6,
        color: Colors.onPrimary,
        fontSize: 13,
        fontWeight: '700',
    },
    greeting: {
        marginTop: 16,
        fontSize: 28,
        lineHeight: 34,
        fontWeight: '800',
        color: Colors.text,
    },
    subGreeting: {
        marginTop: 10,
        fontSize: 14,
        lineHeight: 22,
        color: Colors.textSecondary,
    },
    errorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        ...editorialShadow,
    },
    errorContent: {
        flex: 1,
        marginLeft: 12,
        marginRight: 12,
    },
    errorTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
    },
    errorText: {
        marginTop: 4,
        fontSize: 13,
        lineHeight: 20,
        color: Colors.textSecondary,
    },
    retryBtn: {
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    retryText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
    },
    statsSection: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    statCard: {
        width: '48.5%',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        padding: 18,
        marginBottom: 12,
        ...editorialShadow,
    },
    statCardWide: {
        width: '100%',
    },
    statIcon: {
        width: 42,
        height: 42,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statValue: {
        marginTop: 18,
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
    },
    statLabel: {
        marginTop: 6,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.textSecondary,
    },
    revenueCard: {
        marginTop: 4,
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...editorialShadow,
    },
    sectionEyebrow: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.8,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
    },
    revenueValue: {
        marginTop: 8,
        fontSize: 30,
        fontWeight: '800',
        color: Colors.primary,
    },
    revenueCaption: {
        marginTop: 10,
        maxWidth: '88%',
        fontSize: 13,
        lineHeight: 20,
        color: Colors.textSecondary,
    },
    revenueIconWrap: {
        width: 54,
        height: 54,
        borderRadius: 18,
        backgroundColor: `${Colors.primary}12`,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionHeader: {
        marginTop: 24,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
    },
    sectionSubtitle: {
        marginTop: 6,
        fontSize: 14,
        lineHeight: 21,
        color: Colors.textSecondary,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        padding: 16,
        marginTop: 12,
        ...editorialShadow,
    },
    actionIcon: {
        width: 46,
        height: 46,
        borderRadius: 16,
        backgroundColor: Colors.surfaceContainerLow,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionContent: {
        flex: 1,
        marginLeft: 14,
        marginRight: 10,
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
    },
    actionSubtitle: {
        marginTop: 4,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.textSecondary,
    },
    noteCard: {
        marginTop: 24,
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        padding: 20,
        ...editorialShadow,
    },
    noteTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 10,
    },
    noteItem: {
        fontSize: 14,
        lineHeight: 22,
        color: Colors.textSecondary,
        marginTop: 6,
    },
});

export default ChefHome;
