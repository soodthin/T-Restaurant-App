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


const NAMED_ENTITY_MAP = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    aacute: 'á', Aacute: 'Á', agrave: 'à', Agrave: 'À',
    acirc: 'â', Acirc: 'Â', atilde: 'ã', Atilde: 'Ã',
    eacute: 'é', Eacute: 'É', egrave: 'è', Egrave: 'È',
    ecirc: 'ê', Ecirc: 'Ê', etilde: 'ẽ',
    iacute: 'í', Iacute: 'Í', igrave: 'ì', Igrave: 'Ì',
    oacute: 'ó', Oacute: 'Ó', ograve: 'ò', Ograve: 'Ò',
    ocirc: 'ô', Ocirc: 'Ô', otilde: 'õ', Otilde: 'Õ',
    uacute: 'ú', Uacute: 'Ú', ugrave: 'ù', Ugrave: 'Ù',
    yacute: 'ý', Yacute: 'Ý',
    ntilde: 'ñ', Ntilde: 'Ñ', ccedil: 'ç', Ccedil: 'Ç',
};

export const stripHtml = (raw) => {
    if (!raw) return '';
    return String(raw)
        .replace(/<\/?[^>]+>/g, ' ')
        .replace(/&#x([\da-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
        .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITY_MAP[name] || m)
        .replace(/\s+/g, ' ')
        .trim();
};
