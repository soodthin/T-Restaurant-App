import { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FadeInRight } from '../utils/animations';
import Colors from '../styles/colors';
import { editorialShadow } from '../styles/theme';
import { endpoints } from '../configs';
import { buildApiUrl, getApiErrorMessage } from '../utils/api';
import { useCart } from '../contexts/CartContext';
import { Toast } from './CustomDialog';

const CompareDishes = ({ route, navigation }) => {
    const ids = route.params?.ids || [];
    const { addItem } = useCart();
    const [dishes, setDishes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });

    useEffect(() => {
        const loadDishes = async () => {
            setLoading(true);
            try {
                const res = await fetch(buildApiUrl(`${endpoints['dish-compare']}?ids=${ids.join(',')}`));
                if (!res.ok) {
                    throw new Error(await getApiErrorMessage(res, 'Không thể tải dữ liệu so sánh'));
                }
                const data = await res.json();
                setDishes(data);
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

    if (loading) {
        return <ActivityIndicator size="large" color={Colors.primary} style={{ flex: 1, backgroundColor: Colors.surface }} />;
    }

    if (error) {
        return (
            <View style={styles.centerState}>
                <View style={styles.errorIcon}>
                    <MaterialCommunityIcons name="compare" size={36} color={Colors.primary} />
                </View>
                <Text style={styles.stateTitle}>Không mở được bảng so sánh</Text>
                <Text style={styles.stateText}>{error}</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
                    <Text style={styles.backBtnText}>Quay lại chọn món</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                snapToInterval={320}
                decelerationRate="fast"
                contentContainerStyle={styles.scrollContent}>
                {dishes.map((dish, index) => (
                    <FadeInRight key={dish.id} delay={index * 100} duration={400}>
                        <View style={styles.card}>
                            {dish.image ?
                                <Image source={{ uri: dish.image }} style={styles.image} /> :
                                <View style={[styles.image, styles.imagePlaceholder]}>
                                    <MaterialCommunityIcons name="food-variant" size={30} color={Colors.textSecondary} />
                                </View>
                            }

                            <View style={styles.cardBody}>
                                <Text style={styles.name}>{dish.name}</Text>

                                <View style={styles.metricGroup}>
                                    <View style={styles.metricIconWrap}>
                                        <MaterialCommunityIcons name="tag-outline" size={16} color={Colors.primary} />
                                    </View>
                                    <View>
                                        <Text style={styles.metricLabel}>Giá</Text>
                                        <Text style={styles.metricValue}>{Number(dish.price).toLocaleString()}đ</Text>
                                    </View>
                                </View>

                                <View style={styles.metricGroup}>
                                    <View style={styles.metricIconWrap}>
                                        <MaterialCommunityIcons name="star-outline" size={16} color={Colors.star} />
                                    </View>
                                    <View>
                                        <Text style={styles.metricLabel}>Đánh giá</Text>
                                        <Text style={styles.metricValue}>
                                            {dish.avg_rating > 0 ? Number(dish.avg_rating).toFixed(1) : 'Mới'} ({dish.review_count || 0})
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.metricGroup}>
                                    <View style={styles.metricIconWrap}>
                                        <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.tertiary} />
                                    </View>
                                    <View>
                                        <Text style={styles.metricLabel}>Chuẩn bị</Text>
                                        <Text style={styles.metricValue}>{dish.preparation_time} phút</Text>
                                    </View>
                                </View>

                                <View style={styles.metricGroup}>
                                    <View style={styles.metricIconWrap}>
                                        <MaterialCommunityIcons name="chef-hat" size={16} color={Colors.text} />
                                    </View>
                                    <View>
                                        <Text style={styles.metricLabel}>Phụ trách</Text>
                                        <Text style={styles.metricValue}>{dish.chef_name || 'Nhà hàng'}</Text>
                                    </View>
                                </View>

                                <View style={[styles.metricGroup, { alignItems: 'flex-start' }]}>
                                    <View style={[styles.metricIconWrap, { marginTop: 2 }]}>
                                        <MaterialCommunityIcons name="leaf" size={16} color={Colors.success} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.metricLabel}>Nguyên liệu</Text>
                                        <View style={styles.ingredientPills}>
                                            {(dish.ingredients || 'Chưa cập nhật').split(',').map((item, idx) => (
                                                <View key={idx} style={styles.ingredientPill}>
                                                    <Text style={styles.ingredientPillText}>{item.trim()}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.btnRow}>
                                    <TouchableOpacity
                                        style={styles.primaryBtn}
                                        activeOpacity={0.85}
                                        onPress={() => {
                                            addItem(dish);
                                            setToast({ visible: true, message: `Đã thêm ${dish.name} vào giỏ`, type: 'success' });
                                        }}>
                                        <MaterialCommunityIcons name="cart-plus" size={18} color={Colors.onPrimary} />
                                        <Text style={styles.primaryBtnText}>Thêm vào giỏ</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.secondaryBtn}
                                        activeOpacity={0.8}
                                        onPress={() => navigation.navigate('DishDetail', { id: dish.id })}>
                                        <Text style={styles.secondaryBtnText}>Chi tiết</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </FadeInRight>
                ))}
            </ScrollView>

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    scrollContent: { paddingHorizontal: 16, paddingVertical: 18 },
    card: {
        width: 310,
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        overflow: 'hidden',
        marginRight: 14,
        ...editorialShadow,
    },
    image: { width: '100%', height: 190, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    imagePlaceholder: { backgroundColor: Colors.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' },
    cardBody: { padding: 20 },
    name: { fontSize: 22, fontWeight: '800', color: Colors.text, lineHeight: 28 },
    metricGroup: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
    metricIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: Colors.surfaceContainerLow,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    metricLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 },
    metricValue: { fontSize: 16, color: Colors.text, fontWeight: '700', marginTop: 2 },
    ingredientPills: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
    ingredientPill: {
        backgroundColor: Colors.surfaceContainerLow,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 9999,
        marginRight: 6,
        marginBottom: 4,
    },
    ingredientPillText: { fontSize: 12, color: Colors.text, fontWeight: '600' },
    btnRow: { flexDirection: 'row', marginTop: 20 },
    primaryBtn: {
        flex: 1,
        backgroundColor: Colors.primary,
        borderRadius: 20,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginRight: 8,
    },
    primaryBtnText: { color: Colors.onPrimary, fontWeight: '800', marginLeft: 6 },
    secondaryBtn: {
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 20,
        paddingVertical: 14,
        paddingHorizontal: 18,
        alignItems: 'center',
    },
    secondaryBtnText: { color: Colors.text, fontWeight: '800' },
    centerState: {
        flex: 1,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stateTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 18 },
    stateText: { fontSize: 15, color: Colors.textSecondary, marginTop: 10, textAlign: 'center', lineHeight: 22 },
    backBtn: { backgroundColor: Colors.primary, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 14, marginTop: 18 },
    backBtnText: { color: Colors.onPrimary, fontWeight: '800' },
});

export default CompareDishes;
