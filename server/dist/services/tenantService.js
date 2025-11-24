"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTenant = exports.addTenant = exports.getAllTenants = exports.getTenantByPhone = void 0;
// In production, this would be a database
const tenants = new Map();
// Initialize with sample tenants
tenants.set('+15551234567', {
    id: 'cafe-downtown',
    businessName: 'Downtown Cafe',
    phoneNumber: '+15551234567',
    menu: {
        'coffee': 4.50,
        'latte': 5.25,
        'sandwich': 8.99,
        'pastry': 3.25
    },
    settings: {
        currency: 'USD',
        timezone: 'America/New_York',
        autoReply: true
    }
});
tenants.set('+15559876543', {
    id: 'pizza-palace',
    businessName: 'Pizza Palace',
    phoneNumber: '+15559876543',
    menu: {
        'pizza': 12.99,
        'wings': 8.50,
        'soda': 2.25,
        'salad': 6.75
    },
    settings: {
        currency: 'USD',
        timezone: 'America/Los_Angeles',
        autoReply: true
    }
});
function getTenantByPhone(phoneNumber) {
    return tenants.get(phoneNumber) || null;
}
exports.getTenantByPhone = getTenantByPhone;
function getAllTenants() {
    return Array.from(tenants.values());
}
exports.getAllTenants = getAllTenants;
function addTenant(tenant) {
    tenants.set(tenant.phoneNumber, tenant);
}
exports.addTenant = addTenant;
function updateTenant(phoneNumber, updates) {
    const tenant = tenants.get(phoneNumber);
    if (!tenant)
        return false;
    tenants.set(phoneNumber, { ...tenant, ...updates });
    return true;
}
exports.updateTenant = updateTenant;
//# sourceMappingURL=tenantService.js.map