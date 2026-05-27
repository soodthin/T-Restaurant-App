import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PaperProvider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { View, TouchableOpacity, Text, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { useState, useEffect, useRef } from 'react';

import Login from '@pages/auth/Login';
import Register from '@pages/auth/Register';
import Home from '@pages/public/Home';
import DishDetail from '@pages/public/DishDetail';
import CompareDishes from '@pages/public/CompareDishes';
import RestaurantDetail from '@pages/public/RestaurantDetail';
import Booking from '@pages/customer/Booking';
import Cart from '@pages/customer/Cart';
import Orders from '@pages/customer/Orders';
import MyReviews from '@pages/customer/MyReviews';
import PaymentCheckout from '@pages/customer/PaymentCheckout';
import Profile from '@pages/shared/Profile';
import ChatList from '@pages/shared/ChatList';
import ChatScreen from '@pages/shared/Chat';
import { subscribeToTotalUnreadCount } from './configs/chatService';
import { getStoredUser } from '@configs';
import ChefHome from '@pages/chef/ChefHome';
import MyDishes from '@pages/chef/MyDishes';
import CreateDish from '@pages/chef/CreateDish';
import ChefReviews from '@pages/chef/ChefReviews';
import ChefOrders from '@pages/chef/ChefOrders';
import GuestPromptCard from '@components/GuestPromptCard';
import Colors from '@styles/colors';
import { editorialShadow, paperTheme } from '@styles/theme';
import { CartProvider, useCart } from '@contexts/CartContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabOptions = {
    tabBarActiveTintColor: Colors.primary,
    tabBarInactiveTintColor: Colors.textSecondary,
    tabBarStyle: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderTopWidth: 0,
        elevation: 0,
        height: 72,
        paddingBottom: 12,
        paddingTop: 8,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        position: 'absolute',
        ...editorialShadow,
    },
    tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    tabBarHideOnKeyboard: true,
    headerStyle: {
        backgroundColor: Colors.surface,
        elevation: 0,
        shadowOpacity: 0,
    },
    headerTintColor: Colors.text,
    headerTitleStyle: {
        fontWeight: '800',
        fontSize: 18,
    },
};

const CUSTOMER_TABS = ['Home', 'Cart', 'Booking', 'Orders', 'Profile'];

