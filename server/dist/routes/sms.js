"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const twilio_1 = __importDefault(require("twilio"));
const orderParser_1 = require("../services/orderParser");
const tenantService_1 = require("../services/tenantService");
const router = express_1.default.Router();
const client = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
// In-memory storage for demo (use database in production)
const orders = new Map();
// Webhook endpoint for incoming SMS
router.post('/webhook', (req, res) => {
    const { Body, From, To } = req.body;
    const customerPhone = From;
    const businessPhone = To;
    const message = Body;
    console.log(`SMS from ${customerPhone} to ${businessPhone}: ${message}`);
    // Find the tenant/business by phone number
    const tenant = (0, tenantService_1.getTenantByPhone)(businessPhone);
    if (!tenant) {
        console.error(`No tenant found for phone: ${businessPhone}`);
        return res.status(200).send('OK');
    }
    // Parse the order with tenant's menu
    const parsedOrder = (0, orderParser_1.parseOrder)(message, tenant.menu);
    if (!parsedOrder.isValid) {
        // Send help message
        sendSMS(customerPhone, "Sorry, I couldn't understand your order. Try: '2 coffee, 1 sandwich' or text 'menu' for options.");
        return res.status(200).send('OK');
    }
    // Generate order ID
    const orderId = Date.now().toString();
    // Store order as pending payment
    orders.set(orderId, {
        id: orderId,
        customerPhone,
        businessPhone: businessPhone,
        tenant: tenant,
        items: parsedOrder.items,
        total: parsedOrder.total,
        customerName: parsedOrder.customerName,
        tableNumber: parsedOrder.tableNumber,
        status: 'awaiting_payment',
        createdAt: new Date()
    });
    // Create payment link
    const paymentLink = `${process.env.BASE_URL || 'http://localhost:3000'}/pay/${orderId}`;
    // Format order summary
    const itemsList = parsedOrder.items
        .map(item => `${item.quantity}x ${item.name} ($${(item.price * item.quantity).toFixed(2)})`)
        .join(', ');
    let response;
    if (!tenant.stripeAccountId) {
        response = `Sorry, ${tenant.businessName} hasn't completed their payment setup yet. Please try again later or call directly.`;
    }
    else {
        response = `Order ready for payment:\n\n${itemsList}\nTotal: $${parsedOrder.total.toFixed(2)}\n\nPay now: ${paymentLink}\n\n⚠️ Order will only be sent to ${tenant.businessName} after payment is confirmed.`;
    }
    sendSMS(customerPhone, response);
    res.status(200).send('OK');
});
// Handle menu requests
router.post('/webhook', (req, res) => {
    const { Body, From } = req.body;
    if (Body.toLowerCase().includes('menu')) {
        const menuText = `Menu:\n☕ Coffee - $4.50\n🥪 Sandwich - $8.99\n🧁 Pastry - $3.25\n☕ Latte - $5.25\n☕ Cappuccino - $4.75\n🧁 Muffin - $2.99\n🥯 Bagel - $3.50\n\nText your order like: "2 coffee, 1 sandwich"`;
        sendSMS(From, menuText);
        return res.status(200).send('OK');
    }
});
// Get order details for payment page
router.get('/order/:id', (req, res) => {
    const order = orders.get(req.params.id);
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
});
// Update order status after payment
router.post('/order/:id/paid', (req, res) => {
    const order = orders.get(req.params.id);
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    order.status = 'paid';
    orders.set(req.params.id, order);
    // Send confirmation SMS
    sendSMS(order.customerPhone, `Payment received! Order #${order.id}`);
    res.json({ success: true });
});
async function sendSMS(to, message) {
    try {
        await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to
        });
        console.log(`SMS sent to ${to}: ${message}`);
    }
    catch (error) {
        console.error('Failed to send SMS:', error);
    }
}
exports.default = router;
//# sourceMappingURL=sms.js.map