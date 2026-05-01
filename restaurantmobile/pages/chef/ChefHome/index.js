import { useCallback, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { ActivityIndicator, Button, SegmentedButtons } from 'react-native-paper';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
    authFetch,
    endpoints,
    clearSession,
    getApiErrorMessage,
    storeUser,
} from '@configs';
import { FadeInDown } from '@utils/animations';
import Colors from '@styles/colors';
import { formatCurrency, getDisplayName } from '@utils/format';
import styles from './styles';

const defaultStats = {
    total_dishes: 0,
    total_orders: 0,
    revenue: 0,
    by_dish: [],
    series: [],
};

const periodLabel = {
    day: 'Ngày',
    week: 'Tuần',
    month: 'Tháng',
};

const formatPeriodLabel = (iso, period) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    if (period === 'month') {
        return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
};

const ChefHome = ({ navigation }) => {
    const tabBarHeight = useBottomTabBarHeight();
    const [stats, setStats] = useState(defaultStats);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [period, setPeriod] = useState('day');

    const resetToLogin = useCallback(async () => {
        await clearSession();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }, [navigation]);

    const loadDashboard = useCallback(async (currentPeriod = period, showLoader = true) => {
        if (showLoader) setLoading(true);
        else setRefreshing(true);

        try {
            const [userRes, statsRes] = await Promise.all([
                authFetch(endpoints['current-user']),
                authFetch(`${endpoints['stats']}?period=${currentPeriod}`),
            ]);

            if (userRes.status === 401 || statsRes.status === 401) {
                await resetToLogin();
                return;
            }

            if (!userRes.ok) {
                throw new Error(getApiErrorMessage(userRes, 'Không thể tải thông tin đầu bếp'));
            }
            if (!statsRes.ok) {
                throw new Error(getApiErrorMessage(statsRes, 'Không thể tải bảng điều khiển bếp'));
            }

            const userData = userRes.data;
            const statsData = statsRes.data;
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
    }, [period, resetToLogin]);

    useFocusEffect(useCallback(() => {
        loadDashboard(period, true);
    }, [loadDashboard, period]));

    const onChangePeriod = (next) => {
        setPeriod(next);
        loadDashboard(next, true);
    };

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
            key: 'reviews',
            icon: 'comment-text-multiple-outline',
            title: 'Đánh giá khách hàng',
            subtitle: 'Xem nhận xét của khách dành cho các món bạn phụ trách.',
            onPress: () => navigation.navigate('ChefReviews'),
        },
        {
            key: 'profile',
            icon: 'account-cog-outline',
            title: 'Cập nhật hồ sơ',
            subtitle: 'Kiểm tra số điện thoại, địa chỉ và trạng thái tài khoản.',
            onPress: () => navigation.navigate('Profile'),
        },
    ];

    const series = Array.isArray(stats.series) ? stats.series : [];
    const byDish = Array.isArray(stats.by_dish) ? stats.by_dish : [];
    const seriesMaxRevenue = series.reduce(
        (max, item) => Math.max(max, Number(item.revenue) || 0),
        0,
    );
    const topDishes = byDish.slice(0, 5);
    const topDishMaxRevenue = topDishes.reduce(
        (max, item) => Math.max(max, Number(item.revenue) || 0),
        0,
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 32 }]}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => loadDashboard(period, false)}
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
                    <Button
                        mode="contained-tonal"
                        buttonColor={Colors.surfaceContainerLow}
                        textColor={Colors.text}
                        compact
                        onPress={() => loadDashboard(period, true)}>
                        Thử lại
                    </Button>
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
                <Text style={styles.sectionTitle}>Doanh thu theo thời gian</Text>
                <Text style={styles.sectionSubtitle}>
                    Tổng hợp doanh thu và số suất bán trong 90 ngày gần nhất, gom theo {periodLabel[period].toLowerCase()}.
                </Text>
            </View>

            <View style={styles.periodRow}>
                <SegmentedButtons
                    value={period}
                    onValueChange={onChangePeriod}
                    buttons={[
                        { value: 'day', label: 'Ngày' },
                        { value: 'week', label: 'Tuần' },
                        { value: 'month', label: 'Tháng' },
                    ]}
                />
            </View>

            <View style={styles.chartCard}>
                {series.length === 0 ? (
                    <Text style={styles.emptyChartText}>
                        Chưa có dữ liệu doanh thu trong khoảng thời gian này.
                    </Text>
                ) : (
                    series.map((item) => {
                        const ratio = seriesMaxRevenue > 0
                            ? Math.max(0.04, Number(item.revenue) / seriesMaxRevenue)
                            : 0;
                        return (
                            <View key={item.period} style={styles.barRow}>
                                <Text style={styles.barLabel}>
                                    {formatPeriodLabel(item.period, period)}
                                </Text>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFill, { width: `${ratio * 100}%` }]} />
                                </View>
                                <View style={styles.barValueWrap}>
                                    <Text style={styles.barValue}>{formatCurrency(item.revenue)}</Text>
                                    <Text style={styles.barSub}>{item.orders} suất</Text>
                                </View>
                            </View>
                        );
                    })
                )}
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top món theo doanh thu</Text>
                <Text style={styles.sectionSubtitle}>
                    Xếp hạng các món bạn phụ trách theo doanh thu tổng cộng từ trước đến nay.
                </Text>
            </View>

            <View style={styles.chartCard}>
                {topDishes.length === 0 ? (
                    <Text style={styles.emptyChartText}>
                        Chưa có món nào phát sinh doanh thu.
                    </Text>
                ) : (
                    topDishes.map((item) => {
                        const ratio = topDishMaxRevenue > 0
                            ? Math.max(0.04, Number(item.revenue) / topDishMaxRevenue)
                            : 0;
                        return (
                            <View key={item.dish_id} style={styles.barRow}>
                                <Text style={styles.barLabel} numberOfLines={1}>
                                    {item.dish__name}
                                </Text>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFill, { width: `${ratio * 100}%` }]} />
                                </View>
                                <View style={styles.barValueWrap}>
                                    <Text style={styles.barValue}>{formatCurrency(item.revenue)}</Text>
                                    <Text style={styles.barSub}>{item.orders} suất</Text>
                                </View>
                            </View>
                        );
                    })
                )}
            </View>

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

export default ChefHome;
