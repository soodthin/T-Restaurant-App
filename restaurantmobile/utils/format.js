export const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

export const formatDate = (value) => {
    if (!value) return 'Chưa có dữ liệu';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Chưa có dữ liệu';

    return date.toLocaleDateString('vi-VN');
};

export const formatDateTime = (value) => {
    if (!value) return 'Chưa có dữ liệu';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Chưa có dữ liệu';

    return `${date.toLocaleDateString('vi-VN')} · ${date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    })}`;
};

export const getDisplayName = (user, fallback = 'Người dùng') => {
    if (!user) return fallback;

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || user.username || fallback;
};

export const getInitialLetter = (value, fallback = '?') => {
    const normalized = String(value || '').trim();
    if (!normalized) return fallback;
    return normalized.charAt(0).toUpperCase();
};

export const sanitizeNumberInput = (value) => String(value || '').replace(/[^\d]/g, '');
