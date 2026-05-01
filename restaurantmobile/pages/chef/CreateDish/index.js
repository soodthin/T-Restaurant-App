import { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { ActivityIndicator, Button, Chip, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ConfirmDialog, Toast } from '@components/CustomDialog';
import {
    Apis,
    authFetch,
    endpoints,
    clearSession,
    getApiErrorMessage,
    storeUser,
} from '@configs';
import { FadeInDown } from '@utils/animations';
import Colors from '@styles/colors';
import {
    formatCurrency,
    getDisplayName,
    sanitizeNumberInput,
} from '@utils/format';
import styles from './styles';

const outlineStyle = { borderRadius: 16, borderColor: Colors.outline, borderWidth: 1.5 };
const inputStyle = { backgroundColor: Colors.surfaceContainerLow };

const initialDish = {
    name: '',
    description: '',
    price: '',
    ingredients: '',
    preparation_time: '',
};

const CreateDish = ({ navigation, route }) => {
    const editingDish = route?.params?.dish || null;
    const isEditing = Boolean(editingDish);

    const [dish, setDish] = useState(() => editingDish ? {
        name: editingDish.name || '',
        description: editingDish.description || '',
        price: editingDish.price ? String(editingDish.price) : '',
        ingredients: editingDish.ingredients || '',
        preparation_time: editingDish.preparation_time ? String(editingDish.preparation_time) : '',
    } : initialDish);
    const [image, setImage] = useState(null);
    const [menus, setMenus] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedMenu, setSelectedMenu] = useState(editingDish?.menu || null);
    const [selectedCategory, setSelectedCategory] = useState(editingDish?.category || null);
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
                Apis.get(endpoints['menus']),
                Apis.get(endpoints['categories']),
            ]);

            if (userRes.status === 401) {
                await resetToLogin();
                return;
            }

            if (!userRes.ok) {
                throw new Error(getApiErrorMessage(userRes, 'Không thể tải thông tin đầu bếp'));
            }
            if (!menuRes.ok) {
                throw new Error('Không thể tải danh sách menu');
            }
            if (!categoryRes.ok) {
                throw new Error('Không thể tải danh sách loại món');
            }

            const userData = userRes.data;
            const menuData = menuRes.data;
            const categoryData = categoryRes.data;

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

            const url = isEditing
                ? endpoints['dish-detail'](editingDish.id)
                : endpoints['dishes'];
            const method = isEditing ? 'PATCH' : 'POST';
            const res = await authFetch(url, { method, body: form });

            if (res.status === 401) {
                await resetToLogin();
                return;
            }

            if (res.status === 201 || res.status === 200) {
                setSuccessDialog(true);
                return;
            }

            showToast(getApiErrorMessage(res, isEditing ? 'Không thể cập nhật món ăn' : 'Không thể tạo món ăn'));
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
                <Button
                    mode="contained"
                    buttonColor={Colors.primary}
                    textColor={Colors.onPrimary}
                    style={styles.stateBtn}
                    onPress={loadData}>
                    Tải lại dữ liệu
                </Button>
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
                <Button
                    mode="contained-tonal"
                    buttonColor={Colors.surfaceContainerLow}
                    textColor={Colors.text}
                    style={styles.stateBtn}
                    onPress={() => navigation.navigate('Profile')}>
                    Mở hồ sơ
                </Button>
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
                    <Text style={styles.heroEyebrow}>{isEditing ? 'Cập nhật món' : 'Tạo món mới'}</Text>
                    <Text style={styles.heroTitle}>
                        {isEditing
                            ? 'Chỉnh sửa thông tin món, giữ nội dung luôn cập nhật.'
                            : 'Chuẩn hóa thông tin món trước khi đưa lên menu'}
                    </Text>
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
                        editingDish?.image ?
                            <Image source={{ uri: editingDish.image }} style={styles.imagePreview} /> :
                            <View style={styles.imagePlaceholder}>
                                <MaterialCommunityIcons name="camera-plus" size={34} color={Colors.textSecondary} />
                                <Text style={styles.imageTitle}>Tải ảnh món ăn</Text>
                                <Text style={styles.imageSubtitle}>Ảnh rõ và đúng món sẽ giúp giao diện chuyên nghiệp hơn.</Text>
                            </View>}
                </TouchableOpacity>

                <FadeInDown duration={500} style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Thông tin chính</Text>

                    <TextInput
                        mode="outlined"
                        label="TÊN MÓN"
                        placeholder="Ví dụ: Cơm chiên hải sản"
                        placeholderTextColor={Colors.placeholder}
                        value={dish.name}
                        onChangeText={(value) => changeField('name', value)}
                        error={!!fieldErrors.name}
                        outlineStyle={outlineStyle}
                        style={[inputStyle, styles.formInput]}
                        activeOutlineColor={Colors.primary}
                        textColor={Colors.text}
                    />
                    {fieldErrors.name ? <Text style={styles.errorText}>{fieldErrors.name}</Text> : null}

                    <TextInput
                        mode="outlined"
                        label="MÔ TẢ NGẮN"
                        placeholder="Mô tả hương vị, điểm nổi bật hoặc cách phục vụ món."
                        placeholderTextColor={Colors.placeholder}
                        value={dish.description}
                        onChangeText={(value) => changeField('description', value)}
                        multiline
                        numberOfLines={4}
                        outlineStyle={outlineStyle}
                        style={[inputStyle, styles.formInput, styles.multilineInput]}
                        activeOutlineColor={Colors.primary}
                        textColor={Colors.text}
                    />

                    <View style={styles.row}>
                        <View style={styles.halfField}>
                            <TextInput
                                mode="outlined"
                                label="GIÁ BÁN (VNĐ)"
                                placeholder="65000"
                                placeholderTextColor={Colors.placeholder}
                                value={dish.price}
                                onChangeText={(value) => changeField('price', sanitizeNumberInput(value))}
                                keyboardType="numeric"
                                error={!!fieldErrors.price}
                                outlineStyle={outlineStyle}
                                style={[inputStyle, styles.formInput]}
                                activeOutlineColor={Colors.primary}
                                textColor={Colors.text}
                            />
                            {fieldErrors.price ? <Text style={styles.errorText}>{fieldErrors.price}</Text> : null}
                        </View>

                        <View style={styles.halfField}>
                            <TextInput
                                mode="outlined"
                                label="CHUẨN BỊ (PHÚT)"
                                placeholder="20"
                                placeholderTextColor={Colors.placeholder}
                                value={dish.preparation_time}
                                onChangeText={(value) => changeField('preparation_time', sanitizeNumberInput(value))}
                                keyboardType="numeric"
                                error={!!fieldErrors.preparation_time}
                                outlineStyle={outlineStyle}
                                style={[inputStyle, styles.formInput]}
                                activeOutlineColor={Colors.primary}
                                textColor={Colors.text}
                            />
                            {fieldErrors.preparation_time ?
                                <Text style={styles.errorText}>{fieldErrors.preparation_time}</Text> :
                                null}
                        </View>
                    </View>
                </FadeInDown>

                <FadeInDown duration={500} style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Nguyên liệu và phân loại</Text>

                    <TextInput
                        mode="outlined"
                        label="NGUYÊN LIỆU"
                        placeholder="Liệt kê các thành phần chính, cách sơ chế hoặc lưu ý dị ứng nếu có."
                        placeholderTextColor={Colors.placeholder}
                        value={dish.ingredients}
                        onChangeText={(value) => changeField('ingredients', value)}
                        multiline
                        numberOfLines={4}
                        outlineStyle={outlineStyle}
                        style={[inputStyle, styles.formInput, styles.multilineInput]}
                        activeOutlineColor={Colors.primary}
                        textColor={Colors.text}
                    />

                    <Text style={styles.label}>MENU</Text>
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                        {menus.map((menu) => (
                            <Chip
                                key={menu.id}
                                mode="flat"
                                selected={selectedMenu === menu.id}
                                onPress={() => {
                                    setSelectedMenu(menu.id);
                                    setFieldErrors((prev) => ({ ...prev, menu: '' }));
                                }}
                                style={styles.selectionChip}>
                                {menu.name}
                            </Chip>
                        ))}
                    </ScrollView>
                    {fieldErrors.menu ? <Text style={styles.errorText}>{fieldErrors.menu}</Text> : null}

                    <Text style={styles.label}>LOẠI MÓN</Text>
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                        {categories.map((category) => (
                            <Chip
                                key={category.id}
                                mode="flat"
                                selected={selectedCategory === category.id}
                                onPress={() => {
                                    setSelectedCategory(category.id);
                                    setFieldErrors((prev) => ({ ...prev, category: '' }));
                                }}
                                style={styles.selectionChip}>
                                {category.name}
                            </Chip>
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

                <Button
                    mode="contained"
                    icon="content-save-outline"
                    buttonColor={Colors.primary}
                    textColor={Colors.onPrimary}
                    style={styles.submitAction}
                    disabled={submitting}
                    loading={submitting}
                    onPress={submit}>
                    {isEditing ? 'Lưu thay đổi' : 'Xác nhận tạo món'}
                </Button>
            </ScrollView>

            <ConfirmDialog
                visible={confirm}
                type="confirm"
                title={isEditing ? 'Xác nhận lưu thay đổi' : 'Xác nhận tạo món'}
                message={isEditing
                    ? `Cập nhật thông tin món "${dish.name.trim()}"?`
                    : `Tạo món "${dish.name.trim()}" với giá ${formatCurrency(dish.price)}?`}
                onCancel={() => setConfirm(false)}
                onConfirm={doCreate}
            />

            <ConfirmDialog
                visible={successDialog}
                type="success"
                title={isEditing ? 'Cập nhật thành công' : 'Tạo món thành công'}
                message={isEditing
                    ? 'Thông tin món đã được cập nhật.'
                    : 'Món ăn đã được thêm vào hệ thống. Bạn có thể kiểm tra lại tại màn hình Món của tôi.'}
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

export default CreateDish;
