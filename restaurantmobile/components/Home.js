import { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
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
                            <TouchableOpacity
                                style={[styles.compareBtn, isSelected && styles.compareBtnActive]}
                                onPress={() => toggleCompare(item.id)}
                                activeOpacity={0.8}>
                                <MaterialCommunityIcons
                                    name={isSelected ? 'check-circle' : 'compare'}
                                    size={16}
                                    color={isSelected ? Colors.onPrimary : Colors.text}
                                />
                                <Text style={[styles.compareText, isSelected && styles.compareTextActive]}>
                                    {isSelected ? 'Đã chọn' : 'So sánh'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.addBtn}
                                activeOpacity={0.85}
                                onPress={() => {
                                    addItem(item);
                                    showToast(`Đã thêm ${item.name} vào giỏ`);
                                }}>
                                <MaterialCommunityIcons name="cart-plus" size={18} color={Colors.onPrimary} />
                                <Text style={styles.addBtnText}>Thêm</Text>
                            </TouchableOpacity>
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
                <View style={styles.searchInputWrap}>
                    <MaterialCommunityIcons name="magnify" size={22} color={Colors.textSecondary} style={{ marginLeft: 16 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm món ăn, đầu bếp hoặc thực đơn..."
                        placeholderTextColor={Colors.placeholder}
                        value={search}
                        onChangeText={setSearch}
                        onSubmitEditing={() => refresh({ search })}
                        returnKeyType="search"
                    />
                </View>
                <TouchableOpacity style={styles.searchBtn} onPress={() => refresh({ search })} activeOpacity={0.85}>
                    <MaterialCommunityIcons name="tune-variant" size={22} color={Colors.onPrimary} />
                </TouchableOpacity>
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
                <TouchableOpacity
                    style={[styles.compareCta, selectedCompareIds.length < 2 && styles.compareCtaDisabled]}
                    onPress={goToCompare}
                    activeOpacity={0.85}>
                    <Text style={styles.compareCtaText}>Mở bảng</Text>
                </TouchableOpacity>
            </FadeIn>

            {menus.length > 0 &&
                <ScrollView
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}>
                    <TouchableOpacity
                        style={[styles.chip, menuId === null && styles.chipActive]}
                        onPress={() => refresh({ menuId: null })}
                        activeOpacity={0.8}>
                        <Text style={[styles.chipText, menuId === null && styles.chipTextActive]}>Tất cả menu</Text>
                    </TouchableOpacity>
                    {menus.map((menu) => (
                        <TouchableOpacity
                            key={menu.id}
                            style={[styles.chip, menuId === menu.id && styles.chipActive]}
                            onPress={() => refresh({ menuId: menu.id })}
                            activeOpacity={0.8}>
                            <Text style={[styles.chipText, menuId === menu.id && styles.chipTextActive]}>
                                {menu.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            }

            {categories.length > 0 &&
                <ScrollView
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[styles.chipRow, { paddingTop: 0 }]}>
                    <TouchableOpacity
                        style={[styles.chip, catId === null && styles.chipActive]}
                        onPress={() => refresh({ catId: null })}
                        activeOpacity={0.8}>
                        <Text style={[styles.chipText, catId === null && styles.chipTextActive]}>Tất cả loại món</Text>
                    </TouchableOpacity>
                    {categories.map((category) => (
                        <TouchableOpacity
                            key={category.id}
                            style={[styles.chip, catId === category.id && styles.chipActive]}
                            onPress={() => refresh({ catId: category.id })}
                            activeOpacity={0.8}>
                            <Text style={[styles.chipText, catId === category.id && styles.chipTextActive]}>
                                {category.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            }

            <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.chipRow, { paddingTop: 0, paddingBottom: 12 }]}>
                {sortOptions.map((option) => (
                    <TouchableOpacity
                        key={option.key || 'default'}
                        style={[styles.sortChip, ordering === option.key && styles.sortChipActive]}
                        onPress={() => refresh({ ordering: option.key })}
                        activeOpacity={0.8}>
                        <Text style={[styles.sortText, ordering === option.key && styles.sortTextActive]}>
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {error ?
                <View style={styles.errorCard}>
                    <MaterialCommunityIcons name="cloud-alert-outline" size={22} color={Colors.primary} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.errorTitle}>Không tải được danh sách món</Text>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => refresh({ search, catId, menuId, ordering })}>
                        <Text style={styles.retryText}>Thử lại</Text>
                    </TouchableOpacity>
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
    searchRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8 },
    searchInputWrap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 20,
        marginRight: 10,
        ...editorialShadow,
    },
    searchInput: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 15,
        fontSize: 15,
        color: Colors.text,
    },
    searchBtn: {
        backgroundColor: Colors.primary,
        width: 54,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
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
    compareCta: {
        backgroundColor: Colors.text,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    compareCtaDisabled: { backgroundColor: Colors.textSecondary },
    compareCtaText: { color: Colors.onPrimary, fontSize: 13, fontWeight: '700' },
    chipRow: { paddingHorizontal: 16, paddingVertical: 8 },
    chip: {
        backgroundColor: Colors.surfaceContainerHigh,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 9999,
        marginRight: 8,
    },
    chipActive: { backgroundColor: Colors.primary },
    chipText: { fontSize: 14, color: Colors.text, fontWeight: '600' },
    chipTextActive: { color: Colors.onPrimary, fontWeight: '700' },
    sortChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 9999,
        marginRight: 8,
        backgroundColor: Colors.surfaceContainerLow,
    },
    sortChipActive: { backgroundColor: Colors.text },
    sortText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
    sortTextActive: { color: Colors.onPrimary },
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
    retryBtn: { backgroundColor: Colors.surfaceContainerLow, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
    retryText: { color: Colors.text, fontWeight: '700', fontSize: 13 },
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
    cardActions: { flexDirection: 'row', marginTop: 16 },
    compareBtn: {
        flex: 1,
        marginRight: 8,
        borderRadius: 20,
        paddingVertical: 12,
        backgroundColor: Colors.surfaceContainerLow,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    compareBtnActive: { backgroundColor: Colors.primary },
    compareText: { fontSize: 14, fontWeight: '700', color: Colors.text, marginLeft: 6 },
    compareTextActive: { color: Colors.onPrimary },
    addBtn: {
        flex: 1,
        borderRadius: 20,
        paddingVertical: 12,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    addBtnText: { color: Colors.onPrimary, fontSize: 14, fontWeight: '700', marginLeft: 6 },
    empty: { alignItems: 'center', marginTop: 36, paddingHorizontal: 32, paddingBottom: 10 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: 14 },
    emptyText: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 21 },
});

export default Home;
