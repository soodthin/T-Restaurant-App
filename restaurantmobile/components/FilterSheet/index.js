import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import Colors from '@styles/colors';
import { sanitizeNumberInput } from '@utils/format';
import styles from './styles';

const toStr = (v) => (v === null || v === undefined || v === '' ? '' : String(v));

const FilterSheet = ({
    visible,
    onClose,
    sortOptions,
    menus,
    categories,
    chefs = [],
    menuId,
    catId,
    chefId = null,
    ordering,
    priceMin,
    priceMax,
    prepMin,
    prepMax,
    onSelect,
    onApplyRange,
}) => {

    const formatChefName = (chef) => {
        const full = `${chef.first_name || ''} ${chef.last_name || ''}`.trim();
        return full || chef.username;
    };

    const [localPriceMin, setLocalPriceMin] = useState(toStr(priceMin));
    const [localPriceMax, setLocalPriceMax] = useState(toStr(priceMax));
    const [localPrepMin, setLocalPrepMin] = useState(toStr(prepMin));
    const [localPrepMax, setLocalPrepMax] = useState(toStr(prepMax));

    useEffect(() => {
        if (visible) {
            setLocalPriceMin(toStr(priceMin));
            setLocalPriceMax(toStr(priceMax));
            setLocalPrepMin(toStr(prepMin));
            setLocalPrepMax(toStr(prepMax));
        }
    }, [visible, priceMin, priceMax, prepMin, prepMax]);

    const applyRanges = () => {
        if (typeof onApplyRange === 'function') {
            onApplyRange({
                priceMin: localPriceMin || null,
                priceMax: localPriceMax || null,
                prepMin: localPrepMin || null,
                prepMax: localPrepMax || null,
            });
        }
    };

    const clearRanges = () => {
        setLocalPriceMin('');
        setLocalPriceMax('');
        setLocalPrepMin('');
        setLocalPrepMax('');
        if (typeof onApplyRange === 'function') {
            onApplyRange({ priceMin: null, priceMax: null, prepMin: null, prepMax: null });
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.sheetOverlay} onPress={onClose} />
            <View style={styles.sheetContainer}>
                <View style={styles.sheetHandle} />
                <ScrollView showsVerticalScrollIndicator={false}>
                    {sortOptions.length > 0 && (
                        <View style={styles.sheetSection}>
                            <Text style={styles.sheetSectionTitle}>Sắp xếp</Text>
                            {sortOptions.map((option) => {
                                const active = ordering === option.key;
                                return (
                                    <TouchableOpacity
                                        key={option.key || 'default'}
                                        style={styles.sheetRow}
                                        activeOpacity={0.7}
                                        onPress={() => onSelect({ ordering: option.key })}>
                                        <Text style={[styles.sheetRowText, active && styles.sheetRowTextActive]}>{option.label}</Text>
                                        <View style={[styles.radio, active && styles.radioActive]}>
                                            {active && <View style={styles.radioDot} />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}

                    <View style={styles.sheetSection}>
                        <Text style={styles.sheetSectionTitle}>Khoảng giá (đ)</Text>
                        <View style={styles.rangeRow}>
                            <TextInput
                                mode="outlined"
                                placeholder="Tối thiểu"
                                value={localPriceMin}
                                onChangeText={(v) => setLocalPriceMin(sanitizeNumberInput(v))}
                                keyboardType="numeric"
                                style={styles.rangeInput}
                                outlineStyle={styles.rangeOutline}
                                activeOutlineColor={Colors.primary}
                                textColor={Colors.text}
                            />
                            <Text style={styles.rangeSeparator}>—</Text>
                            <TextInput
                                mode="outlined"
                                placeholder="Tối đa"
                                value={localPriceMax}
                                onChangeText={(v) => setLocalPriceMax(sanitizeNumberInput(v))}
                                keyboardType="numeric"
                                style={styles.rangeInput}
                                outlineStyle={styles.rangeOutline}
                                activeOutlineColor={Colors.primary}
                                textColor={Colors.text}
                            />
                        </View>
                    </View>

                    <View style={styles.sheetSection}>
                        <Text style={styles.sheetSectionTitle}>Thời gian phục vụ (phút)</Text>
                        <View style={styles.rangeRow}>
                            <TextInput
                                mode="outlined"
                                placeholder="Tối thiểu"
                                value={localPrepMin}
                                onChangeText={(v) => setLocalPrepMin(sanitizeNumberInput(v))}
                                keyboardType="numeric"
                                style={styles.rangeInput}
                                outlineStyle={styles.rangeOutline}
                                activeOutlineColor={Colors.primary}
                                textColor={Colors.text}
                            />
                            <Text style={styles.rangeSeparator}>—</Text>
                            <TextInput
                                mode="outlined"
                                placeholder="Tối đa"
                                value={localPrepMax}
                                onChangeText={(v) => setLocalPrepMax(sanitizeNumberInput(v))}
                                keyboardType="numeric"
                                style={styles.rangeInput}
                                outlineStyle={styles.rangeOutline}
                                activeOutlineColor={Colors.primary}
                                textColor={Colors.text}
                            />
                        </View>
                        <View style={styles.rangeActions}>
                            <Button
                                mode="text"
                                textColor={Colors.textSecondary}
                                onPress={clearRanges}
                                compact>
                                Xóa khoảng lọc
                            </Button>
                            <Button
                                mode="contained"
                                buttonColor={Colors.primary}
                                textColor={Colors.onPrimary}
                                onPress={applyRanges}
                                compact>
                                Áp dụng
                            </Button>
                        </View>
                    </View>

                    {menus.length > 0 && (
                        <View style={styles.sheetSection}>
                            <Text style={styles.sheetSectionTitle}>Thực đơn</Text>
                            <TouchableOpacity style={styles.sheetRow} activeOpacity={0.7} onPress={() => onSelect({ menuId: null })}>
                                <Text style={[styles.sheetRowText, menuId === null && styles.sheetRowTextActive]}>Tất cả</Text>
                                <View style={[styles.radio, menuId === null && styles.radioActive]}>
                                    {menuId === null && <View style={styles.radioDot} />}
                                </View>
                            </TouchableOpacity>
                            {menus.map((menu) => {
                                const active = menuId === menu.id;
                                return (
                                    <TouchableOpacity key={menu.id} style={styles.sheetRow} activeOpacity={0.7} onPress={() => onSelect({ menuId: menu.id })}>
                                        <Text style={[styles.sheetRowText, active && styles.sheetRowTextActive]}>{menu.name}</Text>
                                        <View style={[styles.radio, active && styles.radioActive]}>
                                            {active && <View style={styles.radioDot} />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}

                    {categories.length > 0 && (
                        <View style={styles.sheetSection}>
                            <Text style={styles.sheetSectionTitle}>Loại món</Text>
                            <TouchableOpacity style={styles.sheetRow} activeOpacity={0.7} onPress={() => onSelect({ catId: null })}>
                                <Text style={[styles.sheetRowText, catId === null && styles.sheetRowTextActive]}>Tất cả</Text>
                                <View style={[styles.radio, catId === null && styles.radioActive]}>
                                    {catId === null && <View style={styles.radioDot} />}
                                </View>
                            </TouchableOpacity>
                            {categories.map((category) => {
                                const active = catId === category.id;
                                return (
                                    <TouchableOpacity key={category.id} style={styles.sheetRow} activeOpacity={0.7} onPress={() => onSelect({ catId: category.id })}>
                                        <Text style={[styles.sheetRowText, active && styles.sheetRowTextActive]}>{category.name}</Text>
                                        <View style={[styles.radio, active && styles.radioActive]}>
                                            {active && <View style={styles.radioDot} />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}

                    {chefs.length > 0 && (
                        <View style={styles.sheetSection}>
                            <Text style={styles.sheetSectionTitle}>Đầu bếp phụ trách</Text>
                            <TouchableOpacity style={styles.sheetRow} activeOpacity={0.7} onPress={() => onSelect({ chefId: null })}>
                                <Text style={[styles.sheetRowText, chefId === null && styles.sheetRowTextActive]}>Tất cả</Text>
                                <View style={[styles.radio, chefId === null && styles.radioActive]}>
                                    {chefId === null && <View style={styles.radioDot} />}
                                </View>
                            </TouchableOpacity>
                            {chefs.map((chef) => {
                                const active = chefId === chef.id;
                                return (
                                    <TouchableOpacity key={chef.id} style={styles.sheetRow} activeOpacity={0.7} onPress={() => onSelect({ chefId: chef.id })}>
                                        <Text style={[styles.sheetRowText, active && styles.sheetRowTextActive]}>{formatChefName(chef)}</Text>
                                        <View style={[styles.radio, active && styles.radioActive]}>
                                            {active && <View style={styles.radioDot} />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
};

export default FilterSheet;
