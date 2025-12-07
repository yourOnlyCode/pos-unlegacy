import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class OrderRoutingService {
  async routeOrder(businessId: string, orderData: any) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new Error('Business not found');
    }

    // Edge device routing not yet implemented
    // Default to cloud processing
    return this.processCloudOrder(businessId, orderData);
  }

  private async sendToEdgeDevice(endpoint: string, orderData: any) {
    const response = await axios.post(`${endpoint}/api/orders`, orderData, {
      timeout: 5000, // 5 second timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  }

  private async processCloudOrder(businessId: string, orderData: any) {
    // Use local order parsing with Ollama fallback
    const { parseOrder } = require('./orderParser');
    
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new Error('Business not found');
    }

    // Try local parsing first
    let parsedOrder = parseOrder(orderData.message, business.menu);
    
    // If local parsing fails or has low confidence, try Ollama
    if (!parsedOrder.isValid || parsedOrder.confidence < 0.7) {
      try {
        const { OllamaService } = require('./llm/ollamaService');
        const ollamaService = new OllamaService();
        parsedOrder = await ollamaService.parseOrder(orderData.message, business.menu);
      } catch (error) {
        console.log('Ollama fallback failed, using local parsing result');
      }
    }

    // Save order to database
    const order = await prisma.order.create({
      data: {
        id: `order_${Date.now()}`,
        businessId,
        customerPhone: orderData.customerPhone,
        customerName: parsedOrder.customerName,
        tableNumber: parsedOrder.tableNumber,
        items: parsedOrder.items,
        total: this.calculateTotal(parsedOrder.items, business.menu),
        status: 'pending',
      },
    });

    return {
      orderId: order.id,
      parsedOrder,
      total: order.total,
    };
  }

  private calculateTotal(items: any[], menu: any): number {
    return items.reduce((total, item) => {
      const menuItem = menu[item.name];
      const price = typeof menuItem === 'number' ? menuItem : menuItem?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  }

  async getBusinessConfig(businessId: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        businessName: true,
        menu: true,
        inventory: true,
      },
    });

    return business;
  }
}