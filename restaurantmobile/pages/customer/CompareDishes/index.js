import { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import { ActivityIndicator, Button, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FadeInRight } from '@utils/animations';
import Colors from '@styles/colors';
import { Apis, endpoints, getApiErrorMessage } from '@configs';
import { useCart } from '@contexts/CartContext';
import { Toast } from '@components/CustomDialog';
import styles from './styles';

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
                const res = await Apis.get(`${endpoints['dish-compare']}?ids=${ids.join(',')}`);
                if (!res.ok) {
                    throw new Error(getApiErrorMessage(res, 'Kh\u00f4ng th\u1ec3 t\u1ea3i d\u1eef li\u1ec7u so s\u00e1nh'));
                }
                const data = res.data;
                setDishes(data);
                setError('');
            } catch (err) {
                setError(err.message || 'Kh\u00f4ng th\u1ec3 t\u1ea3i d\u1eef li\u1ec7u so s\u00e1nh');
            } finally {
                setLoading(false);
            }
        };

        if (ids.length >= 2) loadDishes();
        else {
            setError('C\u1ea7n \u00edt nh\u1ea5t 2 m\u00f3n \u0111\u1ec3 so s\u00e1nh');
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
                <Text style={styles.stateTitle}>{`Kh\u00f4ng m\u1edf \u0111\u01b0\u1ee3c b\u1ea3ng so s\u00e1nh`}</Text>
                <Text style={styles.stateText}>{error}</Text>
                <Button
                    mode="contained"
                    onPress={() => navigation.goBack()}
                    buttonColor={Colors.primary}
                    textColor={Colors.onPrimary}
                    style={styles.actionBtn}>
                    {`Quay l\u1ea1i ch\u1ecdn m\u00f3n`}
                </Button>
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
                                        <Text style={styles.metricLabel}>{`Gi\u00e1`}</Text>
                                        <Text style={styles.metricValue}>{Number(dish.price).toLocaleString()}{`\u0111`}</Text>
                                    </View>
                                </View>

                                <View style={styles.metricGroup}>
                                    <View style={styles.metricIconWrap}>
                                        <MaterialCommunityIcons name="star-outline" size={16} color={Colors.star} />
                                    </View>
                                    <View>
                                        <Text style={styles.metricLabel}>{`\u0110\u00e1nh gi\u00e1`}</Text>
                                        <Text style={styles.metricValue}>
                                            {dish.avg_rating > 0 ? Number(dish.avg_rating).toFixed(1) : 'M\u1edbi'} ({dish.review_count || 0})
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.metricGroup}>
                                    <View style={styles.metricIconWrap}>
                                        <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.tertiary} />
                                    </View>
                                    <View>
                                        <Text style={styles.metricLabel}>{`Chu\u1ea9n b\u1ecb`}</Text>
                                        <Text style={styles.metricValue}>{dish.preparation_time} {`ph\u00fat`}</Text>
                                    </View>
                                </View>

                                <View style={styles.metricGroup}>
                                    <View style={styles.metricIconWrap}>
                                        <MaterialCommunityIcons name="chef-hat" size={16} color={Colors.text} />
                                    </View>
                                    <View>
                                        <Text style={styles.metricLabel}>{`Ph\u1ee5 tr\u00e1ch`}</Text>
                                        <Text style={styles.metricValue}>{dish.chef_name || 'Nh\u00e0 h\u00e0ng'}</Text>
                                    </View>
                                </View>

                                <View style={[styles.metricGroup, { alignItems: 'flex-start' }]}>
                                    <View style={[styles.metricIconWrap, { marginTop: 2 }]}>
                                        <MaterialCommunityIcons name="leaf" size={16} color={Colors.success} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.metricLabel}>{`Nguy\u00ean li\u1ec7u`}</Text>
                                        <View style={styles.ingredientPills}>
                                            {(dish.ingredients || 'Ch\u01b0a c\u1eadp nh\u1eadt').split(',').map((item, idx) => (
                                                <Chip
                                                    key={idx}
                                                    mode="outlined"
                                                    compact
                                                    textStyle={styles.ingredientChipText}
                                                    style={styles.ingredientChip}>
                                                    {item.trim()}
                                                </Chip>
                                            ))}
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.btnRow}>
                                    <Button
                                        mode="contained"
                                        icon="cart-plus"
                                        buttonColor={Colors.primary}
                                        textColor={Colors.onPrimary}
                                        style={styles.cartBtn}
                                        onPress={() => {
                                            addItem(dish);
                                            setToast({ visible: true, message: `\u0110\u00e3 th\u00eam ${dish.name} v\u00e0o gi\u1ecf`, type: 'success' });
                                        }}>
                                        {`Th\u00eam v\u00e0o gi\u1ecf`}
                                    </Button>

                                    <Button
                                        mode="contained-tonal"
                                        buttonColor={Colors.surfaceContainerLow}
                                        textColor={Colors.text}
                                        onPress={() => navigation.navigate('DishDetail', { id: dish.id })}>
                                        Chi ti\u1ebft
                                    </Button>
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

export default CompareDishes;
