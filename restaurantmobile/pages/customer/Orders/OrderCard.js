import React from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation } from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FadeInUp } from '@utils/animations';
import Colors from '@styles/colors';
import styles from './styles';
import {
    statusConfig,
    statusNoticeConfig,
    paymentMethodConfig,
    paymentStatusConfig,
    formatDateTime,
    formatBookingInfo
} from './orderConstants';

const OrderCard = ({ item, index, onViewDetail }) => {
    const status = statusConfig[item.status] || { label: item.status, color: Colors.textSecondary, icon: 'help-circle-outline' };
    const payment = paymentMethodConfig[item.payment_method] || { label: 'Chưa chọn', icon: 'credit-card-outline' };
    const payStatus = paymentStatusConfig[item.payment_status] || { label: 'Chưa ghi nhận', color: Colors.textSecondary };
    const bookingInfo = formatBookingInfo(item);
    const isCancelled = item.status === 'cancelled' || item.status === 'payment_failed';
    const detailCount = item.details?.length || 0;

    return (
        <FadeInUp delay={index * 50} duration={350}>
            <View style={[styles.card, isCancelled && styles.cardCancelled]}>

                <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.orderId}>{`Đơn #${item.id}`}</Text>
                        <Text style={styles.date}>{formatDateTime(item.created_date)}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: status.color + '15' }]}>
                        <MaterialCommunityIcons name={status.icon} size={14} color={status.color} />
                        <Text style={[styles.badgeText, { color: status.color }]}>
                            {status.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.serviceRow}>
                    <View style={styles.serviceIcon}>
                        <MaterialCommunityIcons
                            name={item.service_type === 'table' ? 'table-chair' : 'storefront-outline'}
                            size={18}
                            color={Colors.primary}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.serviceTitle}>
                            {item.service_label || (item.booking ? 'Phục vụ theo lịch đặt bàn' : 'Lấy tại quầy')}
                        </Text>
                        <Text style={styles.serviceSub}>
                            {item.service_type === 'table'
                                ? (bookingInfo || `Lịch đặt bàn #${item.booking}`)
                                : 'Nhận món tại quầy khi trạng thái đã sẵn sàng.'}
                        </Text>
                    </View>
                </View>

                <View style={styles.paymentBlock}>
                    <View style={styles.paymentInfoCol}>
                        <Text style={styles.summaryLabel}>Thanh toán</Text>
                        <View style={styles.paymentMethodRow}>
                            <MaterialCommunityIcons name={payment.icon} size={14} color={Colors.textSecondary} />
                            <Text style={styles.paymentMethodText} numberOfLines={1}>{payment.label}</Text>
                        </View>
                        <View style={[styles.payPill, { backgroundColor: payStatus.color + '15', alignSelf: 'flex-start', marginTop: 4, marginLeft: 0 }]}>
                            <Text style={[styles.payPillText, { color: payStatus.color }]}>
                                {payStatus.label}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.amountCol}>
                        <Text style={[styles.summaryLabel, { textAlign: 'right' }]}>Tổng tiền</Text>
                        <Text style={styles.amount}>
                            {Number(item.total_amount).toLocaleString('vi-VN')}đ
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.actionsRow}>
                    <View style={styles.detailsToggleLeft}>
                        <MaterialCommunityIcons name="receipt" size={16} color={Colors.textSecondary} />
                        <Text style={styles.detailsToggleText}>{`${detailCount} món ăn`}</Text>
                    </View>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.viewDetailBtn}
                        onPress={() => onViewDetail(item)}
                    >
                        <Text style={styles.viewDetailText}>Xem chi tiết</Text>
                        <MaterialCommunityIcons name="arrow-right" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>
        </FadeInUp>
    );
};

export default React.memo(OrderCard);
