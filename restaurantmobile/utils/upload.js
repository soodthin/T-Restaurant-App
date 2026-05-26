import { Platform } from 'react-native';


export const appendImageAsset = async (form, field, asset, defaultName = 'photo.jpg') => {
    if (!asset?.uri) return;

    const name = asset.fileName || defaultName;
    const type = asset.mimeType || 'image/jpeg';

    if (Platform.OS === 'web') {

        const blob = await fetch(asset.uri).then((r) => r.blob());
        form.append(field, new File([blob], name, { type: blob.type || type }));
        return;
    }

    form.append(field, { uri: asset.uri, name, type });
};
