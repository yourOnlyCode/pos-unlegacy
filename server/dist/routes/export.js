"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tenantService_1 = require("../services/tenantService");
const router = express_1.default.Router();
// In production, replace with actual database queries
const orders = new Map();
// Export all business data as JSON
router.get('/business/:businessId/export', async (req, res) => {
    try {
        const { businessId } = req.params;
        const { format = 'json' } = req.query;
        // Get business data
        const business = (0, tenantService_1.getAllTenants)().find(t => t.id === businessId);
        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }
        // Get all orders for this business
        const businessOrders = Array.from(orders.values())
            .filter(order => order.tenant?.id === businessId);
        // Calculate analytics
        const analytics = {
            totalOrders: businessOrders.length,
            totalRevenue: businessOrders.reduce((sum, order) => sum + order.total, 0),
            averageOrderValue: businessOrders.length > 0
                ? businessOrders.reduce((sum, order) => sum + order.total, 0) / businessOrders.length
                : 0,
            topItems: getTopItems(businessOrders),
            ordersByDay: getOrdersByDay(businessOrders)
        };
        const exportData = {
            exportInfo: {
                businessId,
                businessName: business.businessName,
                exportDate: new Date().toISOString(),
                dataVersion: '1.0'
            },
            business: {
                id: business.id,
                name: business.businessName,
                phoneNumber: business.phoneNumber,
                menu: business.menu,
                settings: business.settings,
                stripeAccountId: business.stripeAccountId
            },
            orders: businessOrders.map(order => ({
                id: order.id,
                items: order.items,
                total: order.total,
                customerName: order.customerName,
                tableNumber: order.tableNumber,
                customerPhone: order.customerPhone,
                status: order.status,
                createdAt: order.createdAt
            })),
            analytics
        };
        if (format === 'csv') {
            return exportAsCSV(res, exportData);
        }
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${businessId}-backup-${Date.now()}.json"`);
        res.json(exportData);
    }
    catch (error) {
        res.status(500).json({ error: 'Export failed' });
    }
});
// Auto-backup endpoint (called daily)
router.post('/business/:businessId/auto-backup', async (req, res) => {
    try {
        const { businessId } = req.params;
        // In production, save to cloud storage (S3, etc.)
        const backupData = await generateBackup(businessId);
        // Store backup with timestamp
        const backupId = `${businessId}-${Date.now()}`;
        res.json({
            backupId,
            size: JSON.stringify(backupData).length,
            createdAt: new Date().toISOString(),
            downloadUrl: `/api/export/business/${businessId}/download/${backupId}`
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Auto-backup failed' });
    }
});
// List available backups
router.get('/business/:businessId/backups', async (req, res) => {
    try {
        const { businessId } = req.params;
        // In production, list from cloud storage
        const mockBackups = [
            {
                id: `${businessId}-${Date.now() - 86400000}`,
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                size: '2.4 MB',
                type: 'auto'
            },
            {
                id: `${businessId}-${Date.now() - 172800000}`,
                createdAt: new Date(Date.now() - 172800000).toISOString(),
                size: '2.1 MB',
                type: 'manual'
            }
        ];
        res.json({ backups: mockBackups });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to list backups' });
    }
});
function getTopItems(orders) {
    const itemCounts = {};
    orders.forEach(order => {
        order.items?.forEach((item) => {
            itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
        });
    });
    return Object.entries(itemCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count: count }));
}
function getOrdersByDay(orders) {
    const dayGroups = {};
    orders.forEach(order => {
        if (order.createdAt) {
            const day = new Date(order.createdAt).toISOString().split('T')[0];
            dayGroups[day] = (dayGroups[day] || 0) + 1;
        }
    });
    return dayGroups;
}
function exportAsCSV(res, data) {
    const csvRows = [
        'Order ID,Date,Customer Name,Table,Phone,Items,Total,Status',
        ...data.orders.map((order) => {
            const items = order.items.map((item) => `${item.quantity}x ${item.name}`).join('; ');
            return [
                order.id,
                new Date(order.createdAt).toLocaleDateString(),
                order.customerName || '',
                order.tableNumber || '',
                order.customerPhone,
                `"${items}"`,
                order.total,
                order.status
            ].join(',');
        })
    ];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${data.exportInfo.businessId}-orders.csv"`);
    res.send(csvRows.join('\n'));
}
async function generateBackup(businessId) {
    // Same logic as export endpoint
    return { businessId, timestamp: Date.now() };
}
exports.default = router;
//# sourceMappingURL=export.js.map