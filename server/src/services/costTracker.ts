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

export function calculateCosts(): CostSummary {
  const { getPurchasedNumbers } = require('./phonePoolService');
  const numbers: Array<{
    businessId: string;
    number: string;
    purchasedAt: Date;
  }> = getPurchasedNumbers();
  
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

export function projectedSavings(businessesToCancel: string[]): number {
  return businessesToCancel.length * 1.00; // $1 per number per month
}