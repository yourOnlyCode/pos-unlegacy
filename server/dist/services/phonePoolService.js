"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNumberByBusiness = exports.getPurchasedNumbers = exports.releasePhoneNumber = exports.assignPhoneNumber = void 0;
const twilio_1 = __importDefault(require("twilio"));
const client = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
// Track purchased numbers (in production, store in database)
const purchasedNumbers = new Map();
async function assignPhoneNumber(businessId) {
    // Always purchase new number for each business
    return await purchaseNewNumber(businessId);
}
exports.assignPhoneNumber = assignPhoneNumber;
async function releasePhoneNumber(businessId) {
    for (const [number, info] of purchasedNumbers) {
        if (info.businessId === businessId) {
            try {
                // Release the number back to Twilio (stops monthly charges)
                await client.incomingPhoneNumbers(info.twilioSid).remove();
                purchasedNumbers.delete(number);
                console.log(`Released phone number ${number} for ${businessId}`);
                return true;
            }
            catch (error) {
                console.error(`Failed to release ${number}:`, error);
                return false;
            }
        }
    }
    return false;
}
exports.releasePhoneNumber = releasePhoneNumber;
function getPurchasedNumbers() {
    return Array.from(purchasedNumbers.values())
        .map(info => ({
        number: info.number,
        businessId: info.businessId,
        purchasedAt: info.purchasedAt
    }));
}
exports.getPurchasedNumbers = getPurchasedNumbers;
function getNumberByBusiness(businessId) {
    for (const [number, info] of purchasedNumbers) {
        if (info.businessId === businessId) {
            return number;
        }
    }
    return null;
}
exports.getNumberByBusiness = getNumberByBusiness;
async function purchaseNewNumber(businessId) {
    try {
        // Search for available numbers
        const numbers = await client.availablePhoneNumbers('US').local.list({
            smsEnabled: true,
            limit: 1
        });
        if (numbers.length === 0) {
            console.error('No available phone numbers');
            return null;
        }
        // Purchase the number
        const purchasedNumber = await client.incomingPhoneNumbers.create({
            phoneNumber: numbers[0].phoneNumber,
            smsUrl: `${process.env.BASE_URL || 'https://your-domain.com'}/api/sms/webhook`,
            smsMethod: 'POST'
        });
        // Track purchased number
        purchasedNumbers.set(purchasedNumber.phoneNumber, {
            number: purchasedNumber.phoneNumber,
            businessId,
            purchasedAt: new Date(),
            twilioSid: purchasedNumber.sid
        });
        console.log(`Purchased and assigned ${purchasedNumber.phoneNumber} to ${businessId}`);
        return purchasedNumber.phoneNumber;
    }
    catch (error) {
        console.error('Failed to purchase phone number:', error);
        return null;
    }
}
async function configureWebhook(phoneNumber) {
    try {
        // Find the Twilio phone number resource
        const numbers = await client.incomingPhoneNumbers.list({
            phoneNumber: phoneNumber
        });
        if (numbers.length > 0) {
            // Update webhook URL
            await client.incomingPhoneNumbers(numbers[0].sid).update({
                smsUrl: `${process.env.BASE_URL || 'https://your-domain.com'}/api/sms/webhook`,
                smsMethod: 'POST'
            });
            console.log(`Configured webhook for ${phoneNumber}`);
        }
    }
    catch (error) {
        console.error(`Failed to configure webhook for ${phoneNumber}:`, error);
    }
}
//# sourceMappingURL=phonePoolService.js.map