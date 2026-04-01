import { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ConfirmDialog, Toast } from './CustomDialog';
import authFetch, {
    clearSession,
    getApiErrorMessage,
    storeUser,
} from '../utils/api';
import BASE_URL, { endpoints } from '../configs';
import { FadeInDown } from '../utils/animations';
import Colors from '../styles/colors';
import { editorialShadow } from '../styles/theme';
import {
    formatCurrency,
    getDisplayName,
    sanitizeNumberInput,
} from '../utils/format';

const initialDish = {
    name: '',
    description: '',
    price: '',
    ingredients: '',
    preparation_time: '',
};

const CreateDish = ({ navigation }) => {
    const [dish, setDish] = useState(initialDish);
    const [image, setImage] = useState(null);
    const [menus, setMenus] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [user, setUser] = useState(null);
    const [loadingData, setLoadingData] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [loadError, setLoadError] = useState('');
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });
    const [confirm, setConfirm] = useState(false);
    const [successDialog, setSuccessDialog] = useState(false);

    const showToast = useCallback((message, type = 'error') => {
        setToast({ visible: true, message, type });
    }, []);

    const resetToLogin = useCallback(async () => {
        await clearSession();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }, [navigation]);

    const loadData = useCallback(async () => {
        setLoadingData(true);

        try {
            const [userRes, menuRes, categoryRes] = await Promise.all([
                authFetch(endpoints['current-user']),
                fetch(`${BASE_URL}${endpoints['menus']}`),
                fetch(`${BASE_URL}${endpoints['categories']}`),
            ]);

            if (userRes.status === 401) {
                await resetToLogin();
                return;
            }

            if (!userRes.ok) {
                throw new Error(await getApiErrorMessage(userRes, 'Không thể tải thông tin đầu bếp'));
            }
            if (!menuRes.ok) {
                throw new Error('Không thể tải danh sách menu');
            }
            if (!categoryRes.ok) {
                throw new Error('Không thể tải danh sách loại món');
            }

            const [userData, menuData, categoryData] = await Promise.all([
                userRes.json(),
                menuRes.json(),
                categoryRes.json(),
            ]);

            setUser(userData);
            await storeUser(userData);
            setMenus(menuData.results || menuData || []);
            setCategories(Array.isArray(categoryData) ? categoryData : categoryData.results || []);
            setLoadError('');
        } catch (err) {
            setLoadError(err.message || 'Không thể chuẩn bị dữ liệu tạo món');
        } finally {
            setLoadingData(false);
        }
    }, [resetToLogin]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const changeField = (field, value) => {
        setDish((prev) => ({ ...prev, [field]: value }));
        setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const validate = () => {
        const nextErrors = {};

        if (dish.name.trim().length < 3) {
            nextErrors.name = 'Tên món cần có ít nhất 3 ký tự.';
        }
        if (!dish.price || Number(dish.price) <= 0) {
            nextErrors.price = 'Giá món phải lớn hơn 0.';
        }
        if (!dish.preparation_time || Number(dish.preparation_time) <= 0) {
            nextErrors.preparation_time = 'Thời gian chuẩn bị phải lớn hơn 0 phút.';
        }
        if (!selectedMenu) {
            nextErrors.menu = 'Hãy chọn menu để món xuất hiện đúng khu vực.';
        }
        if (!selectedCategory) {
            nextErrors.category = 'Hãy chọn loại món để khách dễ tìm kiếm.';
        }

        return nextErrors;
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showToast('Cần quyền truy cập thư viện ảnh để tải hình món ăn.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            quality: 0.85,
        });

        if (!result.canceled) {
            setImage(result.assets[0]);
        }
    };

    const submit = () => {
        if (!user?.is_verified) {
            showToast('Vui lòng kiểm tra quyền tạo món trong phần hồ sơ.');
            return;
        }

        const nextErrors = validate();
        setFieldErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            showToast('Vui lòng kiểm tra lại các trường bắt buộc.');
            return;
        }

        setConfirm(true);
    };

    const doCreate = async () => {
        setConfirm(false);
        setSubmitting(true);

        try {
            const form = new FormData();
            form.append('name', dish.name.trim());
            form.append('description', dish.description.trim());
            form.append('price', dish.price);
            form.append('ingredients', dish.ingredients.trim());
            form.append('preparation_time', dish.preparation_time);
            form.append('menu', String(selectedMenu));
            form.append('category', String(selectedCategory));

            if (image) {
                form.append('image', {
                    uri: image.uri,
                    name: image.fileName || 'dish.jpg',
                    type: image.mimeType || 'image/jpeg',
                });
            }

            const res = await authFetch(endpoints['dishes'], {
                method: 'POST',
                body: form,
            });

            if (res.status === 401) {
                await resetToLogin();
                return;
            }

            if (res.status === 201) {
                setSuccessDialog(true);
                return;
            }

            showToast(await getApiErrorMessage(res, 'Không thể tạo món ăn'));
        } catch (err) {
            showToast(err.message || 'Không thể kết nối tới máy chủ');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingData) {
        return (
            <ActivityIndicator
                size="large"
                color={Colors.primary}
                style={styles.loading}
            />
        );
    }

    if (loadError && menus.length === 0 && categories.length === 0) {
        return (
            <View style={styles.centerState}>
                <MaterialCommunityIcons name="database-alert-outline" size={52} color={Colors.primary} />
                <Text style={styles.stateTitle}>Chưa thể mở form tạo món</Text>
                <Text style={styles.stateText}>{loadError}</Text>
                <TouchableOpacity style={styles.retryBtn} activeOpacity={0.85} onPress={loadData}>
                    <Text style={styles.retryText}>Tải lại dữ liệu</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!user?.is_verified) {
        return (
            <View style={styles.centerState}>
                <MaterialCommunityIcons name="shield-account-outline" size={52} color={Colors.primary} />
                <Text style={styles.stateTitle}>Chưa thể tạo món tại màn hình này</Text>
                <Text style={styles.stateText}>
                    Quyền tạo món được quản lý trong phần Hồ sơ của đầu bếp. Hãy mở Hồ sơ để xem thông tin tài khoản.
                </Text>
                <TouchableOpacity style={styles.retryBtn} activeOpacity={0.85} onPress={() => navigation.navigate('Profile')}>
                    <Text style={styles.retryText}>Mở hồ sơ</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const selectedMenuLabel = menus.find((item) => item.id === selectedMenu)?.name || 'Chưa chọn menu';
    const selectedCategoryLabel = categories.find((item) => item.id === selectedCategory)?.name || 'Chưa chọn loại món';

    return (
        <KeyboardAvoidingView
            style={styles.keyboard}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled">
                <FadeInDown duration={500} style={styles.hero}>
                    <Text style={styles.heroEyebrow}>Tạo món mới</Text>
                    <Text style={styles.heroTitle}>Chuẩn hóa thông tin món trước khi đưa lên menu</Text>
                    <Text style={styles.heroSubtitle}>
                        Điền tên món, giá, thời gian chuẩn bị và phân loại rõ ràng để khách xem được đúng nội dung.
                    </Text>
                </FadeInDown>

                {loadError ?
                    <View style={styles.inlineError}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={18} color={Colors.primary} />
                        <Text style={styles.inlineErrorText}>{loadError}</Text>
                    </View> :
                    null}

                <TouchableOpacity style={styles.imagePicker} activeOpacity={0.8} onPress={pickImage}>
                    {image ?
                        <Image source={{ uri: image.uri }} style={styles.imagePreview} /> :
                        <View style={styles.imagePlaceholder}>
                            <MaterialCommunityIcons name="camera-plus" size={34} color={Colors.textSecondary} />
                            <Text style={styles.imageTitle}>Tải ảnh món ăn</Text>
                            <Text style={styles.imageSubtitle}>Ảnh rõ và đúng món sẽ giúp giao diện chuyên nghiệp hơn.</Text>
                        </View>}
                </TouchableOpacity>

                <FadeInDown duration={500} style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Thông tin chính</Text>

                    <Text style={styles.label}>TÊN MÓN</Text>
                    <TextInput
                        style={[styles.input, fieldErrors.name && styles.inputError]}
                        placeholder="Ví dụ: Cơm chiên hải sản"
                        placeholderTextColor={Colors.placeholder}
                        value={dish.name}
                        onChangeText={(value) => changeField('name', value)}
                    />
                    {fieldErrors.name ? <Text style={styles.errorText}>{fieldErrors.name}</Text> : null}

                    <Text style={styles.label}>MÔ TẢ NGẮN</Text>
                    <TextInput
                        style={[styles.input, styles.multiline]}
                        placeholder="Mô tả hương vị, điểm nổi bật hoặc cách phục vụ món."
                        placeholderTextColor={Colors.placeholder}
                        value={dish.description}
                        onChangeText={(value) => changeField('description', value)}
                        multiline={true}
                        textAlignVertical="top"
                    />

                    <View style={styles.row}>
                        <View style={styles.halfField}>
                            <Text style={styles.label}>GIÁ BÁN (VNĐ)</Text>
                            <TextInput
                                style={[styles.input, fieldErrors.price && styles.inputError]}
                                placeholder="65000"
                                placeholderTextColor={Colors.placeholder}
                                value={dish.price}
                                onChangeText={(value) => changeField('price', sanitizeNumberInput(value))}
                                keyboardType="numeric"
                            />
                            {fieldErrors.price ? <Text style={styles.errorText}>{fieldErrors.price}</Text> : null}
                        </View>

                        <View style={styles.halfField}>
                            <Text style={styles.label}>CHUẨN BỊ (PHÚT)</Text>
                            <TextInput
                                style={[styles.input, fieldErrors.preparation_time && styles.inputError]}
                                placeholder="20"
                                placeholderTextColor={Colors.placeholder}
                                value={dish.preparation_time}
                                onChangeText={(value) => changeField('preparation_time', sanitizeNumberInput(value))}
                                keyboardType="numeric"
                            />
                            {fieldErrors.preparation_time ?
                                <Text style={styles.errorText}>{fieldErrors.preparation_time}</Text> :
                                null}
                        </View>
                    </View>
                </FadeInDown>

                <FadeInDown duration={500} style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Nguyên liệu và phân loại</Text>

                    <Text style={styles.label}>NGUYÊN LIỆU</Text>
                    <TextInput
                        style={[styles.input, styles.multiline]}
                        placeholder="Liệt kê các thành phần chính, cách sơ chế hoặc lưu ý dị ứng nếu có."
                        placeholderTextColor={Colors.placeholder}
                        value={dish.ingredients}
                        onChangeText={(value) => changeField('ingredients', value)}
                        multiline={true}
                        textAlignVertical="top"
                    />

                    <Text style={styles.label}>MENU</Text>
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                        {menus.map((menu) => (
                            <TouchableOpacity
                                key={menu.id}
                                style={[styles.chip, selectedMenu === menu.id && styles.chipActive]}
                                onPress={() => {
                                    setSelectedMenu(menu.id);
                                    setFieldErrors((prev) => ({ ...prev, menu: '' }));
                                }}>
                                <Text style={[styles.chipText, selectedMenu === menu.id && styles.chipTextActive]}>
                                    {menu.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    {fieldErrors.menu ? <Text style={styles.errorText}>{fieldErrors.menu}</Text> : null}

                    <Text style={styles.label}>LOẠI MÓN</Text>
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                style={[styles.chip, selectedCategory === category.id && styles.chipActive]}
                                onPress={() => {
                                    setSelectedCategory(category.id);
                                    setFieldErrors((prev) => ({ ...prev, category: '' }));
                                }}>
                                <Text style={[styles.chipText, selectedCategory === category.id && styles.chipTextActive]}>
                                    {category.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    {fieldErrors.category ? <Text style={styles.errorText}>{fieldErrors.category}</Text> : null}
                </FadeInDown>

                <FadeInDown duration={500} style={styles.previewCard}>
                    <Text style={styles.previewEyebrow}>Bản xem trước</Text>
                    <Text style={styles.previewName}>{dish.name.trim() || 'Tên món sẽ hiển thị ở đây'}</Text>
                    <Text style={styles.previewSubtitle}>
                        {dish.description.trim() || 'Thêm mô tả ngắn để khách hiểu nhanh về món.'}
                    </Text>

                    <View style={styles.previewMetaRow}>
                        <View style={styles.previewMetaCard}>
                            <Text style={styles.previewMetaLabel}>Giá</Text>
                            <Text style={styles.previewMetaValue}>
                                {dish.price ? formatCurrency(dish.price) : 'Chưa nhập'}
                            </Text>
                        </View>
                        <View style={styles.previewMetaCard}>
                            <Text style={styles.previewMetaLabel}>Thời gian</Text>
                            <Text style={styles.previewMetaValue}>
                                {dish.preparation_time ? `${dish.preparation_time} phút` : 'Chưa nhập'}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.previewInfo}>Menu: {selectedMenuLabel}</Text>
                    <Text style={styles.previewInfo}>Loại món: {selectedCategoryLabel}</Text>
                    <Text style={styles.previewInfo}>Phụ trách: {getDisplayName(user, 'Đầu bếp')}</Text>
                </FadeInDown>

                <TouchableOpacity
                    style={[
                        styles.submitBtn,
                        submitting && styles.submitBtnDisabled,
                    ]}
                    activeOpacity={0.85}
                    disabled={submitting}
                    onPress={submit}>
                    {submitting ?
                        <ActivityIndicator color={Colors.onPrimary} /> :
                        <>
                            <MaterialCommunityIcons name="content-save-outline" size={20} color={Colors.onPrimary} />
                            <Text style={styles.submitText}>Xác nhận tạo món</Text>
                        </>}
                </TouchableOpacity>
            </ScrollView>

            <ConfirmDialog
                visible={confirm}
                type="confirm"
                title="Xác nhận tạo món"
                message={`Tạo món "${dish.name.trim()}" với giá ${formatCurrency(dish.price)}?`}
                onCancel={() => setConfirm(false)}
                onConfirm={doCreate}
            />

            <ConfirmDialog
                visible={successDialog}
                type="success"
                title="Tạo món thành công"
                message="Món ăn đã được thêm vào hệ thống. Bạn có thể kiểm tra lại tại màn hình Món của tôi."
                confirmText="Quay lại"
                onConfirm={() => {
                    setSuccessDialog(false);
                    navigation.goBack();
                }}
            />

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    keyboard: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    scroll: {
        backgroundColor: Colors.surface,
    },
    container: {
        padding: 20,
        paddingBottom: 36,
    },
    loading: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    centerState: {
        flex: 1,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
    },
    stateTitle: {
        marginTop: 16,
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
        textAlign: 'center',
    },
    stateText: {
        marginTop: 10,
        fontSize: 15,
        lineHeight: 22,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    retryBtn: {
        marginTop: 18,
        backgroundColor: Colors.primary,
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingVertical: 14,
    },
    retryText: {
        color: Colors.onPrimary,
        fontWeight: '700',
    },
    hero: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        padding: 20,
        ...editorialShadow,
    },
    heroEyebrow: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        color: Colors.primary,
    },
    heroTitle: {
        marginTop: 8,
        fontSize: 28,
        lineHeight: 34,
        fontWeight: '800',
        color: Colors.text,
    },
    heroSubtitle: {
        marginTop: 10,
        fontSize: 14,
        lineHeight: 22,
        color: Colors.textSecondary,
    },
    inlineError: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginTop: 12,
    },
    inlineErrorText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.text,
    },
    imagePicker: {
        marginTop: 16,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: Colors.surfaceContainerLowest,
        ...editorialShadow,
    },
    imagePreview: {
        width: '100%',
        height: 220,
    },
    imagePlaceholder: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    imageTitle: {
        marginTop: 10,
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    imageSubtitle: {
        marginTop: 6,
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
        color: Colors.textSecondary,
    },
    sectionCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        padding: 18,
        marginTop: 16,
        ...editorialShadow,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 14,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.7,
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    input: {
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: Colors.text,
        marginBottom: 10,
    },
    inputError: {
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    multiline: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    errorText: {
        marginBottom: 10,
        fontSize: 12,
        lineHeight: 18,
        color: Colors.primary,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfField: {
        width: '48%',
    },
    chipRow: {
        paddingBottom: 4,
    },
    chip: {
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 9999,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 8,
    },
    chipActive: {
        backgroundColor: Colors.primary,
    },
    chipText: {
        fontSize: 14,
        color: Colors.text,
    },
    chipTextActive: {
        color: Colors.onPrimary,
        fontWeight: '700',
    },
    previewCard: {
        marginTop: 16,
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        padding: 20,
        ...editorialShadow,
    },
    previewEyebrow: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    previewName: {
        marginTop: 8,
        fontSize: 24,
        lineHeight: 30,
        fontWeight: '800',
        color: Colors.text,
    },
    previewSubtitle: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 22,
        color: Colors.textSecondary,
    },
    previewMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        marginBottom: 8,
    },
    previewMetaCard: {
        width: '48%',
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 18,
        padding: 14,
    },
    previewMetaLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    previewMetaValue: {
        marginTop: 6,
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
    },
    previewInfo: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 20,
        color: Colors.textSecondary,
    },
    submitBtn: {
        marginTop: 18,
        backgroundColor: Colors.primary,
        borderRadius: 20,
        paddingVertical: 16,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    submitBtnDisabled: {
        opacity: 0.55,
    },
    submitText: {
        marginLeft: 8,
        color: Colors.onPrimary,
        fontSize: 15,
        fontWeight: '700',
    },
});

export default CreateDish;
