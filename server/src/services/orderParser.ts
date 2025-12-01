import { distance } from 'fastest-levenshtein';

export interface ParsedOrder {
  items: Array<{ name: string; quantity: number; price: number; modifications?: string[] }>;
  total: number;
  isValid: boolean;
  customerName?: string;
  tableNumber?: string;
  errorMessage?: string;
  hasFuzzyMatches?: boolean;
}

function extractCustomerName(text: string): string | undefined {
  const namePatterns = [
    /(?:for|name:?)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i,
    /^([a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s*,/,
    /^([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s*[-:]/,
  ];
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return undefined;
}

function extractTableNumber(text: string): string | undefined {
  const tablePatterns = [
    /table\s*(\d+)/i,
    /#(\d+)/,
    /(?:table|tbl)\s*([a-zA-Z]?\d+[a-zA-Z]?)/i,
  ];
  
  for (const pattern of tablePatterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return undefined;
}

function parseExactMatches(text: string, menu: Record<string, { price: number; image?: string } | number>): Array<{ name: string; quantity: number; price: number; modifications?: string[] }> {
  const items: Array<{ name: string; quantity: number; price: number; modifications?: string[] }> = [];
  
  // Split by commas to handle individual items with modifications
  const itemSegments = text.split(',').map(s => s.trim());
  
  for (const segment of itemSegments) {
    const menuItems = Object.keys(menu);
    let foundItem = null;
    let quantity = 1;
    
    // Find menu item in this segment
    for (const menuItem of menuItems) {
      if (segment.includes(menuItem)) {
        foundItem = menuItem;
        // Extract quantity
        const quantityMatch = segment.match(new RegExp(`(\\d+)\\s*${menuItem}`));
        if (quantityMatch) {
          quantity = parseInt(quantityMatch[1]);
        }
        break;
      }
    }
    
    if (foundItem) {
      const modifications = extractModifications(segment, foundItem);
      const menuItem = menu[foundItem];
      const price = typeof menuItem === 'number' ? menuItem : menuItem.price;
      items.push({ 
        name: foundItem, 
        quantity, 
        price,
        modifications: modifications.length > 0 ? modifications : undefined
      });
    }
  }

  return items;
}

function extractModifications(segment: string, itemName: string): string[] {
  const modifications: string[] = [];
  
  // Find item position to extract modifications near it
  const itemIndex = segment.toLowerCase().indexOf(itemName.toLowerCase());
  if (itemIndex === -1) return modifications;
  
  // Look for modifications in a window around the item
  const beforeItem = segment.substring(0, itemIndex);
  const afterItem = segment.substring(itemIndex + itemName.length);
  const context = beforeItem + ' ' + afterItem;
  
  const modPatterns = [
    /no\s+(\w+)/gi,
    /without\s+(\w+)/gi,
    /extra\s+(\w+)/gi,
    /add\s+(\w+)/gi,
    /light\s+(\w+)/gi,
    /heavy\s+(\w+)/gi,
    /on\s+the\s+side/gi,
    /well\s+done/gi,
    /medium\s+rare/gi
  ];
  
  for (const pattern of modPatterns) {
    let match;
    while ((match = pattern.exec(context)) !== null) {
      modifications.push(match[0].trim());
    }
  }
  
  return modifications;
}

function parseFuzzyMatches(text: string, menu: Record<string, { price: number; image?: string } | number>): { items: Array<{ name: string; quantity: number; price: number; modifications?: string[] }>; hasFuzzy: boolean } {
  const items: Array<{ name: string; quantity: number; price: number; modifications?: string[] }> = [];
  const words = text.split(/[\s,]+/);
  const menuItems = Object.keys(menu);
  const wordNumbers: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
  };
  
  for (const word of words) {
    if (word.length < 3 || /^\d+$/.test(word) || ['and', 'the', 'for', 'please', 'thanks'].includes(word)) {
      continue;
    }
    
    let bestMatch: string | null = null;
    let bestDistance = Infinity;
    
    for (const menuItem of menuItems) {
      const dist = distance(word, menuItem);
      const threshold = Math.ceil(menuItem.length * 0.3);
      
      if (dist < bestDistance && dist <= threshold) {
        bestDistance = dist;
        bestMatch = menuItem;
      }
    }
    
    if (bestMatch && !items.find(i => i.name === bestMatch)) {
      const wordIndex = words.indexOf(word);
      let quantity = 1;
      
      if (wordIndex > 0) {
        const prevWord = words[wordIndex - 1];
        const numMatch = prevWord.match(/\d+/);
        if (numMatch) {
          quantity = parseInt(numMatch[0]);
        } else if (wordNumbers[prevWord]) {
          quantity = wordNumbers[prevWord];
        }
      }
      
      const wordSegment = words.slice(Math.max(0, wordIndex - 3), wordIndex + 2).join(' ');
      const modifications = extractModifications(wordSegment, bestMatch);
      const menuItem = menu[bestMatch];
      const price = typeof menuItem === 'number' ? menuItem : menuItem.price;
      items.push({ 
        name: bestMatch, 
        quantity, 
        price,
        modifications: modifications.length > 0 ? modifications : undefined
      });
    }
  }
  
  return { items, hasFuzzy: items.length > 0 };
}

export function parseOrder(message: string, menu: Record<string, { price: number; image?: string } | number>): ParsedOrder {
  const text = message.toLowerCase().trim();
  const originalText = message.trim();
  
  const customerName = extractCustomerName(originalText);
  const tableNumber = extractTableNumber(text);
  
  let items = parseExactMatches(text, menu);
  let hasFuzzyMatches = false;
  
  if (items.length === 0) {
    const fuzzyResult = parseFuzzyMatches(text, menu);
    items = fuzzyResult.items;
    hasFuzzyMatches = fuzzyResult.hasFuzzy;
  }

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
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