# POS System - Developer Guide

A comprehensive Square-like Point of Sale application with SMS ordering, built with React and Node.js.

## 🏗️ Architecture Overview

### Multi-Tenant SaaS Platform
- **Unlimited businesses** with isolated data
- **Just-in-time phone number provisioning** via Twilio
- **Stripe Connect integration** for direct business payouts
- **Platform fee collection** with cost tracking

### Tech Stack
- **Frontend**: React 18 + TypeScript + Material-UI + Vite
- **Backend**: Node.js + Express + TypeScript
- **Payments**: Stripe Connect + Stripe Terminal
- **SMS**: Twilio with automatic phone number management
- **Development**: In-memory storage (production ready for PostgreSQL)

---

## 📁 Project Structure

```
pos-unlegacy/
├── client/          # React frontend
├── server/          # Node.js backend  
├── shared/          # Shared TypeScript types
├── database/        # Database schemas (future)
└── test-*.ps1      # PowerShell testing scripts
```

---

## 🖥️ Frontend (React)

### Core Application
- **`App.tsx`** - Main router with all application routes
- **`main.tsx`** - React entry point with StrictMode
- **`vite.config.ts`** - Build config with backend proxy

### Theme & Responsive Design
- **`theme/responsive.ts`** - POS-optimized Material-UI theme
  - Custom breakpoints for tablets/phones (xs: 0, md: 900px)
  - Touch-optimized buttons (48px+ minimum height)
  - Responsive typography scaling

### Components Architecture

#### 🔐 Authentication & Onboarding
```
onboarding/
├── OnboardingFlow.tsx      # 3-step wizard coordinator
├── BusinessInfoForm.tsx    # Name, email, password collection
├── StripeSetup.tsx        # Stripe Connect account creation
└── OnboardingComplete.tsx  # Success page
```

- **`AdminLogin.tsx`** - Login portal (register → onboarding flow)
- **`ConnectSuccess.tsx`** - Stripe Connect callback handler

#### 💰 Point of Sale
- **`POSInterface.tsx`** - Main POS terminal
  - Responsive product grid (2-6 columns based on screen)
  - Shopping cart with real-time totals
  - Stripe Terminal integration
- **`PaymentTerminal.tsx`** - In-person payment processing
- **`PaymentPage.tsx`** - SMS order payment portal
  - Environment-aware (test vs production payments)
  - Order fetching and payment processing

#### 👨💼 Admin Dashboard
```
admin/
├── InventoryManagement.tsx  # Menu CRUD operations
└── OrdersList.tsx          # Order history management
```

- **`AdminDashboard.tsx`** - Business management hub
- **`OrderManagement.tsx`** - Real-time order tracking
  - Status flow: paid → preparing → ready → completed
  - Interactive status updates and completion checkboxes
- **`DataExport.tsx`** - Business data export

### Utilities & Hooks
- **`utils/api.ts`** - TypeScript API client with interfaces
- **`utils/validation.ts`** - Form validation and business ID generation
- **`hooks/useOnboarding.ts`** - Onboarding state management

---

## 🖧 Backend (Node.js)

### Core Server
- **`index.ts`** - Express server setup
  - Route registration
  - Middleware configuration  
  - Backup scheduler initialization

### Authentication
- **`middleware/authMiddleware.ts`** - JWT authentication and authorization

### API Routes

#### Business Management
- **`routes/auth.ts`** - User registration, login, JWT management
- **`routes/admin.ts`** - Business tenant CRUD operations
- **`routes/inventory.ts`** - Menu management

#### Payment Processing
- **`routes/payments.ts`** - Stripe payment intent creation
- **`routes/connect.ts`** - Stripe Connect management
  - Account creation and onboarding
  - Status monitoring and webhooks

#### SMS & Orders
- **`routes/sms.ts`** - Twilio webhook handling
  - Natural language order parsing
  - Customer communication
- **`routes/orders.ts`** - Order lifecycle management
  - Status updates and business filtering
- **`routes/webhooks.ts`** - Payment confirmations and notifications

#### System
- **`routes/export.ts`** - Data export functionality
- **`routes/test.ts`** - Development-only endpoints
  - Mock order creation and payment simulation
  - Automatically disabled in production (NODE_ENV check)

### Business Logic Services

#### Multi-Tenant Management
- **`services/tenantService.ts`** - Business isolation and lookup
- **`services/userService.ts`** - User account management

