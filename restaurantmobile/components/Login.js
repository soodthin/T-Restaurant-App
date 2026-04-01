import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FadeInDown, FadeInUp } from '../utils/animations';
import { Toast } from './CustomDialog';
import PasswordInput from './PasswordInput';
import BASE_URL, { endpoints, CLIENT_ID, CLIENT_SECRET } from '../configs';
import Colors from '../styles/colors';
import { editorialShadow } from '../styles/theme';

const Login = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });

    const showToast = (message, type = 'error') => setToast({ visible: true, message, type });

    const login = async () => {
        if (!username || !password) {
            showToast('Vui lòng nhập đầy đủ thông tin');
            return;
        }
        if (username.includes('@')) {
            showToast('Màn hình này đăng nhập bằng username, không dùng email');
            return;
        }

        setLoading(true);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const url = `${BASE_URL}${endpoints['login']}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `grant_type=password&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&client_id=${encodeURIComponent(CLIENT_ID)}&client_secret=${encodeURIComponent(CLIENT_SECRET)}`,
                signal: controller.signal,
            });
            const data = await res.json();

            if (data.access_token) {
                await AsyncStorage.setItem('token', data.access_token);
                const userRes = await fetch(`${BASE_URL}${endpoints['current-user']}`, {
                    headers: { Authorization: `Bearer ${data.access_token}` },
                });
                const userData = await userRes.json();
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                navigation.reset({ index: 0, routes: [{ name: 'Main', params: { role: userData.role } }] });
            } else {
                showToast('Sai tài khoản hoặc mật khẩu');
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                showToast('Quá thời gian kết nối. Kiểm tra lại mạng.');
            } else {
                showToast(err.message || 'Không thể kết nối server');
            }
        } finally {
            clearTimeout(timeout);
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
                <View style={styles.bgBlob2} />

                <FadeInDown delay={100} duration={600} style={styles.logoWrap}>
                    <View style={styles.logo}>
                        <Text style={styles.logoText}>T</Text>
                    </View>
                </FadeInDown>

                <FadeInDown delay={200} duration={500}>
                    <Text style={styles.brandSmall}>SAIGON SAVORY</Text>
                </FadeInDown>

                <FadeInDown delay={300} duration={500}>
                    <Text style={styles.title}>Chào mừng trở lại</Text>
                </FadeInDown>
                <FadeInDown delay={400} duration={500}>
                    <Text style={styles.subtitle}>Đăng nhập để tiếp tục trải nghiệm{'\n'}dịch vụ nhà hàng.</Text>
                </FadeInDown>

                <FadeInUp delay={500} duration={500}>
                    <Text style={styles.label}>TÊN ĐĂNG NHẬP</Text>
                    <View style={styles.inputWrap}>
                        <MaterialCommunityIcons name="account-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Nhập username của bạn"
                            placeholderTextColor={Colors.placeholder}
                            value={username}
                            onChangeText={(text) => setUsername(text.replace(/\s/g, ''))}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                    <Text style={styles.helperText}>Đăng nhập bằng username đã đăng ký, không dùng email.</Text>

                    <Text style={styles.label}>MẬT KHẨU</Text>
                    <PasswordInput value={password} onChangeText={setPassword} />
                </FadeInUp>

                <FadeInUp delay={600} duration={500}>
                    {loading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} /> :
                        <TouchableOpacity style={styles.btn} onPress={login} activeOpacity={0.85}>
                            <Text style={styles.btnText}>Đăng nhập</Text>
                            <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.onPrimary} />
                        </TouchableOpacity>
                    }
                </FadeInUp>

                <FadeInUp delay={700} duration={500} style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>hoặc</Text>
                    <View style={styles.dividerLine} />
                </FadeInUp>

                <FadeInUp delay={800} duration={500} style={styles.footer}>
                    <Text style={styles.footerText}>Bạn chưa có tài khoản?</Text>
                    <TouchableOpacity
                        style={styles.footerBtn}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('Register', { role: 'customer' })}>
                        <Text style={styles.footerLink}>Đăng ký ngay</Text>
                    </TouchableOpacity>
                </FadeInUp>

                <FadeInUp delay={900} duration={500}>
                    <TouchableOpacity
                        style={styles.chefLink}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('Register', { role: 'chef' })}>
                        <MaterialCommunityIcons name="chef-hat" size={18} color={Colors.primary} />
                        <Text style={styles.chefLinkText}>Bạn là một đầu bếp?</Text>
                    </TouchableOpacity>
                </FadeInUp>

                <Toast
                    visible={toast.visible}
                    message={toast.message}
                    type={toast.type}
                    onHide={() => setToast({ ...toast, visible: false })}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 28, paddingTop: 80 },
    bgBlob: {
        position: 'absolute',
        top: -80,
        right: -60,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: Colors.primaryLight,
        opacity: 0.6,
    },
    bgBlob2: {
        position: 'absolute',
        bottom: 100,
        left: -80,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: Colors.tertiaryLight,
        opacity: 0.4,
    },
    logoWrap: { alignItems: 'center', marginBottom: 12 },
    logo: {
        width: 60,
        height: 60,
        borderRadius: 18,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ rotate: '-3deg' }],
        ...editorialShadow,
    },
    logoText: {
        fontSize: 32,
        fontWeight: '900',
        fontStyle: 'italic',
        color: Colors.onPrimary,
    },
    brandSmall: {
        textAlign: 'center',
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 3,
        marginBottom: 36,
    },
    title: { fontSize: 32, fontWeight: '800', color: Colors.text, textAlign: 'center', lineHeight: 40 },
    subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginTop: 10, marginBottom: 40, lineHeight: 23 },
    label: { fontSize: 11, color: Colors.textSecondary, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 16,
        marginBottom: 18,
        borderWidth: 1.5,
        borderColor: Colors.outline,
    },
    inputIcon: { marginLeft: 16 },
    input: { flex: 1, paddingVertical: 16, paddingHorizontal: 12, fontSize: 16, color: Colors.text },
    helperText: { fontSize: 12, color: Colors.textSecondary, marginTop: -10, marginBottom: 18 },
    btn: {
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        padding: 18,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        ...editorialShadow,
    },
    btnText: { color: Colors.onPrimary, fontSize: 17, fontWeight: '800', marginRight: 8 },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 32, marginBottom: 24 },
    dividerLine: { flex: 1, height: 1, backgroundColor: Colors.outlineVariant + '40' },
    dividerText: { marginHorizontal: 16, color: Colors.textSecondary, fontSize: 13 },
    footer: { alignItems: 'center' },
    footerText: { color: Colors.textSecondary, fontSize: 14 },
    footerBtn: {
        marginTop: 10,
        paddingVertical: 14,
        paddingHorizontal: 40,
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 24,
        ...editorialShadow,
    },
    footerLink: { color: Colors.text, fontSize: 15, fontWeight: '800' },
    chefLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 28, marginBottom: 40 },
    chefLinkText: { color: Colors.primary, fontSize: 14, fontWeight: '700', marginLeft: 8 },
});

export default Login;
