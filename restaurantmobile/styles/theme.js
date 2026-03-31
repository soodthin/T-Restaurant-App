import { Platform } from 'react-native';
import Colors from './colors';

// Editorial shadow - ambient lighting, not structural
export const editorialShadow = Platform.select({
    ios: {
        shadowColor: '#271816',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.06,
        shadowRadius: 32,
    },
    android: {
        elevation: 4,
    },
    default: {},
});

// Glassmorphic style for floating elements
export const glassmorphic = {
    backgroundColor: Colors.surface + 'CC', // 80% opacity
};

// Lacquered gradient colors (for LinearGradient or manual)
export const lacquerGradient = {
    colors: [Colors.primary, Colors.primaryContainer],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
};

// Border radius presets
export const Radius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    full: 9999,
};

// Spacing scale
export const Space = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
};
