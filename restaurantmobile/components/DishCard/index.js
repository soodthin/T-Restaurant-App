import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FadeInUp } from '@utils/animations';
import Colors from '@styles/colors';
import styles from './styles';

const DishCard = ({ dish, index, onPress, onCompare, onAddCart, isCompareSelected, featured = false }) => {
    if (featured) {
        return (
            <FadeInUp delay={index * 60} duration={400}>
                <TouchableOpacity
                    style={styles.featuredCard}
                    activeOpacity={0.92}
                    onPress={() => onPress(dish)}>
                    {dish.image ?
                        <Image source={{ uri: dish.image }} style={styles.featuredImg} /> :
                        <View style={[styles.featuredImg, styles.featuredPlaceholder]}>
                            <MaterialCommunityIcons name="food-variant" size={40} color={Colors.textSecondary} />
                        </View>
                    }
                    <View style={styles.featuredBody}>
                        <View style={styles.featuredTopRow}>
                            <Text style={styles.featuredDishName} numberOfLines={2}>{dish.name}</Text>
                            <Text style={styles.featuredDishPrice}>
                                {Number(dish.price).toLocaleString()}đ
                            </Text>
                        </View>

                        <View style={styles.featuredMetaRow}>
                            <View style={styles.metricChip}>
                                <MaterialCommunityIcons name="star" size={13} color={Colors.star} />
                                <Text style={styles.metricText}>
                                    {dish.avg_rating > 0 ? Number(dish.avg_rating).toFixed(1) : 'Mới'}
                                </Text>
                            </View>
                            <View style={styles.metricChip}>
                                <MaterialCommunityIcons name="clock-outline" size={13} color={Colors.tertiary} />
                                <Text style={styles.metricText}>{dish.preparation_time} phút</Text>
                            </View>
                        </View>

                        <View style={styles.cardActions}>
                            <Button
                                mode={isCompareSelected ? 'contained' : 'contained-tonal'}
                                compact
                                icon={isCompareSelected ? 'check-circle' : 'compare'}
                                onPress={() => onCompare(dish.id)}
                                buttonColor={isCompareSelected ? Colors.primary : Colors.surfaceContainerLow}
                                textColor={isCompareSelected ? Colors.onPrimary : Colors.text}
                                style={styles.actionBtn}
                                labelStyle={styles.actionBtnLabel}>
                                {isCompareSelected ? 'Đã chọn' : 'So sánh'}
                            </Button>

                            <Button
                                mode="contained"
                                compact
                                icon="cart-plus"
                                onPress={() => onAddCart(dish)}
                                buttonColor={Colors.primary}
                                textColor={Colors.onPrimary}
                                style={styles.actionBtn}
                                labelStyle={styles.actionBtnLabel}>
                                Thêm
                            </Button>
                        </View>
                    </View>
                </TouchableOpacity>
            </FadeInUp>
        );
    }

    return (
        <FadeInUp delay={index * 60} duration={400}>
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.92}
                onPress={() => onPress(dish)}>
                <View style={styles.cardContent}>
                    {dish.image ?
                        <Image source={{ uri: dish.image }} style={styles.dishImg} /> :
                        <View style={[styles.dishImg, styles.placeholder]}>
                            <MaterialCommunityIcons name="food-variant" size={28} color={Colors.textSecondary} />
                        </View>
                    }

                    <View style={styles.cardBody}>
                        <View style={styles.topRow}>
                            <Text style={styles.dishName} numberOfLines={2}>{dish.name}</Text>
                            <Text style={styles.dishPrice}>
                                {Number(dish.price).toLocaleString()}đ
                            </Text>
                        </View>

                        <View style={styles.metaRow}>
                            <View style={styles.metricChip}>
                                <MaterialCommunityIcons name="star" size={13} color={Colors.star} />
                                <Text style={styles.metricText}>
                                    {dish.avg_rating > 0 ? Number(dish.avg_rating).toFixed(1) : 'Mới'}
                                </Text>
                            </View>
                            <View style={styles.metricChip}>
                                <MaterialCommunityIcons name="clock-outline" size={13} color={Colors.tertiary} />
                                <Text style={styles.metricText}>{dish.preparation_time} phút</Text>
                            </View>
                        </View>

                        <View style={styles.cardActions}>
                            <Button
                                mode={isCompareSelected ? 'contained' : 'contained-tonal'}
                                compact
                                icon={isCompareSelected ? 'check-circle' : 'compare'}
                                onPress={() => onCompare(dish.id)}
                                buttonColor={isCompareSelected ? Colors.primary : Colors.surfaceContainerLow}
                                textColor={isCompareSelected ? Colors.onPrimary : Colors.text}
                                style={styles.actionBtn}
                                labelStyle={styles.actionBtnLabel}>
                                {isCompareSelected ? 'Đã chọn' : 'So sánh'}
                            </Button>

                            <Button
                                mode="contained"
                                compact
                                icon="cart-plus"
                                onPress={() => onAddCart(dish)}
                                buttonColor={Colors.primary}
                                textColor={Colors.onPrimary}
                                style={styles.actionBtn}
                                labelStyle={styles.actionBtnLabel}>
                                Thêm
                            </Button>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </FadeInUp>
    );
};

export default DishCard;
