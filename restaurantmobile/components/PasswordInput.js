import { useState } from 'react';
import { TextInput } from 'react-native-paper';
import Colors from '@styles/colors';

const PasswordInput = ({ value, onChangeText, placeholder }) => {
    const [show, setShow] = useState(false);

    return (
        <TextInput
            mode="outlined"
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder || '••••••••'}
            placeholderTextColor={Colors.placeholder}
            secureTextEntry={!show}
            left={<TextInput.Icon icon="lock-outline" color={Colors.textSecondary} />}
            right={
                <TextInput.Icon
                    icon={show ? 'eye-off-outline' : 'eye-outline'}
                    color={Colors.textSecondary}
                    onPress={() => setShow(!show)}
                />
            }
            outlineStyle={{ borderRadius: 16, borderColor: Colors.outline, borderWidth: 1.5 }}
            style={{ backgroundColor: Colors.surfaceContainerLowest, marginBottom: 16, fontSize: 16 }}
            textColor={Colors.text}
            activeOutlineColor={Colors.primary}
        />
    );
};

export default PasswordInput;
