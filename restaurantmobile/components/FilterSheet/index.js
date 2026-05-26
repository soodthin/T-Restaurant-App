import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@styles/colors';
import styles from './styles';


const PRICE_BUCKETS = [
    { key: 'all', label: 'Tất cả', min: null, max: null },
    { key: 'lt50', label: 'Dưới 50.000đ', min: null, max: 50000 },
    { key: '50_100', label: '50.000đ – 100.000đ', min: 50000, max: 100000 },
    { key: '100_200', label: '100.000đ – 200.000đ', min: 100000, max: 200000 },
    { key: '200_500', label: '200.000đ – 500.000đ', min: 200000, max: 500000 },
    { key: 'gt500', label: 'Trên 500.000đ', min: 500000, max: null },
];

const PREP_BUCKETS = [
    { key: 'all', label: 'Tất cả', min: null, max: null },
    { key: 'lt15', label: 'Dưới 15 phút', min: null, max: 15 },
    { key: '15_30', label: '15 – 30 phút', min: 15, max: 30 },
    { key: '30_60', label: '30 – 60 phút', min: 30, max: 60 },
    { key: 'gt60', label: 'Trên 60 phút', min: 60, max: null },
];


const findBucketKey = (buckets, currentMin, currentMax) => {
    const norm = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
    const cMin = norm(currentMin);
    const cMax = norm(currentMax);
    const matched = buckets.find((b) => b.min === cMin && b.max === cMax);
    return matched ? matched.key : null;
};


