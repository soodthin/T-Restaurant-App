import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'django-insecure-0e0-t_72u_#+d)6s#v$&kyznk-(qhw*8g@(&5$2q6or$2jkb2f'
)

DEBUG = os.environ.get('DJANGO_DEBUG', 'True').lower() in ('1', 'true', 'yes')

ALLOWED_HOSTS = [h.strip() for h in os.environ.get('DJANGO_ALLOWED_HOSTS', '*').split(',') if h.strip()]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'drf_yasg',
    'oauth2_provider',
    'cloudinary',
    'cloudinary_storage',
    'ckeditor',
    'ckeditor_uploader',
    'restaurant',
]

CKEDITOR_UPLOAD_PATH = 'images/dishes/'

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'RestaurantBackend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'RestaurantBackend.wsgi.application'

# ket noi MySQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('MYSQL_ADDON_DB', 'restaurantdb'),
        'USER': os.environ.get('MYSQL_ADDON_USER', 'root'),
        'PASSWORD': os.environ.get('MYSQL_ADDON_PASSWORD', '12345'),
        'HOST': os.environ.get('MYSQL_ADDON_HOST', 'localhost'),
        'PORT': os.environ.get('MYSQL_ADDON_PORT', '3306'),
        'OPTIONS': {
            'charset': 'utf8mb4',
            'connect_timeout': 10,
        },
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Ho_Chi_Minh'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# luu anh len cloudinary
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME', 'dxhp3sukx'),
    'API_KEY': os.environ.get('CLOUDINARY_API_KEY', '657381574582262'),
    'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET', 'GAVUf-uitHW43NVQk63mWChPUL8'),
}
STORAGES = {
    "default": {
        "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# dung model User tuy chinh thay cho User mac dinh
AUTH_USER_MODEL = 'restaurant.User'

# cho phep frontend goi API tu domain khac
CORS_ALLOW_ALL_ORIGINS = True

# chung thuc bang OAuth2 (phan trang khai bao tren tung viewset)
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'oauth2_provider.contrib.rest_framework.OAuth2Authentication',
    ),
}
