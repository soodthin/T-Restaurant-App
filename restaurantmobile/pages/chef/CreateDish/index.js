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
import { ActivityIndicator, Button, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    sanitizeNumberInput,
    stripHtml,
} from '@utils/format';
import { appendImageAsset } from '@utils/upload';
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
    const insets = useSafeAreaInsets();
    const editingDish = route?.params?.dish || null;
    const isEditing = Boolean(editingDish);

    const [dish, setDish] = useState(() => editingDish ? {
        name: editingDish.name || '',

        description: stripHtml(editingDish.description),
        price: editingDish.price ? String(editingDish.price) : '',
        ingredients: stripHtml(editingDish.ingredients),
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

    const [ingredientInput, setIngredientInput] = useState('');

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


    const parseIngredients = (raw) => (raw || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    const addIngredient = () => {
        const v = ingredientInput.trim();
        if (!v) return;

        const newItems = v.split(',').map((s) => s.trim()).filter(Boolean);
        const list = parseIngredients(dish.ingredients);
        for (const item of newItems) {
            if (!list.includes(item)) list.push(item);
        }
        changeField('ingredients', list.join(', '));
        setIngredientInput('');
    };

    const removeIngredient = (idx) => {
        const list = parseIngredients(dish.ingredients);
        list.splice(idx, 1);
        changeField('ingredients', list.join(', '));
    };

    const validate = () => {
        const nextErrors = {};
        if (dish.name.trim().length < 3) {
            nextErrors.name = 'Tên món cần có ít nhất 3 ký tự.';
        }
        if (!dish.description.trim()) {
            nextErrors.description = 'Mô tả món ăn không được để trống.';
        }
        if (!image && !editingDish?.image) {
            nextErrors.image = 'Hãy chọn hình ảnh minh họa cho món ăn.';
        }
        if (!dish.price || Number(dish.price) <= 0) {
            nextErrors.price = 'Giá món phải lớn hơn 0.';
        }
        if (parseIngredients(dish.ingredients).length === 0) {
            nextErrors.ingredients = 'Hãy thêm ít nhất một nguyên liệu.';
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
            setFieldErrors((prev) => ({ ...prev, image: '' }));
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
                await appendImageAsset(form, 'image', image, 'dish.jpg');
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

    const previewImageUri = image?.uri || editingDish?.image || null;

    return (
        <KeyboardAvoidingView
            style={styles.keyboard}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.container, { paddingBottom: 120 + insets.bottom }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>


                <FadeInDown duration={500} style={styles.hero}>
                    <View style={styles.heroRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.heroEyebrow}>
                                {isEditing ? 'Chỉnh sửa món' : 'Tạo món mới'}
                            </Text>
                            <Text style={styles.heroTitle}>
                                {isEditing ? 'Cập nhật món' : 'Chuẩn hóa món'}
                            </Text>
                        </View>
                        <View style={styles.heroIconWrap}>
                            <MaterialCommunityIcons name="silverware-fork-knife" size={22} color={Colors.primary} />
                        </View>
                    </View>
                    <Text style={styles.heroSubtitle}>
                        Điền tên món, giá, thời gian chuẩn bị và phân loại rõ ràng để lên menu.
                    </Text>
                </FadeInDown>

                {loadError ?
                    <View style={styles.inlineError}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={18} color={Colors.primary} />
                        <Text style={styles.inlineErrorText}>{loadError}</Text>
                    </View> :
                    null}


                <Text style={styles.sectionLabel}>Hình ảnh minh họa</Text>
                <TouchableOpacity
                    style={[styles.imagePicker, !previewImageUri && styles.imagePickerDashed]}
                    activeOpacity={0.85}
                    onPress={pickImage}
                >
                    {previewImageUri ?
                        <Image source={{ uri: previewImageUri }} style={styles.imagePreview} /> :
                        <View style={styles.imagePlaceholder}>
                            <View style={styles.cameraCircle}>
                                <MaterialCommunityIcons name="camera-plus-outline" size={26} color={Colors.primary} />
                            </View>
                            <Text style={styles.imageTitle}>Tải ảnh món ăn</Text>
                            <Text style={styles.imageSubtitle}>Nhấn vào đây để chọn ảnh từ thư viện.</Text>
                        </View>
                    }
                </TouchableOpacity>
                {fieldErrors.image ? <Text style={styles.errorText}>{fieldErrors.image}</Text> : null}


                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Thông tin chính</Text>

                    <Text style={styles.label}>TÊN MÓN</Text>
                    <TextInput
                        mode="outlined"
                        placeholder="Ví dụ: Cơm chiên hải sản"
                        placeholderTextColor={Colors.placeholder}
                        value={dish.name}
                        onChangeText={(value) => changeField('name', value)}
                        error={!!fieldErrors.name}
                        outlineStyle={outlineStyle}
                        style={[inputStyle, styles.formInput]}
                        activeOutlineColor={Colors.primary}
                        textColor={Colors.text}
                        right={<TextInput.Icon icon="silverware-fork-knife" color={Colors.textSecondary} />}
                    />
                    {fieldErrors.name ? <Text style={styles.errorText}>{fieldErrors.name}</Text> : null}

                    <Text style={styles.label}>MÔ TẢ NGẮN</Text>
                    <TextInput
                        mode="outlined"
                        placeholder="Mô tả hương vị, điểm nổi bật hoặc cách phục vụ món."
                        placeholderTextColor={Colors.placeholder}
                        value={dish.description}
                        onChangeText={(value) => changeField('description', value)}
                        error={!!fieldErrors.description}
                        multiline
                        numberOfLines={4}
                        outlineStyle={outlineStyle}
                        style={[inputStyle, styles.formInput, styles.multilineInput]}
                        activeOutlineColor={Colors.primary}
                        textColor={Colors.text}
                    />
                    {fieldErrors.description ? <Text style={styles.errorText}>{fieldErrors.description}</Text> : null}

                    <View style={styles.row}>
                        <View style={styles.halfField}>
                            <Text style={styles.label}>GIÁ BÁN (VNĐ)</Text>
                            <TextInput
                                mode="outlined"
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
                                right={<TextInput.Icon icon="cash" color={Colors.textSecondary} />}
                            />
                            {fieldErrors.price ? <Text style={styles.errorText}>{fieldErrors.price}</Text> : null}
                        </View>

                        <View style={styles.halfField}>
                            <Text style={styles.label}>T.GIAN (PHÚT)</Text>
                            <TextInput
                                mode="outlined"
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
                                right={<TextInput.Icon icon="clock-outline" color={Colors.textSecondary} />}
                            />
                            {fieldErrors.preparation_time ?
                                <Text style={styles.errorText}>{fieldErrors.preparation_time}</Text> :
                                null}
                        </View>
                    </View>
                </View>


                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Nguyên liệu & Phân loại</Text>

                    <Text style={styles.label}>NGUYÊN LIỆU</Text>
                    {parseIngredients(dish.ingredients).length > 0 && (
                        <View style={styles.ingredientChipsWrap}>
                            {parseIngredients(dish.ingredients).map((ing, idx) => (
                                <View key={`${ing}-${idx}`} style={styles.ingredientChip}>
                                    <MaterialCommunityIcons name="leaf" size={11} color={Colors.success} />
                                    <Text style={styles.ingredientChipText}>{ing}</Text>
                                    <TouchableOpacity
                                        activeOpacity={0.6}
                                        onPress={() => removeIngredient(idx)}
                                        hitSlop={6}
                                    >
                                        <MaterialCommunityIcons name="close-circle" size={15} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                    <TextInput
                        mode="outlined"
                        placeholder="Ví dụ: bột bánh mì"
                        placeholderTextColor={Colors.placeholder}
                        value={ingredientInput}
                        onChangeText={setIngredientInput}
                        onSubmitEditing={addIngredient}
                        error={!!fieldErrors.ingredients}
                        returnKeyType="done"
                        blurOnSubmit={false}
                        outlineStyle={outlineStyle}
                        style={[inputStyle, styles.formInput]}
                        activeOutlineColor={Colors.primary}
                        textColor={Colors.text}
                        right={
                            <TextInput.Icon
                                icon="plus-circle"
                                color={ingredientInput.trim() ? Colors.primary : Colors.placeholder}
                                onPress={addIngredient}
                            />
                        }
                    />
                    {fieldErrors.ingredients ? <Text style={styles.errorText}>{fieldErrors.ingredients}</Text> : null}
                    <Text style={styles.ingredientHint}>
                        Nhập từng nguyên liệu rồi bấm dấu <Text style={{ fontWeight: '800' }}>+</Text> hoặc Enter để thêm.
                    </Text>

                    <Text style={styles.label}>CHỌN MENU</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipRow}
                    >
                        {menus.map((menu) => {
                            const active = selectedMenu === menu.id;
                            return (
                                <TouchableOpacity
                                    key={menu.id}
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        setSelectedMenu(menu.id);
                                        setFieldErrors((prev) => ({ ...prev, menu: '' }));
                                    }}
                                    style={[styles.chip, active && styles.chipActive]}
                                >
                                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                        {menu.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                    {fieldErrors.menu ? <Text style={styles.errorText}>{fieldErrors.menu}</Text> : null}

                    <Text style={[styles.label, { marginTop: 12 }]}>CHỌN LOẠI MÓN</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipRow}
                    >
                        {categories.map((category) => {
                            const active = selectedCategory === category.id;
                            return (
                                <TouchableOpacity
                                    key={category.id}
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        setSelectedCategory(category.id);
                                        setFieldErrors((prev) => ({ ...prev, category: '' }));
                                    }}
                                    style={[styles.chip, active && styles.chipActive]}
                                >
                                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                        {category.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                    {fieldErrors.category ? <Text style={styles.errorText}>{fieldErrors.category}</Text> : null}
                </View>


                <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Thẻ hiển thị trên app</Text>
                <View style={styles.previewCompact}>
                    <View style={styles.previewThumb}>
                        {previewImageUri ?
                            <Image source={{ uri: previewImageUri }} style={styles.previewThumbImg} /> :
                            <MaterialCommunityIcons name="image-off-outline" size={28} color={Colors.placeholder} />
                        }
                    </View>
                    <View style={styles.previewBody}>
                        <Text style={styles.previewName} numberOfLines={1}>
                            {dish.name.trim() || 'Tên món ăn'}
                        </Text>
                        <Text style={styles.previewDesc} numberOfLines={2}>
                            {dish.description.trim() || 'Mô tả ngắn gọn về món ăn của bạn sẽ hiển thị ở đây.'}
                        </Text>
                        <View style={styles.previewFooter}>
                            <Text style={styles.previewPrice}>
                                {dish.price ? formatCurrency(dish.price) : '0đ'}
                            </Text>
                            <View style={styles.previewTimePill}>
                                <MaterialCommunityIcons name="clock-outline" size={11} color={Colors.textSecondary} />
                                <Text style={styles.previewTimeText}>
                                    {dish.preparation_time || '--'} phút
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>


            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={submit}
                    disabled={submitting}
                    style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color={Colors.onPrimary} />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="content-save-outline" size={20} color={Colors.onPrimary} />
                            <Text style={styles.submitBtnText}>
                                {isEditing ? 'Lưu thay đổi' : 'Tạo món mới'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

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
                title={isEditing ? 'Cập nhật thành công' : 'Đã gửi món chờ duyệt'}
                message={isEditing
                    ? 'Thông tin món đã được cập nhật.'
                    : 'Món ăn đã được gửi và đang chờ Admin duyệt. Khi được duyệt, món sẽ hiển thị công khai cho khách.'}
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
