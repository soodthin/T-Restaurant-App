import { useCallback, useMemo, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TextInput as RNTextInput,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { ConfirmDialog, Toast } from '@components/CustomDialog';
import AddressDialog from '@components/AddressDialog';
import {
    authFetch,
    endpoints,
    clearSession,
    getApiErrorMessage,
    storeUser,
} from '@configs';
import Colors from '@styles/colors';
import { getDisplayName, getInitialLetter } from '@utils/format';
import { appendImageAsset } from '@utils/upload';
import styles from './styles';

const roleConfig = {
    customer: { label: 'Khách hàng', icon: 'account-circle', color: Colors.tertiary },
    chef:     { label: 'Đầu bếp',     icon: 'chef-hat',        color: Colors.star },
    admin:    { label: 'Quản trị',    icon: 'shield-account',  color: Colors.text },
};

const ContactRow = ({ icon, label, value, editable, onChange, onTap, keyboardType }) => (
    <View style={styles.contactRow}>
        <View style={styles.contactIconWrap}>
            <MaterialCommunityIcons name={icon} size={18} color={Colors.textSecondary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.contactLabel}>{label}</Text>
            {editable && onChange ? (
                <RNTextInput
                    style={styles.contactInput}
                    value={value}
                    onChangeText={onChange}
                    keyboardType={keyboardType}
                    placeholderTextColor={Colors.placeholder}
                />
            ) : onTap ? (
                <TouchableOpacity onPress={onTap} activeOpacity={0.7}>
                    <Text style={styles.contactValue} numberOfLines={2}>{value}</Text>
                </TouchableOpacity>
            ) : (
                <Text style={styles.contactValue} numberOfLines={2}>{value}</Text>
            )}
        </View>
    </View>
);

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
                await appendImageAsset(form, 'avatar', newAvatar, 'avatar.jpg');
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

    const actionMenus = useMemo(() => {
        if (!user) return [];
        if (user.role === 'chef') {
            const items = [
                {
                    icon: 'silverware-fork-knife',
                    label: 'Quản lý món ăn',
                    color: Colors.primary,
                    bg: Colors.primaryLight,
                    onPress: () => navigation.navigate('MyDishes'),
                },
                {
                    icon: 'view-dashboard-outline',
                    label: 'Tổng quan bếp',
                    color: Colors.tertiary,
                    bg: Colors.tertiary + '15',
                    onPress: () => navigation.navigate('ChefHome'),
                },
            ];
            if (user.is_verified) {
                items.splice(1, 0, {
                    icon: 'plus-circle-outline',
                    label: 'Tạo món mới',
                    color: Colors.success,
                    bg: Colors.success + '18',
                    onPress: () => navigation.navigate('CreateDish'),
                });
            }
            return items;
        }
        return [
            {
                icon: 'receipt',
                label: 'Lịch sử đơn hàng',
                color: Colors.primary,
                bg: Colors.primaryLight,
                onPress: () => navigation.navigate('Orders'),
            },
            {
                icon: 'calendar-clock',
                label: 'Lịch sử đặt bàn',
                color: Colors.tertiary,
                bg: Colors.tertiary + '15',
                onPress: () => navigation.navigate('Booking', { initialTab: 'history' }),
            },
            {
                icon: 'star-outline',
                label: 'Đánh giá đã viết',
                color: Colors.star,
                bg: Colors.star + '18',
                onPress: () => navigation.navigate('MyReviews'),
            },
        ];
    }, [user, navigation]);

    if (loading) {
        return <ActivityIndicator size="large" color={Colors.primary} style={styles.loading} />;
    }

    if (!user) {
        return (
            <View style={styles.centerState}>
                <Text style={styles.centerText}>Chưa có thông tin đăng nhập</Text>
            </View>
        );
    }

    const role = roleConfig[user.role] || roleConfig.customer;
    const avatarUri = newAvatar ? newAvatar.uri : user.avatar;

    return (
        <KeyboardAvoidingView
            style={styles.keyboard}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.container, { paddingBottom: tabBarHeight + 36 }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>


                <View style={styles.cover}>
                    {avatarUri ?
                        <Image
                            source={{ uri: avatarUri }}
                            blurRadius={30}
                            style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
                        /> : null
                    }
                    <View style={[StyleSheet.absoluteFill, styles.coverOverlay]} />

                    <TouchableOpacity
                        style={[styles.editFloatBtn, editing && styles.editFloatBtnSave]}
                        activeOpacity={0.85}
                        onPress={editing ? saveProfile : startEdit}
                        disabled={saving}>
                        <MaterialCommunityIcons
                            name={editing ? (saving ? 'progress-clock' : 'check') : 'pencil-outline'}
                            size={16}
                            color={editing ? Colors.onPrimary : Colors.text}
                        />
                        <Text style={[styles.editFloatBtnText, editing && { color: Colors.onPrimary }]}>
                            {editing ? (saving ? 'Đang lưu...' : 'Lưu') : 'Sửa'}
                        </Text>
                    </TouchableOpacity>
                </View>


                <View style={styles.avatarWrap}>
                    {avatarUri ?
                        <Image source={{ uri: avatarUri }} style={styles.avatar} /> :
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarLetter}>
                                {getInitialLetter(getDisplayName(user, user.username))}
                            </Text>
                        </View>
                    }
                    {editing &&
                        <TouchableOpacity
                            style={styles.cameraBadge}
                            activeOpacity={0.7}
                            onPress={pickAvatar}>
                            <MaterialCommunityIcons name="camera" size={14} color={Colors.onPrimary} />
                        </TouchableOpacity>
                    }
                </View>


                <View style={styles.profileHeader}>
                    <Text style={styles.name}>{getDisplayName(user, user.username)}</Text>
                    <Text style={styles.usernameHint}>@{user.username}</Text>
                    <View style={styles.badgeRow}>
                        <View style={[styles.roleBadge, { backgroundColor: role.color + '20' }]}>
                            <MaterialCommunityIcons name={role.icon} size={13} color={role.color} />
                            <Text style={[styles.roleBadgeText, { color: role.color }]}>{role.label}</Text>
                        </View>
                        {user.role === 'chef' &&
                            <View style={[
                                styles.verifyBadge,
                                user.is_verified ? styles.verifyBadgeOn : styles.verifyBadgeOff,
                            ]}>
                                <MaterialCommunityIcons
                                    name={user.is_verified ? 'check-decagram' : 'clock-outline'}
                                    size={12}
                                    color={user.is_verified ? Colors.success : Colors.textSecondary}
                                />
                                <Text style={[
                                    styles.verifyBadgeText,
                                    { color: user.is_verified ? Colors.success : Colors.textSecondary },
                                ]}>
                                    {user.is_verified ? 'Đã xác minh' : 'Chờ xác minh'}
                                </Text>
                            </View>
                        }
                    </View>
                </View>


                <View style={styles.contactCard}>
                    <Text style={styles.cardLabel}>Thông tin liên hệ</Text>

                    {editing ? (
                        <>
                            <ContactRow
                                icon="account-outline"
                                label="Họ"
                                value={editData.first_name}
                                editable
                                onChange={(v) => setEditData((prev) => ({ ...prev, first_name: v }))}
                            />
                            <ContactRow
                                icon="account-outline"
                                label="Tên"
                                value={editData.last_name}
                                editable
                                onChange={(v) => setEditData((prev) => ({ ...prev, last_name: v }))}
                            />
                        </>
                    ) : null}

                    <ContactRow
                        icon="email-outline"
                        label="Email"
                        value={user.email || 'Chưa cập nhật'}
                    />

                    <ContactRow
                        icon="phone-outline"
                        label="Điện thoại"
                        value={editing ? editData.phone : (user.phone || 'Chưa cập nhật')}
                        editable={editing}
                        keyboardType="phone-pad"
                        onChange={(v) => setEditData((prev) => ({ ...prev, phone: v }))}
                    />

                    <ContactRow
                        icon="map-marker-outline"
                        label="Địa chỉ"
                        value={editing
                            ? (editData.address || 'Bấm để chọn địa chỉ')
                            : (user.address || 'Chưa cập nhật')}
                        onTap={editing ? () => setShowAddress(true) : null}
                    />
                </View>


                {!editing && actionMenus.length > 0 && (
                    <View style={styles.menuSection}>
                        <Text style={styles.cardLabel}>Hoạt động & quản lý</Text>
                        <View style={styles.menuList}>
                            {actionMenus.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.menuItem, index > 0 && styles.menuItemBorder]}
                                    activeOpacity={0.7}
                                    onPress={item.onPress}>
                                    <View style={[styles.menuIconWrap, { backgroundColor: item.bg }]}>
                                        <MaterialCommunityIcons name={item.icon} size={18} color={item.color} />
                                    </View>
                                    <Text style={styles.menuLabel}>{item.label}</Text>
                                    <MaterialCommunityIcons
                                        name="chevron-right"
                                        size={18}
                                        color={Colors.placeholder}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}


                {editing && (
                    <TouchableOpacity
                        style={styles.cancelLinkBtn}
                        activeOpacity={0.7}
                        onPress={cancelEdit}>
                        <Text style={styles.cancelLinkText}>Hủy thay đổi</Text>
                    </TouchableOpacity>
                )}


                {!editing && (
                    <TouchableOpacity
                        style={styles.logoutBtn}
                        activeOpacity={0.85}
                        onPress={() => setLogoutConfirm(true)}>
                        <MaterialCommunityIcons name="logout" size={18} color={Colors.primary} />
                        <Text style={styles.logoutText}>Đăng xuất</Text>
                    </TouchableOpacity>
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
