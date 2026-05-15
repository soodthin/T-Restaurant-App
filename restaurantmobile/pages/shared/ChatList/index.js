import { useCallback, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    RefreshControl,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getStoredUser } from '@configs';
import { subscribeToChatRooms } from '../../../configs/chatService';
import { getInitialLetter } from '@utils/format';
import Colors from '@styles/colors';
import { FadeIn, FadeInUp } from '@utils/animations';
import styles from './styles';

const formatLastTime = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút`;
    if (diffMins < 1440) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    if (diffMins < 2880) return 'Hôm qua';
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

const ChatRoomItem = ({ room, currentUser, index, onPress }) => {
    const isCustomer = currentUser?.role === 'customer';
    // Hien thi thong tin nguoi doi dien.
    const otherName = isCustomer ? room.chefName : room.customerName;
    const otherAvatar = isCustomer ? room.chefAvatar : room.customerAvatar;
    const otherId = isCustomer ? room.chefId : room.customerId;
    const otherRole = isCustomer ? 'chef' : 'customer';
    const unreadCount = isCustomer ? (room.unreadCount_customer || 0) : (room.unreadCount_chef || 0);

    return (
        <FadeInUp delay={index * 60} duration={350}>
            <TouchableOpacity
                style={styles.chatItem}
                activeOpacity={0.7}
                onPress={() => onPress({
                    id: otherId,
                    first_name: otherName,
                    last_name: '',
                    username: otherName,
                    avatar: otherAvatar,
                    role: otherRole,
                })}
            >
                {otherAvatar ? (
                    <Image source={{ uri: otherAvatar }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarLetter}>
                            {getInitialLetter(otherName || '?')}
                        </Text>
                    </View>
                )}

                <View style={styles.chatContent}>
                    <View style={styles.chatTopRow}>
                        <Text style={styles.chatName} numberOfLines={1}>{otherName || `User #${otherId}`}</Text>
                        <Text style={styles.chatTime}>{formatLastTime(room.lastMessageAt)}</Text>
                    </View>
                    <View style={styles.chatBottomRow}>
                        <View style={[styles.roleBadge, {
                            backgroundColor: otherRole === 'chef'
                                ? Colors.star + '20'
                                : Colors.tertiary + '20',
                        }]}>
                            <MaterialCommunityIcons
                                name={otherRole === 'chef' ? 'chef-hat' : 'account'}
                                size={10}
                                color={otherRole === 'chef' ? Colors.star : Colors.tertiary}
                            />
                            <Text style={[styles.roleText, {
                                color: otherRole === 'chef' ? Colors.star : Colors.tertiary,
                            }]}>
                                {otherRole === 'chef' ? 'Đầu bếp' : 'Khách hàng'}
                            </Text>
                        </View>
                        <View style={styles.messageRow}>
                            <Text 
                                style={[styles.lastMessage, unreadCount > 0 && styles.lastMessageUnread]} 
                                numberOfLines={1}>
                                {room.lastMessage || 'Chưa có tin nhắn'}
                            </Text>
                            {unreadCount > 0 && (
                                <View style={styles.unreadBadge}>
                                    <Text style={styles.unreadText}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </FadeInUp>
    );
};

const ChatList = ({ navigation }) => {
    const [rooms, setRooms] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let unsub = null;
            let cancelled = false;

            const init = async () => {
                const user = await getStoredUser();
                if (cancelled) return;
                setCurrentUser(user);

                if (!user) {
                    setLoading(false);
                    return;
                }

                unsub = subscribeToChatRooms(user.id, user.role, (chatRooms) => {
                    if (!cancelled) {
                        setRooms(chatRooms);
                        setLoading(false);
                        setRefreshing(false);
                    }
                });
            };

            init();

            return () => {
                cancelled = true;
                if (unsub) unsub();
            };
        }, [])
    );

    const navigateToChat = (otherUser) => {
        navigation.navigate('ChatScreen', { otherUser });
    };

    const onRefresh = () => {
        setRefreshing(true);
        // subscribeToChatRooms da la realtime, refresh chi de trigger UI feedback.
        setTimeout(() => setRefreshing(false), 600);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={rooms}
                renderItem={({ item, index }) => (
                    <ChatRoomItem
                        room={item}
                        currentUser={currentUser}
                        index={index}
                        onPress={navigateToChat}
                    />
                )}
                keyExtractor={(item) => item.roomId}
                contentContainerStyle={{ paddingBottom: 24 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                    />
                }
                ListHeaderComponent={
                    <FadeIn duration={400} style={styles.header}>
                        <Text style={styles.headerTitle}>Tin nhắn</Text>
                        <Text style={styles.headerSubtitle}>
                            {currentUser?.role === 'chef'
                                ? 'Trao đổi trực tiếp với khách hàng về món ăn.'
                                : 'Trao đổi trực tiếp với đầu bếp về món ăn.'}
                        </Text>
                    </FadeIn>
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconCircle}>
                            <MaterialCommunityIcons name="chat-processing-outline" size={36} color={Colors.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>Chưa có cuộc trò chuyện</Text>
                        <Text style={styles.emptyText}>
                            {currentUser?.role === 'chef'
                                ? 'Khi khách hàng nhắn tin hỏi về món ăn, cuộc trò chuyện sẽ xuất hiện tại đây.'
                                : 'Vào chi tiết món ăn và bấm "Chat với đầu bếp" để bắt đầu cuộc trò chuyện.'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

export default ChatList;
