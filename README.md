# T-Restaurant App

**T-Restaurant App** là hệ thống quản lý nhà hàng trực tuyến, gồm backend API (Django REST Framework) và ứng dụng di động (React Native/Expo) phục vụ cả khách hàng (đặt bàn, đặt món, thanh toán) và đầu bếp/nhân viên bếp (quản lý món ăn, đơn hàng).

---

## Mục lục

- [Tính năng chính](#tính-năng-chính)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt & chạy dự án](#cài-đặt--chạy-dự-án)
- [Biến môi trường](#biến-môi-trường)
- [Tài liệu API](#tài-liệu-api)
- [Tác giả](#tác-giả)

---

## Tính năng chính

### Khách hàng (Customer)
- Đăng ký / đăng nhập (OAuth2)
- Xem thực đơn, chi tiết món ăn, so sánh món ăn
- Đặt bàn trước (Table Booking)
- Thêm món vào giỏ hàng, đặt món (Order) và theo dõi trạng thái đơn hàng
- Thanh toán đơn hàng qua **MoMo** hoặc **Stripe**
- Đánh giá món ăn / nhà hàng (Review)
- Chat trực tiếp với nhà hàng (Firebase)
- Quản lý hồ sơ cá nhân

### Đầu bếp / Nhân viên bếp (Chef)
- Quản lý danh sách món ăn của mình (tạo, sửa món - CreateDish, MyDishes)
- Xem và xử lý đơn hàng (ChefOrders)
- Xem đánh giá của khách hàng (ChefReviews)
- Trang tổng quan riêng cho bếp (ChefHome)

### Hệ thống / Quản trị
- Quản lý người dùng, danh mục món (FoodCategory), thực đơn (Menu), món ăn (Dish)
- Thống kê doanh thu / đơn hàng (Stats API)
- Trang quản trị Django Admin tuỳ chỉnh
- Tài liệu API tự động (Swagger / ReDoc)

---

## Công nghệ sử dụng

### Backend – `RestaurantBackend`
| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ / Framework | Python, Django 4.2, Django REST Framework |
| Xác thực | django-oauth-toolkit (OAuth2) |
| Dữ liệu | MySQL (mysqlclient) |
| Thanh toán | Stripe, MoMo (webhook + IPN) |
| Lưu trữ ảnh | Cloudinary |
| Soạn thảo nội dung | django-ckeditor |
| Tài liệu API | drf-yasg (Swagger/ReDoc) |
| Triển khai | Gunicorn, Whitenoise |

### Mobile – `restaurantmobile`
| Thành phần | Công nghệ |
|---|---|
| Framework | React Native 0.81 + Expo 54 |
| Điều hướng | React Navigation (bottom-tabs, native-stack) |
| Giao diện | React Native Paper |
| Dữ liệu | Axios |
| Realtime / Chat | Firebase |
| Khác | Async Storage, Expo Image Picker, React Native WebView (thanh toán) |

---

## Cấu trúc dự án

```
T-Restaurant-App/
├── RestaurantBackend/
│   ├── RestaurantBackend/       # Cấu hình dự án Django (settings, urls, wsgi)
│   ├── restaurant/              # App chính
│   │   ├── models.py            # User, Menu, Dish, TableBooking, Order, Review, Payment...
│   │   ├── views.py             # ViewSets cho từng resource + Stats, webhook Momo/Stripe
│   │   ├── serializers.py
│   │   ├── perms.py             # Phân quyền
│   │   ├── momo.py / stripe_gw.py  # Tích hợp cổng thanh toán
│   │   └── urls.py
│   ├── templates/
│   ├── requirements.txt
│   └── build.sh                 # Script triển khai (migrate, seed, collectstatic)
│
├── restaurantmobile/
│   ├── pages/
│   │   ├── auth/                # Login, Register
│   │   ├── customer/            # Booking, Cart, Orders, Payment...
│   │   ├── chef/                # ChefHome, ChefOrders, MyDishes...
│   │   ├── public/               # Home, RestaurantDetail, DishDetail
│   │   └── shared/                # Chat, Profile
│   ├── contexts/                 # CartContext
│   ├── configs/                  # Apis.js, firebaseConfig.js, chatService.js
│   └── App.js
│
└── postman/                       # Postman collections & environments để test API
```

---

## Yêu cầu hệ thống

- **Python** 3.10+ và **pip**
- **MySQL** 8.x
- **Node.js** ≥ 18 và **npm**
- **Expo CLI** (`npm install -g expo-cli`) hoặc dùng `npx expo`
- Tài khoản **Cloudinary**, **Stripe**, **MoMo (business)**, **Firebase** để chạy đầy đủ tính năng

---

## Cài đặt & chạy dự án

### 1. Clone repository
```bash
git clone https://github.com/soodthin/T-Restaurant-App.git
cd T-Restaurant-App
```

### 2. Backend (Django)
```bash
cd RestaurantBackend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```
Tạo file `.env` (xem mục [Biến môi trường](#biến-môi-trường)), sau đó chạy:
```bash
python manage.py migrate
python manage.py runserver
```
Server mặc định chạy tại `http://localhost:8000`.

### 3. Mobile app (React Native/Expo)
```bash
cd restaurantmobile
npm install
npx expo start
```
Quét mã QR bằng ứng dụng **Expo Go** hoặc chạy trên emulator (`npm run android` / `npm run ios`).

---

## Biến môi trường

Backend đọc cấu hình nhạy cảm từ biến môi trường (`python-dotenv`). Cần khai báo tối thiểu trong file `.env`:

```env
# Django
SECRET_KEY=
DEBUG=
ALLOWED_HOSTS=

# Database (MySQL)
MYSQL_ADDON_DB=
MYSQL_ADDON_USER=
MYSQL_ADDON_PASSWORD=
MYSQL_ADDON_HOST=
MYSQL_ADDON_PORT=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# MoMo Payment
MOMO_PARTNER_CODE=
MOMO_ACCESS_KEY=
MOMO_SECRET_KEY=
MOMO_CREATE_URL=
MOMO_IPN_URL=
MOMO_REDIRECT_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CURRENCY=
STRIPE_SUCCESS_URL=
STRIPE_CANCEL_URL=
```

---

## Tài liệu API

Sau khi chạy backend, có thể xem tài liệu API tự động tại:

- Swagger UI: `http://localhost:8000/swagger/`
- ReDoc: `http://localhost:8000/redoc/`
- Django Admin: `http://localhost:8000/admin/`

Ngoài ra, các collection Postman để test API có sẵn trong thư mục `postman/`.

---

[@soodthin](https://github.com/soodthin)
