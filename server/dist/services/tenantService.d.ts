interface Tenant {
    id: string;
    businessName: string;
    phoneNumber: string;
    menu: Record<string, number>;
    stripeAccountId?: string;
    settings: {
        currency: string;
        timezone: string;
        autoReply: boolean;
    };
}
export declare function getTenantByPhone(phoneNumber: string): Tenant | null;
export declare function getAllTenants(): Tenant[];
export declare function addTenant(tenant: Tenant): void;
export declare function updateTenant(phoneNumber: string, updates: Partial<Tenant>): boolean;
export {};
//# sourceMappingURL=tenantService.d.ts.map