const CustomerTab = ({ initialRouteName = 'Home' }) => {
    const { totalItems } = useCart();
    const initialTab = CUSTOMER_TABS.includes(initialRouteName) ? initialRouteName : 'Home';

    return (
        <Tab.Navigator initialRouteName={initialTab} screenOptions={tabOptions}>
            <Tab.Screen
                name="Home"
                component={Home}
                options={{
                    title: 'Khám phá',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons
                            name="silverware-fork-knife"
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="Cart"
                component={Cart}
                options={{
                    title: 'Giỏ hàng',
                    tabBarBadge: totalItems > 0 ? totalItems : undefined,
                    tabBarBadgeStyle: { backgroundColor: Colors.primary, fontSize: 10, fontWeight: '700' },
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="shopping-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Booking"
                component={Booking}
                options={{
                    title: 'Đặt bàn',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="calendar-clock" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Orders"
                component={Orders}
                options={{
                    title: 'Đơn hàng',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="receipt" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={Profile}
                options={{
                    title: 'Hồ sơ',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons
                            name="account-circle-outline"
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

const GuestAccount = ({ navigation }) => (
    <View style={{ flex: 1, backgroundColor: Colors.surface, justifyContent: 'center', padding: 20 }}>
        <GuestPromptCard
            title="Đăng nhập để trải nghiệm đầy đủ"
            description="Đặt món, đặt bàn, theo dõi đơn hàng và nhiều tiện ích khác dành cho thành viên."
            onPrimary={() => navigation.navigate('Login')}
            onSecondary={() => navigation.navigate('Register', { role: 'customer' })}
        />
    </View>
);

const GuestTab = () => {
    const { totalItems } = useCart();

    return (
        <Tab.Navigator screenOptions={tabOptions}>
            <Tab.Screen
                name="Home"
                component={Home}
                options={{
                    title: 'Khám phá',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="silverware-fork-knife" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Cart"
                component={Cart}
                initialParams={{ isGuest: true }}
                options={{
                    title: 'Giỏ hàng',
                    tabBarBadge: totalItems > 0 ? totalItems : undefined,
                    tabBarBadgeStyle: { backgroundColor: Colors.primary, fontSize: 10, fontWeight: '700' },
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="shopping-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="GuestAccount"
                component={GuestAccount}
                options={{
                    title: 'Tài khoản',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="account-circle-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

const ChefTab = () => (
    <Tab.Navigator screenOptions={tabOptions}>
        <Tab.Screen
            name="ChefHome"
            component={ChefHome}
            options={{
                title: 'Tổng quan',
                headerShown: false,
                tabBarIcon: ({ color, size }) => (
                    <MaterialCommunityIcons name="view-dashboard-outline" size={size} color={color} />
                ),
            }}
        />
        <Tab.Screen
            name="MyDishes"
            component={MyDishes}
            options={{
                title: 'Món của tôi',
                tabBarIcon: ({ color, size }) => (
                    <MaterialCommunityIcons name="food" size={size} color={color} />
                ),
            }}
        />
        <Tab.Screen
            name="ChefReviews"
            component={ChefReviews}
            options={{
                title: 'Đánh giá',
                tabBarIcon: ({ color, size }) => (
                    <MaterialCommunityIcons name="comment-text-multiple-outline" size={size} color={color} />
                ),
            }}
        />
        <Tab.Screen
            name="Profile"
            component={Profile}
            options={{
                title: 'Hồ sơ',
                tabBarIcon: ({ color, size }) => (
                    <MaterialCommunityIcons
                        name="account-circle-outline"
                        size={size}
                        color={color}
                    />
                ),
            }}
        />
    </Tab.Navigator>
);

const ChatFab = ({ onPress, unreadCount }) => {
    const { width, height } = Dimensions.get('window');
    const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
            },
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: pan.x._value,
                    y: pan.y._value
                });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: () => {
                pan.flattenOffset();

                const currentX = pan.x._value;
                const currentY = pan.y._value;

                const isLeftHalf = currentX < -(width / 2 - 45);
                const targetX = isLeftHalf ? -(width - 90) : 0;

                const minY = -(height - 180);
                const maxY = 20;

                let targetY = currentY;
                if (targetY < minY) targetY = minY;
                if (targetY > maxY) targetY = maxY;

                Animated.spring(pan, {
                    toValue: { x: targetX, y: targetY },
                    useNativeDriver: false,
                    friction: 6,
                }).start();
            }
        })
    ).current;

    return (
        <Animated.View
            {...panResponder.panHandlers}
            style={[
                fabStyles.fabContainer,
                { transform: [{ translateX: pan.x }, { translateY: pan.y }] }
            ]}
        >
            <TouchableOpacity style={fabStyles.fab} activeOpacity={0.85} onPress={onPress}>
                <MaterialCommunityIcons name="chat" size={24} color={Colors.onPrimary} />
                {unreadCount > 0 && (
                    <View style={fabStyles.badge}>
                        <Text style={fabStyles.badgeText}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const fabStyles = StyleSheet.create({
    fabContainer: {
        position: 'absolute',
        right: 18,
        bottom: 88,
        zIndex: 100,
    },
    fab: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#271816',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: Colors.error,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: Colors.surface,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
    },
});

const MainScreen = ({ route, navigation }) => {
    const role = route.params?.role || 'customer';
    const initialScreen = route.params?.initialScreen || 'Home';
    const showFab = role === 'customer' || role === 'chef';
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        let unsub = null;
        if (showFab) {
            getStoredUser().then((user) => {
                if (user) {
                    unsub = subscribeToTotalUnreadCount(user.id, user.role, (total) => {
                        setUnreadCount(total);
                    });
                }
            });
        }
        return () => {
            if (unsub) unsub();
        };
    }, [showFab]);

    const tabContent = role === 'chef'
        ? <ChefTab />
        : role === 'guest'
            ? <GuestTab />
            : <CustomerTab initialRouteName={initialScreen} />;

    return (
        <View style={{ flex: 1 }}>
            {tabContent}
            {showFab && (
                <ChatFab
                    onPress={() => navigation.navigate('ChatList')}
                    unreadCount={unreadCount}
                />
            )}
        </View>
    );
};

const stackScreenOptions = {
    headerStyle: { backgroundColor: Colors.surface },
    headerTintColor: Colors.text,
    headerShadowVisible: false,
    headerTitleStyle: { fontWeight: '800' },
};

const App = () => (
    <PaperProvider theme={paperTheme}>
        <CartProvider>
            <NavigationContainer>
                <Stack.Navigator initialRouteName="Login">
                    <Stack.Screen
                        name="Login"
                        component={Login}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Register"
                        component={Register}
                        options={{
                            title: 'Đăng ký',
                            ...stackScreenOptions,
                        }}
                    />
                    <Stack.Screen
                        name="Main"
                        component={MainScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="DishDetail"
                        component={DishDetail}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="RestaurantDetail"
                        component={RestaurantDetail}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="CompareDishes"
                        component={CompareDishes}
                        options={{ title: 'So sánh món', ...stackScreenOptions }}
                    />
                    <Stack.Screen
                        name="CreateDish"
                        component={CreateDish}
                        options={({ route }) => ({
                            title: route.params?.dish ? 'Chỉnh sửa món' : 'Tạo món mới',
                            ...stackScreenOptions,
                        })}
                    />
                    <Stack.Screen
                        name="MyReviews"
                        component={MyReviews}
                        options={{ title: 'Đánh giá đã viết', ...stackScreenOptions }}
                    />
                    <Stack.Screen
                        name="ChefOrders"
                        component={ChefOrders}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="ChatList"
                        component={ChatList}
                        options={{ title: 'Tin nhắn', ...stackScreenOptions }}
                    />
                    <Stack.Screen
                        name="ChatScreen"
                        component={ChatScreen}
                        options={{ title: 'Chat', ...stackScreenOptions }}
                    />
                    <Stack.Screen
                        name="PaymentCheckout"
                        component={PaymentCheckout}
                        options={{ headerShown: false }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </CartProvider>
    </PaperProvider>
);

export default App;
