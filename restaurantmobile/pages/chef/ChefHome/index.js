import { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Modal,
    Animated,
    Pressable,
    StyleSheet,
} from 'react-native';
import { ActivityIndicator, Button } from 'react-native-paper';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
    authFetch,
    endpoints,
    clearSession,
    getApiErrorMessage,
    storeUser,
} from '@configs';
import { ConfirmDialog } from '@components/CustomDialog';
import { FadeInDown } from '@utils/animations';
import Colors from '@styles/colors';
import { formatCurrency, getDisplayName } from '@utils/format';
import styles from './styles';

const DRAWER_WIDTH = 288;

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

const SidebarItem = ({ icon, title, color, badge, onPress }) => (
    <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={styles.sidebarItem}
    >
        <MaterialCommunityIcons name={icon} size={22} color={color} />
        <Text style={styles.sidebarItemText}>{title}</Text>
        {badge ? (
            <View style={styles.sidebarBadge}>
                <Text style={styles.sidebarBadgeText}>{badge}</Text>
            </View>
        ) : null}
        <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.outlineVariant} />
    </TouchableOpacity>
);

const ChefHome = ({ navigation }) => {
    const tabBarHeight = useBottomTabBarHeight();
    const insets = useSafeAreaInsets();
    const [stats, setStats] = useState(defaultStats);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [period, setPeriod] = useState('day');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [logoutConfirm, setLogoutConfirm] = useState(false);

    const drawerX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

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


            if (userRes.ok) {
                setUser(userRes.data);
                await storeUser(userRes.data);
            }

            if (statsRes.ok) {
                setStats({ ...defaultStats, ...statsRes.data });
                setError('');
            } else {
                setStats(defaultStats);
                setError(getApiErrorMessage(statsRes, 'Không thể tải bảng điều khiển bếp'));
            }


            if (!userRes.ok && !statsRes.ok) {
                setError(getApiErrorMessage(userRes, 'Không thể tải thông tin đầu bếp'));
            }
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
        if (next === period) return;
        setPeriod(next);
        loadDashboard(next, true);
    };

    const openDrawer = () => {
        setDrawerOpen(true);
        Animated.parallel([
            Animated.timing(drawerX, { toValue: 0, duration: 260, useNativeDriver: true }),
            Animated.timing(backdropOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
        ]).start();
    };

    const closeDrawer = (after) => {
        Animated.parallel([
            Animated.timing(drawerX, { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
            Animated.timing(backdropOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]).start(() => {
            setDrawerOpen(false);
            if (typeof after === 'function') after();
        });
    };

    const navigateThen = (screen) => () => closeDrawer(() => navigation.navigate(screen));

    const handleLogout = () => {
        closeDrawer(() => {
            setLogoutConfirm(true);
        });
    };

    const doLogout = async () => {
        setLogoutConfirm(false);
        await clearSession();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
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

    const isVerified = !!user?.is_verified;
    const portionsSold = Number(stats.total_orders) || 0;
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
        <View style={styles.container}>

            <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={openDrawer}
                    style={styles.appBarBtn}
                    hitSlop={8}
                >
                    <MaterialCommunityIcons name="menu" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.appBarTitle}>Thống kê bếp</Text>
                <View style={styles.appBarBtn} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 32 }]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadDashboard(period, false)}
                        tintColor={Colors.primary}
                    />
                }>

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


                {user && !isVerified && (
                    <FadeInDown duration={400} style={styles.warningCard}>
                        <View style={styles.warningStripe} />
                        <MaterialCommunityIcons
                            name="shield-alert-outline"
                            size={22}
                            color={Colors.primary}
                            style={{ marginTop: 1 }}
                        />
                        <View style={styles.warningContent}>
                            <Text style={styles.warningTitle}>Hạn chế quyền truy cập</Text>
                            <Text style={styles.warningText}>
                                Tài khoản cần được Admin phê duyệt trước khi có thể tạo và quản lý món ăn mới.
                            </Text>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate('Profile')}
                                style={styles.warningAction}
                            >
                                <Text style={styles.warningActionText}>Mở hồ sơ</Text>
                                <MaterialCommunityIcons name="arrow-right" size={14} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </FadeInDown>
                )}


                <FadeInDown duration={500} style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconWrap, { backgroundColor: Colors.primary + '16' }]}>
                            <MaterialCommunityIcons
                                name="silverware-fork-knife"
                                size={22}
                                color={Colors.primary}
                            />
                        </View>
                        <Text style={styles.statLabel}>Tổng món</Text>
                        <Text style={styles.statValue}>{Number(stats.total_dishes) || 0}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconWrap, { backgroundColor: Colors.success + '16' }]}>
                            <MaterialCommunityIcons
                                name="trending-up"
                                size={22}
                                color={Colors.success}
                            />
                        </View>
                        <Text style={styles.statLabel}>Tổng lượt đặt</Text>
                        <Text style={styles.statValue}>{portionsSold}</Text>
                    </View>
                </FadeInDown>


                <FadeInDown duration={500} style={styles.revenueCard}>
                    <View style={{ zIndex: 1 }}>
                        <Text style={styles.revenueEyebrow}>Tổng doanh thu</Text>
                        <Text style={styles.revenueValue}>{formatCurrency(stats.revenue)}</Text>
                        <Text style={styles.revenueCaption}>
                            Tổng hợp từ các món do bạn phụ trách trong đơn hàng.
                        </Text>
                    </View>
                    <MaterialCommunityIcons
                        name="cash-multiple"
                        size={110}
                        color={styles.revenueBgIcon.color}
                        style={styles.revenueBgIcon}
                    />
                </FadeInDown>


                {isVerified && (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('CreateDish')}
                        style={styles.createBtn}
                    >
                        <MaterialCommunityIcons
                            name="plus-circle-outline"
                            size={28}
                            color={Colors.onPrimary}
                        />
                        <View style={styles.createBtnContent}>
                            <Text style={styles.createBtnTitle}>Tạo món mới</Text>
                            <Text style={styles.createBtnSub}>Thêm món ăn mới vào thực đơn.</Text>
                        </View>
                    </TouchableOpacity>
                )}


                <Text style={styles.sectionTitle}>Doanh thu theo thời gian</Text>


                <View style={styles.periodSegment}>
                    {['day', 'week', 'month'].map((p) => {
                        const active = p === period;
                        return (
                            <TouchableOpacity
                                key={p}
                                activeOpacity={0.7}
                                onPress={() => onChangePeriod(p)}
                                style={[styles.periodTab, active && styles.periodTabActive]}
                            >
                                <Text style={[styles.periodTabText, active && styles.periodTabTextActive]}>
                                    {periodLabel[p]}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
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


                <Text style={styles.sectionTitle}>Top món theo doanh thu</Text>
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
            </ScrollView>


            <Modal
                visible={drawerOpen}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={() => closeDrawer()}
            >
                <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => closeDrawer()} />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.drawer,
                        { transform: [{ translateX: drawerX }] },
                    ]}
                >

                    <View style={[styles.drawerHeader, { paddingTop: insets.top + 24 }]}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => closeDrawer()}
                            style={[styles.drawerCloseBtn, { top: insets.top + 12 }]}
                        >
                            <MaterialCommunityIcons name="close" size={20} color={Colors.onPrimary} />
                        </TouchableOpacity>

                        <View style={styles.drawerAvatar}>
                            <MaterialCommunityIcons name="chef-hat" size={32} color={Colors.primary} />
                        </View>
                        <Text style={styles.drawerName}>{getDisplayName(user, 'Đầu bếp')}</Text>
                        <Text style={styles.drawerRole}>Quản lý khu vực Bếp</Text>

                        <View style={[styles.drawerStatus, isVerified ? styles.drawerStatusVerified : styles.drawerStatusPending]}>
                            <MaterialCommunityIcons
                                name={isVerified ? 'check-circle' : 'alert-circle-outline'}
                                size={13}
                                color={isVerified ? Colors.success : Colors.star}
                            />
                            <Text style={styles.drawerStatusText}>
                                {isVerified ? 'Đã xác minh' : 'Chờ duyệt'}
                            </Text>
                        </View>
                    </View>


                    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                        <SidebarItem
                            icon="receipt"
                            title="Quản lý đơn hàng"
                            color={Colors.primary}
                            onPress={navigateThen('ChefOrders')}
                        />
                        <SidebarItem
                            icon="silverware-fork-knife"
                            title="Quản lý món"
                            color={Colors.tertiary}
                            onPress={navigateThen('MyDishes')}
                        />
                        <SidebarItem
                            icon="star"
                            title="Đánh giá khách hàng"
                            color={Colors.star}
                            onPress={navigateThen('ChefReviews')}
                        />
                        {isVerified && (
                            <SidebarItem
                                icon="plus-circle-outline"
                                title="Tạo món mới"
                                color={Colors.success}
                                onPress={navigateThen('CreateDish')}
                            />
                        )}

                        <View style={styles.sidebarDivider} />

                        <SidebarItem
                            icon="account-cog-outline"
                            title="Cập nhật hồ sơ"
                            color={Colors.tertiary}
                            onPress={navigateThen('Profile')}
                        />
                        <SidebarItem
                            icon="logout"
                            title="Đăng xuất"
                            color={Colors.textSecondary}
                            onPress={handleLogout}
                        />
                    </ScrollView>
                </Animated.View>
            </Modal>

            <ConfirmDialog
                visible={logoutConfirm}
                type="warning"
                title="Đăng xuất"
                message="Bạn có chắc chắn muốn đăng xuất không?"
                onCancel={() => setLogoutConfirm(false)}
                onConfirm={doLogout}
                confirmText="Đăng xuất"
                cancelText="Hủy"
            />
        </View>
    );
};

export default ChefHome;
