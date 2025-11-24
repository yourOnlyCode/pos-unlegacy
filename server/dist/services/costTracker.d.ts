interface CostSummary {
    totalNumbers: number;
    monthlyCost: number;
    dailyCost: number;
    businesses: Array<{
        businessId: string;
        phoneNumber: string;
        monthlyCost: number;
        purchasedAt: Date;
    }>;
}
export declare function calculateCosts(): CostSummary;
export declare function projectedSavings(businessesToCancel: string[]): number;
export {};
//# sourceMappingURL=costTracker.d.ts.map