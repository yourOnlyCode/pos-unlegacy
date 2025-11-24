"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stripe_1 = __importDefault(require("stripe"));
const tenantService_1 = require("../services/tenantService");
const router = express_1.default.Router();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-11-17.clover',
});
// Stripe webhook for payment confirmations
router.post('/stripe', express_1.default.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        console.log('Webhook signature verification failed:', err);
        return res.status(400).send('Webhook Error');
    }
    // Handle successful payment
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        // Get order details from metadata
        const orderId = paymentIntent.metadata.orderId;
        const businessPhone = paymentIntent.metadata.businessPhone;
        const customerPhone = paymentIntent.metadata.customerPhone;
        const orderDetails = paymentIntent.metadata.orderDetails;
        const customerName = paymentIntent.metadata.customerName;
        const tableNumber = paymentIntent.metadata.tableNumber;
        if (orderId && businessPhone && customerPhone && orderDetails) {
            // Notify business of paid order
            notifyBusinessOfOrder(businessPhone, orderId, orderDetails, customerPhone, customerName, tableNumber);
            // Send confirmation to customer
            sendCustomerConfirmation(customerPhone, orderId);
        }
    }
    res.json({ received: true });
});
async function notifyBusinessOfOrder(businessPhone, orderId, orderDetails, customerPhone, customerName, tableNumber) {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const tenant = (0, tenantService_1.getTenantByPhone)(businessPhone);
    if (!tenant)
        return;
    // Build customer info line
    let customerInfo = `Phone: ${customerPhone}`;
    if (customerName || tableNumber) {
        const nameInfo = customerName ? `Name: ${customerName}` : '';
        const tableInfo = tableNumber ? `Table: ${tableNumber}` : '';
        const extraInfo = [nameInfo, tableInfo].filter(Boolean).join(' | ');
        customerInfo = `${extraInfo}\n${customerInfo}`;
    }
    const message = `🔔 NEW PAID ORDER #${orderId}

${orderDetails}

${customerInfo}
Status: PAID ✅

Reply "ready" when order is complete.`;
    try {
        await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: businessPhone // Send TO the business owner's phone
        });
        console.log(`Order notification sent to business: ${businessPhone}`);
    }
    catch (error) {
        console.error('Failed to notify business:', error);
    }
}
async function sendCustomerConfirmation(customerPhone, orderId) {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const message = `✅ Payment confirmed! 

Order #${orderId} is being prepared.
You'll receive an SMS when it's ready for pickup.

Thank you for your order!`;
    try {
        await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: customerPhone
        });
    }
    catch (error) {
        console.error('Failed to send customer confirmation:', error);
    }
}
exports.default = router;
//# sourceMappingURL=webhooks.js.map