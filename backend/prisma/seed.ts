import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('❌ Database seeding is strictly disabled in production!');
  }

  console.log('🌱 Seeding Baantika development database...');

  // Hash standard demo password
  const passwordHash = await argon2.hash('Baantika@123', {
    type: argon2.argon2id,
  });

  // Create 3 demo users
  const user1 = await prisma.user.upsert({
    where: { email: 'aarav@baantika.local' },
    update: {},
    create: {
      email: 'aarav@baantika.local',
      displayName: 'Aarav Sharma',
      passwordHash,
      currency: 'INR',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'diya@baantika.local' },
    update: {},
    create: {
      email: 'diya@baantika.local',
      displayName: 'Diya Patel',
      passwordHash,
      currency: 'INR',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'kabir@baantika.local' },
    update: {},
    create: {
      email: 'kabir@baantika.local',
      displayName: 'Kabir Mehta',
      passwordHash,
      currency: 'INR',
    },
  });

  console.log(`Created demo users: ${user1.displayName}, ${user2.displayName}, ${user3.displayName}`);

  // Create demo group
  let group = await prisma.group.findFirst({
    where: { name: 'Flat 302 Koramangala' },
  });

  if (!group) {
    group = await prisma.group.create({
      data: {
        name: 'Flat 302 Koramangala',
        description: 'Monthly flat rent, groceries, and utilities',
        currency: 'INR',
        createdById: user1.id,
        members: {
          create: [
            { userId: user1.id, role: 'OWNER' },
            { userId: user2.id, role: 'ADMIN' },
            { userId: user3.id, role: 'MEMBER' },
          ],
        },
      },
    });

    console.log(`Created group: ${group.name}`);

    // Create Expense 1: WiFi & Fiber Bill (Equal split)
    const expense1 = await prisma.expense.create({
      data: {
        groupId: group.id,
        description: 'Airtel Fiber Broadband',
        amountPaise: 119900, // ₹1,199.00
        expenseDate: new Date('2024-02-01'),
        category: 'Utilities',
        splitMethod: 'EQUAL',
        createdById: user1.id,
        payers: {
          create: [{ userId: user1.id, amountPaise: 119900 }],
        },
        splits: {
          create: [
            { userId: user1.id, amountPaise: 39967 },
            { userId: user2.id, amountPaise: 39967 },
            { userId: user3.id, amountPaise: 39966 },
          ],
        },
      },
    });

    // Create Expense 2: Groceries at Nature's Basket (Exact split)
    const expense2 = await prisma.expense.create({
      data: {
        groupId: group.id,
        description: 'Weekend Groceries',
        amountPaise: 350000, // ₹3,500.00
        expenseDate: new Date('2024-02-04'),
        category: 'Groceries',
        splitMethod: 'EXACT',
        createdById: user2.id,
        payers: {
          create: [{ userId: user2.id, amountPaise: 350000 }],
        },
        splits: {
          create: [
            { userId: user1.id, amountPaise: 120000 },
            { userId: user2.id, amountPaise: 150000 },
            { userId: user3.id, amountPaise: 80000 },
          ],
        },
      },
    });

    // Create a pending settlement: Kabir -> Aarav
    await prisma.settlement.create({
      data: {
        groupId: group.id,
        payerId: user3.id,
        payeeId: user1.id,
        amountPaise: 39966,
        status: 'PENDING',
        createdById: user3.id,
        note: 'WiFi share for February',
      },
    });

    console.log(`Created expenses: "${expense1.description}", "${expense2.description}"`);
  }

  console.log('✅ Development database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
