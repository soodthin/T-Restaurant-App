import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


export const BASE_URL = 'https://t-restaurant.onrender.com';

export const CLIENT_ID = 'restaurant_client_id';
export const CLIENT_SECRET = 'restaurant_client_secret';


export const endpoints = {
    'login': '/o/token/',
    'current-user': '/api/users/current-user/',
    'register': '/api/users/',
    'chefs': '/api/users/chefs/',
    'categories': '/api/categories/',
    'menus': '/api/menus/',
    'dishes': '/api/dishes/',
    'dish-detail': (id) => `/api/dishes/${id}/`,
    'dish-reviews': (id) => `/api/dishes/${id}/reviews/`,
    'dish-compare': '/api/dishes/compare/',
    'my-dish-reviews': '/api/dishes/my-reviews/',
    'my-reviews': '/api/reviews/mine/',
    'review-detail': (id) => `/api/reviews/${id}/`,
    'bookings': '/api/bookings/',
    'orders': '/api/orders/',
    'order-add-detail': (id) => `/api/orders/${id}/add-detail/`,
    'reviews': '/api/reviews/',
    'payments': '/api/payments/',
    'payment-detail': (id) => `/api/payments/${id}/`,
    'payment-cancel': (id) => `/api/payments/${id}/cancel/`,
    'stats': '/api/stats/',
};


const SESSION_STORAGE_KEYS = ['token', 'user', 'customer_cart_items'];


const baseConfig = {
    baseURL: BASE_URL,
    timeout: 45000,
    validateStatus: () => true,
};


const attachOk = (instance) => {
    instance.interceptors.response.use((res) => {
        res.ok = res.status >= 200 && res.status < 300;
        return res;
    });
    return instance;
};


export const Apis = attachOk(axios.create(baseConfig));


export const authApis = (token) => attachOk(axios.create({
    ...baseConfig,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
}));


export const clearSession = async () => {
    await AsyncStorage.multiRemove(SESSION_STORAGE_KEYS);
};

export const storeUser = async (user) => {
    await AsyncStorage.setItem('user', JSON.stringify(user));
};

export const getStoredToken = async () => AsyncStorage.getItem('token');

export const getStoredUser = async () => {
    const rawUser = await AsyncStorage.getItem('user');
    if (!rawUser) return null;

    try {
        return JSON.parse(rawUser);
    } catch (err) {
        return null;
    }
};


const HTML_RESPONSE_RE = /<\s*(?:!doctype|html|head|body|title|h\d|p|div|script)\b/i;

const extractMessage = (payload) => {
    if (!payload) return '';
    if (typeof payload === 'string') {

        if (HTML_RESPONSE_RE.test(payload)) return '';
        return payload;
    }
    if (Array.isArray(payload)) {
        return payload.map(extractMessage).filter(Boolean).join('\n');
    }
    if (typeof payload === 'object') {
        return Object.values(payload).map(extractMessage).filter(Boolean).join('\n');
    }
    return '';
};

export const getApiErrorMessage = (res, fallback = 'Đã có lỗi xảy ra') => {
    if (!res) return fallback;
    const msg = extractMessage(res.data);
    if (msg) return msg;
    if (res.status >= 500) return `Máy chủ tạm thời gặp sự cố (mã ${res.status}). Vui lòng thử lại sau.`;
    return fallback;
};


export const authFetch = async (url, options = {}) => {
    const token = await getStoredToken();

    const method = (options.method || 'GET').toLowerCase();
    const headers = { ...(options.headers || {}) };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let data = options.body;


    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (err) {

        }
    }

    const res = await axios.request({
        url,
        method,
        headers,
        data,
        baseURL: BASE_URL,
        timeout: 45000,
        validateStatus: () => true,
    });

    res.ok = res.status >= 200 && res.status < 300;
    return res;
};


export default Apis;
