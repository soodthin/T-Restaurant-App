import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_STORAGE_KEY = 'customer_cart_items';
const CartContext = createContext(null);

const normalizeDish = (dish) => ({
    id: dish.id,
    name: dish.name,
    price: Number(dish.price) || 0,
    image: dish.image || null,
    preparation_time: dish.preparation_time || 0,
    avg_rating: Number(dish.avg_rating) || 0,
    review_count: Number(dish.review_count) || 0,
    chef_name: dish.chef_name || '',
    quantity: 1,
});

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState([]);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        const loadCart = async () => {
            try {
                const rawCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
                if (rawCart) {
                    setItems(JSON.parse(rawCart));
                }
            } catch (err) {
                setItems([]);
            } finally {
                setHydrated(true);
            }
        };
        loadCart();
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }, [hydrated, items]);

    const addItem = (dish, quantity = 1) => {
        const normalizedDish = normalizeDish(dish);
        setItems((prev) => {
            const existing = prev.find((item) => item.id === normalizedDish.id);
            if (existing) {
                return prev.map((item) => item.id === normalizedDish.id
                    ? { ...item, quantity: item.quantity + quantity }
                    : item);
            }
            return [...prev, { ...normalizedDish, quantity }];
        });
    };

    const updateQuantity = (dishId, quantity) => {
        setItems((prev) => prev.flatMap((item) => {
            if (item.id !== dishId) return [item];
            if (quantity <= 0) return [];
            return [{ ...item, quantity }];
        }));
    };

    const removeItem = (dishId) => {
        setItems((prev) => prev.filter((item) => item.id !== dishId));
    };

    const clearCart = () => {
        setItems([]);
    };

    const value = {
        items,
        hydrated,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
