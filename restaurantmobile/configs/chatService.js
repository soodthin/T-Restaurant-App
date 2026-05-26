import {
    ref,
    push,
    set,
    get,
    onChildAdded,
    onValue,
    serverTimestamp,
    query,
    orderByChild,
    off,
} from 'firebase/database';
import { database } from './firebaseConfig';


export const getChatRoomId = (customerId, chefId) =>
    `customer_${customerId}_chef_${chefId}`;

const isChatRole = (role) => role === 'customer' || role === 'chef';

const isCustomerChefPair = (currentUser, otherUser) =>
    currentUser?.id &&
    otherUser?.id &&
    isChatRole(currentUser.role) &&
    isChatRole(otherUser.role) &&
    currentUser.role !== otherUser.role;


export const getOrCreateChatRoom = async (currentUser, otherUser) => {
    if (!isCustomerChefPair(currentUser, otherUser)) {
        throw new Error('Chat chi ho tro giua khach hang va dau bep.');
    }
    const isCustomer = currentUser.role === 'customer';
    const customerId = isCustomer ? currentUser.id : otherUser.id;
    const chefId = isCustomer ? otherUser.id : currentUser.id;
    const roomId = getChatRoomId(customerId, chefId);

    const roomRef = ref(database, `chatRooms/${roomId}/info`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
        const customerName = isCustomer
            ? _getDisplayName(currentUser)
            : _getDisplayName(otherUser);
        const chefName = isCustomer
            ? _getDisplayName(otherUser)
            : _getDisplayName(currentUser);

        await set(roomRef, {
            customerId,
            customerName,
            customerAvatar: isCustomer
                ? (currentUser.avatar || null)
                : (otherUser.avatar || null),
            chefId,
            chefName,
            chefAvatar: isCustomer
                ? (otherUser.avatar || null)
                : (currentUser.avatar || null),
            lastMessage: '',
            lastMessageAt: 0,
            unreadCount_customer: 0,
            unreadCount_chef: 0,
            createdAt: serverTimestamp(),
        });
    }

    return roomId;
};


export const sendMessage = async (roomId, senderId, senderRole, text) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    if (!isChatRole(senderRole)) {
        throw new Error('Vai tro gui tin nhan khong hop le.');
    }

    const messagesRef = ref(database, `chatRooms/${roomId}/messages`);
    const newMsgRef = push(messagesRef);
    const now = Date.now();

    await set(newMsgRef, {
        senderId,
        senderRole,
        text: trimmed,
        createdAt: now,
    });


    const infoRef = ref(database, `chatRooms/${roomId}/info`);
    const infoSnap = await get(infoRef);
    if (infoSnap.exists()) {
        const data = infoSnap.val();
        const updates = {
            ...data,
            lastMessage: trimmed,
            lastMessageAt: now,
        };
        if (senderRole === 'customer') {
            updates.unreadCount_chef = (data.unreadCount_chef || 0) + 1;
        } else {
            updates.unreadCount_customer = (data.unreadCount_customer || 0) + 1;
        }
        await set(infoRef, updates);
    }
};


export const subscribeToMessages = (roomId, callback) => {
    const messagesRef = ref(database, `chatRooms/${roomId}/messages`);
    const q = query(messagesRef, orderByChild('createdAt'));

    let isSubscribed = true;
    const allMessages = [];
    let childAddedUnsub = null;

    get(q).then((snapshot) => {
        if (!isSubscribed) return;

        const data = snapshot.val();
        if (data) {
            Object.entries(data).forEach(([key, msg]) => {
                allMessages.push({ id: key, ...msg });
            });
            allMessages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        }
        callback([...allMessages]);


        childAddedUnsub = onChildAdded(q, (childSnap) => {
            if (!isSubscribed) return;
            const msg = { id: childSnap.key, ...childSnap.val() };

            if (!allMessages.find((m) => m.id === msg.id)) {
                allMessages.push(msg);
                allMessages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                callback([...allMessages]);
            }
        });
    });


    return () => {
        isSubscribed = false;
        if (childAddedUnsub) {
            off(q, 'child_added', childAddedUnsub);
        }
    };
};


export const subscribeToChatRooms = (userId, role, callback) => {
    if (!isChatRole(role)) {
        callback([]);
        return () => {};
    }
    const roomsRef = ref(database, 'chatRooms');

    const unsub = onValue(roomsRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            callback([]);
            return;
        }

        const rooms = [];
        Object.entries(data).forEach(([roomId, roomData]) => {
            const info = roomData.info;
            if (!info) return;

            const isMyRoom = role === 'customer'
                ? info.customerId === userId
                : info.chefId === userId;

            if (isMyRoom) {
                rooms.push({
                    roomId,
                    ...info,
                });
            }
        });


        rooms.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
        callback(rooms);
    });

    return () => off(roomsRef, 'value', unsub);
};


export const subscribeToTotalUnreadCount = (userId, role, callback) => {
    if (!isChatRole(role)) {
        callback(0);
        return () => {};
    }
    const roomsRef = ref(database, 'chatRooms');

    const unsub = onValue(roomsRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            callback(0);
            return;
        }

        let total = 0;
        Object.entries(data).forEach(([roomId, roomData]) => {
            const info = roomData.info;
            if (!info) return;

            const isMyRoom = role === 'customer'
                ? info.customerId === userId
                : info.chefId === userId;

            if (isMyRoom) {
                total += role === 'customer'
                    ? (info.unreadCount_customer || 0)
                    : (info.unreadCount_chef || 0);
            }
        });

        callback(total);
    });

    return () => off(roomsRef, 'value', unsub);
};


export const resetUnreadCount = async (roomId, role) => {
    if (!isChatRole(role)) return;
    const infoRef = ref(database, `chatRooms/${roomId}/info`);
    const snapshot = await get(infoRef);
    if (snapshot.exists()) {
        const data = snapshot.val();
        const updates = { ...data };
        if (role === 'customer') {
            updates.unreadCount_customer = 0;
        } else {
            updates.unreadCount_chef = 0;
        }
        await set(infoRef, updates);
    }
};


const _getDisplayName = (user) => {
    const full = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return full || user.username || `User #${user.id}`;
};
