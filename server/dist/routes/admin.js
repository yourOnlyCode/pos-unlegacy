"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tenantService_1 = require("../services/tenantService");
const phonePoolService_1 = require("../services/phonePoolService");
const costTracker_1 = require("../services/costTracker");
const router = express_1.default.Router();
// Get all tenants
router.get('/tenants', (req, res) => {
    const tenants = (0, tenantService_1.getAllTenants)();
    res.json(tenants);
});
// Get tenant by phone
router.get('/tenants/:phone', (req, res) => {
    const tenant = (0, tenantService_1.getTenantByPhone)(req.params.phone);
    if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
    }
    res.json(tenant);
});
// Add new tenant with auto-assigned phone number
router.post('/tenants', async (req, res) => {
    const { id, businessName, menu, settings, email } = req.body;
    if (!id || !businessName || !menu || !email) {
        return res.status(400).json({ error: 'Missing required fields (id, businessName, menu, email)' });
    }
    // Auto-assign phone number from pool
    const phoneNumber = await (0, phonePoolService_1.assignPhoneNumber)(id);
    if (!phoneNumber) {
        return res.status(500).json({ error: 'No phone numbers available' });
    }
    const tenant = {
        id,
        businessName,
        phoneNumber,
        menu,
        settings: settings || {
            currency: 'USD',
            timezone: 'America/New_York',
            autoReply: true
        }
    };
    (0, tenantService_1.addTenant)(tenant);
    // Return tenant info with next step for Stripe Connect
    res.status(201).json({
        ...tenant,
        nextStep: {
            action: 'create_stripe_account',
            endpoint: '/api/connect/create-account',
            data: { businessId: id, businessName, email, phoneNumber }
        }
    });
});
// Get all purchased phone numbers with cost breakdown
router.get('/phone-numbers', (req, res) => {
    const costSummary = (0, costTracker_1.calculateCosts)();
    res.json(costSummary);
});
// Get cost dashboard
router.get('/costs', (req, res) => {
    const costs = (0, costTracker_1.calculateCosts)();
    res.json({
        summary: {
            totalNumbers: costs.totalNumbers,
            monthlyBill: `$${costs.monthlyCost.toFixed(2)}`,
            dailyCost: `$${costs.dailyCost.toFixed(2)}`,
            costPerBusiness: '$1.00/month'
        },
        businesses: costs.businesses
    });
});
// Cancel business and release phone number
router.delete('/tenants/:businessId', async (req, res) => {
    const { businessId } = req.params;
    const phoneNumber = (0, phonePoolService_1.getNumberByBusiness)(businessId);
    if (!phoneNumber) {
        return res.status(404).json({ error: 'Business not found' });
    }
    const released = await (0, phonePoolService_1.releasePhoneNumber)(businessId);
    if (released) {
        res.json({
            message: 'Business cancelled and phone number released',
            phoneNumber,
            monthlySavings: '$1.00'
        });
    }
    else {
        res.status(500).json({ error: 'Failed to release phone number' });
    }
});
// Update tenant
router.put('/tenants/:phone', (req, res) => {
    const success = (0, tenantService_1.updateTenant)(req.params.phone, req.body);
    if (!success) {
        return res.status(404).json({ error: 'Tenant not found' });
    }
    const updatedTenant = (0, tenantService_1.getTenantByPhone)(req.params.phone);
    res.json(updatedTenant);
});
exports.default = router;
//# sourceMappingURL=admin.js.map