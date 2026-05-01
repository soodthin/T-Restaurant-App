import { useCallback, useMemo, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    RefreshControl,
} from 'react-native';
import { ActivityIndicator, Button, Searchbar } from 'react-native-paper';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
    authFetch,
    endpoints,
    clearSession,
    getApiErrorMessage,
    storeUser,
} from '@configs';
import { FadeInDown } from '@utils/animations';
import Colors from '@styles/colors';
import { formatCurrency, formatDate } from '@utils/format';
import styles from './styles';

const MyDishes = ({ navigation }) => {
    const tabBarHeight = useBottomTabBarHeight();
    const [user, setUser] = useState(null);
    const [dishes, setDishes] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const resetToLogin = useCallback(async () => {
        await clearSession();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }, [navigation]);

    const loadData = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true);
        else setRefreshing(true);

        try {
            const userRes = await authFetch(endpoints['current-user']);
            if (userRes.status === 401) {
                await resetToLogin();
                return;
            }
            if (!userRes.ok) {
                throw new Error(getApiErrorMessage(userRes, 'Không thể tải tài khoản đầu bếp'));
            }

            const userData = userRes.data;
            setUser(userData);
            await storeUser(userData);

            const dishRes = await authFetch(`${endpoints['dishes']}?my=true`);
            if (!dishRes.ok) {
                throw new Error(getApiErrorMessage(dishRes, 'Không thể tải danh sách món ăn'));
            }

            const dishData = dishRes.data;
            setDishes(dishData.results || []);
            setError('');
        } catch (err) {
            setDishes([]);
            setError(err.message || 'Không thể tải danh sách món ăn');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [resetToLogin]);

    useFocusEffect(useCallback(() => {
        loadData(true);
    }, [loadData]));

    const filteredDishes = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return dishes;

        return dishes.filter((dish) => {
            const haystack = [
                dish.name,
                dish.description,
                dish.menu_name,
                dish.category_name,
            ].join(' ').toLowerCase();
            return haystack.includes(keyword);
        });
    }, [dishes, search]);

    const summaryCards = useMemo(() => {
        const totalMenus = new Set(dishes.map((dish) => dish.menu_name).filter(Boolean)).size;
        const avgPrep = dishes.length > 0
            ? Math.round(dishes.reduce((sum, dish) => sum + Number(dish.preparation_time || 0), 0) / dishes.length)
            : 0;

        return [
            { key: 'count', label: 'Tổng món', value: `${dishes.length}` },
            { key: 'menus', label: 'Menu đang tham gia', value: `${totalMenus}` },
            { key: 'prep', label: 'Chuẩn bị trung bình', value: `${avgPrep} phút` },
        ];
    }, [dishes]);

    const headerButtonLabel = user?.is_verified ? 'Tạo món mới' : 'Mở hồ sơ';

    const renderDish = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('DishDetail', { id: item.id })}>
            {item.image ?
                <Image source={{ uri: item.image }} style={styles.dishImg} /> :
                <View style={[styles.dishImg, styles.placeholder]}>
                    <MaterialCommunityIcons name="food-variant" size={30} color={Colors.textSecondary} />
                </View>}

            <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                    <Text style={styles.dishName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.dishPrice}>{formatCurrency(item.price)}</Text>
                </View>

                <Text style={styles.dishDescription} numberOfLines={2}>
                    {item.description || 'Bổ sung mô tả món ăn để khách dễ quyết định hơn.'}
                </Text>

                <View style={styles.metaRow}>
                    <View style={styles.metaChip}>
                        <MaterialCommunityIcons name="book-open-page-variant-outline" size={14} color={Colors.primary} />
                        <Text style={styles.metaText}>{item.menu_name || 'Chưa gán menu'}</Text>
                    </View>
                    <View style={styles.metaChip}>
                        <MaterialCommunityIcons name="shape-outline" size={14} color={Colors.primary} />
                        <Text style={styles.metaText}>{item.category_name || 'Chưa gán loại'}</Text>
                    </View>
                </View>

                <View style={styles.footerRow}>
                    <Text style={styles.footerText}>
                        {Number(item.preparation_time) || 0} phút chuẩn bị
                    </Text>
                    <Text style={styles.footerText}>
                        Cập nhật {formatDate(item.updated_date)}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <ActivityIndicator
                size="large"
                color={Colors.primary}
                style={styles.loading}
            />
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={filteredDishes}
                renderItem={renderDish}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 32 }]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadData(false)}
                        tintColor={Colors.primary}
                    />
                }
                ListHeaderComponent={
                    <FadeInDown duration={500}>
                        <View style={styles.hero}>
                            <View style={styles.heroText}>
                                <Text style={styles.title}>Món ăn của tôi</Text>
                                <Text style={styles.subtitle}>
                                    Theo dõi chất lượng nội dung món, giá bán, menu và thời gian chuẩn bị trong cùng một nơi.
                                </Text>
                            </View>

                            <Button
                                mode="contained"
                                icon="plus"
                                buttonColor={Colors.primary}
                                textColor={Colors.onPrimary}
                                onPress={() => navigation.navigate(user?.is_verified ? 'CreateDish' : 'Profile')}>
                                {headerButtonLabel}
                            </Button>
                        </View>
                        <View style={styles.summaryRow}>
                            {summaryCards.map((item) => (
                                <View key={item.key} style={styles.summaryCard}>
                                    <Text style={styles.summaryValue}>{item.value}</Text>
                                    <Text style={styles.summaryLabel}>{item.label}</Text>
                                </View>
                            ))}
                        </View>

                        <Searchbar
                            placeholder="Tìm theo tên món, menu hoặc loại món..."
                            value={search}
                            onChangeText={setSearch}
                            style={styles.searchbar}
                            inputStyle={styles.searchbarInput}
                            iconColor={Colors.textSecondary}
                            placeholderTextColor={Colors.placeholder}
                        />

                        {error ?
                            <View style={styles.errorCard}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={20} color={Colors.primary} />
                                <View style={styles.errorContent}>
                                    <Text style={styles.errorTitle}>Không tải được danh sách món</Text>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                                <Button
                                    mode="contained-tonal"
                                    buttonColor={Colors.surfaceContainerLow}
                                    textColor={Colors.text}
                                    compact
                                    onPress={() => loadData(true)}>
                                    Thử lại
                                </Button>
                            </View> :
                            null}
                    </FadeInDown>
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialCommunityIcons name="food-off" size={52} color={Colors.textSecondary} />
                        <Text style={styles.emptyTitle}>
                            {search.trim() ? 'Không tìm thấy món phù hợp' : 'Chưa có món nào trong khu vực bếp'}
                        </Text>
                        <Text style={styles.emptyText}>
                            {search.trim()
                                ? 'Thử thay đổi từ khóa tìm kiếm hoặc rà soát lại danh mục món.'
                                : user?.is_verified
                                    ? 'Bắt đầu bằng việc tạo món đầu tiên với mô tả, giá và thời gian chuẩn bị đầy đủ.'
                                    : 'Quyền tạo món được quản lý trong phần hồ sơ đầu bếp.'}
                        </Text>
                        <Button
                            mode="contained"
                            buttonColor={Colors.primary}
                            textColor={Colors.onPrimary}
                            style={styles.emptyAction}
                            onPress={() => navigation.navigate(user?.is_verified ? 'CreateDish' : 'Profile')}>
                            {headerButtonLabel}
                        </Button>
                    </View>
                }
            />
        </View>
    );
};

export default MyDishes;
