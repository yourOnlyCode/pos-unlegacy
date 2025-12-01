export interface CartItem {
  name: string;
  quantity: number;
  emoji: string;
  instructions?: string;
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
  quantity: number,
  instructions?: string
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
      emoji: itemEmojis[item] || '🍽️',
      instructions
    }];
  }
};

export const removeFromCart = (cartItems: CartItem[], itemName: string): CartItem[] => {
  return cartItems.filter(item => item.name !== itemName);
};

export const formatCartOrder = (cartItems: CartItem[]): string => {
  return cartItems
    .map(item => {
      let text = `${item.quantity} ${item.name}`;
      if (item.instructions) {
        text += ` ${item.instructions}`;
      }
      return text;
    })
    .join(', ');
};