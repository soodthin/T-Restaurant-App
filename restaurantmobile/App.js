import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PaperProvider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { View } from 'react-native';

import Login from '@pages/auth/Login';
import Register from '@pages/auth/Register';
import Home from '@pages/customer/Home';
import DishDetail from '@pages/customer/DishDetail';
import Booking from '@pages/customer/Booking';
import Cart from '@pages/customer/Cart';
import CompareDishes from '@pages/customer/CompareDishes';
import Orders from '@pages/customer/Orders';
import Profile from '@pages/shared/Profile';
import ChefHome from '@pages/chef/ChefHome';
import MyDishes from '@pages/chef/MyDishes';
import CreateDish from '@pages/chef/CreateDish';
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

const CustomerTab = () => {
    const { totalItems } = useCart();

    return (
        <Tab.Navigator screenOptions={tabOptions}>
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

const MainScreen = ({ route }) => {
    const role = route.params?.role || 'customer';
    if (role === 'chef') return <ChefTab />;
    if (role === 'guest') return <GuestTab />;
    return <CustomerTab />;
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
                        options={{ title: 'Chi tiết món ăn', ...stackScreenOptions }}
                    />
                    <Stack.Screen
                        name="CompareDishes"
                        component={CompareDishes}
                        options={{ title: 'So sánh món', ...stackScreenOptions }}
                    />
                    <Stack.Screen
                        name="CreateDish"
                        component={CreateDish}
                        options={{ title: 'Tạo món mới', ...stackScreenOptions }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </CartProvider>
    </PaperProvider>
);

export default App;
