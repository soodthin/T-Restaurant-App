import { useCallback, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import {
    ActivityIndicator,
    Button,
    Portal,
    Dialog,
    TextInput,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
    authFetch,
    endpoints,
    clearSession,
    getApiErrorMessage,
} from '@configs';
import { FadeInUp } from '@utils/animations';
import { formatDateTime } from '@utils/format';
import { ConfirmDialog, Toast } from '@components/CustomDialog';
import Colors from '@styles/colors';
import styles from './styles';

const StarPicker = ({ value, onChange, size = 30 }) => (
    <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
                key={star}
                style={styles.starBtn}
                onPress={() => onChange(star)}>
                <MaterialCommunityIcons
                    name={star <= value ? 'star' : 'star-outline'}
                    size={size}
                    color={Colors.star}
                />
            </TouchableOpacity>
        ))}
    </View>
);

const StarRow = ({ rating }) => (
    <View style={styles.starInline}>
        {[1, 2, 3, 4, 5].map((star) => (
            <MaterialCommunityIcons
                key={star}
                name={star <= rating ? 'star' : 'star-outline'}
                size={14}
                color={Colors.star}
            />
        ))}
    </View>
);

const MyReviews = ({ navigation }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [page, setPage] = useState(1);
    const [error, setError] = useState('');
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });
    const [editing, setEditing] = useState(null);
    const [editRating, setEditRating] = useState(0);
    const [editComment, setEditComment] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const showToast = (message, type = 'error') => {
        setToast({ visible: true, message, type });
    };

    const resetToLogin = useCallback(async () => {
        await clearSession();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }, [navigation]);

    const loadReviews = useCallback(async (p = 1, mode = 'initial') => {
        if (mode === 'initial') setLoading(true);
        else if (mode === 'refresh') setRefreshing(true);
        else setLoadingMore(true);

        try {
            const res = await authFetch(`${endpoints['my-reviews']}?page=${p}`);
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

    const openEdit = (review) => {
        setEditing(review);
        setEditRating(review.rating);
        setEditComment(review.comment || '');
    };

    const closeEdit = () => {
        setEditing(null);
        setEditRating(0);
        setEditComment('');
    };

    const saveEdit = async () => {
        if (editRating < 1 || editRating > 5) {
            showToast('Vui lòng chọn số sao từ 1 đến 5');
            return;
        }
        setSaving(true);
        try {
            const res = await authFetch(endpoints['review-detail'](editing.id), {
                method: 'PATCH',
                body: JSON.stringify({
                    rating: editRating,
                    comment: editComment,
                }),
            });
            if (res.status === 401) {
                await resetToLogin();
                return;
            }
            if (!res.ok) {
                showToast(getApiErrorMessage(res, 'Không thể cập nhật đánh giá'));
                return;
            }
            const updated = res.data;
            setReviews((prev) => prev.map((r) => r.id === updated.id
                ? { ...r, rating: updated.rating, comment: updated.comment }
                : r,
            ));
            closeEdit();
            showToast('Đã cập nhật đánh giá', 'success');
        } catch (err) {
            showToast('Không thể cập nhật đánh giá');
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await authFetch(endpoints['review-detail'](deleteTarget.id), {
                method: 'DELETE',
            });
            if (res.status === 401) {
                await resetToLogin();
                return;
            }
            if (!res.ok && res.status !== 204) {
                showToast(getApiErrorMessage(res, 'Không thể xóa đánh giá'));
                return;
            }
            setReviews((prev) => prev.filter((r) => r.id !== deleteTarget.id));
            setDeleteTarget(null);
            showToast('Đã xóa đánh giá', 'success');
        } catch (err) {
            showToast('Không thể xóa đánh giá');
        } finally {
            setDeleting(false);
        }
    };

    const renderReview = ({ item, index }) => (
        <FadeInUp delay={index * 40} duration={300}>
            <View style={styles.card}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.cardTop}
                    onPress={() => navigation.navigate('DishDetail', { id: item.dish })}>
                    {item.dish_image ?
                        <Image source={{ uri: item.dish_image }} style={styles.thumb} /> :
                        <View style={[styles.thumb, styles.thumbPlaceholder]}>
                            <MaterialCommunityIcons name="food-variant" size={28} color={Colors.textSecondary} />
                        </View>
                    }
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.dishName} numberOfLines={2}>
                            {item.dish_name || `Món #${item.dish}`}
                        </Text>
                        <View style={styles.metaRow}>
                            <StarRow rating={item.rating} />
                            <Text style={styles.metaDot}>·</Text>
                            <Text style={styles.dateText}>{formatDateTime(item.created_date)}</Text>
                        </View>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.placeholder} />
                </TouchableOpacity>

                {item.comment ? (
                    <Text style={styles.comment}>{item.comment}</Text>
                ) : (
                    <Text style={styles.commentEmpty}>Bạn chưa viết nhận xét cho món này.</Text>
                )}

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        activeOpacity={0.7}
                        onPress={() => openEdit(item)}>
                        <MaterialCommunityIcons name="pencil-outline" size={16} color={Colors.tertiary} />
                        <Text style={[styles.actionText, { color: Colors.tertiary }]}>Sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        activeOpacity={0.7}
                        onPress={() => setDeleteTarget(item)}>
                        <MaterialCommunityIcons name="trash-can-outline" size={16} color={Colors.primary} />
                        <Text style={[styles.actionText, { color: Colors.primary }]}>Xóa</Text>
                    </TouchableOpacity>
                </View>
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
                contentContainerStyle={styles.content}
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
                        <Text style={styles.title}>Đánh giá đã viết</Text>
                        <Text style={styles.subtitle}>
                            Quản lý nhận xét của bạn cho các món đã thưởng thức.
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
                        <MaterialCommunityIcons name="star-outline" size={48} color={Colors.textSecondary} />
                        <Text style={styles.emptyTitle}>Chưa có đánh giá nào</Text>
                        <Text style={styles.emptyText}>
                            Hãy thưởng thức một món ăn và chia sẻ cảm nhận của bạn.
                        </Text>
                        <Button
                            mode="contained"
                            buttonColor={Colors.primary}
                            textColor={Colors.onPrimary}
                            style={{ marginTop: 14, borderRadius: 18 }}
                            labelStyle={{ fontWeight: '700' }}
                            onPress={() => navigation.navigate('Main')}>
                            Khám phá món ăn
                        </Button>
                    </View>
                }
            />

            <Portal>
                <Dialog
                    visible={Boolean(editing)}
                    onDismiss={closeEdit}
                    style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>
                        Cập nhật đánh giá
                    </Dialog.Title>
                    <Dialog.Content>
                        {editing ? (
                            <>
                                <Text style={styles.dialogDish} numberOfLines={2}>
                                    {editing.dish_name || `Món #${editing.dish}`}
                                </Text>
                                <Text style={styles.dialogLabel}>Số sao</Text>
                                <StarPicker value={editRating} onChange={setEditRating} />
                                <Text style={styles.dialogLabel}>Nhận xét</Text>
                                <TextInput
                                    mode="outlined"
                                    placeholder="Chia sẻ cảm nhận của bạn..."
                                    placeholderTextColor={Colors.placeholder}
                                    value={editComment}
                                    onChangeText={setEditComment}
                                    multiline
                                    style={{ backgroundColor: Colors.surfaceContainerLowest, minHeight: 90 }}
                                    outlineStyle={{ borderRadius: 14, borderColor: Colors.outline, borderWidth: 1.5 }}
                                    activeOutlineColor={Colors.primary}
                                    textColor={Colors.text}
                                />
                            </>
                        ) : null}
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button
                            onPress={closeEdit}
                            textColor={Colors.textSecondary}
                            disabled={saving}>
                            Hủy
                        </Button>
                        <Button
                            mode="contained"
                            buttonColor={Colors.primary}
                            textColor={Colors.onPrimary}
                            onPress={saveEdit}
                            loading={saving}
                            disabled={saving}>
                            Lưu thay đổi
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <ConfirmDialog
                visible={Boolean(deleteTarget)}
                type="warning"
                title="Xóa đánh giá"
                message={`Bạn chắc chắn muốn xóa đánh giá cho "${deleteTarget?.dish_name || 'món này'}"?`}
                onCancel={() => !deleting && setDeleteTarget(null)}
                onConfirm={confirmDelete}
                confirmText={deleting ? 'Đang xóa...' : 'Xóa'}
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

export default MyReviews;
