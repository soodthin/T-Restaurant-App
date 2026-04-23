import { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image,
    ScrollView,
} from 'react-native';
import { Searchbar, Chip, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FadeInDown, FadeInUp, FadeIn } from '../utils/animations';
import BASE_URL, { endpoints } from '../configs';
import Colors from '../styles/colors';
import { editorialShadow } from '../styles/theme';
import { useCart } from '../contexts/CartContext';
import { Toast } from './CustomDialog';
import { getApiErrorMessage } from '../utils/api';

const sortOptions = [
    { key: '', label: 'Phổ biến' },
    { key: '-avg_rating', label: 'Đánh giá cao' },
    { key: 'price', label: 'Giá tăng' },
    { key: '-price', label: 'Giá giảm' },
    { key: 'name', label: 'Tên A-Z' },
];

const Home = ({ navigation }) => {
    const { addItem } = useCart();
    const tabBarHeight = useBottomTabBarHeight();
    const [dishes, setDishes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState('');
    const [catId, setCatId] = useState(null);
    const [menuId, setMenuId] = useState(null);
    const [ordering, setOrdering] = useState('');
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(true);
    const [error, setError] = useState('');
    const [selectedCompareIds, setSelectedCompareIds] = useState([]);
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
    };

    const buildUrl = (p, q, cat, menu, order) => {
        const params = [`page=${p}`];
        if (q) params.push(`search=${encodeURIComponent(q.trim())}`);
        if (cat) params.push(`category_id=${cat}`);
        if (menu) params.push(`menu_id=${menu}`);
        if (order) params.push(`ordering=${order}`);
        return `${BASE_URL}${endpoints['dishes']}?${params.join('&')}`;
    };

    const loadDishes = async (p = 1, q = search, cat = catId, menu = menuId, order = ordering) => {
        if (p === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const res = await fetch(buildUrl(p, q, cat, menu, order));
            if (!res.ok) {
                throw new Error(await getApiErrorMessage(res, 'Không thể tải danh sách món ăn'));
            }

            const data = await res.json();
            const results = data.results || [];
            setDishes((prev) => p === 1 ? results : [...prev, ...results]);
            setHasNext(Boolean(data.next));
            setError('');
        } catch (err) {
            if (p === 1) setDishes([]);
            setError(err.message || 'Không thể tải danh sách món ăn');
        } finally {
            if (p === 1) setLoading(false);
            else setLoadingMore(false);
        }
    };

    const loadFilters = async () => {
        try {
            const [categoryRes, menuRes] = await Promise.all([
                fetch(`${BASE_URL}${endpoints['categories']}`),
                fetch(`${BASE_URL}${endpoints['menus']}`),
            ]);

            if (categoryRes.ok) {
                const categoryData = await categoryRes.json();
                setCategories(Array.isArray(categoryData) ? categoryData : categoryData.results || []);
            }

            if (menuRes.ok) {
                const menuData = await menuRes.json();
                setMenus(Array.isArray(menuData) ? menuData : menuData.results || []);
            }
        } catch (err) {
            setCategories([]);
            setMenus([]);
        }
    };

    useEffect(() => {
        loadFilters();
        loadDishes(1, '', null, null, '');
    }, []);

    const refresh = (next = {}) => {
        const nextSearch = next.search ?? search;
        const nextCategory = next.catId ?? catId;
        const nextMenu = next.menuId ?? menuId;
        const nextOrdering = next.ordering ?? ordering;

        if (next.search !== undefined) setSearch(next.search);
        if (next.catId !== undefined) setCatId(next.catId);
        if (next.menuId !== undefined) setMenuId(next.menuId);
        if (next.ordering !== undefined) setOrdering(next.ordering);

        setPage(1);
        loadDishes(1, nextSearch, nextCategory, nextMenu, nextOrdering);
    };

    const loadMore = () => {
        if (!hasNext || loading || loadingMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        loadDishes(nextPage);
    };

    const toggleCompare = (dishId) => {
        setSelectedCompareIds((prev) => {
            if (prev.includes(dishId)) {
                return prev.filter((id) => id !== dishId);
            }
            if (prev.length >= 3) {
                showToast('Chỉ nên so sánh tối đa 3 món cùng lúc', 'error');
                return prev;
            }
            return [...prev, dishId];
        });
    };

    const goToCompare = () => {
        if (selectedCompareIds.length < 2) {
            showToast('Chọn ít nhất 2 món để so sánh', 'error');
            return;
        }
        navigation.navigate('CompareDishes', { ids: selectedCompareIds });
    };

    const renderDish = ({ item, index }) => {
        const isSelected = selectedCompareIds.includes(item.id);

        return (
            <FadeInUp delay={index * 60} duration={400}>
                <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.92}
                    onPress={() => navigation.navigate('DishDetail', { id: item.id })}>
                    {item.image ?
                        <Image source={{ uri: item.image }} style={styles.dishImg} /> :
                        <View style={[styles.dishImg, styles.placeholder]}>
                            <MaterialCommunityIcons name="food-variant" size={30} color={Colors.textSecondary} />
                        </View>
                    }

                    <View style={styles.floatingBadge}>
                        <MaterialCommunityIcons name="star" size={14} color={Colors.star} />
                        <Text style={styles.floatingBadgeText}>
                            {item.avg_rating > 0 ? item.avg_rating.toFixed(1) : 'Mới'}
                        </Text>
                    </View>

                    <View style={styles.cardBody}>
                        <View style={styles.cardTop}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                                <Text style={styles.dishName} numberOfLines={2}>{item.name}</Text>
                                <Text style={styles.dishMeta} numberOfLines={1}>
                                    {item.menu_name || 'Thực đơn'} · {item.category_name || 'Món ăn'}
                                </Text>
                            </View>
                            <Text style={styles.dishPrice}>{Number(item.price).toLocaleString()}đ</Text>
                        </View>

                        <View style={styles.badgeRow}>
                            <View style={styles.metricChip}>
                                <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.primary} />
                                <Text style={styles.metricText}>{item.preparation_time} phút</Text>
                            </View>
                            <View style={styles.metricChip}>
                                <MaterialCommunityIcons name="message-text-outline" size={14} color={Colors.tertiary} />
                                <Text style={styles.metricText}>{item.review_count || 0} đánh giá</Text>
                            </View>
                        </View>

                        <Text style={styles.chefText} numberOfLines={1}>
                            Phụ trách: {item.chef_name || 'Nhà hàng'}
                        </Text>

                        <View style={styles.cardActions}>
                            <Button
                                mode={isSelected ? 'contained' : 'contained-tonal'}
                                compact
                                icon={isSelected ? 'check-circle' : 'compare'}
                                onPress={() => toggleCompare(item.id)}
                                buttonColor={isSelected ? Colors.primary : Colors.surfaceContainerLow}
                                textColor={isSelected ? Colors.onPrimary : Colors.text}
                                style={styles.actionBtn}
                                labelStyle={styles.actionBtnLabel}>
                                {isSelected ? 'Đã chọn' : 'So sánh'}
                            </Button>

                            <Button
                                mode="contained"
                                compact
                                icon="cart-plus"
                                onPress={() => {
                                    addItem(item);
                                    showToast(`Đã thêm ${item.name} vào giỏ`);
                                }}
                                buttonColor={Colors.primary}
                                textColor={Colors.onPrimary}
                                style={styles.actionBtn}
                                labelStyle={styles.actionBtnLabel}>
                                Thêm
                            </Button>
                        </View>
                    </View>
                </TouchableOpacity>
            </FadeInUp>
        );
    };

    const ListHeader = (
        <View>
            <FadeInDown duration={500} style={styles.hero}>
                <Text style={styles.heroEyebrow}>SAIGON SAVORY</Text>
                <Text style={styles.heroTitle}>Khám phá món ngon theo đúng gu của bạn</Text>
                <Text style={styles.heroSubtitle}>
                    Tìm theo món, đầu bếp, thực đơn hoặc loại món. Chọn nhiều món để so sánh nhanh trước khi gọi.
                </Text>
            </FadeInDown>

            <FadeIn delay={200} duration={400} style={styles.searchRow}>
                <Searchbar
                    placeholder="Tìm món ăn, đầu bếp hoặc thực đơn..."
                    value={search}
                    onChangeText={setSearch}
                    onSubmitEditing={() => refresh({ search })}
                    style={styles.searchbar}
                    inputStyle={{ color: Colors.text }}
                    placeholderTextColor={Colors.placeholder}
                    elevation={0}
                />
                <IconButton
                    icon="tune-variant"
                    mode="contained"
                    containerColor={Colors.primary}
                    iconColor={Colors.onPrimary}
                    size={22}
                    onPress={() => refresh({ search })}
                    style={styles.filterBtn}
                />
            </FadeIn>

            <FadeIn delay={300} duration={400} style={styles.compareBanner}>
                <View style={styles.compareIconCircle}>
                    <MaterialCommunityIcons name="compare" size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.compareTitle}>So sánh món</Text>
                    <Text style={styles.compareSubtitle}>
                        Đã chọn {selectedCompareIds.length}/3 món để so sánh.
                    </Text>
                </View>
                <Button
                    mode="contained"
                    compact
                    onPress={goToCompare}
                    disabled={selectedCompareIds.length < 2}
                    buttonColor={Colors.text}
                    textColor={Colors.onPrimary}
                    style={{ borderRadius: 16 }}
                    labelStyle={{ fontWeight: '700', fontSize: 13 }}>
                    Mở bảng
                </Button>
            </FadeIn>

            {menus.length > 0 &&
                <ScrollView
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}>
                    <Chip
                        selected={menuId === null}
                        onPress={() => refresh({ menuId: null })}
                        mode="flat"
                        compact
                        style={styles.filterChip}
                        textStyle={styles.filterChipText}>
                        Tất cả menu
                    </Chip>
                    {menus.map((menu) => (
                        <Chip
                            key={menu.id}
                            selected={menuId === menu.id}
                            onPress={() => refresh({ menuId: menu.id })}
                            mode="flat"
                            compact
                            style={styles.filterChip}
                            textStyle={styles.filterChipText}>
                            {menu.name}
                        </Chip>
                    ))}
                </ScrollView>
            }

            {categories.length > 0 &&
                <ScrollView
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[styles.chipRow, { paddingTop: 0 }]}>
                    <Chip
                        selected={catId === null}
                        onPress={() => refresh({ catId: null })}
                        mode="flat"
                        compact
                        style={styles.filterChip}
                        textStyle={styles.filterChipText}>
                        Tất cả loại món
                    </Chip>
                    {categories.map((category) => (
                        <Chip
                            key={category.id}
                            selected={catId === category.id}
                            onPress={() => refresh({ catId: category.id })}
                            mode="flat"
                            compact
                            style={styles.filterChip}
                            textStyle={styles.filterChipText}>
                            {category.name}
                        </Chip>
                    ))}
                </ScrollView>
            }

            <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.chipRow, { paddingTop: 0, paddingBottom: 12 }]}>
                {sortOptions.map((option) => (
                    <Chip
                        key={option.key || 'default'}
                        selected={ordering === option.key}
                        onPress={() => refresh({ ordering: option.key })}
                        mode="flat"
                        compact
                        style={styles.filterChip}
                        textStyle={styles.filterChipText}>
                        {option.label}
                    </Chip>
                ))}
            </ScrollView>

            {error ?
                <View style={styles.errorCard}>
                    <MaterialCommunityIcons name="cloud-alert-outline" size={22} color={Colors.primary} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.errorTitle}>Không tải được danh sách món</Text>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                    <Button
                        mode="contained-tonal"
                        compact
                        onPress={() => refresh({ search, catId, menuId, ordering })}
                        buttonColor={Colors.surfaceContainerLow}
                        textColor={Colors.text}
                        labelStyle={{ fontWeight: '700', fontSize: 13 }}>
                        Thử lại
                    </Button>
                </View> :
                null
            }
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} /> :
                <FlatList
                    data={dishes}
                    renderItem={renderDish}
                    keyExtractor={(item) => item.id.toString()}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.35}
                    ListHeaderComponent={ListHeader}
                    ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 12 }} /> : null}
                    contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <MaterialCommunityIcons name="food-off" size={50} color={Colors.textSecondary} />
                            <Text style={styles.emptyTitle}>Không có món nào phù hợp</Text>
                            <Text style={styles.emptyText}>Thử đổi bộ lọc hoặc từ khóa tìm kiếm để xem thêm kết quả.</Text>
                        </View>
                    }
                />
            }

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    hero: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
    heroEyebrow: { color: Colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 3 },
    heroTitle: { fontSize: 30, fontWeight: '800', color: Colors.text, marginTop: 10, lineHeight: 38 },
    heroSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 10, lineHeight: 22 },
    searchRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8, alignItems: 'center' },
    searchbar: {
        flex: 1,
        borderRadius: 20,
        backgroundColor: Colors.surfaceContainerLowest,
        marginRight: 10,
        ...editorialShadow,
    },
    filterBtn: { borderRadius: 20 },
    compareBanner: {
        marginHorizontal: 16,
        marginTop: 14,
        marginBottom: 4,
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        ...editorialShadow,
    },
    compareIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    compareTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
    compareSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
    chipRow: { paddingHorizontal: 16, paddingVertical: 8 },
    filterChip: { marginRight: 8 },
    filterChipText: { fontWeight: '600' },
    errorCard: {
        marginHorizontal: 16,
        marginTop: 6,
        marginBottom: 10,
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        ...editorialShadow,
    },
    errorTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
    errorText: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
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
    empty: { alignItems: 'center', marginTop: 36, paddingHorizontal: 32, paddingBottom: 10 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: 14 },
    emptyText: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 21 },
});

export default Home;
