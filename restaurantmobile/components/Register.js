import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FadeInDown, FadeInUp } from '../utils/animations';
import { ConfirmDialog, Toast } from './CustomDialog';
import PasswordInput from './PasswordInput';
import BASE_URL, { endpoints } from '../configs';
import Colors from '../styles/colors';
import { editorialShadow } from '../styles/theme';

const Register = ({ navigation, route }) => {
    const initRole = route.params?.role || 'customer';
    const [user, setUser] = useState({
        username: '',
        password: '',
        email: '',
        first_name: '',
        last_name: '',
        role: initRole,
        phone: '',
        address: '',
    });
    const [confirmPass, setConfirmPass] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });
    const [confirm, setConfirm] = useState(false);
    const [successDialog, setSuccessDialog] = useState(false);

    const showToast = (message, type = 'error') => setToast({ visible: true, message, type });
    const change = (field, value) => setUser({ ...user, [field]: value });

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showToast('Cần quyền truy cập thư viện ảnh');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            shape: 'circle',
            quality: 0.9,
        });

        if (!result.canceled) {
            setAvatar(result.assets[0]);
        }
    };

    const register = () => {
        if (!avatar) {
            showToast('Vui lòng chọn ảnh đại diện');
            return;
        }
        if (!user.first_name || !user.last_name) {
            showToast('Vui lòng nhập họ và tên');
            return;
        }
        if (!user.username) {
            showToast('Vui lòng nhập tên đăng nhập');
            return;
        }
        if (!user.email || !user.email.includes('@')) {
            showToast('Email không hợp lệ');
            return;
        }
        if (!user.phone || user.phone.trim().length < 9) {
            showToast('Vui lòng nhập số điện thoại hợp lệ');
            return;
        }
        if (!user.address || user.address.trim().length < 5) {
            showToast('Vui lòng nhập địa chỉ liên hệ');
            return;
        }
        if (!user.password || user.password.length < 6) {
            showToast('Mật khẩu phải ít nhất 6 ký tự');
            return;
        }
        if (user.password !== confirmPass) {
            showToast('Mật khẩu xác nhận không khớp');
            return;
        }
        setConfirm(true);
    };

    const doRegister = async () => {
        setConfirm(false);
        setLoading(true);
        try {
            const form = new FormData();
            for (const key in user) {
                form.append(key, user[key]);
            }
            if (avatar) {
                form.append('avatar', {
                    uri: avatar.uri,
                    name: avatar.fileName || 'avatar.jpg',
                    type: avatar.mimeType || 'image/jpeg',
                });
            }

            const res = await fetch(`${BASE_URL}${endpoints['register']}`, {
                method: 'POST',
                body: form,
            });

            if (res.status === 201) {
                setSuccessDialog(true);
            } else {
                const data = await res.json();
                showToast(Object.values(data).flat().join('\n'));
            }
        } catch (err) {
            showToast('Không thể kết nối server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
                style={{ backgroundColor: Colors.surface }}
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled">

                <View style={styles.bgBlob} />

                <FadeInDown delay={100} duration={500}>
                    <Text style={styles.pageTitle}>
                        {initRole === 'chef' ? 'Đăng ký Đầu bếp' : 'Tạo tài khoản'}
                    </Text>
                </FadeInDown>

                <FadeInDown delay={200} duration={500}>
                    <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} activeOpacity={0.8}>
                        {avatar ?
                            <Image source={{ uri: avatar.uri }} style={styles.avatar} /> :
                            <View style={styles.avatarPlaceholder}>
                                <MaterialCommunityIcons name="camera-plus-outline" size={36} color={Colors.textSecondary} />
                            </View>
                        }
                        <View style={styles.cameraBadge}>
                            <MaterialCommunityIcons name="camera" size={14} color={Colors.onPrimary} />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.avatarLabel}>CHỌN ẢNH ĐẠI DIỆN</Text>
                </FadeInDown>

                {initRole === 'chef' &&
                    <FadeInDown delay={250} duration={400}>
                        <View style={styles.notice}>
                            <MaterialCommunityIcons name="information-outline" size={18} color={Colors.primary} />
                            <Text style={styles.noticeText}>
                                Tài khoản đầu bếp cần được quản trị viên duyệt trước khi sử dụng.
                            </Text>
                        </View>
                    </FadeInDown>
                }

                <FadeInUp delay={300} duration={500}>
                    <Text style={styles.label}>HỌ VÀ TÊN</Text>
                    <View style={styles.nameRow}>
                        <View style={[styles.inputWrap, { flex: 1, marginRight: 8 }]}>
                            <MaterialCommunityIcons name="account-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Họ"
                                placeholderTextColor={Colors.placeholder}
                                value={user.first_name}
                                onChangeText={(v) => change('first_name', v)}
                            />
                        </View>
                        <View style={[styles.inputWrap, { flex: 1 }]}>
                            <TextInput
                                style={styles.input}
                                placeholder="Tên"
                                placeholderTextColor={Colors.placeholder}
                                value={user.last_name}
                                onChangeText={(v) => change('last_name', v)}
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>TÊN ĐĂNG NHẬP</Text>
                    <View style={styles.inputWrap}>
                        <MaterialCommunityIcons name="at" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="username"
                            placeholderTextColor={Colors.placeholder}
                            value={user.username}
                            onChangeText={(v) => change('username', v.replace(/\s/g, ''))}
                            autoCapitalize="none"
                        />
                    </View>

                    <Text style={styles.label}>EMAIL</Text>
                    <View style={styles.inputWrap}>
                        <MaterialCommunityIcons name="email-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="example@gmail.com"
                            placeholderTextColor={Colors.placeholder}
                            value={user.email}
                            onChangeText={(v) => change('email', v.replace(/\s/g, ''))}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <Text style={styles.label}>SỐ ĐIỆN THOẠI</Text>
                    <View style={styles.inputWrap}>
                        <MaterialCommunityIcons name="phone-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="+84 900 000 000"
                            placeholderTextColor={Colors.placeholder}
                            value={user.phone}
                            onChangeText={(v) => change('phone', v)}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <Text style={styles.label}>ĐỊA CHỈ LIÊN HỆ</Text>
                    <View style={styles.inputWrap}>
                        <MaterialCommunityIcons name="map-marker-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Ví dụ: 371 Nguyễn Kiệm, Q. Gò Vấp"
                            placeholderTextColor={Colors.placeholder}
                            value={user.address}
                            onChangeText={(v) => change('address', v)}
                        />
                    </View>

                    <Text style={styles.label}>MẬT KHẨU</Text>
                    <PasswordInput
                        value={user.password}
                        onChangeText={(v) => change('password', v)}
                        placeholder="Ít nhất 6 ký tự"
                    />

                    <Text style={styles.label}>XÁC NHẬN MẬT KHẨU</Text>
                    <PasswordInput
                        value={confirmPass}
                        onChangeText={setConfirmPass}
                        placeholder="Nhập lại mật khẩu"
                    />
                </FadeInUp>

                <FadeInUp delay={500} duration={500}>
                    {loading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} /> :
                        <TouchableOpacity style={styles.btn} onPress={register} activeOpacity={0.85}>
                            <Text style={styles.btnText}>Đăng ký tài khoản</Text>
                            <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.onPrimary} />
                        </TouchableOpacity>
                    }

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Bạn đã có tài khoản? </Text>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.footerLink}>Đăng nhập ngay</Text>
                        </TouchableOpacity>
                    </View>
                </FadeInUp>
            </ScrollView>

            <ConfirmDialog
                visible={confirm}
                type="confirm"
                title="Xác nhận đăng ký"
                message="Bạn chắc chắn muốn tạo tài khoản với thông tin này?"
                onCancel={() => setConfirm(false)}
                onConfirm={doRegister}
            />

            <ConfirmDialog
                visible={successDialog}
                type="success"
                title="Đăng ký thành công!"
                message={initRole === 'chef' ? 'Tài khoản đang chờ quản trị viên duyệt.' : 'Bạn có thể đăng nhập ngay bây giờ.'}
                confirmText="Đăng nhập"
                onConfirm={() => {
                    setSuccessDialog(false);
                    navigation.goBack();
                }}
            />

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast({ ...toast, visible: false })}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 28, paddingTop: 20 },
    bgBlob: {
        position: 'absolute',
        top: -50,
        right: -70,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: Colors.primaryLight,
        opacity: 0.5,
    },
    pageTitle: { fontSize: 32, fontWeight: '800', color: Colors.text, marginBottom: 28 },
    avatarWrap: { alignSelf: 'center', marginBottom: 8 },
    avatar: { width: 112, height: 112, borderRadius: 56, borderWidth: 3, borderColor: Colors.outlineVariant + '40' },
    avatarPlaceholder: {
        width: 112,
        height: 112,
        borderRadius: 56,
        backgroundColor: Colors.surfaceContainerLow,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.outline,
        borderStyle: 'dashed',
    },
    cameraBadge: {
        position: 'absolute',
        right: -4,
        bottom: -4,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: Colors.surface,
    },
    avatarLabel: { textAlign: 'center', fontSize: 11, color: Colors.textSecondary, fontWeight: '700', marginTop: 8, marginBottom: 24, letterSpacing: 1 },
    notice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primaryLight,
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
    },
    noticeText: { flex: 1, fontSize: 13, color: Colors.primary, marginLeft: 10, lineHeight: 19 },
    label: { fontSize: 11, color: Colors.textSecondary, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
    nameRow: { flexDirection: 'row' },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: Colors.outline,
    },
    inputIcon: { marginLeft: 16 },
    input: { flex: 1, paddingVertical: 16, paddingHorizontal: 12, fontSize: 16, color: Colors.text },
    btn: {
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        padding: 18,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        ...editorialShadow,
    },
    btnText: { color: Colors.onPrimary, fontSize: 17, fontWeight: '800', marginRight: 8 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28, marginBottom: 40 },
    footerText: { color: Colors.textSecondary, fontSize: 14 },
    footerLink: { color: Colors.primary, fontSize: 14, fontWeight: '800' },
});

export default Register;
