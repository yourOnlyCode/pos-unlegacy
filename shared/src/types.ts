import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().positive(),
  category: z.string(),
  stock: z.number().int().min(0),
  imageUrl: z.string().optional(),
});

export const CartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

export const OrderSchema = z.object({
  id: z.string(),
  items: z.array(CartItemSchema),
  total: z.number().positive(),
  createdAt: z.date(),
  status: z.enum(['pending', 'completed', 'cancelled']),
});

export type Product = z.infer<typeof ProductSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type Order = z.infer<typeof OrderSchema>;