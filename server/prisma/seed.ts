import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test business #1: Downtown Cafe
  const cafe = await prisma.business.upsert({
    where: { id: 'cafe-downtown' },
    update: {},
    create: {
      id: 'cafe-downtown',
      businessName: 'Downtown Cafe',
      email: 'admin@downtowncafe.com',
      passwordHash: await bcrypt.hash('password123', 10),
      phoneNumber: '+15551234567',
      stripeAccountId: 'acct_test123',
      menu: {
        'coffee': 4.50,
        'latte': 5.25,
        'cappuccino': 4.75,
        'sandwich': 8.99,
        'pastry': 3.25,
        'bagel': 3.50,
        'muffin': 2.99
      },
      inventory: {
        'coffee': 50,
        'latte': 30,
        'cappuccino': 25,
        'sandwich': 15,
        'pastry': 20,
        'bagel': 10,
        'muffin': 12
      },
      settings: {
        currency: 'USD',
        timezone: 'America/New_York',
        autoReply: true,
        checkInEnabled: true,
        checkInTimerMinutes: 15
      },
      posIntegration: {
        provider: 'none',
        enabled: false
      }
    }
  });

  console.log('✅ Created business:', cafe.businessName);

  // Create test business #2: Pizza Palace
  const pizza = await prisma.business.upsert({
    where: { id: 'pizza-palace' },
    update: {},
    create: {
      id: 'pizza-palace',
      businessName: 'Pizza Palace',
      email: 'admin@pizzapalace.com',
      passwordHash: await bcrypt.hash('password123', 10),
      phoneNumber: '+15559876543',
      stripeAccountId: 'acct_test456',
      menu: {
        'pizza': 12.99,
        'wings': 8.50,
        'soda': 2.25,
        'salad': 6.75
      },
      inventory: {
        'pizza': 20,
        'wings': 5,
        'soda': 50,
        'salad': 8
      },
      settings: {
        currency: 'USD',
        timezone: 'America/Los_Angeles',
        autoReply: true,
        checkInEnabled: true,
        checkInTimerMinutes: 20
      },
      posIntegration: {
        provider: 'none',
        enabled: false
      }
    }
  });

  console.log('✅ Created business:', pizza.businessName);

  // Create admin user for cafe
  const cafeUser = await prisma.user.upsert({
    where: { email: 'admin@downtowncafe.com' },
    update: {},
    create: {
      email: 'admin@downtowncafe.com',
      passwordHash: await bcrypt.hash('password123', 10),
      businessId: cafe.id,
      role: 'admin'
    }
  });

  console.log('✅ Created user:', cafeUser.email);

  // Create admin user for pizza
  const pizzaUser = await prisma.user.upsert({
    where: { email: 'admin@pizzapalace.com' },
    update: {},
    create: {
      email: 'admin@pizzapalace.com',
      passwordHash: await bcrypt.hash('password123', 10),
      businessId: pizza.id,
      role: 'admin'
    }
  });

  console.log('✅ Created user:', pizzaUser.email);

  console.log('🎉 Seeding completed!');
  console.log('\n📝 Test credentials:');
  console.log('Business ID: cafe-downtown');
  console.log('Email: admin@downtowncafe.com');
  console.log('Password: password123');
  console.log('\nBusiness ID: pizza-palace');
  console.log('Email: admin@pizzapalace.com');
  console.log('Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
