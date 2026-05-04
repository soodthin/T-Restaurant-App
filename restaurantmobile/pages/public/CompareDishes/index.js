import { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { ActivityIndicator, Button, Chip, Portal, Dialog } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FadeIn } from '@utils/animations';
import Colors from '@styles/colors';
import { Apis, endpoints, getApiErrorMessage } from '@configs';
import { useCart } from '@contexts/CartContext';
import { Toast } from '@components/CustomDialog';
import { stripHtml } from '@utils/format';
import styles from './styles';

const PREVIEW_INGREDIENTS = 2;

const splitIngredients = (raw) => stripHtml(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const CompareDishes = ({ route, navigation }) => {
    const ids = route.params?.ids || [];
    const { addItem } = useCart();
    const [dishes, setDishes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });
    const [ingredientDish, setIngredientDish] = useState(null);

    useEffect(() => {
        const loadDishes = async () => {
            setLoading(true);
            try {
                const res = await Apis.get(`${endpoints['dish-compare']}?ids=${ids.join(',')}`);
                if (!res.ok) {
                    throw new Error(getApiErrorMessage(res, 'Không thể tải dữ liệu so sánh'));
                }
                setDishes(res.data);
                setError('');
            } catch (err) {
                setError(err.message || 'Không thể tải dữ liệu so sánh');
            } finally {
                setLoading(false);
            }
        };

        if (ids.length >= 2) loadDishes();
        else {
            setError('Cần ít nhất 2 món để so sánh');
            setLoading(false);
        }
    }, [ids]);

    const bests = useMemo(() => {
        if (dishes.length === 0) return { price: null, time: null, rating: null };
        const prices = dishes.map((d) => Number(d.price) || 0);
        const times = dishes.map((d) => Number(d.preparation_time) || 0);
        const ratings = dishes.map((d) => Number(d.avg_rating) || 0);
        const minPrice = Math.min(...prices);
        const minTime = Math.min(...times);
        const maxRating = Math.max(...ratings);
        return {
            price: prices.every((p) => p === minPrice) ? null : minPrice,
            time: times.every((t) => t === minTime) ? null : minTime,
            rating: maxRating > 0 && !ratings.every((r) => r === maxRating) ? maxRating : null,
        };
    }, [dishes]);

    if (loading) {
        return <ActivityIndicator size="large" color={Colors.primary} style={{ flex: 1, backgroundColor: Colors.surface }} />;
    }

    if (error) {
        return (
            <View style={styles.centerState}>
                <View style={styles.errorIcon}>
                    <MaterialCommunityIcons name="compare" size={36} color={Colors.primary} />
                </View>
                <Text style={styles.stateTitle}>{'Không mở được bảng so sánh'}</Text>
                <Text style={styles.stateText}>{error}</Text>
                <Button
                    mode="contained"
                    onPress={() => navigation.goBack()}
                    buttonColor={Colors.primary}
                    textColor={Colors.onPrimary}
                    style={styles.actionBtn}>
                    {'Quay lại chọn món'}
                </Button>
            </View>
        );
    }

    const dialogIngredients = splitIngredients(ingredientDish?.ingredients);

    const removeDish = (id) => {
        const next = dishes.filter((d) => d.id !== id);
        if (next.length < 2) {
            navigation.goBack();
            return;
        }
        setDishes(next);
    };

    const renderBestBadge = (label) => (
        <View style={styles.bestBadge}>
            <MaterialCommunityIcons name="trophy-variant" size={11} color={Colors.success} />
            <Text style={styles.bestBadgeText}>{label}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <FadeIn duration={300}>
                    {/* Hàng ảnh — float (không có card bg) */}
                    <View style={styles.imageRow}>
                        {dishes.map((dish) => (
                            <View key={`img-${dish.id}`} style={styles.imageCellWrap}>
                                <View style={styles.imageBg}>
                                    {dish.image ?
                                        <Image source={{ uri: dish.image }} style={styles.dishImage} /> :
                                        <MaterialCommunityIcons name="silverware-fork-knife" size={32} color={Colors.primary} />
                                    }
                                </View>
                                <TouchableOpacity
                                    style={styles.removeBtn}
                                    activeOpacity={0.7}
                                    hitSlop={10}
                                    onPress={() => removeDish(dish.id)}>
                                    <MaterialCommunityIcons name="close" size={14} color={Colors.onPrimary} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    {/* Hàng tên — float (không có card bg) */}
                    <View style={styles.nameRow}>
                        {dishes.map((dish) => (
                            <View key={`name-${dish.id}`} style={styles.nameCell}>
                                <Text style={styles.dishName} numberOfLines={2}>{dish.name}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Giá */}
                    <View style={styles.criteriaHeader}>
                        <MaterialCommunityIcons name="tag-outline" size={14} color={Colors.primary} />
                        <Text style={styles.criteriaLabel}>{'Giá'}</Text>
                    </View>
                    <View style={styles.row}>
                        {dishes.map((dish) => {
                            const isBest = bests.price !== null && Number(dish.price) === bests.price;
                            return (
                                <View key={`price-${dish.id}`} style={styles.cell}>
                                    <Text style={[styles.value, isBest && styles.valueBest]}>
                                        {Number(dish.price).toLocaleString()}đ
                                    </Text>
                                    {isBest ? renderBestBadge('Rẻ nhất') : null}
                                </View>
                            );
                        })}
                    </View>

                    {/* Thời gian phục vụ */}
                    <View style={styles.criteriaHeader}>
                        <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.tertiary} />
                        <Text style={styles.criteriaLabel}>{'Thời gian phục vụ'}</Text>
                    </View>
                    <View style={styles.row}>
                        {dishes.map((dish) => {
                            const isBest = bests.time !== null && Number(dish.preparation_time) === bests.time;
                            return (
                                <View key={`time-${dish.id}`} style={styles.cell}>
                                    <Text style={[styles.value, isBest && styles.valueBest]}>
                                        {dish.preparation_time} phút
                                    </Text>
                                    {isBest ? renderBestBadge('Nhanh nhất') : null}
                                </View>
                            );
                        })}
                    </View>

                    {/* Đánh giá */}
                    <View style={styles.criteriaHeader}>
                        <MaterialCommunityIcons name="star-outline" size={14} color={Colors.star} />
                        <Text style={styles.criteriaLabel}>{'Đánh giá'}</Text>
                    </View>
                    <View style={styles.row}>
                        {dishes.map((dish) => {
                            const rating = Number(dish.avg_rating) || 0;
                            const isBest = bests.rating !== null && rating === bests.rating;
                            return (
                                <View key={`rate-${dish.id}`} style={styles.cell}>
                                    <View style={styles.ratingValueRow}>
                                        <MaterialCommunityIcons
                                            name={rating > 0 ? 'star' : 'star-outline'}
                                            size={14}
                                            color={rating > 0 ? Colors.star : Colors.placeholder}
                                        />
                                        <Text style={[styles.value, isBest && styles.valueBest, { marginLeft: 4 }]}>
                                            {rating > 0 ? rating.toFixed(1) : 'Mới'}
                                        </Text>
                                    </View>
                                    <Text style={styles.subValue}>
                                        {dish.review_count || 0} đánh giá
                                    </Text>
                                    {isBest ? renderBestBadge('Đánh giá cao') : null}
                                </View>
                            );
                        })}
                    </View>

                    {/* Nguyên liệu chính */}
                    <View style={styles.criteriaHeader}>
                        <MaterialCommunityIcons name="leaf" size={14} color={Colors.success} />
                        <Text style={styles.criteriaLabel}>{'Nguyên liệu chính'}</Text>
                    </View>
                    <View style={styles.row}>
                        {dishes.map((dish) => {
                            const all = splitIngredients(dish.ingredients);
                            const preview = all.slice(0, PREVIEW_INGREDIENTS);
                            const remaining = Math.max(0, all.length - PREVIEW_INGREDIENTS);
                            return (
                                <View key={`ing-${dish.id}`} style={styles.ingredientCell}>
                                    {all.length === 0 ?
                                        <Text style={styles.emptyHint}>{'Chưa cập nhật'}</Text> :
                                        <View style={styles.ingredientPreview}>
                                            {preview.map((item, idx) => (
                                                <View key={idx} style={styles.previewChip}>
                                                    <Text style={styles.previewChipText} numberOfLines={1}>{item}</Text>
                                                </View>
                                            ))}
                                            <TouchableOpacity
                                                style={styles.moreBtn}
                                                activeOpacity={0.7}
                                                onPress={() => setIngredientDish(dish)}>
                                                <Text style={styles.moreBtnText}>
                                                    {remaining > 0 ? `+${remaining} nữa` : 'Xem chi tiết'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    }
                                </View>
                            );
                        })}
                    </View>

                    {/* Nút thêm vào giỏ */}
                    <View style={[styles.row, styles.buttonRow]}>
                        {dishes.map((dish) => (
                            <View key={`btn-${dish.id}`} style={styles.btnCell}>
                                <Button
                                    mode="contained"
                                    icon="cart-plus"
                                    compact
                                    buttonColor={Colors.primary}
                                    textColor={Colors.onPrimary}
                                    onPress={() => {
                                        addItem(dish);
                                        setToast({ visible: true, message: `Đã thêm ${dish.name} vào giỏ`, type: 'success' });
                                    }}
                                    style={styles.cartBtn}
                                    labelStyle={styles.cartBtnLabel}
                                    contentStyle={styles.cartBtnContent}>
                                    {'Thêm'}
                                </Button>
                            </View>
                        ))}
                    </View>
                </FadeIn>
            </ScrollView>

            <Portal>
                <Dialog
                    visible={Boolean(ingredientDish)}
                    onDismiss={() => setIngredientDish(null)}
                    style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>
                        {ingredientDish?.name || 'Chi tiết món'}
                    </Dialog.Title>
                    <Dialog.Content>
                        <ScrollView style={{ maxHeight: 360 }}>
                            <Text style={styles.dialogSection}>{'Nguyên liệu sử dụng'}</Text>
                            {dialogIngredients.length > 0 ? (
                                <View style={styles.ingredientsGrid}>
                                    {dialogIngredients.map((item, idx) => (
                                        <Chip
                                            key={idx}
                                            mode="outlined"
                                            icon="leaf"
                                            compact
                                            textStyle={styles.dialogChipText}
                                            style={styles.dialogChip}>
                                            {item}
                                        </Chip>
                                    ))}
                                </View>
                            ) : (
                                <Text style={styles.emptyHint}>{'Chưa cập nhật nguyên liệu cho món này.'}</Text>
                            )}

                            {ingredientDish?.description ?
                                <View style={styles.descriptionBlock}>
                                    <Text style={styles.dialogSection}>{'Mô tả món'}</Text>
                                    <Text style={styles.descriptionText}>{stripHtml(ingredientDish.description)}</Text>
                                </View> :
                                null
                            }

                            <View style={styles.descriptionBlock}>
                                <Text style={styles.dialogSection}>{'Phụ trách'}</Text>
                                <Text style={styles.descriptionText}>{ingredientDish?.chef_name || 'Nhà hàng'}</Text>
                            </View>
                        </ScrollView>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button
                            onPress={() => setIngredientDish(null)}
                            textColor={Colors.text}>
                            {'Đóng'}
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
            />
        </View>
    );
};

export default CompareDishes;
