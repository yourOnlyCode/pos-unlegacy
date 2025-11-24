interface ParsedOrder {
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  isValid: boolean;
}

export function parseOrder(message: string, menu: Record<string, number>): ParsedOrder {
  const text = message.toLowerCase().trim();
  const items: Array<{ name: string; quantity: number; price: number }> = [];
  
  // Pattern: "2 coffee", "1 sandwich", etc.
  const patterns = [
    /(\d+)\s+(coffee|latte|cappuccino)/g,
    /(\d+)\s+(sandwich|bagel)/g,
    /(\d+)\s+(pastry|muffin)/g,
  ];

  // Try all patterns
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const quantity = parseInt(match[1]);
      const itemName = match[2];
      const price = menu[itemName];
      
      if (price) {
        items.push({ name: itemName, quantity, price });
      }
    }
  }

  // Alternative: look for menu items with optional quantities
  Object.keys(menu).forEach(item => {
    if (text.includes(item) && !items.find(i => i.name === item)) {
      // Default to quantity 1 if no number specified
      const quantityMatch = text.match(new RegExp(`(\\d+)\\s*${item}`));
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
      items.push({ name: item, quantity, price: menu[item] });
    }
  });

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  return {
    items,
    total,
    isValid: items.length > 0
  };
}