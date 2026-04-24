import { View, Text, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import styles from './styles';

const FilterSheet = ({ visible, onClose, sortOptions, menus, categories, menuId, catId, ordering, onSelect }) => {
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
                </ScrollView>
            </View>
        </Modal>
    );
};

export default FilterSheet;
