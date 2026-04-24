import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FadeInDown, FadeInUp } from '@utils/animations';
import { ConfirmDialog, Toast } from '@components/CustomDialog';
import PasswordInput from '@components/PasswordInput';
import AddressDialog from '@components/AddressDialog';
import BASE_URL, { endpoints } from '@configs';
import Colors from '@styles/colors';
import { editorialShadow } from '@styles/theme';
import styles from './styles';

const inputOutlineStyle = { borderRadius: 16, borderColor: Colors.outline, borderWidth: 1.5 };
const inputBgStyle = { backgroundColor: Colors.surfaceContainerLowest };

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
    const [showAddress, setShowAddress] = useState(false);

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
                        <TextInput
                            mode="outlined"
                            placeholder="Họ"
                            placeholderTextColor={Colors.placeholder}
                            value={user.first_name}
                            onChangeText={(v) => change('first_name', v)}
                            left={<TextInput.Icon icon="account-outline" />}
                            textColor={Colors.text}
                            activeOutlineColor={Colors.primary}
                            outlineStyle={inputOutlineStyle}
                            style={[inputBgStyle, { flex: 1, marginRight: 8, marginBottom: 16 }]}
                        />
                        <TextInput
                            mode="outlined"
                            placeholder="Tên"
                            placeholderTextColor={Colors.placeholder}
                            value={user.last_name}
                            onChangeText={(v) => change('last_name', v)}
                            textColor={Colors.text}
                            activeOutlineColor={Colors.primary}
                            outlineStyle={inputOutlineStyle}
                            style={[inputBgStyle, { flex: 1, marginBottom: 16 }]}
                        />
                    </View>

                    <Text style={styles.label}>TÊN ĐĂNG NHẬP</Text>
                    <TextInput
                        mode="outlined"
                        placeholder="username"
                        placeholderTextColor={Colors.placeholder}
                        value={user.username}
                        onChangeText={(v) => change('username', v.replace(/\s/g, ''))}
                        autoCapitalize="none"
                        left={<TextInput.Icon icon="at" />}
                        textColor={Colors.text}
                        activeOutlineColor={Colors.primary}
                        outlineStyle={inputOutlineStyle}
                        style={[inputBgStyle, { marginBottom: 16 }]}
                    />

                    <Text style={styles.label}>EMAIL</Text>
                    <TextInput
                        mode="outlined"
                        placeholder="example@gmail.com"
                        placeholderTextColor={Colors.placeholder}
                        value={user.email}
                        onChangeText={(v) => change('email', v.replace(/\s/g, ''))}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        left={<TextInput.Icon icon="email-outline" />}
                        textColor={Colors.text}
                        activeOutlineColor={Colors.primary}
                        outlineStyle={inputOutlineStyle}
                        style={[inputBgStyle, { marginBottom: 16 }]}
                    />

                    <Text style={styles.label}>SỐ ĐIỆN THOẠI</Text>
                    <TextInput
                        mode="outlined"
                        placeholder="+84 900 000 000"
                        placeholderTextColor={Colors.placeholder}
                        value={user.phone}
                        onChangeText={(v) => change('phone', v)}
                        keyboardType="phone-pad"
                        left={<TextInput.Icon icon="phone-outline" />}
                        textColor={Colors.text}
                        activeOutlineColor={Colors.primary}
                        outlineStyle={inputOutlineStyle}
                        style={[inputBgStyle, { marginBottom: 16 }]}
                    />

                    <Text style={styles.label}>ĐỊA CHỈ LIÊN HỆ</Text>
                    <TouchableOpacity style={styles.addressBtn} onPress={() => setShowAddress(true)} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="map-marker-outline" size={22} color={user.address ? Colors.primary : Colors.placeholder} />
                        <Text style={[styles.addressText, !user.address && styles.addressPlaceholder]} numberOfLines={2}>
                            {user.address || 'Bấm để chọn địa chỉ'}
                        </Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>

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
                        <Button
                            mode="contained"
                            icon="arrow-right"
                            onPress={register}
                            buttonColor={Colors.primary}
                            textColor={Colors.onPrimary}
                            contentStyle={{ flexDirection: 'row-reverse', paddingVertical: 8 }}
                            style={{ borderRadius: 24, marginTop: 16, ...editorialShadow }}
                            labelStyle={{ fontSize: 17, fontWeight: '800' }}
                        >
                            Đăng ký tài khoản
                        </Button>
                    }

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Bạn đã có tài khoản? </Text>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.footerLink}>Đăng nhập ngay</Text>
                        </TouchableOpacity>
                    </View>

                    {initRole !== 'chef' &&
                        <TouchableOpacity
                            style={styles.chefLink}
                            activeOpacity={0.7}
                            onPress={() => navigation.replace('Register', { role: 'chef' })}>
                            <MaterialCommunityIcons name="chef-hat" size={18} color={Colors.primary} />
                            <Text style={styles.chefLinkText}>Bạn là một đầu bếp?</Text>
                        </TouchableOpacity>
                    }
                </FadeInUp>
            </ScrollView>

            <AddressDialog
                visible={showAddress}
                onClose={() => setShowAddress(false)}
                onConfirm={(addr) => {
                    change('address', addr);
                    setShowAddress(false);
                }}
                initialAddress={user.address}
            />

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

export default Register;
