import { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../styles/colors';

const PasswordInput = ({ value, onChangeText, placeholder }) => {
    const [show, setShow] = useState(false);

    return (
        <View style={styles.wrap}>
            <MaterialCommunityIcons name="lock-outline" size={20} color={Colors.textSecondary} style={styles.leadingIcon} />
            <TextInput
                style={styles.input}
                placeholder={placeholder || '••••••••'}
                placeholderTextColor={Colors.placeholder}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={!show}
            />
            <TouchableOpacity style={styles.toggle} onPress={() => setShow(!show)}>
                <MaterialCommunityIcons
                    name={show ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={Colors.textSecondary}
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: Colors.outline,
    },
    leadingIcon: { marginLeft: 16 },
    input: { flex: 1, paddingVertical: 16, paddingHorizontal: 12, fontSize: 16, color: Colors.text },
    toggle: { paddingHorizontal: 14 },
});

export default PasswordInput;
