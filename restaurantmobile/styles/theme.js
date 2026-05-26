import { Platform } from 'react-native';
import { MD3LightTheme } from 'react-native-paper';
import Colors from './colors';


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


export const glassmorphic = {
    backgroundColor: Colors.surface + 'CC',
};


export const lacquerGradient = {
    colors: [Colors.primary, Colors.primaryContainer],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
};


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


export const Space = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
};


export const paperTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: Colors.primary,
        onPrimary: Colors.onPrimary,
        primaryContainer: Colors.primaryContainer,
        surface: Colors.surface,
        surfaceVariant: Colors.surfaceContainerHigh,
        onSurface: Colors.onSurface,
        onSurfaceVariant: Colors.onSurfaceVariant,
        outline: Colors.outlineVariant,
        outlineVariant: Colors.outline,
        error: Colors.error,
        background: Colors.surface,
        elevation: {
            level0: 'transparent',
            level1: Colors.surfaceContainerLow,
            level2: Colors.surfaceContainerHigh,
            level3: Colors.surfaceContainerHigh,
            level4: Colors.surfaceDim,
            level5: Colors.surfaceDim,
        },
    },
    roundness: 16,
};
