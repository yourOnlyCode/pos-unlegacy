export interface CartItem {
  id: string;
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
  // Find existing item with matching name AND instructions
  const existingItemIndex = cartItems.findIndex(
    cartItem => cartItem.name === item && cartItem.instructions === instructions
  );
  
  if (existingItemIndex >= 0) {
    // Increment quantity if exact match (same name and instructions)
    return cartItems.map((cartItem, index) => 
      index === existingItemIndex 
        ? { ...cartItem, quantity: cartItem.quantity + quantity }
        : cartItem
    );
  } else {
    // Add as new item if no exact match
    const id = `${item}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return [...cartItems, {
      id,
      name: item,
      quantity,
      emoji: itemEmojis[item] || '🍽️',
      instructions
    }];
  }
};

export const removeFromCart = (cartItems: CartItem[], itemId: string): CartItem[] => {
  return cartItems.filter(item => item.id !== itemId);
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