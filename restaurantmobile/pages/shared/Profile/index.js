import { useCallback, useMemo, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { TextInput, Button, ActivityIndicator, Avatar } from 'react-native-paper';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FadeInDown, FadeInUp, FadeIn } from '@utils/animations';
import { useFocusEffect } from '@react-navigation/native';
import { ConfirmDialog, Toast } from '@components/CustomDialog';
import ChefVerificationBanner from '@components/ChefVerificationBanner';
import AddressDialog from '@components/AddressDialog';
import { authFetch, endpoints, clearSession, getApiErrorMessage, storeUser } from '@configs';
import Colors from '@styles/colors';
import { editorialShadow } from '@styles/theme';
import { getDisplayName, getInitialLetter } from '@utils/format';
import styles from './styles';

const roleLabelMap = {
    admin: 'Quản trị viên',
    chef: 'Đầu bếp',
    customer: 'Khách hàng',
};

const Profile = ({ navigation }) => {
    const tabBarHeight = useBottomTabBarHeight();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [newAvatar, setNewAvatar] = useState(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });
    const [logoutConfirm, setLogoutConfirm] = useState(false);
    const [showAddress, setShowAddress] = useState(false);

    const showToast = useCallback((message, type = 'error') => {
        setToast({ visible: true, message, type });
    }, []);

    const resetToLogin = useCallback(async () => {
        await clearSession();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }, [navigation]);

    const loadProfile = useCallback(async () => {
        try {
            const res = await authFetch(endpoints['current-user']);
            if (res.status === 401) {
                await resetToLogin();
                return;
            }
            if (!res.ok) {
                showToast(getApiErrorMessage(res, 'Không thể tải thông tin cá nhân'));
                return;
            }

            const data = res.data;
            setUser(data);
            await storeUser(data);
        } catch (err) {
            showToast('Không thể tải thông tin cá nhân');
        } finally {
            setLoading(false);
        }
    }, [resetToLogin, showToast]);

    useFocusEffect(useCallback(() => {
        setLoading(true);
        loadProfile();
    }, [loadProfile]));

    const infoRows = useMemo(() => {
        if (!user) return [];

        const rows = [
            { key: 'email', icon: 'email-outline', label: 'Email', value: user.email || 'Chưa cập nhật' },
            { key: 'phone', icon: 'phone-outline', label: 'Điện thoại', value: user.phone || 'Chưa cập nhật' },
            { key: 'address', icon: 'map-marker-outline', label: 'Địa chỉ liên hệ', value: user.address || 'Chưa cập nhật' },
        ];

        if (user.role === 'chef') {
            rows.push({
                key: 'status',
                icon: user.is_verified ? 'check-decagram-outline' : 'clock-outline',
                label: 'Trạng thái vận hành',
                value: user.is_verified ? 'Đã duyệt tạo món' : 'Chờ quản trị viên duyệt',
                accent: user.is_verified ? Colors.success : Colors.star,
            });
        }

        return rows;
    }, [user]);

    const startEdit = () => {
        setEditData({
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            phone: user?.phone || '',
            address: user?.address || '',
        });
        setNewAvatar(null);
        setEditing(true);
    };

    const cancelEdit = () => {
        setEditing(false);
        setNewAvatar(null);
    };

    const pickAvatar = async () => {
        if (!editing) return;

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showToast('Cần quyền truy cập thư viện ảnh để thay ảnh đại diện.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            shape: 'circle',
            quality: 0.85,
        });

        if (!result.canceled) {
            setNewAvatar(result.assets[0]);
        }
    };

    const saveProfile = async () => {
        if (!editData.phone || editData.phone.trim().length < 9) {
            showToast('Số điện thoại chưa hợp lệ');
            return;
        }
        if (!editData.address || editData.address.trim().length < 5) {
            showToast('Vui lòng nhập địa chỉ liên hệ đầy đủ');
            return;
        }

        setSaving(true);

        try {
            const form = new FormData();
            form.append('first_name', editData.first_name);
            form.append('last_name', editData.last_name);
            form.append('phone', editData.phone.trim());
            form.append('address', editData.address.trim());

            if (newAvatar) {
                form.append('avatar', {
                    uri: newAvatar.uri,
                    name: newAvatar.fileName || 'avatar.jpg',
                    type: newAvatar.mimeType || 'image/jpeg',
                });
            }

            const res = await authFetch(endpoints['current-user'], {
                method: 'PATCH',
                body: form,
            });

            if (res.status === 401) {
                await resetToLogin();
                return;
            }

            if (!res.ok) {
                showToast(getApiErrorMessage(res, 'Không thể cập nhật thông tin'));
                return;
            }

            const data = res.data;
            setUser(data);
            await storeUser(data);
            setEditing(false);
            setNewAvatar(null);
            showToast('Cập nhật thông tin thành công', 'success');
        } catch (err) {
            showToast('Không thể cập nhật thông tin');
        } finally {
            setSaving(false);
        }
    };

    const doLogout = async () => {
        setLogoutConfirm(false);
        await resetToLogin();
    };

    if (loading) {
        return (
            <ActivityIndicator
                size="large"
                color={Colors.primary}
                style={styles.loading}
            />
        );
    }

    if (!user) {
        return (
            <View style={styles.centerState}>
                <Text style={styles.centerText}>Chưa có thông tin đăng nhập</Text>
            </View>
        );
    }

    const avatarUri = newAvatar ? newAvatar.uri : user.avatar;
    const roleLabel = roleLabelMap[user.role] || 'Người dùng';

    return (
        <KeyboardAvoidingView
            style={styles.keyboard}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.container, { paddingBottom: tabBarHeight + 36 }]}
                keyboardShouldPersistTaps="handled">

                <FadeInDown duration={500} style={styles.hero}>
                    <TouchableOpacity
                        onPress={pickAvatar}
                        disabled={!editing}
                        activeOpacity={editing ? 0.8 : 1}>
                        {avatarUri ?
                            <Avatar.Image size={112} source={{ uri: avatarUri }} /> :
                            <Avatar.Text
                                size={112}
                                label={getInitialLetter(getDisplayName(user, user.username))}
                                style={{ backgroundColor: Colors.primary }}
                                labelStyle={{ fontSize: 42, fontWeight: '800' }}
                            />}

                        {editing ?
                            <View style={styles.editAvatarBadge}>
                                <MaterialCommunityIcons name="camera" size={14} color={Colors.onPrimary} />
                            </View> :
                            null}
                    </TouchableOpacity>

                    <Text style={styles.name}>{getDisplayName(user, user.username)}</Text>
                    <Text style={styles.username}>@{user.username}</Text>

                    <View style={styles.badgeRow}>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>{roleLabel}</Text>
                        </View>

                        {user.role === 'chef' ?
                            <View style={[styles.statusBadge, user.is_verified ? styles.statusApproved : styles.statusPending]}>
                                <Text style={[styles.statusBadgeText, { color: user.is_verified ? Colors.success : Colors.star }]}>
                                    {user.is_verified ? 'Đã duyệt' : 'Chờ duyệt'}
                                </Text>
                            </View> :
                            null}
                    </View>

                    {user.role === 'chef' ?
                        <ChefVerificationBanner
                            verified={user.is_verified}
                            style={styles.banner}
                            actionLabel={user.is_verified ? 'Mở món của tôi' : 'Quản lý món hiện có'}
                            onAction={() => navigation.navigate('MyDishes')}
                        /> :
                        null}
                </FadeInDown>

                {!editing ? (
                    <>
                        <FadeInUp delay={200} duration={400} style={styles.infoCard}>
                            <Text style={styles.cardTitle}>Thông tin tài khoản</Text>
                            {infoRows.map((item) => (
                                <View key={item.key} style={styles.infoRow}>
                                    <View style={[styles.infoIcon, item.accent && { backgroundColor: item.accent + '15' }]}>
                                        <MaterialCommunityIcons
                                            name={item.icon}
                                            size={18}
                                            color={item.accent || Colors.primary}
                                        />
                                    </View>
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>{item.label}</Text>
                                        <Text style={[styles.infoValue, item.accent && { color: item.accent }]}>
                                            {item.value}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </FadeInUp>

                        {user.role === 'chef' ?
                            <FadeInUp delay={300} duration={400} style={styles.noteCard}>
                                <Text style={styles.cardTitle}>Gợi ý chuẩn hóa hồ sơ bếp</Text>
                                <Text style={styles.noteItem}>Điện thoại và địa chỉ liên hệ cần chính xác để hỗ trợ quy trình duyệt tài khoản.</Text>
                                <Text style={styles.noteItem}>Sau khi được duyệt, bạn nên kiểm tra lại mô tả món, menu và loại món trước khi bán.</Text>
                            </FadeInUp> :
                            null}

                        <FadeInUp delay={400} duration={400}>
                            <Button
                                mode="contained"
                                icon="account-edit-outline"
                                onPress={startEdit}
                                style={styles.btn}
                                contentStyle={styles.btnContent}
                            >
                                Chỉnh sửa thông tin
                            </Button>

                            {user.role === 'chef' ?
                                <Button
                                    mode="contained-tonal"
                                    icon="silverware-variant"
                                    onPress={() => navigation.navigate(user.is_verified ? 'CreateDish' : 'MyDishes')}
                                    style={styles.btn}
                                    contentStyle={styles.btnContent}
                                >
                                    {user.is_verified ? 'Tạo món mới' : 'Xem món hiện có'}
                                </Button> :
                                null}

                            <Button
                                mode="contained"
                                buttonColor={Colors.text}
                                textColor={Colors.onPrimary}
                                onPress={() => setLogoutConfirm(true)}
                                style={styles.btn}
                                contentStyle={styles.btnContent}
                            >
                                Đăng xuất
                            </Button>
                        </FadeInUp>
                    </>
                ) : (
                    <FadeIn duration={400} style={styles.editCard}>
                        <Text style={styles.cardTitle}>Cập nhật hồ sơ</Text>
                        <Text style={styles.editSubtitle}>
                            Hoàn thiện thông tin liên hệ để đảm bảo vận hành và hỗ trợ duyệt tài khoản nhanh hơn.
                        </Text>

                        <TextInput
                            mode="outlined"
                            label="HỌ"
                            value={editData.first_name}
                            onChangeText={(value) => setEditData((prev) => ({ ...prev, first_name: value }))}
                            placeholder="Họ"
                            placeholderTextColor={Colors.placeholder}
                            outlineStyle={styles.inputOutline}
                            style={styles.input}
                            activeOutlineColor={Colors.primary}
                            textColor={Colors.text}
                        />

                        <TextInput
                            mode="outlined"
                            label="TÊN"
                            value={editData.last_name}
                            onChangeText={(value) => setEditData((prev) => ({ ...prev, last_name: value }))}
                            placeholder="Tên"
                            placeholderTextColor={Colors.placeholder}
                            outlineStyle={styles.inputOutline}
                            style={styles.input}
                            activeOutlineColor={Colors.primary}
                            textColor={Colors.text}
                        />

                        <TextInput
                            mode="outlined"
                            label="SỐ ĐIỆN THOẠI"
                            value={editData.phone}
                            onChangeText={(value) => setEditData((prev) => ({ ...prev, phone: value }))}
                            placeholder="+84 900 000 000"
                            placeholderTextColor={Colors.placeholder}
                            keyboardType="phone-pad"
                            left={<TextInput.Icon icon="phone-outline" />}
                            outlineStyle={styles.inputOutline}
                            style={styles.input}
                            activeOutlineColor={Colors.primary}
                            textColor={Colors.text}
                        />

                        <Text style={styles.addressLabel}>ĐỊA CHỈ LIÊN HỆ</Text>
                        <TouchableOpacity style={styles.addressBtn} onPress={() => setShowAddress(true)} activeOpacity={0.7}>
                            <MaterialCommunityIcons name="map-marker-outline" size={22} color={editData.address ? Colors.primary : Colors.placeholder} />
                            <Text style={[styles.addressText, !editData.address && styles.addressPlaceholder]} numberOfLines={2}>
                                {editData.address || 'Bấm để chọn địa chỉ'}
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textSecondary} />
                        </TouchableOpacity>

                        <View style={styles.actionRow}>
                            <Button
                                mode="contained-tonal"
                                onPress={cancelEdit}
                                style={{ flex: 1, marginRight: 10, borderRadius: 20 }}
                                contentStyle={styles.btnContent}
                            >
                                Hủy
                            </Button>

                            <Button
                                mode="contained"
                                onPress={saveProfile}
                                loading={saving}
                                disabled={saving}
                                style={{ flex: 2, borderRadius: 20 }}
                                contentStyle={styles.btnContent}
                            >
                                Lưu thay đổi
                            </Button>
                        </View>
                    </FadeIn>
                )}
            </ScrollView>

            <ConfirmDialog
                visible={logoutConfirm}
                type="warning"
                title="Đăng xuất"
                message="Bạn chắc chắn muốn đăng xuất khỏi ứng dụng?"
                onCancel={() => setLogoutConfirm(false)}
                onConfirm={doLogout}
                confirmText="Đăng xuất"
            />

            <AddressDialog
                visible={showAddress}
                onClose={() => setShowAddress(false)}
                onConfirm={(addr) => {
                    setEditData((prev) => ({ ...prev, address: addr }));
                    setShowAddress(false);
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

export default Profile;
