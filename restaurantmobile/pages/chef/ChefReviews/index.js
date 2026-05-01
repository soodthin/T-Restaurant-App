import { useCallback, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    RefreshControl,
} from 'react-native';
import { ActivityIndicator, Button } from 'react-native-paper';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authFetch, endpoints, clearSession, getApiErrorMessage } from '@configs';
import { FadeInUp } from '@utils/animations';
import Colors from '@styles/colors';
import { formatDateTime } from '@utils/format';
import styles from './styles';

const ChefReviews = ({ navigation }) => {
    const tabBarHeight = useBottomTabBarHeight();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [page, setPage] = useState(1);
    const [error, setError] = useState('');

    const resetToLogin = useCallback(async () => {
        await clearSession();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }, [navigation]);

    const loadReviews = useCallback(async (p = 1, mode = 'initial') => {
        if (mode === 'initial') setLoading(true);
        else if (mode === 'refresh') setRefreshing(true);
        else setLoadingMore(true);

        try {
            const res = await authFetch(`${endpoints['my-dish-reviews']}?page=${p}`);
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
        loadReviews(1, 'initial');
    }, [loadReviews]));

    const loadMore = () => {
        if (!hasNext || loading || loadingMore) return;
        loadReviews(page + 1, 'more');
    };

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
                        onRefresh={() => loadReviews(1, 'refresh')}
                        tintColor={Colors.primary}
                    />
                }
                ListHeaderComponent={
                    <View style={styles.hero}>
                        <Text style={styles.title}>Đánh giá khách hàng</Text>
                        <Text style={styles.subtitle}>
                            Tổng hợp toàn bộ đánh giá khách dành cho các món bạn phụ trách.
                        </Text>
                        {error ?
                            <View style={styles.errorBox}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={18} color={Colors.primary} />
                                <Text style={styles.errorText}>{error}</Text>
                                <Button mode="contained-tonal" compact onPress={() => loadReviews(1, 'initial')}>
                                    Thử lại
                                </Button>
                            </View> : null}
                    </View>
                }
                ListFooterComponent={
                    loadingMore ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: 12 }} /> : null
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialCommunityIcons name="comment-text-multiple-outline" size={48} color={Colors.textSecondary} />
                        <Text style={styles.emptyTitle}>Chưa có đánh giá</Text>
                        <Text style={styles.emptyText}>
                            Sau khi khách đánh giá các món của bạn, nội dung sẽ xuất hiện tại đây.
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

export default ChefReviews;
