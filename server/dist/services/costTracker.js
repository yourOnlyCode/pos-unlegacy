"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectedSavings = exports.calculateCosts = void 0;
function calculateCosts() {
    const { getPurchasedNumbers } = require('./phonePoolService');
    const numbers = getPurchasedNumbers();
    const MONTHLY_COST_PER_NUMBER = 1.00;
    const totalNumbers = numbers.length;
    const monthlyCost = totalNumbers * MONTHLY_COST_PER_NUMBER;
    const dailyCost = monthlyCost / 30;
    const businesses = numbers.map(num => ({
        businessId: num.businessId,
        phoneNumber: num.number,
        monthlyCost: MONTHLY_COST_PER_NUMBER,
        purchasedAt: num.purchasedAt
    }));
    return {
        totalNumbers,
        monthlyCost,
        dailyCost,
        businesses
    };
}
exports.calculateCosts = calculateCosts;
function projectedSavings(businessesToCancel) {
    return businessesToCancel.length * 1.00; // $1 per number per month
}
exports.projectedSavings = projectedSavings;
//# sourceMappingURL=costTracker.js.map