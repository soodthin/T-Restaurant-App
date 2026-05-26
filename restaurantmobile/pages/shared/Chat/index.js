import { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput as RNTextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getStoredUser } from '@configs';
import { getOrCreateChatRoom, sendMessage, subscribeToMessages, resetUnreadCount } from '../../../configs/chatService';
import Colors from '@styles/colors';
import { getDisplayName, getInitialLetter } from '@utils/format';
import styles from './styles';

const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const formatDateSeparator = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Hôm nay';
    if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const shouldShowDateSeparator = (messages, index) => {


    const realIndex = messages.length - 1 - index;
    if (realIndex === 0) return true;
    const current = messages[realIndex];
    const previous = messages[realIndex - 1];
    if (!current?.createdAt || !previous?.createdAt) return false;
    const currentDate = new Date(current.createdAt).toDateString();
    const previousDate = new Date(previous.createdAt).toDateString();
    return currentDate !== previousDate;
};

const MessageBubble = ({ item, isMe }) => (
    <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
            <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOther]}>
                {item.text}
            </Text>
            <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeOther]}>
                {formatTime(item.createdAt)}
            </Text>
        </View>
    </View>
);

const Chat = ({ route, navigation }) => {
    const { otherUser } = route.params;
    const [currentUser, setCurrentUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [roomId, setRoomId] = useState(null);
    const flatListRef = useRef(null);
    const unsubRef = useRef(null);


    useEffect(() => {
        const name = otherUser
            ? (getDisplayName(otherUser, otherUser.username) || `User #${otherUser.id}`)
            : 'Chat';
        navigation.setOptions({
            title: name,
            headerRight: () => (
                <View style={styles.headerAvatar}>
                    {otherUser?.avatar ? (
                        <Image source={{ uri: otherUser.avatar }} style={styles.headerAvatarImg} />
                    ) : (
                        <View style={[styles.headerAvatarImg, styles.headerAvatarPlaceholder]}>
                            <Text style={styles.headerAvatarLetter}>
                                {getInitialLetter(name)}
                            </Text>
                        </View>
                    )}
                </View>
            ),
        });
    }, [otherUser, navigation]);


    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            const init = async () => {
                setLoading(true);
                try {
                    const user = await getStoredUser();
                    if (cancelled) return;
                    setCurrentUser(user);

                    if (!user || !otherUser) {
                        setLoading(false);
                        return;
                    }

                    const rid = await getOrCreateChatRoom(user, otherUser);
                    if (cancelled) return;
                    setRoomId(rid);


                    await resetUnreadCount(rid, user.role);


                    unsubRef.current = subscribeToMessages(rid, (msgs) => {
                        if (!cancelled) {
                            setMessages(msgs);
                            setLoading(false);
                        }
                    });
                } catch (err) {
                    if (!cancelled) setLoading(false);
                }
            };

            init();

            return () => {
                cancelled = true;
                if (unsubRef.current) {
                    unsubRef.current();
                    unsubRef.current = null;
                }
            };
        }, [otherUser])
    );

    const handleSend = async () => {
        const text = inputText.trim();
        if (!text || !currentUser || !roomId || sending) return;

        setSending(true);
        setInputText('');
        try {
            await sendMessage(roomId, currentUser.id, currentUser.role, text);
        } catch (err) {

            setInputText(text);
        } finally {
            setSending(false);
        }
    };


    const invertedMessages = [...messages].reverse();

    const renderMessage = ({ item, index }) => {
        const isMe = item.senderId === currentUser?.id;
        const showDate = shouldShowDateSeparator(messages, index);
        const realIndex = messages.length - 1 - index;
        const realMsg = messages[realIndex];

        return (
            <View>
                {showDate && (
                    <View style={styles.dateSeparator}>
                        <View style={styles.dateSeparatorLine} />
                        <Text style={styles.dateSeparatorText}>
                            {formatDateSeparator(realMsg?.createdAt)}
                        </Text>
                        <View style={styles.dateSeparatorLine} />
                    </View>
                )}
                <MessageBubble item={item} isMe={isMe} />
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <FlatList
                ref={flatListRef}
                data={invertedMessages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                inverted
                style={styles.messageList}
                contentContainerStyle={styles.messageListContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <MaterialCommunityIcons name="chat-outline" size={40} color={Colors.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>Bắt đầu cuộc trò chuyện</Text>
                        <Text style={styles.emptyText}>
                            Gửi tin nhắn đầu tiên để trao đổi trực tiếp
                            {otherUser?.role === 'chef' ? ' với đầu bếp.' : ' với khách hàng.'}
                        </Text>
                    </View>
                }
            />


            <View style={styles.inputBar}>
                <View style={styles.inputWrap}>
                    <RNTextInput
                        style={styles.textInput}
                        placeholder="Nhập tin nhắn..."
                        placeholderTextColor={Colors.placeholder}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={1000}
                        editable={!sending}
                    />
                </View>
                <TouchableOpacity
                    style={[
                        styles.sendBtn,
                        (!inputText.trim() || sending) && styles.sendBtnDisabled,
                    ]}
                    activeOpacity={0.7}
                    onPress={handleSend}
                    disabled={!inputText.trim() || sending}
                >
                    <MaterialCommunityIcons
                        name="send"
                        size={20}
                        color={inputText.trim() && !sending ? Colors.onPrimary : Colors.placeholder}
                    />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

export default Chat;
