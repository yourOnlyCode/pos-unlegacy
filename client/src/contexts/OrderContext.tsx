/**
 * Order Context
 * Centralized state management for ordering flow
 */

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CartItem } from '../ordering-helpers/cartHelpers';
import { Message } from '../ordering-helpers/messageHelpers';

interface OrderContextValue {
  // Cart state
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  
  // Message state
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  
  // UI state
  cartExpanded: boolean;
  setCartExpanded: (expanded: boolean) => void;
  
  // Order state
  currentOrderId: string | null;
  setCurrentOrderId: (orderId: string | null) => void;
}

const OrderContext = createContext<OrderContextValue | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [cartExpanded, setCartExpanded] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const addToCart = useCallback((item: CartItem) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(
        i => i.id === item.id && 
        JSON.stringify(i.modifications) === JSON.stringify(item.modifications)
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + item.quantity
        };
        return updated;
      }

      return [...prev, item];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const value: OrderContextValue = {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    cartTotal,
    messages,
    addMessage,
    clearMessages,
    cartExpanded,
    setCartExpanded,
    currentOrderId,
    setCurrentOrderId,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}
