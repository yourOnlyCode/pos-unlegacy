# Quick Start Guide - Architecture Patterns

## 🎯 Common Tasks

### Making API Calls

**Old way (❌ Don't do this):**
```typescript
const response = await fetch('/api/orders/123');
const order = await response.json();
```

**New way (✅ Do this):**
```typescript
import { api } from '../api/client';
import { Order } from '../types';

const order = await api.get<Order>('/api/orders/123');
```

**Why?**
- Type-safe responses
- Automatic authentication
- Consistent error handling
- Centralized configuration

---

### Accessing Environment Variables

**Old way (❌ Don't do this):**
```typescript
const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
```

**New way (✅ Do this):**
```typescript
import { config } from '../config/env';

const apiUrl = config.apiBaseUrl;
```

**Why?**
- Type-safe access
- Validates on startup
- No runtime type casts
- Single source of truth

---

### Managing Shared State

**Old way (❌ Don't do this):**
```typescript
// Passing props through 5 levels of components
<Parent>
  <Child1 cart={cart} setCart={setCart}>
    <Child2 cart={cart} setCart={setCart}>
      <Child3 cart={cart} setCart={setCart}>
        {/* Finally use it here */}
      </Child3>
    </Child2>
  </Child1>
</Parent>
```

**New way (✅ Do this):**
```typescript
// App.tsx
<OrderProvider>
  <Parent />
</OrderProvider>

// Any component, any level deep
function DeepChild() {
  const { cartItems, addToCart } = useOrder();
  return <button onClick={() => addToCart(item)}>Add</button>;
}
```

**Why?**
- No prop drilling
- Cleaner components
- Easy to test
- Better performance

---

### Handling Errors

**Old way (❌ Don't do this):**
```typescript
try {
  const data = await fetchData();
  // ... component crashes on error
} catch (error) {
  console.log(error); // User sees blank screen
}
```

**New way (✅ Do this):**
```typescript
// Wrap components in Error Boundary
<ErrorBoundary>
  <OrderingPortal />
</ErrorBoundary>

// Or use try-catch with user feedback
try {
  const data = await api.get('/data');
} catch (error) {
  if (error instanceof ApiError) {
    setError(error.message); // Show to user
  }
}
```

**Why?**
- Prevents full app crashes
- User-friendly error messages
- Error tracking
- Graceful degradation

---

### Logging (Backend)

**Old way (❌ Don't do this):**
```typescript
console.log('Order created:', orderId);
console.log('Error:', error);
```

**New way (✅ Do this):**
```typescript
import { logger } from '../lib/logger';

logger.order('create', orderId, { businessId, total });
logger.error('Order creation failed', error, { orderId });
```

**Why?**
- Structured logs
- Consistent format
- Context data
- Log levels

---

### Creating API Endpoints

**Old way (❌ Don't do this):**
```typescript
// routes/orders.ts
router.post('/orders', async (req, res) => {
  try {
    const orderId = Date.now().toString();
    const order = { id: orderId, ...req.body };
    await prisma.order.create({ data: order });
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed' });
  }
});
```

**New way (✅ Do this):**
```typescript
// routes/orders.ts
import * as ordersController from '../controllers/ordersController';

router.post('/orders', ordersController.createOrder);

// controllers/ordersController.ts
export async function createOrder(req: Request, res: Response) {
  try {
    const order = await orderService.createOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    logger.error('Order creation failed', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
}

// services/orderService.ts
export async function createOrder(data: CreateOrderDto): Promise<Order> {
  validateOrderData(data);
  const orderId = generateOrderId();
  return await prisma.order.create({ data: { id: orderId, ...data } });
}
```

**Why?**
- Separation of concerns
- Testable business logic
- Reusable services
- Cleaner routes

---

## 📁 File Structure Reference

### Client
```
client/src/
├── api/client.ts           # Use for all API calls
├── config/env.ts           # Import config from here
├── contexts/OrderContext.tsx  # Wrap app with providers
├── components/
│   ├── ErrorBoundary.tsx   # Wrap risky components
│   └── YourComponent.tsx
├── types/index.ts          # Import shared types
└── utils/                  # Helper functions
```

### Server
```
server/src/
├── controllers/            # Thin HTTP handlers
├── services/               # Business logic
├── routes/                 # Express routes
├── lib/
│   ├── logger.ts          # Import logger from here
│   └── prisma.ts
└── index.ts
```

---

## 🔍 Finding Examples

**Need to see how to use a pattern?**

1. **API Client:** Check `client/src/components/PaymentPage.tsx`
2. **Config:** Check `client/src/config/api.ts`
3. **Context:** Check `client/src/contexts/OrderContext.tsx`
4. **Error Boundary:** Check `client/src/components/ErrorBoundary.tsx`
5. **Logging:** Check `server/src/controllers/ordersController.ts`
6. **Service Layer:** Check `server/src/controllers/ordersController.ts`

---

## ⚡ Quick Commands

```bash
# Start development
cd client && npm run dev  # Port 3001
cd server && npm run dev  # Port 5000

# Database
cd server
npx prisma studio         # Open DB GUI
npx prisma migrate dev    # Create migration
npm run db:seed           # Seed test data

# Type checking
npm run type-check        # Check TypeScript

# Testing
npm test                  # Run tests
```

---

## 🚨 Common Mistakes

### ❌ Don't manually cast env variables
```typescript
const key = (import.meta as any).env.VITE_KEY; // NO!
```
✅ Use config module instead

### ❌ Don't use console.log in production
```typescript
console.log('User logged in:', userId); // NO!
```
✅ Use logger instead

### ❌ Don't mix business logic in routes
```typescript
router.post('/orders', async (req, res) => {
  // 100 lines of business logic here... NO!
});
```
✅ Use service layer instead

### ❌ Don't ignore error boundaries
```typescript
function App() {
  return <OrderingPortal />; // Can crash entire app!
}
```
✅ Wrap in ErrorBoundary

---

## 📚 Next Steps

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) for deep dive
2. Review [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for features
3. Check existing code for examples
4. Ask questions in code comments

---

## 💡 Pro Tips

- Use VS Code's "Go to Definition" (F12) to explore code
- Use "Find All References" to see how things are used
- Check git history (`git log -p file.ts`) for context
- Read tests to understand expected behavior

---

*Remember: These patterns make code more maintainable, testable, and scalable. The initial setup is worth it!*
