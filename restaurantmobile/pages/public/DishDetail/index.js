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

    // Backend dùng RichTextField → trả HTML có entity Việt; cần strip để hiển thị plain.
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
                            {dish.image ?
                                <FadeIn duration={500}><Image source={{ uri: dish.image }} style={styles.img} /></FadeIn> :
                                <View style={[styles.img, styles.imagePlaceholder]}>
                                    <MaterialCommunityIcons name="food-variant" size={60} color={Colors.textSecondary} />
                                </View>
                            }
                            <View style={styles.ratingOverlay}>
                                <MaterialCommunityIcons name="star" size={18} color={Colors.star} />
                                <Text style={styles.ratingOverlayText}>
                                    {dish.avg_rating > 0 ? Number(dish.avg_rating).toFixed(1) : 'M\u1edbi'}
                                </Text>
                                <Text style={styles.ratingOverlaySub}> · {dish.review_count || 0}</Text>
                            </View>
                        </View>

                        <FadeInUp delay={200} duration={400} style={styles.infoBox}>
                            <View style={styles.titleRow}>
                                <Text style={styles.name}>{dish.name}</Text>
                                <Text style={styles.price}>{Number(dish.price).toLocaleString()}{`\u0111`}</Text>
                            </View>

                            <Text style={styles.desc}>{cleanDescription || 'Nh\u00e0 h\u00e0ng ch\u01b0a c\u1eadp nh\u1eadt m\u00f4 t\u1ea3 cho m\u00f3n n\u00e0y.'}</Text>

                            <View style={styles.tagRow}>
                                <Chip
                                    icon="clock-outline"
                                    mode="flat"
                                    compact
                                    style={styles.tagChip}
                                    textStyle={styles.tagChipText}>
                                    {dish.preparation_time} {`ph\u00fat`}
                                </Chip>
                                <Chip
                                    icon="chef-hat"
                                    mode="flat"
                                    compact
                                    style={styles.tagChip}
                                    textStyle={styles.tagChipText}>
                                    {dish.chef_name || 'Nh\u00e0 h\u00e0ng'}
                                </Chip>
                            </View>
                        </FadeInUp>

                        <FadeInUp delay={300} duration={400} style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>{`Nguy\u00ean li\u1ec7u`}</Text>
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
                                <Text style={styles.ingredients}>{`Th\u00f4ng tin nguy\u00ean li\u1ec7u \u0111ang \u0111\u01b0\u1ee3c c\u1eadp nh\u1eadt.`}</Text>
                            )}
                        </FadeInUp>

                        <FadeInUp delay={400} duration={400} style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>
                                {myReview ? '\u0110\u00e1nh gi\u00e1 c\u1ee7a b\u1ea1n' : 'Vi\u1ebft \u0111\u00e1nh gi\u00e1'}
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
                                placeholder={"Chia s\u1ebb c\u1ea3m nh\u1eadn c\u1ee7a b\u1ea1n v\u1ec1 m\u00f3n n\u00e0y..."}
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
                                    {myReview ? 'C\u1eadp nh\u1eadt \u0111\u00e1nh gi\u00e1' : 'G\u1eedi \u0111\u00e1nh gi\u00e1'}
                                </Button> :
                                <Button
                                    mode="contained-tonal"
                                    onPress={() => navigation.navigate('Login')}
                                    style={{ borderRadius: 20, marginTop: 14 }}
                                    labelStyle={{ fontWeight: '700', fontSize: 15 }}>
                                    {`\u0110\u0103ng nh\u1eadp \u0111\u1ec3 \u0111\u00e1nh gi\u00e1 m\u00f3n n\u00e0y`}
                                </Button>
                            }
                        </FadeInUp>

                        <FadeInUp delay={500} duration={400} style={styles.reviewHeader}>
                            <Text style={styles.sectionTitle}>{`\u0110\u00e1nh gi\u00e1 g\u1ea7n \u0111\u00e2y`} ({reviews.length})</Text>
                        </FadeInUp>
                    </View>
                }
                renderItem={({ item, index }) => (
                    <FadeInUp delay={index * 50} duration={300}>
                        <View style={styles.reviewItem}>
                            <View style={styles.reviewTop}>
                                <View style={{ flex: 1, paddingRight: 12 }}>
                                    <Text style={styles.reviewAuthor}>
                                        {item.customer_name || `Kh\u00e1ch #${item.customer}`}
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
                        <Text style={styles.emptyReviewText}>{`Ch\u01b0a c\u00f3 \u0111\u00e1nh gi\u00e1 n\u00e0o cho m\u00f3n n\u00e0y.`}</Text>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            />

            {/* Chef khong dat hang nen an thanh cong cu them gio. */}
            {currentUser?.role !== 'chef' && (
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
                            showToast(`\u0110\u00e3 th\u00eam ${quantity} ${dish.name} v\u00e0o gi\u1ecf`, 'success');
                        }}
                        buttonColor={Colors.primary}
                        textColor={Colors.onPrimary}
                        style={styles.cartBtn}
                        labelStyle={{ fontWeight: '800', fontSize: 16 }}
                        contentStyle={{ paddingVertical: 6 }}>
                        {`Th\u00eam v\u00e0o gi\u1ecf`}
                    </Button>
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
