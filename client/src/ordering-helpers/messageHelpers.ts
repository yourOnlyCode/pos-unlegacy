export interface Message {
  id: string;
  text: string;
  sender: 'customer' | 'system';
  timestamp: Date;
  type?: 'order' | 'payment' | 'info';
  paymentLink?: string;
  orderId?: string;
  total?: number;
  orderItems?: Array<{ name: string; quantity: number; price: number }>;
}

export const createCustomerMessage = (text: string): Message => ({
  id: Date.now().toString(),
  text,
  sender: 'customer',
  timestamp: new Date(),
});

export const createSystemMessage = (text: string, type: string = 'info', extra: any = {}): Message => ({
  id: (Date.now() + 1).toString(),
  text,
  sender: 'system',
  timestamp: new Date(),
  type: type as any,
  ...extra,
});

export const createErrorMessage = (): Message => ({
  id: (Date.now() + 1).toString(),
  text: 'Sorry, something went wrong. Please try again.',
  sender: 'system',
  timestamp: new Date(),
  type: 'info',
});