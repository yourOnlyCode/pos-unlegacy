/**
 * Shared TypeScript Types
 * Types used across client and server
 */

export interface Order {
  id: string;
  businessId: string;
  customerPhone: string;
  customerName?: string;
  tableNumber?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  stripePaymentIntentId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  completedAt?: Date | string | null;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  modifications?: string[];
}

export type OrderStatus = 'awaiting_payment' | 'paid' | 'preparing' | 'ready' | 'completed';

export interface Business {
  id: string;
  businessName: string;
  email: string;
  phoneNumber?: string;
  stripeAccountId?: string;
  menu: MenuItems;
  inventory: InventoryItems;
  settings: BusinessSettings;
  posIntegration: PosIntegration;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MenuItems {
  [itemName: string]: MenuItem | number;
}

export interface MenuItem {
  price: number;
  image?: string;
  description?: string;
}

export interface InventoryItems {
  [itemName: string]: number;
}

export interface BusinessSettings {
  currency: string;
  timezone: string;
  autoReply: boolean;
  checkInEnabled?: boolean;
  checkInTimerMinutes?: number;
}

export interface PosIntegration {
  provider: 'toast' | 'square' | 'clover' | 'shopify' | 'none';
  apiKey?: string;
  locationId?: string;
  webhookUrl?: string;
  enabled: boolean;
}

export interface User {
  id: string;
  email: string;
  businessId: string;
  role: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AuthResponse {
  token: string;
  business: Business;
  user: User;
}

export interface CreateOrderRequest {
  businessId: string;
  customerPhone: string;
  customerName?: string;
  tableNumber?: string;
  items: OrderItem[];
  total: number;
}

export interface PaymentIntentRequest {
  amount: number;
  currency?: string;
  orderId: string;
  businessPhone?: string;
  customerPhone?: string;
  orderDetails?: string;
  stripeAccountId?: string;
  customerName?: string;
  tableNumber?: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  id: string;
  platformFee?: number;
}
