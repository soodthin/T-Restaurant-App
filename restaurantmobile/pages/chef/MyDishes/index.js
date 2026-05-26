import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    RefreshControl,
} from 'react-native';
import { ActivityIndicator, Button, IconButton, Searchbar } from 'react-native-paper';
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
import { ConfirmDialog, Toast } from '@components/CustomDialog';
import styles from './styles';

const MyDishes = ({ navigation }) => {
    const tabBarHeight = useBottomTabBarHeight();
    const [user, setUser] = useState(null);
    const [dishes, setDishes] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
    };

    const doDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await authFetch(endpoints['dish-detail'](deleteTarget.id), {
                method: 'DELETE',
            });
            if (res.status === 401) {
                await resetToLogin();
                return;
            }
            if (res.status === 204 || res.ok) {
                setDishes((prev) => prev.filter((d) => d.id !== deleteTarget.id));
                showToast(`Đã xóa món "${deleteTarget.name}"`, 'success');
            } else {
                showToast(getApiErrorMessage(res, 'Không thể xóa món'), 'error');
            }
        } catch (err) {
            showToast('Không thể kết nối tới máy chủ', 'error');
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    const resetToLogin = useCallback(async () => {
        await clearSession();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }, [navigation]);


    const buildDishUrl = (q) => {
        const params = ['my=true'];
        if (q && q.trim()) params.push(`search=${encodeURIComponent(q.trim())}`);
        return `${endpoints['dishes']}?${params.join('&')}`;
    };

    const loadData = useCallback(async (showLoader = true, q = search) => {
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

            const dishRes = await authFetch(buildDishUrl(q));
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
    }, [resetToLogin, search]);


    const hasLoadedRef = useRef(false);
    useFocusEffect(useCallback(() => {
        loadData(!hasLoadedRef.current, search);
        hasLoadedRef.current = true;

    }, []));


    const lastSearchedRef = useRef('');
    useEffect(() => {
        if (search === lastSearchedRef.current) return;
        const timer = setTimeout(() => {
            lastSearchedRef.current = search;
            loadData(false, search);
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

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
            activeOpacity={0.85}
            onPress={() => navigation.navigate('DishDetail', { id: item.id })}>
            {item.image ?
                <Image source={{ uri: item.image }} style={styles.dishImg} /> :
                <View style={[styles.dishImg, styles.placeholder]}>
                    <MaterialCommunityIcons name="food-variant" size={28} color={Colors.textSecondary} />
                </View>}

            <View style={styles.cardBody}>
                <View>
                    <View style={styles.cardTop}>
                        <Text style={styles.dishName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.dishPrice}>{formatCurrency(item.price)}</Text>
                    </View>

                    <View style={styles.metaRow}>
                        {!item.active && (
                            <View style={styles.pendingChip}>
                                <MaterialCommunityIcons name="clock-alert-outline" size={11} color={Colors.star} />
                                <Text style={styles.pendingText}>Chờ duyệt</Text>
                            </View>
                        )}
                        <View style={styles.metaChip}>
                            <MaterialCommunityIcons name="book-open-page-variant-outline" size={11} color={Colors.primary} />
                            <Text style={styles.metaText}>{item.menu_name || 'Chưa gán'}</Text>
                        </View>
                        <View style={styles.metaChip}>
                            <MaterialCommunityIcons name="shape-outline" size={11} color={Colors.primary} />
                            <Text style={styles.metaText}>{item.category_name || 'Chưa gán'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.footerRow}>
                    <Text style={styles.footerText} numberOfLines={1}>
                        {Number(item.preparation_time) || 0} phút · Cập nhật {formatDate(item.updated_date)}
                    </Text>
                    {user?.is_verified ? (
                        <View style={styles.actionRow}>
                            <IconButton
                                icon="pencil-outline"
                                mode="contained-tonal"
                                size={14}
                                style={styles.iconBtn}
                                onPress={() => navigation.navigate('CreateDish', { dish: item })}
                                containerColor={Colors.surfaceContainerLow}
                                iconColor={Colors.primary}
                            />
                            <IconButton
                                icon="trash-can-outline"
                                mode="contained-tonal"
                                size={14}
                                style={styles.iconBtn}
                                onPress={() => setDeleteTarget(item)}
                                containerColor={Colors.surfaceContainerLow}
                                iconColor={Colors.primary}
                            />
                        </View>
                    ) : null}
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
                data={dishes}
                renderItem={renderDish}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 32 }]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadData(false, search)}
                        tintColor={Colors.primary}
                    />
                }
                ListHeaderComponent={
                    <FadeInDown duration={500}>
                        <View style={styles.hero}>
                            <View style={styles.heroText}>
                                <Text style={styles.title}>Món ăn của tôi</Text>
                                <Text style={styles.subtitle} numberOfLines={1}>
                                    Quản lý thực đơn của bạn
                                </Text>
                            </View>

                            <Button
                                mode="contained"
                                icon="plus"
                                compact
                                buttonColor={Colors.primary}
                                textColor={Colors.onPrimary}
                                labelStyle={{ fontSize: 12, fontWeight: '700' }}
                                onPress={() => navigation.navigate(user?.is_verified ? 'CreateDish' : 'Profile')}>
                                {user?.is_verified ? 'Tạo món' : 'Hồ sơ'}
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
                            placeholder="Tìm theo tên món..."
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
                                    onPress={() => loadData(true, search)}>
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

            <ConfirmDialog
                visible={Boolean(deleteTarget)}
                type="warning"
                title="Xóa món ăn"
                message={deleteTarget
                    ? `Bạn chắc chắn muốn xóa món "${deleteTarget.name}"? Hành động này không thể hoàn tác.`
                    : ''}
                confirmText={deleting ? 'Đang xóa...' : 'Xóa'}
                loading={deleting}
                onCancel={() => !deleting && setDeleteTarget(null)}
                onConfirm={doDelete}
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

export default MyDishes;
