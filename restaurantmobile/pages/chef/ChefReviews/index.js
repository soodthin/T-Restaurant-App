import { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { ActivityIndicator, Button, Portal, Modal } from 'react-native-paper';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authFetch, endpoints, clearSession, getApiErrorMessage } from '@configs';
import { FadeInUp } from '@utils/animations';
import Colors from '@styles/colors';
import { formatDateTime } from '@utils/format';
import styles from './styles';

const RATING_OPTIONS = [
    { value: null, label: 'Tất cả' },
    { value: 5, label: '5' },
    { value: 4, label: '4' },
    { value: 3, label: '3' },
    { value: 2, label: '2' },
    { value: 1, label: '1' },
];

const ChefReviews = ({ navigation }) => {
    const tabBarHeight = useBottomTabBarHeight();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [page, setPage] = useState(1);
    const [error, setError] = useState('');
    const [ratingFilter, setRatingFilter] = useState(null);
    const [dishFilter, setDishFilter] = useState(null);
    const [dishOptions, setDishOptions] = useState([]);
    const [dishPickerVisible, setDishPickerVisible] = useState(false);

    const resetToLogin = useCallback(async () => {
        await clearSession();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }, [navigation]);

    const loadDishes = useCallback(async () => {
        try {
            const res = await authFetch(`${endpoints['dishes']}?my=true&page_size=100`);
            if (!res.ok) return;
            const data = res.data;
            const items = Array.isArray(data) ? data : (data.results || []);
            setDishOptions(items.map((d) => ({ id: d.id, name: d.name })));
        } catch (err) {

        }
    }, []);

    const loadReviews = useCallback(async (p = 1, mode = 'initial', filters = {}) => {
        if (mode === 'initial') setLoading(true);
        else if (mode === 'refresh') setRefreshing(true);
        else setLoadingMore(true);

        try {
            const params = new URLSearchParams({ page: String(p) });
            if (filters.rating != null) params.append('rating', String(filters.rating));
            if (filters.dish != null) params.append('dish', String(filters.dish));
            const res = await authFetch(`${endpoints['my-dish-reviews']}?${params.toString()}`);
            if (res.status === 401) {
                await resetToLogin();
                return;
            }
            if (!res.ok) {
                throw new Error(getApiErrorMessage(res, 'Không thể tải đánh giá'));
            }

            const data = res.data;
            const items = data.results || [];
            setReviews((prev) => p === 1 ? items : [...prev, ...items]);
            setHasNext(Boolean(data.next));
            setPage(p);
            setError('');
        } catch (err) {
            if (p === 1) setReviews([]);
            setError(err.message || 'Không thể tải đánh giá');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [resetToLogin]);

    useFocusEffect(useCallback(() => {
        loadDishes();
    }, [loadDishes]));

    useEffect(() => {
        loadReviews(1, 'initial', { rating: ratingFilter, dish: dishFilter });
    }, [ratingFilter, dishFilter, loadReviews]);

    const loadMore = () => {
        if (!hasNext || loading || loadingMore) return;
        loadReviews(page + 1, 'more', { rating: ratingFilter, dish: dishFilter });
    };

    const onRefresh = () => {
        loadReviews(1, 'refresh', { rating: ratingFilter, dish: dishFilter });
    };

    const clearFilters = () => {
        setRatingFilter(null);
        setDishFilter(null);
    };

    const selectedDishName = dishFilter
        ? (dishOptions.find((d) => d.id === dishFilter)?.name || `Món #${dishFilter}`)
        : 'Tất cả món';

    const hasActiveFilter = ratingFilter != null || dishFilter != null;

    const renderReview = ({ item, index }) => (
        <FadeInUp delay={index * 50} duration={300}>
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.dishName} numberOfLines={1}>
                            {item.dish_name || `Món #${item.dish}`}
                        </Text>
                        <Text style={styles.customerName}>
                            {item.customer_name || `Khách #${item.customer}`}
                        </Text>
                    </View>
                    <View style={styles.ratingBadge}>
                        <MaterialCommunityIcons name="star" size={14} color={Colors.star} />
                        <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                </View>
                {item.comment ? (
                    <Text style={styles.comment}>{item.comment}</Text>
                ) : (
                    <Text style={styles.commentEmpty}>Khách không để lại nhận xét.</Text>
                )}
                <Text style={styles.date}>{formatDateTime(item.created_date)}</Text>
            </View>
        </FadeInUp>
    );

    const renderFilterBar = () => (
        <View style={styles.filterWrap}>
            <View style={styles.filterRowHeader}>
                <Text style={styles.filterLabel}>Lọc theo</Text>
                {hasActiveFilter ? (
                    <TouchableOpacity onPress={clearFilters} activeOpacity={0.7}>
                        <Text style={styles.clearLink}>Xóa lọc</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}>
                {RATING_OPTIONS.map((opt) => {
                    const active = ratingFilter === opt.value;
                    return (
                        <TouchableOpacity
                            key={String(opt.value)}
                            style={[styles.chip, active && styles.chipActive]}
                            activeOpacity={0.7}
                            onPress={() => setRatingFilter(opt.value)}>
                            {opt.value != null ? (
                                <MaterialCommunityIcons
                                    name="star"
                                    size={13}
                                    color={active ? Colors.onPrimary : Colors.star}
                                />
                            ) : null}
                            <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <TouchableOpacity
                style={[styles.dishPicker, dishFilter != null && styles.dishPickerActive]}
                activeOpacity={0.8}
                onPress={() => setDishPickerVisible(true)}>
                <MaterialCommunityIcons
                    name="silverware-fork-knife"
                    size={16}
                    color={dishFilter != null ? Colors.primary : Colors.textSecondary}
                />
                <Text
                    style={[styles.dishPickerText, dishFilter != null && styles.dishPickerTextActive]}
                    numberOfLines={1}>
                    {selectedDishName}
                </Text>
                <MaterialCommunityIcons
                    name="chevron-down"
                    size={18}
                    color={Colors.textSecondary}
                />
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <ActivityIndicator size="large" color={Colors.primary} style={styles.loading} />
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={reviews}
                renderItem={renderReview}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 32 }]}
                onEndReached={loadMore}
                onEndReachedThreshold={0.4}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                    />
                }
                ListHeaderComponent={
                    <View>
                        <View style={styles.hero}>
                            <Text style={styles.title}>Đánh giá khách hàng</Text>
                            <Text style={styles.subtitle}>
                                Tổng hợp toàn bộ đánh giá khách dành cho các món bạn phụ trách.
                            </Text>
                            {error ?
                                <View style={styles.errorBox}>
                                    <MaterialCommunityIcons name="alert-circle-outline" size={18} color={Colors.primary} />
                                    <Text style={styles.errorText}>{error}</Text>
                                    <Button mode="contained-tonal" compact onPress={onRefresh}>
                                        Thử lại
                                    </Button>
                                </View> : null}
                        </View>
                        {renderFilterBar()}
                    </View>
                }
                ListFooterComponent={
                    loadingMore ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: 12 }} /> : null
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialCommunityIcons name="comment-text-multiple-outline" size={48} color={Colors.textSecondary} />
                        <Text style={styles.emptyTitle}>
                            {hasActiveFilter ? 'Không có đánh giá phù hợp' : 'Chưa có đánh giá'}
                        </Text>
                        <Text style={styles.emptyText}>
                            {hasActiveFilter
                                ? 'Thử xóa bộ lọc hoặc đổi sang tiêu chí khác.'
                                : 'Sau khi khách đánh giá các món của bạn, nội dung sẽ xuất hiện tại đây.'}
                        </Text>
                    </View>
                }
            />

            <Portal>
                <Modal
                    visible={dishPickerVisible}
                    onDismiss={() => setDishPickerVisible(false)}
                    contentContainerStyle={styles.modal}>
                    <Text style={styles.modalTitle}>Chọn món</Text>
                    <ScrollView style={{ maxHeight: 360 }}>
                        <TouchableOpacity
                            style={[styles.dishOption, dishFilter == null && styles.dishOptionActive]}
                            activeOpacity={0.7}
                            onPress={() => {
                                setDishFilter(null);
                                setDishPickerVisible(false);
                            }}>
                            <Text style={[styles.dishOptionText, dishFilter == null && styles.dishOptionTextActive]}>
                                Tất cả món
                            </Text>
                            {dishFilter == null ? (
                                <MaterialCommunityIcons name="check" size={18} color={Colors.primary} />
                            ) : null}
                        </TouchableOpacity>
                        {dishOptions.map((dish) => {
                            const active = dishFilter === dish.id;
                            return (
                                <TouchableOpacity
                                    key={dish.id}
                                    style={[styles.dishOption, active && styles.dishOptionActive]}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        setDishFilter(dish.id);
                                        setDishPickerVisible(false);
                                    }}>
                                    <Text
                                        style={[styles.dishOptionText, active && styles.dishOptionTextActive]}
                                        numberOfLines={1}>
                                        {dish.name}
                                    </Text>
                                    {active ? (
                                        <MaterialCommunityIcons name="check" size={18} color={Colors.primary} />
                                    ) : null}
                                </TouchableOpacity>
                            );
                        })}
                        {dishOptions.length === 0 ? (
                            <Text style={styles.dishOptionEmpty}>
                                Bạn chưa có món nào để lọc.
                            </Text>
                        ) : null}
                    </ScrollView>
                </Modal>
            </Portal>
        </View>
    );
};

export default ChefReviews;
