"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOrder = void 0;
function parseOrder(message, menu) {
    const text = message.toLowerCase().trim();
    const originalText = message.trim();
    const items = [];
    // Extract customer name ("for John" or "name: Sarah")
    let customerName;
    const namePatterns = [
        /(?:for|name:?)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i,
        /^([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s*[-:]/, // "John: 2 coffee"
    ];
    for (const pattern of namePatterns) {
        const match = originalText.match(pattern);
        if (match) {
            customerName = match[1].trim();
            break;
        }
    }
    // Extract table number ("table 5" or "#3")
    let tableNumber;
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
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return {
        items,
        total,
        isValid: items.length > 0,
        customerName,
        tableNumber
    };
}
exports.parseOrder = parseOrder;
//# sourceMappingURL=orderParser.js.map