#### SMS & Communication  
- **`services/orderParser.ts`** - Natural language SMS parsing
  - Extracts customer names and table numbers
  - Fuzzy menu item matching
  - Supports formats: "John table 5: 2 coffee, 1 sandwich"

#### Infrastructure
- **`services/phonePoolService.ts`** - Just-in-time Twilio number purchasing
  - Automatic acquisition on business signup
  - Cost tracking ($1/month per number)
  - Release on cancellation

#### Financial & Operations
- **`services/costTracker.ts`** - Platform cost monitoring
- **`services/backupScheduler.ts`** - Automated daily backups
- **`services/orderService.ts`** - Order processing logic

---

## 🔄 Key Workflows

### Business Onboarding Flow
1. **Register** → Redirects to `/onboarding`
2. **Business Info** → Name, email, password collection
3. **Stripe Setup** → Connect account creation and verification
4. **Complete** → Admin dashboard access with login credentials

### SMS Ordering Workflow
1. **Customer texts** order to business phone number
2. **Order parsing** extracts items, customer name, table number
3. **Payment link** sent via SMS to customer
4. **Payment processing** through PaymentPage component
5. **Business notification** of paid order via SMS
6. **Order tracking** through status updates until completion

### Multi-Tenant Architecture
- **Phone number isolation** - Each business gets unique Twilio number
- **Payment isolation** - Stripe Connect for direct business payouts
- **Data isolation** - Tenant-based data filtering
- **Cost allocation** - Platform fees and usage tracking

---

## 🧪 Development & Testing

### Environment Configuration
```bash
# Server environment
STRIPE_SECRET_KEY=sk_test_...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
NODE_ENV=development

# Client environment  
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Testing Infrastructure
- **`test-order.ps1`** - Simulates complete SMS order flow
- **`test-pay.ps1`** - Tests payment completion webhook
- **`test-admin.ps1`** - Admin dashboard functionality

### Development Features
- **Environment-aware endpoints** - Test routes disabled in production
- **Mock payment flows** - Bypass Stripe in development
- **Pre-loaded test data** - Immediate functionality without setup

### Stripe Test Cards
- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- Any future expiry date and 3-digit CVC

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Configure Environment
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit with your Stripe and Twilio credentials
```

### 3. Start Development
```bash
npm run dev
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### 4. Test the System
```bash
# Test SMS ordering
.\test-order.ps1

# Test payment completion
.\test-pay.ps1 "order-123"
```

---

## 🔧 Key Features

### Responsive POS Interface
- **Tablet-optimized** design with touch-friendly controls
- **Product grid** that scales from 2-6 columns
- **Real-time cart** management with instant totals

### SMS Ordering System
- **Natural language parsing** - "John table 5: 2 coffee, 1 sandwich"
- **Fuzzy menu matching** - Handles typos and variations
- **Payment-first flow** - Business only receives paid orders

### Multi-Business Support
- **Automatic phone provisioning** - Just-in-time Twilio number purchase
- **Stripe Connect integration** - Direct payouts to businesses
- **Platform fee collection** - Configurable revenue sharing

### Admin Dashboard
- **Real-time order management** with status tracking
- **Menu management** with inline editing
- **Data export** capabilities for business analytics
- **Cost tracking** and profitability analysis

---

## 📊 Data Models

### Business Tenant
```typescript
interface BusinessData {
  id: string;
  businessName: string;
  email: string;
  password: string;
  menu: Record<string, number>;
}
```

### Order Lifecycle
```typescript
interface Order {
  id: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  customerName?: string;
  tableNumber?: string;
  customerPhone: string;
  status: 'paid' | 'preparing' | 'ready' | 'completed';
  createdAt: string;
}
```

---

## 🔒 Security & Production

### Authentication
- **JWT-based** authentication with secure token storage
- **Route protection** with middleware validation
- **Environment-based** feature flags

### Payment Security
- **Stripe Connect** for PCI compliance
- **Server-side** payment intent creation
- **Webhook verification** for payment confirmations

### Production Considerations
- **Database migration** from in-memory to PostgreSQL
- **Environment variable** validation
- **Error logging** and monitoring
- **Rate limiting** for API endpoints

---

This system provides a complete foundation for a multi-tenant POS platform with SMS ordering capabilities, ready for production deployment with proper database integration.