const SelectRow = ({ label, valueLabel, options, selectedKey, onChange, active = false }) => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <TouchableOpacity
                style={[styles.selectRow, active && styles.selectRowActive]}
                activeOpacity={0.7}
                onPress={() => setOpen(true)}>
                {!active && (
                    <Text style={styles.selectRowLabel} numberOfLines={1}>{label}</Text>
                )}
                <View style={[styles.selectRowValueWrap, active && styles.selectRowValueWrapActive]}>
                    <Text
                        style={[styles.selectRowValue, active && styles.selectRowValueActive]}
                        numberOfLines={1}>
                        {valueLabel}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={active ? Colors.primary : Colors.textSecondary} />
                </View>
            </TouchableOpacity>

            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <Pressable style={styles.sheetOverlay} onPress={() => setOpen(false)} />
                <View style={styles.subSheetContainer}>
                    <View style={styles.sheetHandle} />
                    <Text style={styles.sheetSectionTitle}>{label}</Text>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {options.map((option) => {
                            const active = option.key === selectedKey;
                            return (
                                <TouchableOpacity
                                    key={option.key === null ? '__null' : String(option.key)}
                                    style={styles.sheetRow}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        onChange(option.key);
                                        setOpen(false);
                                    }}>
                                    <Text style={[styles.sheetRowText, active && styles.sheetRowTextActive]}>
                                        {option.label}
                                    </Text>
                                    <View style={[styles.radio, active && styles.radioActive]}>
                                        {active && <View style={styles.radioDot} />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </Modal>
        </>
    );
};

const FilterSheet = ({
    visible,
    onClose,
    sortOptions,
    menus,
    chefs = [],
    menuId,
    chefId = null,
    ordering,
    priceMin,
    priceMax,
    prepMin,
    prepMax,
    onSelect,
}) => {

    const formatChefName = (chef) => {
        const full = `${chef.first_name || ''} ${chef.last_name || ''}`.trim();
        return full || chef.username;
    };


    const sortChoices = sortOptions.map((o) => ({ key: o.key, label: o.label }));
    const currentSortLabel = sortChoices.find((o) => o.key === ordering)?.label || 'Mặc định';

    const menuChoices = [
        { key: null, label: 'Tất cả' },
        ...menus.map((m) => ({ key: m.id, label: m.name })),
    ];
    const currentMenuLabel = menuChoices.find((o) => o.key === menuId)?.label || 'Tất cả';

    const chefChoices = [
        { key: null, label: 'Tất cả' },
        ...chefs.map((c) => ({ key: c.id, label: formatChefName(c) })),
    ];
    const currentChefLabel = chefChoices.find((o) => o.key === chefId)?.label || 'Tất cả';

    const priceChoices = PRICE_BUCKETS.map((b) => ({ key: b.key, label: b.label }));
    const currentPriceKey = findBucketKey(PRICE_BUCKETS, priceMin, priceMax) || 'all';
    const currentPriceLabel = PRICE_BUCKETS.find((b) => b.key === currentPriceKey)?.label || 'Tùy chỉnh';

    const prepChoices = PREP_BUCKETS.map((b) => ({ key: b.key, label: b.label }));
    const currentPrepKey = findBucketKey(PREP_BUCKETS, prepMin, prepMax) || 'all';
    const currentPrepLabel = PREP_BUCKETS.find((b) => b.key === currentPrepKey)?.label || 'Tùy chỉnh';

    const orderingActive = !!ordering;
    const priceActive = currentPriceKey !== 'all';
    const prepActive = currentPrepKey !== 'all';
    const menuActive = menuId !== null && menuId !== undefined;
    const chefActive = chefId !== null && chefId !== undefined;
    const hasAnyActive = orderingActive || priceActive || prepActive || menuActive || chefActive;

    const clearAll = () => {
        onSelect({
            ordering: '',
            priceMin: null,
            priceMax: null,
            prepMin: null,
            prepMax: null,
            menuId: null,
            chefId: null,
        });
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.sheetOverlay} onPress={onClose} />
            <View style={styles.sheetContainer}>
                <View style={styles.sheetHandle} />

                <View style={styles.sheetTopBar}>
                    <Text style={styles.sheetTitle}>Bộ lọc</Text>
                    {hasAnyActive && (
                        <TouchableOpacity onPress={clearAll} activeOpacity={0.7} style={styles.clearAllBtn}>
                            <MaterialCommunityIcons name="close-circle-outline" size={16} color={Colors.onPrimary} />
                            <Text style={styles.clearAllText}>Xóa bộ lọc</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    {sortOptions.length > 0 && (
                        <SelectRow
                            label="Sắp xếp"
                            valueLabel={currentSortLabel}
                            options={sortChoices}
                            selectedKey={ordering}
                            onChange={(key) => onSelect({ ordering: key })}
                            active={orderingActive}
                        />
                    )}

                    {menus.length > 0 && (
                        <SelectRow
                            label="Thực đơn"
                            valueLabel={currentMenuLabel}
                            options={menuChoices}
                            selectedKey={menuId}
                            onChange={(key) => onSelect({ menuId: key })}
                            active={menuActive}
                        />
                    )}

                    {chefs.length > 0 && (
                        <SelectRow
                            label="Đầu bếp phụ trách"
                            valueLabel={currentChefLabel}
                            options={chefChoices}
                            selectedKey={chefId}
                            onChange={(key) => onSelect({ chefId: key })}
                            active={chefActive}
                        />
                    )}

                    <View style={styles.dualRow}>
                        <View style={styles.dualCol}>
                            <SelectRow
                                label="Khoảng giá"
                                valueLabel={currentPriceLabel}
                                options={priceChoices}
                                selectedKey={currentPriceKey}
                                onChange={(key) => {
                                    const b = PRICE_BUCKETS.find((x) => x.key === key);
                                    onSelect({ priceMin: b?.min ?? null, priceMax: b?.max ?? null });
                                }}
                                active={priceActive}
                            />
                        </View>
                        <View style={styles.dualCol}>
                            <SelectRow
                                label="Thời gian"
                                valueLabel={currentPrepLabel}
                                options={prepChoices}
                                selectedKey={currentPrepKey}
                                onChange={(key) => {
                                    const b = PREP_BUCKETS.find((x) => x.key === key);
                                    onSelect({ prepMin: b?.min ?? null, prepMax: b?.max ?? null });
                                }}
                                active={prepActive}
                            />
                        </View>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

export default FilterSheet;
