import { distance } from 'fastest-levenshtein';

interface ParsedOrder {
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  isValid: boolean;
  customerName?: string;
  tableNumber?: string;
  errorMessage?: string;
  hasFuzzyMatches?: boolean;
}

export function parseOrder(message: string, menu: Record<string, number>): ParsedOrder {
  const text = message.toLowerCase().trim();
  const originalText = message.trim();
  const items: Array<{ name: string; quantity: number; price: number }> = [];
  
  // Extract customer name ("for John" or "name: Sarah")
  let customerName: string | undefined;
  const namePatterns = [
    /(?:for|name:?)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i, // "for John" or "name John"
    /^([a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s*,/, // "Philip, two bagels please" or "Mary Ann, 2 coffee"
    /^([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s*[-:]/, // "John: 2 coffee" or "John - 2 coffee"
  ];
  
  for (const pattern of namePatterns) {
    const match = originalText.match(pattern);
    if (match) {
      customerName = match[1].trim();
      break;
    }
  }
  if (customerName) {
    console.log('[orderParser] Extracted customerName:', customerName);
  } else {
    console.log('[orderParser] No customerName extracted from message:', originalText);
  }
  
  // Extract table number ("table 5" or "#3")
  let tableNumber: string | undefined;
  const tablePatterns = [
    /table\s*(\d+)/i,
    /#(\d+)/,
    /(?:table|tbl)\s*([a-zA-Z]?\d+[a-zA-Z]?)/i,
  ];
  
  for (const pattern of tablePatterns) {
    const match = text.match(pattern);
    if (match) {
      tableNumber = match[1];
      break;
    }
  }
  
  // Create dynamic patterns based on menu items
  const menuItemNames = Object.keys(menu).join('|');
  const patterns = [
    new RegExp(`(\\d+)\\s+(${menuItemNames})`, 'gi'),
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

  // Fuzzy matching: if no exact matches found, try fuzzy matching with Levenshtein distance
  let hasFuzzyMatches = false;
  if (items.length === 0) {
    const words = text.split(/[\s,]+/);
    const menuItems = Object.keys(menu);
    
    for (const word of words) {
      // Skip very short words, numbers, and common words
      if (word.length < 3 || /^\d+$/.test(word) || ['and', 'the', 'for', 'please', 'thanks'].includes(word)) {
        continue;
      }
      
      // Find closest menu item match
      let bestMatch: string | null = null;
      let bestDistance = Infinity;
      
      for (const menuItem of menuItems) {
        const dist = distance(word, menuItem);
        const threshold = Math.ceil(menuItem.length * 0.3); // Allow 30% error
        
        if (dist < bestDistance && dist <= threshold) {
          bestDistance = dist;
          bestMatch = menuItem;
        }
      }
      
      if (bestMatch) {
        // Look for quantity near this word
        const wordIndex = words.indexOf(word);
        let quantity = 1;
        
        // Check previous word for number or word number
        if (wordIndex > 0) {
          const prevWord = words[wordIndex - 1];
          const numMatch = prevWord.match(/\d+/);
          if (numMatch) {
            quantity = parseInt(numMatch[0]);
          } else {
            // Word numbers: one, two, three, etc.
            const wordNumbers: Record<string, number> = {
              'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
              'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
            };
            if (wordNumbers[prevWord]) {
              quantity = wordNumbers[prevWord];
            }
          }
        }
        
        // Only add if not already found
        if (!items.find(i => i.name === bestMatch)) {
          items.push({ name: bestMatch, quantity, price: menu[bestMatch] });
          hasFuzzyMatches = true;
        }
      }
    }
  }

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Generate error message if parsing still failed
  let errorMessage: string | undefined;
  if (items.length === 0) {
    errorMessage = "I couldn't understand your order. Please use this format:\n\n" +
      "[Your Name or Table #] [Quantity] [Item]\n\n" +
      "Examples:\n" +
      "• John 2 coffee, 1 bagel\n" +
      "• Table 5: 1 latte, 2 muffins\n" +
      "• Sarah - 3 sandwiches\n\n" +
      "Text 'menu' to see available items.";
  }
  
  return {
    items,
    total,
    isValid: items.length > 0,
    customerName,
    tableNumber,
    errorMessage,
    hasFuzzyMatches
  };
}