import { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    Image,
    FlatList,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { TextInput, Button, ActivityIndicator, IconButton, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FadeIn, FadeInUp } from '@utils/animations';
import { Apis, authFetch, endpoints, clearSession, getApiErrorMessage, getStoredUser } from '@configs';
import Colors from '@styles/colors';
import { Toast } from '@components/CustomDialog';
import { useCart } from '@contexts/CartContext';
import { stripHtml } from '@utils/format';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './styles';

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
    const insets = useSafeAreaInsets();

    const showToast = (message, type = 'error') => {
        setToast({ visible: true, message, type });
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const storedUser = await getStoredUser();
            setCurrentUser(storedUser);

            const [dishRes, reviewRes] = await Promise.all([
                Apis.get(endpoints['dish-detail'](id)),
                Apis.get(endpoints['dish-reviews'](id)),
            ]);

            if (!dishRes.ok) {
                throw new Error(getApiErrorMessage(dishRes, 'Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c chi ti\u1ebft m\u00f3n \u0103n'));
            }
            if (!reviewRes.ok) {
                throw new Error(getApiErrorMessage(reviewRes, 'Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c danh s\u00e1ch \u0111\u00e1nh gi\u00e1'));
            }

            const dishData = dishRes.data;
            const reviewData = Array.isArray(reviewRes.data)
                ? reviewRes.data
                : (reviewRes.data?.results || []);
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
            setError(err.message || 'Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c chi ti\u1ebft m\u00f3n \u0103n');
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
            showToast('Vui l\u00f2ng \u0111\u0103ng nh\u1eadp \u0111\u1ec3 \u0111\u00e1nh gi\u00e1 m\u00f3n \u0103n');
            return;
        }
        if (rating < 1 || rating > 5) {
            showToast('Vui l\u00f2ng ch\u1ecdn s\u1ed1 sao t\u1eeb 1 \u0111\u1ebfn 5');
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
                showToast(getApiErrorMessage(res, 'Kh\u00f4ng th\u1ec3 g\u1eedi \u0111\u00e1nh gi\u00e1'));
                return;
            }

            const savedReview = res.data;
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
            showToast(myReview ? '\u0110\u00e3 c\u1eadp nh\u1eadt \u0111\u00e1nh gi\u00e1 c\u1ee7a b\u1ea1n' : '\u0110\u00e3 g\u1eedi \u0111\u00e1nh gi\u00e1 th\u00e0nh c\u00f4ng', 'success');
        } catch (err) {
            showToast('Kh\u00f4ng th\u1ec3 g\u1eedi \u0111\u00e1nh gi\u00e1');
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
                <Text style={styles.stateTitle}>{`Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c m\u00f3n \u0103n`}</Text>
                <Text style={styles.stateText}>{error || 'D\u1eef li\u1ec7u m\u00f3n \u0103n hi\u1ec7n kh\u00f4ng kh\u1ea3 d\u1ee5ng.'}</Text>
                <Button
                    mode="contained"
                    onPress={loadData}
                    buttonColor={Colors.primary}
                    textColor={Colors.onPrimary}
                    style={{ borderRadius: 20, marginTop: 18 }}
                    labelStyle={{ fontWeight: '700' }}>
                    {`Th\u1eed l\u1ea1i`}
                </Button>
            </View>
        );
    }


    const cleanDescription = stripHtml(dish.description);
    const cleanIngredients = stripHtml(dish.ingredients);
    const ingredientsList = cleanIngredients
        ? cleanIngredients.split(',').map((s) => s.trim()).filter(Boolean)
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
                            <View style={[styles.headerActions, { top: Math.max(insets.top, 16) + 10 }]}>
                                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.goBack()}>
                                    <MaterialCommunityIcons name="chevron-left" size={26} color={Colors.text} />
                                </TouchableOpacity>
                            </View>

                            {dish.image ?
                                <FadeIn duration={500}><Image source={{ uri: dish.image }} style={styles.img} /></FadeIn> :
                                <View style={[styles.img, styles.imagePlaceholder]}>
                                    <MaterialCommunityIcons name="food-variant" size={60} color={Colors.textSecondary} />
                                </View>
                            }
                        </View>

                        <FadeInUp delay={200} duration={400} style={styles.infoBox}>
                            <View style={styles.titleRow}>
                                <Text style={styles.name}>{dish.name}</Text>
                                <Text style={styles.price}>{Number(dish.price).toLocaleString()}{`\u0111`}</Text>
                            </View>

                            <View style={styles.quickStatsRow}>
                                <View style={styles.ratingBadge}>
                                    <MaterialCommunityIcons name="star" size={16} color={Colors.primary} />
                                    <Text style={styles.ratingBadgeText}>{dish.avg_rating > 0 ? Number(dish.avg_rating).toFixed(1) : 'M\u1edbi'}</Text>
                                    <Text style={styles.ratingBadgeSub}>({dish.review_count || 0})</Text>
                                </View>
                                <View style={styles.prepTimeBadge}>
                                    <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.textSecondary} />
                                    <Text style={styles.prepTimeText}>{dish.preparation_time} phút</Text>
                                </View>
                            </View>

                            <Text style={styles.desc}>{cleanDescription || 'Nh\u00e0 h\u00e0ng ch\u01b0a c\u1eadp nh\u1eadt m\u00f4 t\u1ea3 cho m\u00f3n n\u00e0y.'}</Text>

                            {dish.chef && (
                                <TouchableOpacity
                                    style={styles.chatChefCard}
                                    activeOpacity={currentUser && currentUser.role !== 'chef' ? 0.8 : 1}
                                    onPress={() => {
                                        if (currentUser && currentUser.role !== 'chef') {
                                            navigation.navigate('ChatScreen', {
                                                otherUser: {
                                                    id: dish.chef,
                                                    first_name: dish.chef_name || '',
                                                    last_name: '',
                                                    username: dish.chef_name || `Chef #${dish.chef}`,
                                                    avatar: null,
                                                    role: 'chef',
                                                },
                                            });
                                        }
                                    }}>
                                    <View style={styles.chatChefInfo}>
                                        <View style={styles.chatChefAvatar}>
                                            <MaterialCommunityIcons name="chef-hat" size={24} color={Colors.primary} />
                                        </View>
                                        <View style={styles.chatChefText}>
                                            <Text style={styles.chatChefTitle}>Đầu bếp đảm nhận</Text>
                                            <Text style={styles.chatChefName} numberOfLines={1}>
                                                {dish.chef_name || 'Nhà hàng'}
                                            </Text>
                                        </View>
                                    </View>

                                    {currentUser && currentUser.role !== 'chef' && (
                                        <View style={styles.chatChefAction}>
                                            <MaterialCommunityIcons name="message-text-outline" size={20} color={Colors.onPrimary} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )}

                            <View style={styles.sectionContainer}>
                                <Text style={styles.sectionTitle}>{`Nguyên liệu chính`}</Text>
                                {ingredientsList.length > 0 ? (
                                    <View style={styles.ingredientGrid}>
                                        {ingredientsList.map((item, idx) => (
                                            <View key={idx} style={styles.ingredientChip}>
                                                <MaterialCommunityIcons name="leaf" size={14} color="#22c55e" />
                                                <Text style={styles.ingredientText}>{item}</Text>
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <Text style={styles.ingredients}>{`Thông tin nguyên liệu đang được cập nhật.`}</Text>
                                )}
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.sectionContainer}>
                                <Text style={styles.sectionTitle}>
                                    {myReview ? '\u0110\u00e1nh gi\u00e1 c\u1ee7a b\u1ea1n' : 'Tr\u1ea3i nghi\u1ec7m c\u1ee7a b\u1ea1n?'}
                                </Text>
                                <View style={styles.writeReviewCard}>
                                    <View style={styles.starRow}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <TouchableOpacity
                                                key={star}
                                                onPress={() => setRating(star)}>
                                                <MaterialCommunityIcons
                                                    name={star <= rating ? 'star' : 'star-outline'}
                                                    size={32}
                                                    color={star <= rating ? Colors.star : Colors.outline}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <TextInput
                                        mode="flat"
                                        placeholder={"Chia s\u1ebb c\u1ea3m nh\u1eadn c\u1ee7a b\u1ea1n v\u1ec1 m\u00f3n n\u00e0y..."}
                                        placeholderTextColor={Colors.placeholder}
                                        value={comment}
                                        onChangeText={setComment}
                                        multiline
                                        style={{ backgroundColor: Colors.surfaceContainerLow, minHeight: 96, borderRadius: 12 }}
                                        underlineColor="transparent"
                                        activeUnderlineColor="transparent"
                                        textColor={Colors.text}
                                    />

                                    {currentUser ?
                                        <Button
                                            mode="contained"
                                            onPress={submitReview}
                                            disabled={submittingReview}
                                            loading={submittingReview}
                                            buttonColor={Colors.primary}
                                            textColor={Colors.onPrimary}
                                            style={{ borderRadius: 16, marginTop: 14 }}
                                            labelStyle={{ fontWeight: '700', fontSize: 15 }}
                                            contentStyle={{ paddingVertical: 6 }}>
                                            {myReview ? 'C\u1eadp nh\u1eadt \u0111\u00e1nh gi\u00e1' : 'G\u1eedi \u0111\u00e1nh gi\u00e1'}
                                        </Button> :
                                        <Button
                                            mode="contained-tonal"
                                            onPress={() => navigation.navigate('Login')}
                                            style={{ borderRadius: 16, marginTop: 14 }}
                                            labelStyle={{ fontWeight: '700', fontSize: 15 }}
                                            contentStyle={{ paddingVertical: 6 }}>
                                            {`\u0110\u0103ng nh\u1eadp \u0111\u1ec3 \u0111\u00e1nh gi\u00e1 m\u00f3n n\u00e0y`}
                                        </Button>
                                    }
                                </View>
                            </View>

                            <View style={[styles.sectionContainer, { marginTop: 24, paddingHorizontal: 4 }]}>
                                <Text style={styles.sectionTitle}>{`\u0110\u00e1nh gi\u00e1 g\u1ea7n \u0111\u00e2y`} ({reviews.length})</Text>
                            </View>
                        </FadeInUp>
                    </View>
                }
                renderItem={({ item, index }) => (
                    <FadeInUp delay={index * 50} duration={300} style={{ paddingHorizontal: 20 }}>
                        <View style={styles.reviewItem}>
                            <View style={styles.reviewTop}>
                                <View style={styles.reviewAuthorWrap}>
                                    <View style={styles.reviewAvatar}>
                                        <Text style={styles.reviewAvatarText}>
                                            {(item.customer_name || `K`).charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={styles.reviewAuthor}>
                                            {item.customer_name || `Kh\u00e1ch #${item.customer}`}
                                        </Text>
                                        <Text style={styles.reviewDate}>
                                            {new Date(item.created_date).toLocaleDateString('vi-VN')}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.reviewStarBadge}>
                                    <MaterialCommunityIcons name="star" size={12} color={Colors.star} />
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
                        <Text style={styles.emptyReviewText}>{`Ch\u01b0a c\u00f3 \u0111\u00e1nh gi\u00e1 n\u00e0o cho m\u00f3n n\u00e0y.`}</Text>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
            />


            {currentUser?.role !== 'chef' && (
                <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
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
                    <TouchableOpacity
                        style={styles.cartBtn}
                        activeOpacity={0.85}
                        onPress={() => {
                            addItem(dish, quantity);
                            showToast(`\u0110\u00e3 th\u00eam ${quantity} ph\u1ea7n v\u00e0o gi\u1ecf!`, 'success');
                        }}>
                        <MaterialCommunityIcons name="cart-outline" size={18} color={Colors.onPrimary} />
                        <Text style={styles.cartBtnText}>Thêm vào giỏ</Text>
                        <View style={styles.cartBtnDivider} />
                        <Text style={styles.cartBtnPrice}>
                            {(Number(dish.price) * quantity).toLocaleString()}đ
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
            />
        </KeyboardAvoidingView>
    );
};

export default DishDetail;
