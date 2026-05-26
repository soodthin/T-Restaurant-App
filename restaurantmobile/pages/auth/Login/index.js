import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FadeInDown, FadeInUp } from '@utils/animations';
import { Toast } from '@components/CustomDialog';
import PasswordInput from '@components/PasswordInput';
import { Apis, authApis, endpoints, CLIENT_ID, CLIENT_SECRET, clearSession } from '@configs';
import Colors from '@styles/colors';
import { editorialShadow } from '@styles/theme';
import styles from './styles';

const Login = ({ navigation, route }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });

    const showToast = (message, type = 'error') => setToast({ visible: true, message, type });


    useEffect(() => {
        const flash = route?.params?.flashMessage;
        if (flash) {
            const flashType = route?.params?.flashType || 'error';
            showToast(flash, flashType);

            navigation.setParams({ flashMessage: undefined, flashType: undefined });
        }
    }, [route?.params?.flashMessage]);

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
        try {
            const params = new URLSearchParams();
            params.append('grant_type', 'password');
            params.append('username', username);
            params.append('password', password);
            params.append('client_id', CLIENT_ID);
            params.append('client_secret', CLIENT_SECRET);
            const res = await Apis.post(endpoints['login'], params);
            const data = res.data;

            if (data.access_token) {
                await AsyncStorage.setItem('token', data.access_token);
                const userRes = await authApis(data.access_token).get(endpoints['current-user']);
                const userData = userRes.data;
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                navigation.reset({ index: 0, routes: [{ name: 'Main', params: { role: userData.role } }] });
            } else {
                showToast('Sai tài khoản hoặc mật khẩu');
            }
        } catch (err) {
            if (err.code === 'ECONNABORTED') {
                showToast('Quá thời gian kết nối. Kiểm tra lại mạng.');
            } else {
                showToast(err.message || 'Không thể kết nối server');
            }
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
                    <TextInput
                        mode="outlined"
                        placeholder="Nhập username của bạn"
                        placeholderTextColor={Colors.placeholder}
                        value={username}
                        onChangeText={(text) => setUsername(text.replace(/\s/g, ''))}
                        autoCapitalize="none"
                        autoCorrect={false}
                        left={<TextInput.Icon icon="account-outline" />}
                        textColor={Colors.text}
                        activeOutlineColor={Colors.primary}
                        outlineStyle={{ borderRadius: 16, borderColor: Colors.outline, borderWidth: 1.5 }}
                        style={{ backgroundColor: Colors.surfaceContainerLowest, marginBottom: 18 }}
                    />

                    <Text style={styles.label}>MẬT KHẨU</Text>
                    <PasswordInput value={password} onChangeText={setPassword} />
                </FadeInUp>

                <FadeInUp delay={600} duration={500}>
                    {loading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} /> :
                        <Button
                            mode="contained"
                            icon="arrow-right"
                            onPress={login}
                            buttonColor={Colors.primary}
                            textColor={Colors.onPrimary}
                            contentStyle={{ flexDirection: 'row-reverse', paddingVertical: 8 }}
                            style={{ borderRadius: 24, marginTop: 12, ...editorialShadow }}
                            labelStyle={{ fontSize: 17, fontWeight: '800' }}
                        >
                            Đăng nhập
                        </Button>
                    }
                </FadeInUp>

                <FadeInUp delay={700} duration={500} style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>hoặc</Text>
                    <View style={styles.dividerLine} />
                </FadeInUp>

                <FadeInUp delay={800} duration={500} style={styles.footer}>
                    <Text style={styles.footerText}>Bạn chưa có tài khoản?</Text>
                    <Button
                        mode="outlined"
                        onPress={() => navigation.navigate('Register', { role: 'customer' })}
                        textColor={Colors.text}
                        style={{ borderRadius: 24, marginTop: 10, ...editorialShadow, backgroundColor: Colors.surfaceContainerLowest }}
                        contentStyle={{ paddingVertical: 4, paddingHorizontal: 20 }}
                        labelStyle={{ fontSize: 15, fontWeight: '800' }}
                    >
                        Đăng ký ngay
                    </Button>
                </FadeInUp>

                <FadeInUp delay={900} duration={500}>
                    <TouchableOpacity
                        style={styles.guestLink}
                        activeOpacity={0.85}
                        onPress={async () => {
                            await clearSession();
                            navigation.reset({ index: 0, routes: [{ name: 'Main', params: { role: 'guest' } }] });
                        }}>
                        <View style={styles.guestIconWrap}>
                            <MaterialCommunityIcons name="compass-outline" size={20} color={Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.guestLinkTitle}>Khám phá món ăn</Text>
                            <Text style={styles.guestLinkSub}>Xem thực đơn mà không cần đăng nhập</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textSecondary} />
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

export default Login;
