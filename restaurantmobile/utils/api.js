import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../configs';

const extractMessage = (payload) => {
    if (!payload) return '';
    if (typeof payload === 'string') return payload;
    if (Array.isArray(payload)) {
        return payload.map(extractMessage).filter(Boolean).join('\n');
    }
    if (typeof payload === 'object') {
        return Object.values(payload).map(extractMessage).filter(Boolean).join('\n');
    }
    return '';
};

export const buildApiUrl = (url) => `${BASE_URL}${url}`;

export const clearSession = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
};

export const storeUser = async (user) => {
    await AsyncStorage.setItem('user', JSON.stringify(user));
};

export const getStoredUser = async () => {
    const rawUser = await AsyncStorage.getItem('user');
    if (!rawUser) return null;
    try {
        return JSON.parse(rawUser);
    } catch (err) {
        return null;
    }
};

export const getApiErrorMessage = async (res, fallback = 'Đã có lỗi xảy ra') => {
    try {
        const data = await res.clone().json();
        return extractMessage(data) || fallback;
    } catch (err) {
        try {
            const text = await res.clone().text();
            return text || fallback;
        } catch (textErr) {
            return fallback;
        }
    }
};

// goi API co kem token
const authFetch = async (url, options = {}) => {
    const token = await AsyncStorage.getItem('token');
    const headers = {
        ...options.headers,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    // Khi body la FormData, khong set Content-Type de browser tu set voi boundary
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    } else {
        headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(buildApiUrl(url), {
        ...options,
        headers,
    });
    return res;
};

export default authFetch;
