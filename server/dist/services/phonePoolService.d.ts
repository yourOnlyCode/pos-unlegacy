export declare function assignPhoneNumber(businessId: string): Promise<string | null>;
export declare function releasePhoneNumber(businessId: string): Promise<boolean>;
export declare function getPurchasedNumbers(): Array<{
    number: string;
    businessId: string;
    purchasedAt: Date;
}>;
export declare function getNumberByBusiness(businessId: string): string | null;
//# sourceMappingURL=phonePoolService.d.ts.map