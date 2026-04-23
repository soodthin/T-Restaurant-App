import { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    Image,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { TextInput, Button, ActivityIndicator, IconButton, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FadeIn, FadeInUp } from '../utils/animations';
import authFetch, {
    buildApiUrl,
    clearSession,
    getApiErrorMessage,
    getStoredUser,
} from '../utils/api';
import { endpoints } from '../configs';
import Colors from '../styles/colors';
import { editorialShadow } from '../styles/theme';
import { Toast } from './CustomDialog';
import { useCart } from '../contexts/CartContext';

const DishDetail = ({ route, navigation }) => {
    const { id } = route.params;
    const { addItem } = useCart();
    const [dish, setDish] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });

    const showToast = (message, type = 'error') => {
        setToast({ visible: true, message, type });
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const storedUser = await getStoredUser();
            setCurrentUser(storedUser);

            const [dishRes, reviewRes] = await Promise.all([
                fetch(buildApiUrl(endpoints['dish-detail'](id))),
                fetch(buildApiUrl(endpoints['dish-reviews'](id))),
            ]);

            if (!dishRes.ok) {
                throw new Error(await getApiErrorMessage(dishRes, 'Không tải được chi tiết món ăn'));
            }
            if (!reviewRes.ok) {
                throw new Error(await getApiErrorMessage(reviewRes, 'Không tải được danh sách đánh giá'));
            }

            const [dishData, reviewData] = await Promise.all([dishRes.json(), reviewRes.json()]);
            setDish(dishData);
            setReviews(reviewData);

            if (storedUser) {
                const ownReview = reviewData.find((review) => review.customer === storedUser.id);
                if (ownReview) {
                    setRating(ownReview.rating);
                    setComment(ownReview.comment || '');
                } else {
                    setRating(0);
                    setComment('');
                }
            }

            setError('');
        } catch (err) {
            setError(err.message || 'Không tải được chi tiết món ăn');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const myReview = useMemo(() => {
        if (!currentUser) return null;
        return reviews.find((review) => review.customer === currentUser.id) || null;
    }, [currentUser, reviews]);

    const submitReview = async () => {
        if (!currentUser) {
            showToast('Vui lòng đăng nhập để đánh giá món ăn');
            return;
        }
        if (rating < 1 || rating > 5) {
            showToast('Vui lòng chọn số sao từ 1 đến 5');
            return;
        }

        setSubmittingReview(true);
        try {
            const endpoint = myReview ? `${endpoints['reviews']}${myReview.id}/` : endpoints['reviews'];
            const method = myReview ? 'PATCH' : 'POST';
            const payload = myReview
                ? { rating, comment }
                : { dish: id, rating, comment };

            const res = await authFetch(endpoint, {
                method,
                body: JSON.stringify(payload),
            });

            if (res.status === 401) {
                await clearSession();
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                return;
            }

            if (!res.ok) {
                showToast(await getApiErrorMessage(res, 'Không thể gửi đánh giá'));
                return;
            }

            const savedReview = await res.json();
            setReviews((prev) => {
                if (myReview) {
                    return prev.map((review) => review.id === savedReview.id ? savedReview : review);
                }
                return [savedReview, ...prev];
            });
            setDish((prev) => {
                if (!prev) return prev;
                const existingCount = prev.review_count || 0;
                const nextCount = myReview ? existingCount : existingCount + 1;
                const allRatings = myReview
                    ? reviews.map((review) => review.id === savedReview.id ? savedReview.rating : review.rating)
                    : [savedReview.rating, ...reviews.map((review) => review.rating)];
                const avg = allRatings.reduce((sum, value) => sum + value, 0) / allRatings.length;
                return { ...prev, avg_rating: avg, review_count: nextCount };
            });
            showToast(myReview ? 'Đã cập nhật đánh giá của bạn' : 'Đã gửi đánh giá thành công', 'success');
        } catch (err) {
            showToast('Không thể gửi đánh giá');
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) {
        return <ActivityIndicator size="large" color={Colors.primary} style={{ flex: 1, backgroundColor: Colors.surface }} />;
    }

    if (error || !dish) {
        return (
            <View style={styles.centerState}>
                <MaterialCommunityIcons name="alert-circle-outline" size={52} color={Colors.primary} />
                <Text style={styles.stateTitle}>Không tải được món ăn</Text>
                <Text style={styles.stateText}>{error || 'Dữ liệu món ăn hiện không khả dụng.'}</Text>
                <Button
                    mode="contained"
                    onPress={loadData}
                    buttonColor={Colors.primary}
                    textColor={Colors.onPrimary}
                    style={{ borderRadius: 20, marginTop: 18 }}
                    labelStyle={{ fontWeight: '700' }}>
                    Thử lại
                </Button>
            </View>
        );
    }

    const ingredientsList = dish.ingredients
        ? dish.ingredients.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: Colors.surface }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <FlatList
                style={{ backgroundColor: Colors.surface }}
                data={reviews}
                keyExtractor={(item) => item.id.toString()}
                keyboardShouldPersistTaps="handled"
                ListHeaderComponent={
                    <View>
                        <View style={styles.heroWrap}>
                            {dish.image ?
                                <FadeIn duration={500}><Image source={{ uri: dish.image }} style={styles.img} /></FadeIn> :
                                <View style={[styles.img, styles.imagePlaceholder]}>
                                    <MaterialCommunityIcons name="food-variant" size={60} color={Colors.textSecondary} />
                                </View>
                            }
                            <View style={styles.ratingOverlay}>
                                <MaterialCommunityIcons name="star" size={18} color={Colors.star} />
                                <Text style={styles.ratingOverlayText}>
                                    {dish.avg_rating > 0 ? Number(dish.avg_rating).toFixed(1) : 'Mới'}
                                </Text>
                                <Text style={styles.ratingOverlaySub}> · {dish.review_count || 0}</Text>
                            </View>
                        </View>

                        <FadeInUp delay={200} duration={400} style={styles.infoBox}>
                            <View style={styles.titleRow}>
                                <Text style={styles.name}>{dish.name}</Text>
                                <Text style={styles.price}>{Number(dish.price).toLocaleString()}đ</Text>
                            </View>

                            <Text style={styles.desc}>{dish.description || 'Nhà hàng chưa cập nhật mô tả cho món này.'}</Text>

                            <View style={styles.tagRow}>
                                <Chip
                                    icon="clock-outline"
                                    mode="flat"
                                    compact
                                    style={styles.tagChip}
                                    textStyle={styles.tagChipText}>
                                    {dish.preparation_time} phút
                                </Chip>
                                <Chip
                                    icon="chef-hat"
                                    mode="flat"
                                    compact
                                    style={styles.tagChip}
                                    textStyle={styles.tagChipText}>
                                    {dish.chef_name || 'Nhà hàng'}
                                </Chip>
                            </View>
                        </FadeInUp>

                        <FadeInUp delay={300} duration={400} style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Nguyên liệu</Text>
                            {ingredientsList.length > 0 ? (
                                <View style={styles.ingredientGrid}>
                                    {ingredientsList.map((item, idx) => (
                                        <Chip
                                            key={idx}
                                            icon="leaf"
                                            mode="outlined"
                                            compact
                                            style={styles.ingredientChip}
                                            textStyle={styles.ingredientText}>
                                            {item}
                                        </Chip>
                                    ))}
                                </View>
                            ) : (
                                <Text style={styles.ingredients}>Thông tin nguyên liệu đang được cập nhật.</Text>
                            )}
                        </FadeInUp>

                        <FadeInUp delay={400} duration={400} style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>
                                {myReview ? 'Đánh giá của bạn' : 'Viết đánh giá'}
                            </Text>
                            <View style={styles.starRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity
                                        key={star}
                                        style={styles.starBtn}
                                        onPress={() => setRating(star)}>
                                        <MaterialCommunityIcons
                                            name={star <= rating ? 'star' : 'star-outline'}
                                            size={30}
                                            color={Colors.star}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TextInput
                                mode="outlined"
                                placeholder="Chia sẻ cảm nhận của bạn về món này..."
                                placeholderTextColor={Colors.placeholder}
                                value={comment}
                                onChangeText={setComment}
                                multiline
                                style={{ backgroundColor: Colors.surfaceContainerLowest, minHeight: 96 }}
                                outlineStyle={{ borderRadius: 16, borderColor: Colors.outline, borderWidth: 1.5 }}
                                activeOutlineColor={Colors.primary}
                                textColor={Colors.text}
                            />

                            {currentUser ?
                                <Button
                                    mode="contained"
                                    icon="send"
                                    onPress={submitReview}
                                    disabled={submittingReview}
                                    loading={submittingReview}
                                    buttonColor={Colors.primary}
                                    textColor={Colors.onPrimary}
                                    style={{ borderRadius: 20, marginTop: 14 }}
                                    labelStyle={{ fontWeight: '700', fontSize: 15 }}>
                                    {myReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
                                </Button> :
                                <Button
                                    mode="contained-tonal"
                                    onPress={() => navigation.navigate('Login')}
                                    style={{ borderRadius: 20, marginTop: 14 }}
                                    labelStyle={{ fontWeight: '700', fontSize: 15 }}>
                                    Đăng nhập để đánh giá món này
                                </Button>
                            }
                        </FadeInUp>

                        <FadeInUp delay={500} duration={400} style={styles.reviewHeader}>
                            <Text style={styles.sectionTitle}>Đánh giá gần đây ({reviews.length})</Text>
                        </FadeInUp>
                    </View>
                }
                renderItem={({ item, index }) => (
                    <FadeInUp delay={index * 50} duration={300}>
                        <View style={styles.reviewItem}>
                            <View style={styles.reviewTop}>
                                <View style={{ flex: 1, paddingRight: 12 }}>
                                    <Text style={styles.reviewAuthor}>
                                        {item.customer_name || `Khách #${item.customer}`}
                                    </Text>
                                    <Text style={styles.reviewDate}>
                                        {new Date(item.created_date).toLocaleDateString('vi-VN')}
                                    </Text>
                                </View>
                                <View style={styles.reviewStarBadge}>
                                    <MaterialCommunityIcons name="star" size={14} color={Colors.star} />
                                    <Text style={styles.reviewStarText}>{item.rating}</Text>
                                </View>
                            </View>
                            {item.comment ? <Text style={styles.reviewComment}>{item.comment}</Text> : null}
                        </View>
                    </FadeInUp>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyReview}>
                        <MaterialCommunityIcons name="message-outline" size={44} color={Colors.textSecondary} />
                        <Text style={styles.emptyReviewText}>Chưa có đánh giá nào cho món này.</Text>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            />

            <View style={styles.bottomBar}>
                <View style={styles.stepper}>
                    <IconButton
                        icon="minus"
                        size={18}
                        onPress={() => setQuantity((prev) => Math.max(1, prev - 1))}
                        style={styles.stepBtn}
                        iconColor={Colors.text}
                    />
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <IconButton
                        icon="plus"
                        size={18}
                        onPress={() => setQuantity((prev) => prev + 1)}
                        style={styles.stepBtn}
                        iconColor={Colors.text}
                    />
                </View>
                <Button
                    mode="contained"
                    icon="cart-plus"
                    onPress={() => {
                        addItem(dish, quantity);
                        showToast(`Đã thêm ${quantity} ${dish.name} vào giỏ`, 'success');
                    }}
                    buttonColor={Colors.primary}
                    textColor={Colors.onPrimary}
                    style={styles.cartBtn}
                    labelStyle={{ fontWeight: '800', fontSize: 16 }}
                    contentStyle={{ paddingVertical: 6 }}>
                    Thêm vào giỏ
                </Button>
            </View>

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    heroWrap: { position: 'relative' },
    img: { width: '100%', height: 300, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
    imagePlaceholder: { backgroundColor: Colors.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' },
    ratingOverlay: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest + 'E6',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        ...editorialShadow,
    },
    ratingOverlayText: { color: Colors.text, fontWeight: '800', marginLeft: 6, fontSize: 16 },
    ratingOverlaySub: { color: Colors.textSecondary, fontSize: 13 },
    infoBox: { paddingBottom: 8 },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    name: { fontSize: 28, fontWeight: '800', color: Colors.text, flex: 1, marginRight: 12, lineHeight: 34 },
    price: { fontSize: 24, color: Colors.primary, fontWeight: '800' },
    desc: { fontSize: 15, color: Colors.textSecondary, paddingHorizontal: 20, marginTop: 12, lineHeight: 24 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginTop: 16 },
    tagChip: { marginRight: 8, marginBottom: 8, backgroundColor: Colors.primaryLight },
    tagChipText: { color: Colors.text, fontSize: 13, fontWeight: '600' },
    sectionCard: {
        marginHorizontal: 20,
        marginTop: 18,
        padding: 20,
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        ...editorialShadow,
    },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 12 },
    ingredients: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
    ingredientGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    ingredientChip: { marginRight: 8, marginBottom: 8 },
    ingredientText: { fontSize: 13, color: Colors.text, fontWeight: '600' },
    starRow: { flexDirection: 'row', marginBottom: 14 },
    starBtn: { marginRight: 4 },
    reviewHeader: { marginHorizontal: 20, marginTop: 10 },
    reviewItem: {
        padding: 16,
        marginHorizontal: 20,
        marginVertical: 5,
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 20,
        ...editorialShadow,
    },
    reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    reviewAuthor: { fontSize: 15, fontWeight: '700', color: Colors.text },
    reviewDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
    reviewStarBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.star + '15',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    reviewStarText: { color: Colors.star, fontWeight: '700', fontSize: 14, marginLeft: 4 },
    reviewComment: { color: Colors.text, fontSize: 15, lineHeight: 22, marginTop: 10 },
    emptyReview: { alignItems: 'center', marginTop: 16, paddingHorizontal: 24 },
    emptyReviewText: { fontSize: 14, color: Colors.textSecondary, marginTop: 10, textAlign: 'center' },
    bottomBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface + 'CC',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 18,
        paddingVertical: 14,
        paddingBottom: 28,
        ...editorialShadow,
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 20,
        paddingHorizontal: 2,
        paddingVertical: 2,
    },
    stepBtn: { width: 38, height: 38, borderRadius: 14, backgroundColor: Colors.surfaceContainerLowest },
    quantityText: { minWidth: 36, textAlign: 'center', fontSize: 18, fontWeight: '800', color: Colors.text },
    cartBtn: {
        borderRadius: 20,
        flex: 1,
        marginLeft: 12,
    },
    centerState: {
        flex: 1,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    stateTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 16 },
    stateText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginTop: 10, lineHeight: 22 },
});

export default DishDetail;
