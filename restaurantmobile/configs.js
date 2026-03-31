// doi IP nay thanh IP may tinh khi test tren dien thoai
// cmd: ipconfig -> lay IPv4 Address
const BASE_URL = "http://192.168.64.78:8000";

export const endpoints = {
    'login': '/o/token/',
    'current-user': '/api/users/current-user/',
    'register': '/api/users/',
    'categories': '/api/categories/',
    'menus': '/api/menus/',
    'dishes': '/api/dishes/',
    'dish-detail': (id) => `/api/dishes/${id}/`,
    'dish-reviews': (id) => `/api/dishes/${id}/reviews/`,
    'dish-compare': '/api/dishes/compare/',
    'bookings': '/api/bookings/',
    'orders': '/api/orders/',
    'order-add-detail': (id) => `/api/orders/${id}/add-detail/`,
    'reviews': '/api/reviews/',
    'payments': '/api/payments/',
    'stats': '/api/stats/',
};

export const CLIENT_ID = "restaurant_client_id";
export const CLIENT_SECRET = "restaurant_client_secret";

export default BASE_URL;
