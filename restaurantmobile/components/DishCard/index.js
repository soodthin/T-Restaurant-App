import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FadeInUp } from '@utils/animations';
import Colors from '@styles/colors';
import styles from './styles';

const DishCard = ({ dish, index, onPress, onCompare, onAddCart, isCompareSelected }) => {
    return (
        <FadeInUp delay={index * 60} duration={400}>
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.92}
                onPress={() => onPress(dish)}>
                {dish.image ?
                    <Image source={{ uri: dish.image }} style={styles.dishImg} /> :
                    <View style={[styles.dishImg, styles.placeholder]}>
                        <MaterialCommunityIcons name="food-variant" size={30} color={Colors.textSecondary} />
                    </View>
                }

                <View style={styles.floatingBadge}>
                    <MaterialCommunityIcons name="star" size={14} color={Colors.star} />
                    <Text style={styles.floatingBadgeText}>
                        {dish.avg_rating > 0 ? dish.avg_rating.toFixed(1) : 'Mới'}
                    </Text>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                            <Text style={styles.dishName} numberOfLines={2}>{dish.name}</Text>
                            <Text style={styles.dishMeta} numberOfLines={1}>
                                {dish.menu_name || 'Thực đơn'} · {dish.category_name || 'Món ăn'}
                            </Text>
                        </View>
                        <Text style={styles.dishPrice}>{Number(dish.price).toLocaleString()}đ</Text>
                    </View>

                    <View style={styles.badgeRow}>
                        <View style={styles.metricChip}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.primary} />
                            <Text style={styles.metricText}>{dish.preparation_time} phút</Text>
                        </View>
                        <View style={styles.metricChip}>
                            <MaterialCommunityIcons name="message-text-outline" size={14} color={Colors.tertiary} />
                            <Text style={styles.metricText}>{dish.review_count || 0} đánh giá</Text>
                        </View>
                    </View>

                    <Text style={styles.chefText} numberOfLines={1}>
                        Phụ trách: {dish.chef_name || 'Nhà hàng'}
                    </Text>

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
};

export default DishCard;
