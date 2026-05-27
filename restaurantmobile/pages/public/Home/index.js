import { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    RefreshControl,
    ScrollView,
    ImageBackground,
    Modal,
    Animated,
    Pressable,
    StyleSheet,
} from 'react-native';
import { Searchbar, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FadeInDown, FadeInUp, FadeIn } from '@utils/animations';
import { Apis, authFetch, clearSession, endpoints, getApiErrorMessage } from '@configs';
import { getDisplayName } from '@utils/format';
import Colors from '@styles/colors';
import { useCart } from '@contexts/CartContext';
import { ConfirmDialog, Toast } from '@components/CustomDialog';
import DishCard from '@components/DishCard';
import FilterSheet from '@components/FilterSheet';
import styles from './styles';

const sortOptions = [
    { key: '', label: 'Phổ biến' },
    { key: '-avg_rating', label: 'Đánh giá cao' },
    { key: 'price', label: 'Giá tăng' },
    { key: '-price', label: 'Giá giảm' },
    { key: 'name', label: 'Tên A-Z' },
];

const DRAWER_WIDTH = 288;

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

const Home = ({ navigation }) => {
    const { addItem } = useCart();
    const tabBarHeight = useBottomTabBarHeight();
    const [dishes, setDishes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [menus, setMenus] = useState([]);
    const [chefs, setChefs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [catId, setCatId] = useState(null);
    const [menuId, setMenuId] = useState(null);
    const [chefId, setChefId] = useState(null);
    const [ordering, setOrdering] = useState('');
    const [priceMin, setPriceMin] = useState(null);
    const [priceMax, setPriceMax] = useState(null);
    const [prepMin, setPrepMin] = useState(null);
    const [prepMax, setPrepMax] = useState(null);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(true);
    const [error, setError] = useState('');
    const [selectedCompareIds, setSelectedCompareIds] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });
    const [logoutConfirm, setLogoutConfirm] = useState(false);

    const insets = useSafeAreaInsets();
    const [user, setUser] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const drawerX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

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

    const loadUser = async () => {
        try {
            const res = await authFetch(endpoints['current-user']);
            if (res.ok) {
                setUser(res.data);
            }
        } catch (err) {
            // guest user
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
    };

    const buildUrl = (p, q, cat, menu, order, ranges = null, chef = chefId) => {
        const r = ranges || { pMin: priceMin, pMax: priceMax, tMin: prepMin, tMax: prepMax };
        const params = [`page=${p}`];
        if (q) params.push(`search=${encodeURIComponent(q.trim())}`);
        if (cat) params.push(`category_id=${cat}`);
        if (menu) params.push(`menu_id=${menu}`);
        if (chef) params.push(`chef_id=${chef}`);
        if (order) params.push(`ordering=${order}`);
        if (r.pMin) params.push(`price_min=${r.pMin}`);
        if (r.pMax) params.push(`price_max=${r.pMax}`);
        if (r.tMin) params.push(`prep_min=${r.tMin}`);
        if (r.tMax) params.push(`prep_max=${r.tMax}`);
        return `${endpoints['dishes']}?${params.join('&')}`;
    };

    const loadDishes = async (p = 1, q = search, cat = catId, menu = menuId, order = ordering, ranges = null, chef = chefId) => {
        if (p === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const res = await Apis.get(buildUrl(p, q, cat, menu, order, ranges, chef));
            if (!res.ok) {
                throw new Error(getApiErrorMessage(res, 'Kh\u00f4ng th\u1ec3 t\u1ea3i danh s\u00e1ch m\u00f3n \u0103n'));
            }

            const data = res.data;
            const results = data.results || [];
            setDishes((prev) => p === 1 ? results : [...prev, ...results]);
            setHasNext(Boolean(data.next));
            setError('');
        } catch (err) {
            if (p === 1) setDishes([]);
            setError(err.message || 'Kh\u00f4ng th\u1ec3 t\u1ea3i danh s\u00e1ch m\u00f3n \u0103n');
        } finally {
            if (p === 1) setLoading(false);
            else setLoadingMore(false);
        }
    };

    const loadFilters = async () => {
        try {
            const [categoryRes, menuRes, chefRes] = await Promise.all([
                Apis.get(endpoints['categories']),
                Apis.get(endpoints['menus']),
                Apis.get(endpoints['chefs']),
            ]);

            if (categoryRes.ok) {
                const categoryData = categoryRes.data;
                setCategories(Array.isArray(categoryData) ? categoryData : categoryData.results || []);
            }

            if (menuRes.ok) {
                const menuData = menuRes.data;
                setMenus(Array.isArray(menuData) ? menuData : menuData.results || []);
            }

            if (chefRes.ok) {
                const chefData = chefRes.data;
                setChefs(Array.isArray(chefData) ? chefData : chefData.results || []);
            }
        } catch (err) {
            setCategories([]);
            setMenus([]);
            setChefs([]);
        }
    };

    useEffect(() => {
        loadUser();
        loadFilters();
        loadDishes(1, '', null, null, '');
    }, []);


    const lastSearchedRef = useRef('');
    useEffect(() => {
        if (search === lastSearchedRef.current) return;
        const timer = setTimeout(() => {
            lastSearchedRef.current = search;
            setPage(1);
            loadDishes(1, search, catId, menuId, ordering);
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    const refresh = (next = {}) => {
        const nextSearch = next.search ?? search;
        const nextCategory = next.catId ?? catId;
        const nextMenu = next.menuId ?? menuId;
        const nextChef = next.chefId === undefined ? chefId : next.chefId;
        const nextOrdering = next.ordering ?? ordering;
        const nextPriceMin = next.priceMin === undefined ? priceMin : next.priceMin;
        const nextPriceMax = next.priceMax === undefined ? priceMax : next.priceMax;
        const nextPrepMin = next.prepMin === undefined ? prepMin : next.prepMin;
        const nextPrepMax = next.prepMax === undefined ? prepMax : next.prepMax;

        if (next.search !== undefined) setSearch(next.search);
        if (next.catId !== undefined) setCatId(next.catId);
        if (next.menuId !== undefined) setMenuId(next.menuId);
        if (next.chefId !== undefined) setChefId(next.chefId);
        if (next.ordering !== undefined) setOrdering(next.ordering);
        if (next.priceMin !== undefined) setPriceMin(next.priceMin);
        if (next.priceMax !== undefined) setPriceMax(next.priceMax);
        if (next.prepMin !== undefined) setPrepMin(next.prepMin);
        if (next.prepMax !== undefined) setPrepMax(next.prepMax);

        setPage(1);
        loadDishes(1, nextSearch, nextCategory, nextMenu, nextOrdering, {
            pMin: nextPriceMin,
            pMax: nextPriceMax,
            tMin: nextPrepMin,
            tMax: nextPrepMax,
        }, nextChef);
    };

    const loadMore = () => {
        if (!hasNext || loading || loadingMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        loadDishes(nextPage);
    };

    const onRefresh = async () => {
        setRefreshing(true);

        try {
            const [dishRes, categoryRes, menuRes, chefRes] = await Promise.all([
                Apis.get(buildUrl(1, '', null, null, '', null, null)),
                Apis.get(endpoints['categories']),
                Apis.get(endpoints['menus']),
                Apis.get(endpoints['chefs']),
            ]);


            lastSearchedRef.current = '';
            setSearch('');
            setCatId(null);
            setMenuId(null);
            setChefId(null);
            setOrdering('');
            setPriceMin(null);
            setPriceMax(null);
            setPrepMin(null);
            setPrepMax(null);
            setSelectedCompareIds([]);
            setError('');
            setPage(1);

            if (dishRes.ok) {
                const data = dishRes.data;
                setDishes(data.results || []);
                setHasNext(Boolean(data.next));
            }
            if (categoryRes.ok) {
                const categoryData = categoryRes.data;
                setCategories(Array.isArray(categoryData) ? categoryData : categoryData.results || []);
            }
            if (menuRes.ok) {
                const menuData = menuRes.data;
                setMenus(Array.isArray(menuData) ? menuData : menuData.results || []);
            }
            if (chefRes.ok) {
                const chefData = chefRes.data;
                setChefs(Array.isArray(chefData) ? chefData : chefData.results || []);
            }
        } catch (err) {

        } finally {
            setRefreshing(false);
        }
    };

    const toggleCompare = (dishId) => {
        setSelectedCompareIds((prev) => {
            if (prev.includes(dishId)) {
                return prev.filter((id) => id !== dishId);
            }
            const nextDish = dishes.find((dish) => dish.id === dishId);
            const firstDish = dishes.find((dish) => dish.id === prev[0]);
            if (firstDish && nextDish && firstDish.category !== nextDish.category) {
                showToast('Chỉ so sánh các món cùng loại', 'error');
                return prev;
            }
            if (prev.length >= 3) {
                showToast('Ch\u1ec9 n\u00ean so s\u00e1nh t\u1ed1i \u0111a 3 m\u00f3n c\u00f9ng l\u00fac', 'error');
                return prev;
            }
            return [...prev, dishId];
        });
    };

    const goToCompare = () => {
        if (selectedCompareIds.length < 2) {
            showToast('Ch\u1ecdn \u00edt nh\u1ea5t 2 m\u00f3n \u0111\u1ec3 so s\u00e1nh', 'error');
            return;
        }
        navigation.navigate('CompareDishes', { ids: selectedCompareIds });
    };

    const featuredDishes = dishes.slice(0, 5);
    const standardDishes = dishes.length > 5 ? dishes.slice(5) : [];

    const ListHeader = (
        <View>
            <FadeInDown duration={500}>
                <View style={styles.greetingCard}>
                    <ImageBackground
                        source={{ uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop' }}
                        style={styles.greetingBg}
                        resizeMode="cover"
                    >
                        <View style={styles.greetingOverlay}>
                            <View style={styles.greetingHeader}>
                                <TouchableOpacity onPress={openDrawer} style={styles.greetingIconWrap}>
                                    <MaterialCommunityIcons name="menu" size={24} color="#fff" />
                                </TouchableOpacity>
                                <View style={styles.greetingTextWrap}>
                                    <Text style={styles.greetingTitle}>Sài Gòn Savory</Text>
                                    <Text style={styles.greetingSubtitle}>Hôm nay bạn muốn ăn gì?</Text>
                                </View>
                            </View>
                        </View>
                    </ImageBackground>
                </View>
            </FadeInDown>

            <FadeIn delay={200} duration={400} style={styles.searchRow}>
                <Searchbar
                    placeholder={"Tìm món ăn, đầu bếp hoặc thực đơn..."}
                    value={search}
                    onChangeText={setSearch}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    loading={loading && search !== ''}
                    style={styles.searchbar}
                    inputStyle={{ color: Colors.text }}
                    placeholderTextColor={Colors.placeholder}
                    elevation={0}
                />
                {!searchFocused &&
                    <View>
                        <IconButton
                            icon="tune-variant"
                            mode="contained"
                            containerColor={Colors.primary}
                            iconColor={Colors.onPrimary}
                            size={22}
                            onPress={() => setShowFilters(true)}
                            style={styles.filterBtn}
                        />
                        {(ordering || priceMin || priceMax || prepMin || prepMax || menuId || chefId) ? (
                            <View pointerEvents="none" style={styles.filterDot} />
                        ) : null}
                    </View>
                }
            </FadeIn>

            {categories.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryChipsRow}>
                    {[{ id: null, name: 'Tất cả' }, ...categories].map((c) => {
                        const active = catId === c.id;
                        return (
                            <TouchableOpacity
                                key={c.id ?? '__all'}
                                activeOpacity={0.85}
                                onPress={() => refresh({ catId: c.id })}
                                style={[styles.chip, active && styles.chipActive]}>
                                <Text
                                    numberOfLines={1}
                                    style={[styles.chipText, active && styles.chipTextActive]}>
                                    {c.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            {error ?
                <View style={styles.errorCard}>
                    <MaterialCommunityIcons name="cloud-alert-outline" size={22} color={Colors.primary} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.errorTitle}>{`Không tải được danh sách món`}</Text>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                    <Button
                        mode="contained-tonal"
                        compact
                        onPress={() => refresh({ search, catId, menuId, ordering })}
                        buttonColor={Colors.surfaceContainerLow}
                        textColor={Colors.text}
                        labelStyle={{ fontWeight: '700', fontSize: 13 }}>
                        {`Thử lại`}
                    </Button>
                </View> :
                null
            }

            {featuredDishes.length > 0 && !error && (
                <View>
                    <View style={styles.featuredHeader}>
                        <Text style={styles.featuredTitle}>Món Nổi Bật</Text>
                        <TouchableOpacity onPress={() => {}}>
                            <Text style={{color: Colors.primary, fontWeight: '700'}}>Xem thêm</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={featuredDishes}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.featuredList}
                        keyExtractor={(item) => item.id.toString() + '_featured'}
                        renderItem={({ item, index }) => (
                            <DishCard
                                dish={item}
                                index={index}
                                featured={true}
                                onPress={() => navigation.navigate('DishDetail', { id: item.id })}
                                onCompare={() => toggleCompare(item.id)}
                                onAddCart={() => {
                                    addItem(item);
                                    showToast(`Đã thêm ${item.name} vào giỏ`);
                                }}
                                isCompareSelected={selectedCompareIds.includes(item.id)}
                            />
                        )}
                    />
                    {standardDishes.length > 0 && (
                        <Text style={styles.sectionTitle}>Tất Cả Món</Text>
                    )}
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={standardDishes}
                renderItem={({ item, index }) => (
                    <DishCard
                        dish={item}
                        index={index}
                        onPress={() => navigation.navigate('DishDetail', { id: item.id })}
                        onCompare={() => toggleCompare(item.id)}
                        onAddCart={() => {
                            addItem(item);
                            showToast(`Đã thêm ${item.name} vào giỏ`);
                        }}
                        isCompareSelected={selectedCompareIds.includes(item.id)}
                    />
                )}
                keyExtractor={(item) => item.id.toString()}
                onEndReached={loadMore}
                onEndReachedThreshold={0.35}
                ListHeaderComponent={ListHeader}
                ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 12 }} /> : null}
                contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
                ListEmptyComponent={
                    loading ?
                        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} /> :
                        <View style={styles.empty}>
                            <MaterialCommunityIcons name="food-off" size={50} color={Colors.textSecondary} />
                            <Text style={styles.emptyTitle}>{`Kh\u00f4ng c\u00f3 m\u00f3n n\u00e0o ph\u00f9 h\u1ee3p`}</Text>
                            <Text style={styles.emptyText}>{`Th\u1eed \u0111\u1ed5i b\u1ed9 l\u1ecdc ho\u1eb7c t\u1eeb kh\u00f3a t\u00ecm ki\u1ebfm \u0111\u1ec3 xem th\u00eam k\u1ebft qu\u1ea3.`}</Text>
                        </View>
                }
            />

            {selectedCompareIds.length >= 2 &&
                <View style={[styles.compareFab, { bottom: tabBarHeight + 16 }]}>
                    <TouchableOpacity
                        style={styles.compareFabClear}
                        activeOpacity={0.7}
                        onPress={() => setSelectedCompareIds([])}>
                        <MaterialCommunityIcons name="close" size={18} color={Colors.onPrimary} />
                    </TouchableOpacity>
                    <View style={styles.compareFabDivider} />
                    <TouchableOpacity
                        style={styles.compareFabAction}
                        activeOpacity={0.85}
                        onPress={goToCompare}>
                        <MaterialCommunityIcons name="compare" size={20} color={Colors.onPrimary} />
                        <Text style={styles.compareFabText}>{`So s\u00e1nh (${selectedCompareIds.length})`}</Text>
                    </TouchableOpacity>
                </View>
            }

            <FilterSheet
                visible={showFilters}
                onClose={() => setShowFilters(false)}
                sortOptions={sortOptions}
                menus={menus}
                chefs={chefs}
                menuId={menuId}
                chefId={chefId}
                ordering={ordering}
                priceMin={priceMin}
                priceMax={priceMax}
                prepMin={prepMin}
                prepMax={prepMax}
                onSelect={(selection) => refresh(selection)}
            />

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
            />

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
                            <MaterialCommunityIcons name="account" size={32} color={Colors.primary} />
                        </View>
                        <Text style={styles.drawerName}>{user ? getDisplayName(user) : 'Khách'}</Text>
                        <Text style={styles.drawerRole}>{user ? 'Thành viên' : 'Khách tham quan'}</Text>
                    </View>

                    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                        <SidebarItem
                            icon="storefront-outline"
                            title="Khám phá"
                            color={Colors.primary}
                            onPress={navigateThen('RestaurantDetail')}
                        />
                        <SidebarItem
                            icon="cart-outline"
                            title="Giỏ hàng"
                            color={Colors.tertiary}
                            onPress={navigateThen('Cart')}
                        />
                        {user && (
                            <>
                                <SidebarItem
                                    icon="receipt-outline"
                                    title="Lịch sử Đơn hàng"
                                    color={Colors.success}
                                    onPress={navigateThen('Orders')}
                                />
                                <SidebarItem
                                    icon="calendar-clock"
                                    title="Lịch sử Đặt bàn"
                                    color={Colors.star}
                                    onPress={navigateThen('Booking')}
                                />
                                <SidebarItem
                                    icon="chat-processing-outline"
                                    title="Tin nhắn"
                                    color={Colors.primary}
                                    onPress={navigateThen('ChatList')}
                                />
                                <SidebarItem
                                    icon="star-outline"
                                    title="Đánh giá của tôi"
                                    color={Colors.tertiary}
                                    onPress={navigateThen('MyReviews')}
                                />
                            </>
                        )}

                        <View style={styles.sidebarDivider} />

                        {user ? (
                            <>
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
                            </>
                        ) : (
                            <SidebarItem
                                icon="login"
                                title="Đăng nhập"
                                color={Colors.primary}
                                onPress={() => closeDrawer(() => navigation.navigate('Login'))}
                            />
                        )}
                    </ScrollView>
                </Animated.View>
            </Modal>
        </View>
    );
};

export default Home;
