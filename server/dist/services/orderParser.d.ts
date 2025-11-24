interface ParsedOrder {
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    total: number;
    isValid: boolean;
    customerName?: string;
    tableNumber?: string;
}
export declare function parseOrder(message: string, menu: Record<string, number>): ParsedOrder;
export {};
//# sourceMappingURL=orderParser.d.ts.map