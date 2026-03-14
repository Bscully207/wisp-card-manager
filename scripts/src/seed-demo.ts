import bcrypt from "bcrypt";
import { db, pool, usersTable, cardsTable, transactionsTable, supportTicketsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const EMAIL = "test@testapp.com";
const PASSWORD = "Test1234";
const BCRYPT_ROUNDS = 12;

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 14) + 8, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

function generateCardNumber(): string {
  const segments = Array.from({ length: 4 }, () =>
    String(Math.floor(1000 + Math.random() * 9000))
  );
  return segments.join(" ");
}

function generateCVV(): string {
  return String(Math.floor(100 + Math.random() * 900));
}

async function main() {
  console.log("🌱 Seeding demo user...\n");

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, EMAIL));
  if (existing) {
    console.log(`⚠️  User ${EMAIL} already exists (id=${existing.id}). Skipping.`);
    await pool.end();
    return;
  }

  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS);
  const [user] = await db.insert(usersTable).values({
    email: EMAIL,
    passwordHash,
    firstName: "Sofia",
    lastName: "Martinez",
    phone: "+34 612 345 678",
    address: "Calle Gran Vía 28, 3º B",
    city: "Madrid",
    country: "Spain",
  }).returning();
  console.log(`✅ User created: ${user.firstName} ${user.lastName} (id=${user.id})`);

  const [card1] = await db.insert(cardsTable).values({
    userId: user.id,
    cardNumber: generateCardNumber(),
    cardholderName: "SOFIA MARTINEZ",
    expiryMonth: 9,
    expiryYear: 2028,
    cvv: generateCVV(),
    balance: 842.50,
    currency: "EUR",
    status: "active",
    label: "Daily Spending",
    color: "blue",
    createdAt: daysAgo(90),
  }).returning();

  const [card2] = await db.insert(cardsTable).values({
    userId: user.id,
    cardNumber: generateCardNumber(),
    cardholderName: "SOFIA MARTINEZ",
    expiryMonth: 3,
    expiryYear: 2029,
    cvv: generateCVV(),
    balance: 1250.00,
    currency: "EUR",
    status: "active",
    label: "Travel & Hotels",
    color: "green",
    createdAt: daysAgo(60),
  }).returning();

  const [card3] = await db.insert(cardsTable).values({
    userId: user.id,
    cardNumber: generateCardNumber(),
    cardholderName: "SOFIA MARTINEZ",
    expiryMonth: 12,
    expiryYear: 2027,
    cvv: generateCVV(),
    balance: 0,
    currency: "EUR",
    status: "frozen",
    label: "Online Shopping",
    color: "purple",
    createdAt: daysAgo(75),
  }).returning();

  console.log(`✅ Cards created: ${card1.label} (id=${card1.id}), ${card2.label} (id=${card2.id}), ${card3.label} (id=${card3.id})`);

  interface TxDef {
    cardId: number;
    type: string;
    amount: number;
    description: string;
    dayOffset: number;
  }

  const txDefs: TxDef[] = [
    { cardId: card1.id, type: "topup",   amount: 500,    description: "Initial top-up",              dayOffset: 85 },
    { cardId: card1.id, type: "payment", amount: -47.82, description: "Mercadona grocery",            dayOffset: 82 },
    { cardId: card1.id, type: "payment", amount: -12.99, description: "Netflix subscription",         dayOffset: 78 },
    { cardId: card1.id, type: "payment", amount: -3.50,  description: "Café La Bicicleta",            dayOffset: 75 },
    { cardId: card1.id, type: "topup",   amount: 250,    description: "Monthly top-up",               dayOffset: 60 },
    { cardId: card1.id, type: "payment", amount: -89.90, description: "El Corte Inglés — clothing",   dayOffset: 55 },
    { cardId: card1.id, type: "payment", amount: -15.00, description: "Spotify Premium",              dayOffset: 48 },
    { cardId: card1.id, type: "refund",  amount: 89.90,  description: "El Corte Inglés — refund",     dayOffset: 45 },
    { cardId: card1.id, type: "payment", amount: -22.50, description: "Uber Eats delivery",           dayOffset: 38 },
    { cardId: card1.id, type: "payment", amount: -65.00, description: "Renfe train tickets",          dayOffset: 30 },
    { cardId: card1.id, type: "topup",   amount: 300,    description: "Weekly top-up",                dayOffset: 25 },
    { cardId: card1.id, type: "payment", amount: -34.75, description: "Zara online order",            dayOffset: 20 },
    { cardId: card1.id, type: "payment", amount: -8.50,  description: "Glovo food delivery",          dayOffset: 14 },
    { cardId: card1.id, type: "payment", amount: -5.40,  description: "Metro de Madrid pass",         dayOffset: 10 },
    { cardId: card1.id, type: "payment", amount: -18.70, description: "Farmacia online",              dayOffset: 5 },
    { cardId: card1.id, type: "payment", amount: -35.24, description: "Carrefour weekly shop",        dayOffset: 2 },

    { cardId: card2.id, type: "topup",   amount: 1000,   description: "Travel fund top-up",           dayOffset: 55 },
    { cardId: card2.id, type: "payment", amount: -185.00,description: "Iberia flight BCN–LIS",        dayOffset: 50 },
    { cardId: card2.id, type: "payment", amount: -120.00,description: "Airbnb Lisbon — 2 nights",     dayOffset: 45 },
    { cardId: card2.id, type: "payment", amount: -42.50, description: "Restaurant Belcanto, Lisbon",  dayOffset: 43 },
    { cardId: card2.id, type: "topup",   amount: 750,    description: "Extra travel funds",           dayOffset: 35 },
    { cardId: card2.id, type: "payment", amount: -95.00, description: "Hotel Praktik Rambla, BCN",    dayOffset: 28 },
    { cardId: card2.id, type: "payment", amount: -38.00, description: "Sagrada Família tickets",      dayOffset: 27 },
    { cardId: card2.id, type: "refund",  amount: 38.00,  description: "Sagrada Família — reschedule refund", dayOffset: 25 },
    { cardId: card2.id, type: "payment", amount: -57.50, description: "Car rental — Europcar",        dayOffset: 15 },

    { cardId: card3.id, type: "topup",   amount: 200,    description: "Shopping budget",              dayOffset: 70 },
    { cardId: card3.id, type: "payment", amount: -49.99, description: "Amazon Prime annual",          dayOffset: 65 },
    { cardId: card3.id, type: "payment", amount: -29.99, description: "ASOS clothing order",          dayOffset: 50 },
    { cardId: card3.id, type: "payment", amount: -79.90, description: "Apple App Store — apps",       dayOffset: 40 },
    { cardId: card3.id, type: "payment", amount: -19.99, description: "iCloud+ storage plan",         dayOffset: 30 },
    { cardId: card3.id, type: "payment", amount: -20.13, description: "AliExpress accessories",       dayOffset: 20 },
  ];

  const cardBalances: Record<number, number> = {
    [card1.id]: 0,
    [card2.id]: 0,
    [card3.id]: 0,
  };

  const txValues = txDefs
    .sort((a, b) => b.dayOffset - a.dayOffset)
    .map((tx) => {
      const balanceBefore = cardBalances[tx.cardId];
      const balanceAfter = Math.round((balanceBefore + tx.amount) * 100) / 100;
      cardBalances[tx.cardId] = balanceAfter;
      return {
        cardId: tx.cardId,
        userId: user.id,
        type: tx.type,
        amount: Math.abs(tx.amount),
        balanceBefore,
        balanceAfter,
        description: tx.description,
        status: "completed" as const,
        createdAt: daysAgo(tx.dayOffset),
      };
    });

  await db.insert(transactionsTable).values(txValues);
  console.log(`✅ Transactions created: ${txValues.length} entries`);

  console.log(`   Card "${card1.label}" final running balance: €${cardBalances[card1.id].toFixed(2)}`);
  console.log(`   Card "${card2.label}" final running balance: €${cardBalances[card2.id].toFixed(2)}`);
  console.log(`   Card "${card3.label}" final running balance: €${cardBalances[card3.id].toFixed(2)}`);

  await db.insert(supportTicketsTable).values([
    {
      userId: user.id,
      subject: "Transaction not showing on statement",
      message: "Hi, I made a purchase at Mercadona three days ago for €47.82 but it's not appearing in my transaction history for my Daily Spending card. The payment was confirmed on my receipt. Could you please look into this?",
      category: "billing",
      status: "open",
      createdAt: daysAgo(3),
    },
    {
      userId: user.id,
      subject: "Card declined at POS terminal",
      message: "My Travel & Hotels card was declined at a restaurant in Barcelona even though I have sufficient balance. The terminal showed 'Card not authorized'. I've tried twice. Is there a regional block on the card?",
      category: "card",
      status: "in_progress",
      createdAt: daysAgo(8),
    },
    {
      userId: user.id,
      subject: "How do I change my card PIN?",
      message: "I'd like to update the PIN on my Daily Spending card. I can't find the option in the app. Could you guide me through the process or do it on your end?",
      category: "account",
      status: "resolved",
      createdAt: daysAgo(30),
    },
  ]);
  console.log("✅ Support tickets created: 3 entries");

  console.log("\n🎉 Demo user seeded successfully!");
  console.log(`   Email: ${EMAIL}`);
  console.log(`   Password: ${PASSWORD}`);

  await pool.end();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  pool.end();
  process.exit(1);
});
