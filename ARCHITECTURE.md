# POS System - Architecture Documentation

## Overview

This document describes the architectural patterns, best practices, and design decisions implemented in the POS system. The architecture follows modern full-stack patterns with a focus on maintainability, scalability, and developer experience.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Data Layer](#data-layer)
5. [API Design](#api-design)
6. [State Management](#state-management)
7. [Error Handling](#error-handling)
8. [Configuration Management](#configuration-management)
9. [Logging & Monitoring](#logging--monitoring)
10. [Security Patterns](#security-patterns)
11. [Testing Strategy](#testing-strategy)
12. [Deployment Architecture](#deployment-architecture)

---

## System Architecture

### High-Level Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   React     │────────▶│   Express    │────────▶│ PostgreSQL  │
│   Client    │         │   API        │         │   Database  │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │
      │                        │
      ▼                        ▼
┌─────────────┐         ┌──────────────┐
│   Stripe    │         │   Twilio     │
│   Payments  │         │   SMS        │
└─────────────┘         └──────────────┘
```

### Technology Stack

**Frontend:**
- React 18.2 with TypeScript
- Material-UI for components
- Vite for build tooling
- Stripe.js for payments
- React Router for navigation

**Backend:**
- Node.js with Express
- TypeScript for type safety
- Prisma ORM for database
- JWT for authentication
- Twilio for SMS

**Database:**
- PostgreSQL (production)
- Prisma for migrations and queries

**Infrastructure:**
- Vercel for hosting (serverless)
- GitHub for version control

---

## Frontend Architecture

### Project Structure

```
client/src/
├── api/              # API client layer
│   └── client.ts     # Centralized HTTP client
├── components/       # React components
│   ├── ErrorBoundary.tsx
│   ├── OrderingPortal.tsx
│   └── admin/
├── config/           # Configuration modules
│   ├── env.ts        # Environment config
│   └── api.ts        # API endpoints
├── contexts/         # React Context providers
│   └── OrderContext.tsx
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
│   └── index.ts      # Shared types
├── utils/            # Utility functions
└── ordering-helpers/ # Business logic helpers
```

### Key Architectural Patterns

#### 1. **Centralized API Client**

**Problem:** Scattered fetch calls with inconsistent error handling.

**Solution:** Single `ApiClient` class that handles all HTTP requests.

```typescript
// client/src/api/client.ts
import { config } from '../config/env';

class ApiClient {
  private baseUrl: string;
  
  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
  
  // ... post, put, delete, patch
}

export const api = new ApiClient(config.apiBaseUrl);
```

**Benefits:**
- ✅ Consistent error handling
- ✅ Automatic authentication header injection
- ✅ Type-safe responses
- ✅ Single source of truth for API configuration

**Usage:**
```typescript
// Instead of: fetch('/api/orders/123')
const order = await api.get<Order>('/api/orders/123');
```

---

#### 2. **Environment Configuration Management**

**Problem:** Scattered environment variable access with type casts.

**Solution:** Typed configuration module that validates on startup.

```typescript
// client/src/config/env.ts
interface ClientConfig {
  stripePublishableKey: string;
  apiBaseUrl: string;
  mode: 'development' | 'production';
}

function validateConfig(): ClientConfig {
  const env = (import.meta as any).env;
  
  if (!env?.VITE_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('Missing VITE_STRIPE_PUBLISHABLE_KEY');
  }
  
  return {
    stripePublishableKey: env.VITE_STRIPE_PUBLISHABLE_KEY,
    apiBaseUrl: env.MODE === 'production' ? '' : 'http://localhost:5000',
    mode: env.MODE || 'development'
  };
}

export const config = validateConfig(); // Fails fast on startup
```

**Benefits:**
- ✅ Type-safe configuration access
- ✅ Validates required variables on startup
- ✅ No runtime type casts needed
- ✅ Centralized configuration logic

**Usage:**
```typescript
import { config } from '../config/env';

const apiUrl = config.apiBaseUrl; // Type-safe!
```

---

#### 3. **React Context for State Management**

**Problem:** 8-12 useState hooks per component with prop drilling.

**Solution:** Context API for shared state like cart and messages.

```typescript
// client/src/contexts/OrderContext.tsx
interface OrderContextValue {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  messages: Message[];
  addMessage: (message: Message) => void;
  // ... more state
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // ... context logic
  
  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within OrderProvider');
  }
  return context;
}
```

**Benefits:**
- ✅ Eliminates prop drilling
- ✅ Centralized state management
- ✅ Easy to test and mock
- ✅ Type-safe context access

**Usage:**
```typescript
function OrderingPortal() {
  const { cartItems, addToCart, cartTotal } = useOrder();
  
  return <div>Cart total: ${cartTotal}</div>;
}
```

---

#### 4. **Error Boundaries**

**Problem:** Unhandled errors crash entire React app.

**Solution:** Error Boundary components catch and display errors gracefully.

```typescript
// client/src/components/ErrorBoundary.tsx
export class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
    // Log to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

**Benefits:**
- ✅ Prevents full app crashes
- ✅ User-friendly error messages
- ✅ Error logging and tracking
- ✅ Graceful degradation

**Usage:**
```typescript
<ErrorBoundary>
  <OrderingPortal />
</ErrorBoundary>
```

---

#### 5. **Shared TypeScript Types**

**Problem:** Type definitions duplicated between client and server.

**Solution:** Shared types module for consistency.

```typescript
// client/src/types/index.ts
export interface Order {
  id: string;
  businessId: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date | string;
}

export type OrderStatus = 'awaiting_payment' | 'paid' | 'preparing' | 'ready' | 'completed';
```

**Benefits:**
- ✅ Type safety across stack
- ✅ Single source of truth
- ✅ Compile-time error detection
- ✅ Better IDE autocomplete

---

## Backend Architecture

### Project Structure

```
server/src/
├── controllers/      # Request handlers (thin layer)
│   └── ordersController.ts
├── services/         # Business logic layer
│   ├── orderService.ts
│   ├── tenantService.ts
│   └── smsService.ts
├── routes/           # Express route definitions
│   ├── orders.ts
│   ├── payments.ts
│   └── auth.ts
├── middleware/       # Express middleware
│   └── authMiddleware.ts
├── lib/              # Shared utilities
│   ├── prisma.ts     # Prisma client
│   └── logger.ts     # Structured logging
└── index.ts          # Server entry point
```

### Key Architectural Patterns

#### 1. **Service Layer Pattern**

**Problem:** Business logic mixed with HTTP handling in routes.

**Solution:** Separate controllers (HTTP) from services (business logic).

**Before:**
```typescript
// routes/orders.ts - Mixed concerns ❌
router.post('/orders', async (req, res) => {
  const orderId = generateId();
  const order = { id: orderId, ...req.body };
  await prisma.order.create({ data: order });
  res.json(order);
});
```

**After:**
```typescript
// controllers/ordersController.ts - Thin controller ✅
export async function createOrder(req: Request, res: Response) {
  try {
    const orderData = req.body;
    const order = await orderService.createOrder(orderData);
    res.status(201).json(order);
  } catch (error) {
    logger.error('Order creation failed', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
}

// services/orderService.ts - Business logic ✅
export async function createOrder(data: CreateOrderDto): Promise<Order> {
  // Validation
  validateOrderData(data);
  
  // Business logic
  const orderId = generateOrderId();
  
  // Database
  return await prisma.order.create({
    data: { id: orderId, ...data }
  });
}
```

**Benefits:**
- ✅ Separation of concerns
- ✅ Testable business logic
- ✅ Reusable service methods
- ✅ Cleaner route handlers

---

#### 2. **Structured Logging**

**Problem:** console.log() everywhere with inconsistent formatting.

**Solution:** Centralized logger with levels and context.

```typescript
// server/src/lib/logger.ts
class Logger {
  info(message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${message}`, context);
  }
  
  error(message: string, error?: Error, context?: LogContext): void {
    // ... structured error logging
  }
  
  // Specialized methods
  order(action: string, orderId: string, context?: LogContext): void {
    this.info(`Order: ${action}`, { orderId, ...context });
  }
}

export const logger = new Logger();
```

**Benefits:**
- ✅ Consistent log format
- ✅ Structured context data
- ✅ Log levels (debug, info, warn, error)
- ✅ Easy to integrate with log aggregators

**Usage:**
```typescript
logger.order('create', orderId, { businessId, total: 45.99 });
logger.error('Payment failed', error, { orderId, customerId });
```

---

## Data Layer

### Prisma ORM Architecture

#### Schema Design

```prisma
// server/prisma/schema.prisma
model Business {
  id              String   @id
  businessName    String
  email           String   @unique
  passwordHash    String
  phoneNumber     String?  @unique
  stripeAccountId String?  @unique
  menu            Json     @default("{}")
  inventory       Json     @default("{}")
  settings        Json     @default("{}")
  posIntegration  Json     @default("{}")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  users   User[]
  orders  Order[]
  costs   Cost[]

  @@map("businesses")
}

model Order {
  id            String   @id
  businessId    String
  customerPhone String
  customerName  String?
  tableNumber   String?
  items         Json
  total         Float
  status        String   @default("paid")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@map("orders")
}
```

#### Migration Strategy

**Development:**
```bash
# Create migration
npx prisma migrate dev --name description

# Apply migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate
```

**Production:**
```bash
# Apply migrations (no prompts)
npx prisma migrate deploy

# Generate client
npx prisma generate
```

#### Seeding

```typescript
// server/prisma/seed.ts
async function main() {
  await prisma.business.upsert({
    where: { id: 'cafe-downtown' },
    update: {},
    create: {
      id: 'cafe-downtown',
      businessName: 'Downtown Cafe',
      email: 'admin@downtowncafe.com',
      passwordHash: await bcrypt.hash('password123', 10),
      menu: { coffee: 4.50, sandwich: 8.99 },
      inventory: { coffee: 50, sandwich: 15 },
      // ... settings
    }
  });
}
```

**Benefits:**
- ✅ Type-safe database queries
- ✅ Automatic migrations
- ✅ Query optimization
- ✅ Easy testing with seed data

---

## API Design

### RESTful Conventions

```
GET    /api/orders           # List orders
GET    /api/orders/:id       # Get order
POST   /api/orders           # Create order
PUT    /api/orders/:id       # Update order
DELETE /api/orders/:id       # Delete order
PATCH  /api/orders/:id       # Partial update
```

### Response Format

**Success:**
```json
{
  "id": "1234567890",
  "items": [...],
  "total": 45.99,
  "status": "paid"
}
```

**Error:**
```json
{
  "error": "Order not found",
  "code": "ORDER_NOT_FOUND",
  "details": {}
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `ORDER_NOT_FOUND` | 404 | Order does not exist |
| `INVALID_REQUEST` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `INTERNAL_ERROR` | 500 | Server error |

---

## State Management

### Component State (useState)
- **Use for:** Local UI state (toggles, form inputs)
- **Example:** Modal open/close, form validation errors

### Context API (useContext)
- **Use for:** Shared state across components
- **Example:** Cart items, user session, theme

### Server State (React Query - Future)
- **Use for:** Server-cached data
- **Example:** Orders list, business info

### URL State (useParams/useSearchParams)
- **Use for:** Shareable state
- **Example:** Page number, filters, selected items

---

## Error Handling

### Client-Side

**API Errors:**
```typescript
try {
  const order = await api.get<Order>('/api/orders/123');
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      // Handle not found
    } else if (error.status === 401) {
      // Redirect to login
    }
  }
}
```

**Component Errors:**
```typescript
<ErrorBoundary fallback={<CustomError />}>
  <OrderingPortal />
</ErrorBoundary>
```

### Server-Side

**Route Level:**
```typescript
export async function getOrder(req: Request, res: Response) {
  try {
    const order = await orderService.getOrder(req.params.id);
    res.json(order);
  } catch (error) {
    logger.error('Get order failed', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

**Service Level:**
```typescript
export async function getOrder(orderId: string): Promise<Order> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  
  if (!order) {
    throw new OrderNotFoundError(orderId);
  }
  
  return order;
}
```

---

## Configuration Management

### Environment Variables

**Client (.env):**
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

**Server (.env):**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
STRIPE_SECRET_KEY=sk_test_xxx
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
JWT_SECRET=xxx
NODE_ENV=production
LOG_LEVEL=info
```

### Config Validation

**Client:**
```typescript
// Validates on app startup
export const config = validateConfig();
```

**Server:**
```typescript
// Add validation in index.ts
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}
```

---

## Security Patterns

### Authentication

**JWT Tokens:**
```typescript
// Generate
const token = jwt.sign({ businessId, userId }, JWT_SECRET, {
  expiresIn: '7d'
});

// Verify
const decoded = jwt.verify(token, JWT_SECRET);
```

**Middleware:**
```typescript
export const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Payment Security

- ✅ **Never** store credit card numbers
- ✅ Use Stripe.js for PCI compliance
- ✅ Server-side payment intent creation
- ✅ Webhook signature verification

### Data Security

- ✅ Password hashing (bcrypt, 10 rounds)
- ✅ SQL injection prevention (Prisma parameterized queries)
- ✅ XSS prevention (React auto-escaping)
- ✅ CORS configuration
- ✅ Helmet.js security headers

---

## Testing Strategy

### Unit Tests
- **Focus:** Individual functions and utilities
- **Tools:** Jest, Vitest
- **Example:** Service layer methods, utility functions

### Integration Tests
- **Focus:** API endpoints with database
- **Tools:** Supertest, Jest
- **Example:** POST /api/orders creates order in DB

### E2E Tests
- **Focus:** Full user flows
- **Tools:** Playwright, Cypress
- **Example:** Complete checkout flow

---

## Deployment Architecture

### Vercel Serverless

**Configuration (vercel.json):**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "client/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/server" },
    { "source": "/(.*)", "destination": "/client/dist/$1" }
  ]
}
```

**Environment Variables:**
Set in Vercel Dashboard → Settings → Environment Variables

**Database:**
- PostgreSQL hosted on provider (Supabase, Render, Railway)
- Connection pooling enabled
- SSL required

---

## Performance Optimization

### Frontend
- ✅ Code splitting with React.lazy()
- ✅ Image optimization
- ✅ Debounced search inputs
- ✅ Memoized components (React.memo)

### Backend
- ✅ Database query optimization
- ✅ Prisma connection pooling
- ✅ Response caching headers
- ✅ Compressed responses (gzip)

### Database
- ✅ Indexes on frequently queried fields
- ✅ Pagination for large lists
- ✅ N+1 query prevention with includes

---

## Best Practices

### Code Organization
1. **One component per file**
2. **Group related files in folders**
3. **Export from index.ts files**
4. **Keep functions small and focused**

### Naming Conventions
- **Components:** PascalCase (`OrderingPortal.tsx`)
- **Functions:** camelCase (`createOrder()`)
- **Files:** Match export (`orderService.ts`)
- **Constants:** SCREAMING_SNAKE_CASE (`API_BASE_URL`)

### Git Workflow
1. **Feature branches:** `feature/add-payments`
2. **Conventional commits:** `feat:`, `fix:`, `docs:`
3. **Pull requests** for review
4. **Never commit .env files**

---

## Migration Checklist

When refactoring to these patterns:

- [ ] Create typed config modules
- [ ] Implement API client layer
- [ ] Add Error Boundaries
- [ ] Extract Context providers
- [ ] Create service layer
- [ ] Add structured logging
- [ ] Define shared types
- [ ] Update documentation
- [ ] Write tests
- [ ] Review security

---

## Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Stripe API Reference](https://stripe.com/docs/api)

---

## Support

For questions or issues:
1. Check this documentation
2. Review code comments
3. Check git history for context
4. Review DEVELOPER_GUIDE.md

---

*Last Updated: December 2025*
