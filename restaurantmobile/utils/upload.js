import { Platform } from 'react-native';

/**
 * Append một asset (từ expo-image-picker) vào FormData, xử lý đúng cả 2 platform:
 *
 * - Native (iOS/Android): RN networking layer hiểu object {uri, name, type} → tự đính kèm file.
 * - Web: FormData chuẩn của browser; phải fetch blob URL → tạo File thật, nếu append plain
 *   object thì FormData stringify thành "[object Object]" → server nhận về string,
 *   trả 400 "submitted data was not a file".
 *
 * @param {FormData} form        - FormData đang build
 * @param {string}   field       - tên field (vd 'image', 'avatar')
 * @param {object}   asset       - asset từ expo-image-picker (có .uri, .fileName, .mimeType)
 * @param {string}   defaultName - tên file fallback (vd 'dish.jpg')
 */
export const appendImageAsset = async (form, field, asset, defaultName = 'photo.jpg') => {
    if (!asset?.uri) return;

    const name = asset.fileName || defaultName;
    const type = asset.mimeType || 'image/jpeg';

    if (Platform.OS === 'web') {
        // Blob URL (blob:http://localhost:8081/...) hoặc data URI → fetch về Blob thật.
        const blob = await fetch(asset.uri).then((r) => r.blob());
        form.append(field, new File([blob], name, { type: blob.type || type }));
        return;
    }

    form.append(field, { uri: asset.uri, name, type });
};
