import { useEffect, useRef } from 'react';
import { Animated as RNAnimated, View } from 'react-native';

/**
 * Animated wrapper components using React Native's built-in Animated API.
 * Drop-in replacements for react-native-reanimated layout animations.
 */

// FadeInDown: fades in while sliding up from below
export const FadeInDown = ({ delay = 0, duration = 500, distance = 30, style, children }) => {
    const opacity = useRef(new RNAnimated.Value(0)).current;
    const translateY = useRef(new RNAnimated.Value(distance)).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            RNAnimated.parallel([
                RNAnimated.timing(opacity, { toValue: 1, duration, useNativeDriver: true }),
                RNAnimated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }),
            ]).start();
        }, delay);
        return () => clearTimeout(timer);
    }, []);

    return (
        <RNAnimated.View style={[style, { opacity, transform: [{ translateY }] }]}>
            {children}
        </RNAnimated.View>
    );
};

// FadeInUp: fades in while sliding down from above
export const FadeInUp = ({ delay = 0, duration = 500, distance = 30, style, children }) => {
    const opacity = useRef(new RNAnimated.Value(0)).current;
    const translateY = useRef(new RNAnimated.Value(-distance)).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            RNAnimated.parallel([
                RNAnimated.timing(opacity, { toValue: 1, duration, useNativeDriver: true }),
                RNAnimated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }),
            ]).start();
        }, delay);
        return () => clearTimeout(timer);
    }, []);

    return (
        <RNAnimated.View style={[style, { opacity, transform: [{ translateY }] }]}>
            {children}
        </RNAnimated.View>
    );
};

// FadeInRight: fades in while sliding from right
export const FadeInRight = ({ delay = 0, duration = 400, distance = 40, style, children }) => {
    const opacity = useRef(new RNAnimated.Value(0)).current;
    const translateX = useRef(new RNAnimated.Value(distance)).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            RNAnimated.parallel([
                RNAnimated.timing(opacity, { toValue: 1, duration, useNativeDriver: true }),
                RNAnimated.spring(translateX, { toValue: 0, useNativeDriver: true, damping: 16, stiffness: 200 }),
            ]).start();
        }, delay);
        return () => clearTimeout(timer);
    }, []);

    return (
        <RNAnimated.View style={[style, { opacity, transform: [{ translateX }] }]}>
            {children}
        </RNAnimated.View>
    );
};

// FadeIn: simple opacity fade
export const FadeIn = ({ delay = 0, duration = 400, style, children }) => {
    const opacity = useRef(new RNAnimated.Value(0)).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            RNAnimated.timing(opacity, { toValue: 1, duration, useNativeDriver: true }).start();
        }, delay);
        return () => clearTimeout(timer);
    }, []);

    return (
        <RNAnimated.View style={[style, { opacity }]}>
            {children}
        </RNAnimated.View>
    );
};

// ScaleIn: zoom in with fade
export const ScaleIn = ({ delay = 0, duration = 400, style, children }) => {
    const opacity = useRef(new RNAnimated.Value(0)).current;
    const scale = useRef(new RNAnimated.Value(0.85)).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            RNAnimated.parallel([
                RNAnimated.timing(opacity, { toValue: 1, duration, useNativeDriver: true }),
                RNAnimated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 300 }),
            ]).start();
        }, delay);
        return () => clearTimeout(timer);
    }, []);

    return (
        <RNAnimated.View style={[style, { opacity, transform: [{ scale }] }]}>
            {children}
        </RNAnimated.View>
    );
};

// Stagger helper: calculates delay for list items
export const stagger = (index, baseDelay = 60) => baseDelay * index;
