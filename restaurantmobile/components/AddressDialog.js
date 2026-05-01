import { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    FlatList,
    ScrollView,
    TextInput as RNTextInput,
    Keyboard,
    Pressable,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import Colors from '@styles/colors';
import { editorialShadow } from '@styles/theme';

const API = 'https://vietnamlabs.com/api/vietnamprovince';

const AddressDialog = ({ visible, onClose, onConfirm }) => {
    const [mode, setMode] = useState('form');
    const [province, setProvince] = useState(null);
    const [ward, setWard] = useState(null);
    const [street, setStreet] = useState('');

    const [provinces, setProvinces] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (visible) {
            Keyboard.dismiss();
            setMode('form');
            setSearch('');
            setProvince(null);
            setWard(null);
            setStreet('');
        }
    }, [visible]);

    const fetchProvinces = async () => {
        if (provinces.length > 0) return;
        setLoading(true);
        try {
            const res = await axios.get(API);
            if (res.data.success) setProvinces(res.data.data);
        } catch {
            setProvinces([]);
        } finally {
            setLoading(false);
        }
    };

    const openPicker = (type) => {
        Keyboard.dismiss();
        setSearch('');
        setMode(type);
        if (type === 'province') fetchProvinces();
    };

    const selectProvince = (item) => {
        setProvince(item);
        setWard(null);
        setMode('form');
    };

    const selectWard = (item) => {
        setWard(item);
        setMode('form');
    };

    const confirm = () => {
        const parts = [street, ward?.name, province?.province].filter(Boolean);
        onConfirm(parts.join(', '));
    };

    const getListData = () => {
        const q = search.toLowerCase().trim();
        if (mode === 'province') {
            return q ? provinces.filter((p) => p.province.toLowerCase().includes(q)) : provinces;
        }
        const wards = province?.wards || [];
        return q ? wards.filter((w) => w.name.toLowerCase().includes(q)) : wards;
    };

    if (!visible) return null;

    return (
        <Modal visible transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={mode === 'form' ? styles.overlay : styles.overlaySmall} onPress={onClose} />
            <View style={[styles.dialog, mode !== 'form' && { flex: 1 }]}>
                <View style={styles.handle} />
                {mode === 'form' ? (
                    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                            <Text style={styles.title}>Địa chỉ liên hệ</Text>

                            <TouchableOpacity style={styles.pickerBtn} onPress={() => openPicker('province')} activeOpacity={0.7}>
                                <MaterialCommunityIcons name="city-variant-outline" size={20} color={Colors.primary} />
                                <Text style={[styles.pickerText, !province && styles.pickerPlaceholder]}>
                                    {province?.province || 'Chọn Tỉnh / Thành phố'}
                                </Text>
                                <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.pickerBtn, !province && styles.pickerDisabled]}
                                onPress={() => province && openPicker('ward')}
                                activeOpacity={province ? 0.7 : 1}>
                                <MaterialCommunityIcons name="home-group" size={20} color={province ? Colors.primary : Colors.placeholder} />
                                <Text style={[styles.pickerText, !ward && styles.pickerPlaceholder]}>
                                    {ward?.name || 'Chọn Phường / Xã'}
                                </Text>
                                <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>

                            <RNTextInput
                                style={styles.streetInput}
                                placeholder="Số nhà, tên đường"
                                placeholderTextColor={Colors.placeholder}
                                value={street}
                                onChangeText={setStreet}
                            />

                        <View style={styles.actions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
                                <Text style={styles.cancelText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, (!province || !ward) && styles.confirmDisabled]}
                                onPress={confirm}
                                activeOpacity={0.8}
                                disabled={!province || !ward}>
                                <Text style={styles.confirmText}>Xác nhận</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                ) : (
                    <>
                        <View style={styles.listHeader}>
                            <TouchableOpacity onPress={() => setMode('form')} hitSlop={8}>
                                <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.listTitle}>
                                {mode === 'province' ? 'Tỉnh / Thành phố' : 'Phường / Xã'}
                            </Text>
                        </View>

                        <View style={styles.searchBox}>
                            <MaterialCommunityIcons name="magnify" size={20} color={Colors.placeholder} />
                            <RNTextInput
                                style={styles.searchInput}
                                placeholder="Tìm kiếm..."
                                placeholderTextColor={Colors.placeholder}
                                value={search}
                                onChangeText={setSearch}
                            />
                        </View>

                        {loading ? (
                            <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
                        ) : (
                            <FlatList
                                data={getListData()}
                                keyExtractor={(item, index) => (mode === 'province' ? item.id : index).toString()}
                                style={styles.list}
                                keyboardShouldPersistTaps="handled"
                                renderItem={({ item }) => {
                                    const label = mode === 'province' ? item.province : item.name;
                                    const selected = mode === 'province'
                                        ? item.id === province?.id
                                        : item.name === ward?.name;
                                    return (
                                        <TouchableOpacity
                                            style={styles.listRow}
                                            onPress={() => mode === 'province' ? selectProvince(item) : selectWard(item)}
                                            activeOpacity={0.7}>
                                            <Text style={[styles.listRowText, selected && styles.listRowTextActive]}>{label}</Text>
                                            {selected && <MaterialCommunityIcons name="check-circle" size={20} color={Colors.primary} />}
                                        </TouchableOpacity>
                                    );
                                }}
                                ListEmptyComponent={
                                    <Text style={styles.emptyText}>Không tìm thấy kết quả</Text>
                                }
                            />
                        )}
                    </>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    overlaySmall: {
        height: 80,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    dialog: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        paddingBottom: 36,
        ...editorialShadow,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.outlineVariant,
        alignSelf: 'center',
        marginBottom: 20,
    },
    title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 20 },
    pickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1.5,
        borderColor: Colors.outline,
    },
    pickerDisabled: { opacity: 0.5 },
    pickerText: { flex: 1, marginLeft: 12, fontSize: 15, color: Colors.text, fontWeight: '600' },
    pickerPlaceholder: { color: Colors.placeholder, fontWeight: '400' },
    streetInput: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 14,
        paddingLeft: 16,
        fontSize: 15,
        color: Colors.text,
        borderWidth: 1.5,
        borderColor: Colors.outline,
        marginBottom: 10,
    },
    actions: { flexDirection: 'row', marginTop: 10, gap: 10 },
    cancelBtn: {
        flex: 1,
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
    },
    cancelText: { fontSize: 15, fontWeight: '700', color: Colors.text },
    confirmBtn: {
        flex: 1,
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
    },
    confirmDisabled: { opacity: 0.4 },
    confirmText: { fontSize: 15, fontWeight: '700', color: Colors.onPrimary },
    listHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    listTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginLeft: 12 },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 14,
        paddingHorizontal: 12,
        marginBottom: 8,
        borderWidth: 1.5,
        borderColor: Colors.outline,
    },
    searchInput: { flex: 1, paddingVertical: 12, paddingLeft: 8, fontSize: 15, color: Colors.text },
    list: { flexShrink: 1 },
    listRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: Colors.outlineVariant + '30',
    },
    listRowText: { fontSize: 15, color: Colors.text },
    listRowTextActive: { fontWeight: '700', color: Colors.primary },
    emptyText: { textAlign: 'center', color: Colors.textSecondary, marginTop: 20, fontSize: 14 },
});

export default AddressDialog;
