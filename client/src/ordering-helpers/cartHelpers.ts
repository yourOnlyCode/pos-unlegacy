export interface CartItem {
  name: string;
  quantity: number;
  emoji: string;
}

export const itemEmojis: Record<string, string> = {
  coffee: '☕',
  latte: '☕',
  cappuccino: '☕',
  sandwich: '🥪',
  bagel: '🥯',
  pastry: '🧁',
  muffin: '🧁',
};

export const addToCart = (
  cartItems: CartItem[],
  item: string,
  quantity: number
): CartItem[] => {
  const existingItemIndex = cartItems.findIndex(cartItem => cartItem.name === item);
  
  if (existingItemIndex >= 0) {
    return cartItems.map((cartItem, index) => 
      index === existingItemIndex 
        ? { ...cartItem, quantity: cartItem.quantity + quantity }
        : cartItem
    );
  } else {
    return [...cartItems, {
      name: item,
      quantity,
      emoji: itemEmojis[item] || '🍽️'
    }];
  }
};

export const removeFromCart = (cartItems: CartItem[], itemName: string): CartItem[] => {
  return cartItems.filter(item => item.name !== itemName);
};

export const formatCartOrder = (cartItems: CartItem[]): string => {
  return cartItems
    .map(item => `${item.quantity} ${item.name}`)
    .join(', ');
};