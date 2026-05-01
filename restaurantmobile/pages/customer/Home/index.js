import { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
} from 'react-native';
import { Searchbar, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FadeInDown, FadeInUp, FadeIn } from '@utils/animations';
import { Apis, endpoints, getApiErrorMessage } from '@configs';
import Colors from '@styles/colors';
import { useCart } from '@contexts/CartContext';
import { Toast } from '@components/CustomDialog';
import DishCard from '@components/DishCard';
import FilterSheet from '@components/FilterSheet';
import styles from './styles';

const sortOptions = [
    { key: '', label: 'Ph\u1ed5 bi\u1ebfn' },
    { key: '-avg_rating', label: '\u0110\u00e1nh gi\u00e1 cao' },
    { key: 'price', label: 'Gi\u00e1 t\u0103ng' },
    { key: '-price', label: 'Gi\u00e1 gi\u1ea3m' },
    { key: 'name', label: 'T\u00ean A-Z' },
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
    const [showFilters, setShowFilters] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
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
        return `${endpoints['dishes']}?${params.join('&')}`;
    };

    const loadDishes = async (p = 1, q = search, cat = catId, menu = menuId, order = ordering) => {
        if (p === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const res = await Apis.get(buildUrl(p, q, cat, menu, order));
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
            const [categoryRes, menuRes] = await Promise.all([
                Apis.get(endpoints['categories']),
                Apis.get(endpoints['menus']),
            ]);

            if (categoryRes.ok) {
                const categoryData = categoryRes.data;
                setCategories(Array.isArray(categoryData) ? categoryData : categoryData.results || []);
            }

            if (menuRes.ok) {
                const menuData = menuRes.data;
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

    const ListHeader = (
        <View>
            <FadeInDown duration={500}>
                <View style={styles.banner}>
                    <View style={styles.bannerBlob1} />
                    <View style={styles.bannerBlob2} />
                    <MaterialCommunityIcons name="noodles" size={50} color="#ffffff0D" style={{ position: 'absolute', top: 10, right: 60 }} />
                    <MaterialCommunityIcons name="cup" size={40} color="#ffffff0D" style={{ position: 'absolute', bottom: 12, right: 16 }} />
                    <MaterialCommunityIcons name="food-drumstick" size={36} color="#ffffff0D" style={{ position: 'absolute', top: 8, right: 12 }} />
                    <View style={styles.bannerContent}>
                        <View style={styles.bannerLogo}>
                            <Text style={styles.bannerLogoText}>T</Text>
                        </View>
                        <View style={{ marginLeft: 16 }}>
                            <Text style={styles.bannerName}>SAIGON SAVORY</Text>
                            <Text style={styles.bannerSub}>{'\u1ea8m th\u1ef1c S\u00e0i G\u00f2n \u0111\u00edch th\u1ef1c'}</Text>
                        </View>
                    </View>
                    <View style={styles.bannerTagRow}>
                        <View style={styles.bannerTag}>
                            <MaterialCommunityIcons name="silverware-fork-knife" size={12} color={Colors.onPrimary} />
                            <Text style={styles.bannerTagText}>{`M\u00f3n Vi\u1ec7t`}</Text>
                        </View>
                        <View style={styles.bannerTag}>
                            <MaterialCommunityIcons name="clock-outline" size={12} color={Colors.onPrimary} />
                            <Text style={styles.bannerTagText}>{`M\u1edf c\u1eeda`}</Text>
                        </View>
                        <View style={styles.bannerTag}>
                            <MaterialCommunityIcons name="star" size={12} color={Colors.star} />
                            <Text style={styles.bannerTagText}>4.8</Text>
                        </View>
                    </View>
                </View>
            </FadeInDown>

            <FadeIn delay={200} duration={400} style={styles.searchRow}>
                <Searchbar
                    placeholder={"T\u00ecm m\u00f3n \u0103n, \u0111\u1ea7u b\u1ebfp ho\u1eb7c th\u1ef1c \u0111\u01a1n..."}
                    value={search}
                    onChangeText={setSearch}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    onSubmitEditing={() => refresh({ search })}
                    style={styles.searchbar}
                    inputStyle={{ color: Colors.text }}
                    placeholderTextColor={Colors.placeholder}
                    elevation={0}
                />
                {!searchFocused &&
                    <IconButton
                        icon="tune-variant"
                        mode="contained"
                        containerColor={Colors.primary}
                        iconColor={Colors.onPrimary}
                        size={22}
                        onPress={() => setShowFilters(true)}
                        style={styles.filterBtn}
                    />
                }
            </FadeIn>


            {error ?
                <View style={styles.errorCard}>
                    <MaterialCommunityIcons name="cloud-alert-outline" size={22} color={Colors.primary} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.errorTitle}>{`Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c danh s\u00e1ch m\u00f3n`}</Text>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                    <Button
                        mode="contained-tonal"
                        compact
                        onPress={() => refresh({ search, catId, menuId, ordering })}
                        buttonColor={Colors.surfaceContainerLow}
                        textColor={Colors.text}
                        labelStyle={{ fontWeight: '700', fontSize: 13 }}>
                        {`Th\u1eed l\u1ea1i`}
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
                    renderItem={({ item, index }) => (
                        <DishCard
                            dish={item}
                            index={index}
                            onPress={() => navigation.navigate('DishDetail', { id: item.id })}
                            onCompare={() => toggleCompare(item.id)}
                            onAddCart={() => {
                                addItem(item);
                                showToast(`\u0110\u00e3 th\u00eam ${item.name} v\u00e0o gi\u1ecf`);
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
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <MaterialCommunityIcons name="food-off" size={50} color={Colors.textSecondary} />
                            <Text style={styles.emptyTitle}>{`Kh\u00f4ng c\u00f3 m\u00f3n n\u00e0o ph\u00f9 h\u1ee3p`}</Text>
                            <Text style={styles.emptyText}>{`Th\u1eed \u0111\u1ed5i b\u1ed9 l\u1ecdc ho\u1eb7c t\u1eeb kh\u00f3a t\u00ecm ki\u1ebfm \u0111\u1ec3 xem th\u00eam k\u1ebft qu\u1ea3.`}</Text>
                        </View>
                    }
                />
            }

            {selectedCompareIds.length >= 2 &&
                <TouchableOpacity style={[styles.compareFab, { bottom: tabBarHeight + 16 }]} activeOpacity={0.9} onPress={goToCompare}>
                    <MaterialCommunityIcons name="compare" size={20} color={Colors.onPrimary} />
                    <Text style={styles.compareFabText}>{`So s\u00e1nh (${selectedCompareIds.length})`}</Text>
                </TouchableOpacity>
            }

            <FilterSheet
                visible={showFilters}
                onClose={() => setShowFilters(false)}
                sortOptions={sortOptions}
                menus={menus}
                categories={categories}
                menuId={menuId}
                catId={catId}
                ordering={ordering}
                onSelect={(selection) => refresh(selection)}
            />

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
            />
        </View>
    );
};

export default Home;
