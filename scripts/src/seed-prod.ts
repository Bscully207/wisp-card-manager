const BASE_URL = process.env.PROD_API_URL || "https://client-card-manager.replit.app/api";

const USERS = [
  {
    email: "test@testapp.com",
    password: "Test1234",
    firstName: "Sofia",
    lastName: "Martinez",
    phone: "+34 612 345 678",
    profile: {
      firstName: "Sofia",
      lastName: "Martinez",
      phone: "+34 612 345 678",
      address: "Calle Gran Via 28, 3 B",
      city: "Madrid",
      country: "Spain",
    },
    cards: [
      { label: "Daily Spending", color: "blue", currency: "EUR" },
      { label: "Travel & Hotels", color: "green", currency: "EUR" },
      { label: "Online Shopping", color: "purple", currency: "EUR" },
    ],
    freezeCard: "Online Shopping",
    tickets: [
      {
        subject: "Transaction not showing on statement",
        message: "Hi, I made a purchase at Mercadona three days ago for EUR 47.82 but it is not appearing in my transaction history for my Daily Spending card. The payment was confirmed on my receipt. Could you please look into this?",
        category: "billing",
      },
      {
        subject: "Card declined at POS terminal",
        message: "My Travel & Hotels card was declined at a restaurant in Barcelona even though I have sufficient balance. The terminal showed Card not authorized. I have tried twice. Is there a regional block on the card?",
        category: "card",
      },
      {
        subject: "How do I change my card PIN?",
        message: "I would like to update the PIN on my Daily Spending card. I cannot find the option in the app. Could you guide me through the process or do it on your end?",
        category: "account",
      },
    ],
  },
  {
    email: "demo@testapp.com",
    password: "1234",
    firstName: "Alex",
    lastName: "Johnson",
    phone: "+1 415 555 0198",
    profile: {
      firstName: "Alex",
      lastName: "Johnson",
      phone: "+1 415 555 0198",
      address: "742 Evergreen Terrace, Apt 4A",
      city: "San Francisco",
      country: "United States",
    },
    cards: [
      { label: "Everyday Card", color: "blue", currency: "USD" },
      { label: "Savings Reserve", color: "green", currency: "USD" },
      { label: "Subscriptions", color: "purple", currency: "USD" },
    ],
    freezeCard: null,
    tickets: [
      {
        subject: "Duplicate charge on my account",
        message: "I noticed two identical charges of $29.99 on my Everyday Card from Netflix dated March 10. I only have one subscription. Could you investigate and refund the duplicate?",
        category: "billing",
      },
      {
        subject: "Request to increase card limit",
        message: "I would like to increase the spending limit on my Everyday Card. My current limit feels too low for my monthly expenses. What documentation do you need from me?",
        category: "card",
      },
    ],
  },
];

let sessionCookie = "";

async function api(method: string, path: string, body?: unknown): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (sessionCookie) {
    headers["Cookie"] = sessionCookie;
  }

  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });

  const rawSetCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  for (const sc of rawSetCookie) {
    const cookiePart = sc.split(";")[0];
    if (cookiePart.startsWith("connect.sid=")) {
      sessionCookie = cookiePart;
    }
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, data };
}

async function ensureUser(user: typeof USERS[number]): Promise<void> {
  console.log(`Attempting login for ${user.email}...`);
  const loginRes = await api("POST", "/auth/login", { email: user.email, password: user.password });

  if (loginRes.status === 200) {
    console.log("  User already exists, logged in successfully.");
    return;
  }

  console.log("  User not found, registering...");
  const regRes = await api("POST", "/auth/register", {
    email: user.email,
    password: user.password,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
  });

  if (regRes.status === 201) {
    console.log("  Registered successfully.");
  } else if (regRes.status === 409) {
    console.log("  Already registered, logging in...");
    const retryLogin = await api("POST", "/auth/login", { email: user.email, password: user.password });
    if (retryLogin.status !== 200) {
      throw new Error(`Login failed after registration conflict: ${JSON.stringify(retryLogin.data)}`);
    }
  } else {
    throw new Error(`Registration failed: ${regRes.status} ${JSON.stringify(regRes.data)}`);
  }
}

async function updateProfile(profile: typeof USERS[number]["profile"]): Promise<void> {
  console.log("Updating profile...");
  const res = await api("PUT", "/users/profile", profile);

  if (res.status === 200) {
    console.log("  Profile updated.");
  } else {
    console.warn(`  Profile update returned ${res.status}: ${JSON.stringify(res.data)}`);
  }
}

interface CardInfo {
  id: number;
  label: string;
  balance: number;
  status: string;
}

async function ensureCards(expectedCards: typeof USERS[number]["cards"]): Promise<CardInfo[]> {
  console.log("Checking existing cards...");
  const existingRes = await api("GET", "/cards");
  const existing: CardInfo[] = existingRes.status === 200 && Array.isArray(existingRes.data)
    ? existingRes.data.map((c: any) => ({ id: c.id, label: c.label, balance: c.balance, status: c.status }))
    : [];

  const existingLabels = new Set(existing.map(c => c.label));
  const cards: CardInfo[] = [...existing];

  for (const def of expectedCards) {
    if (existingLabels.has(def.label)) {
      console.log(`  Card "${def.label}" already exists, skipping.`);
      continue;
    }
    const res = await api("POST", "/cards", def);
    if (res.status === 201) {
      console.log(`  Created card: ${def.label} (id=${res.data.id})`);
      cards.push({ id: res.data.id, label: def.label, balance: 0, status: res.data.status });
    } else {
      throw new Error(`Failed to create card ${def.label}: ${res.status} ${JSON.stringify(res.data)}`);
    }
  }

  return cards;
}

async function topUpCards(cards: CardInfo[], expectedCards: typeof USERS[number]["cards"]): Promise<void> {
  const cardByLabel = Object.fromEntries(cards.map(c => [c.label, c]));

  const firstCard = cardByLabel[expectedCards[0]?.label];
  const secondCard = cardByLabel[expectedCards[1]?.label];
  const thirdCard = cardByLabel[expectedCards[2]?.label];

  if (!firstCard || !secondCard || !thirdCard) {
    throw new Error("Missing expected cards");
  }

  interface TopUpDef {
    cardId: number;
    amount: number;
    description: string;
    skipIfFrozen?: boolean;
  }

  const topups: TopUpDef[] = [
    { cardId: firstCard.id, amount: 600, description: "Initial top-up" },
    { cardId: firstCard.id, amount: 250, description: "Monthly top-up" },
    { cardId: firstCard.id, amount: 300, description: "Weekly top-up" },
    { cardId: secondCard.id, amount: 1000, description: "Savings deposit" },
    { cardId: secondCard.id, amount: 750, description: "Extra funds" },
    { cardId: thirdCard.id, amount: 200, description: "Subscription budget", skipIfFrozen: true },
  ];

  const alreadyFunded = cards.every(c => c.balance > 0);

  if (alreadyFunded) {
    console.log("Cards already have balances, skipping top-ups.");
    return;
  }

  console.log("Topping up cards...");

  for (const tu of topups) {
    const card = cards.find(c => c.id === tu.cardId);
    if (card && card.status === "frozen" && tu.skipIfFrozen) {
      console.log(`  Skipping top-up for frozen card ${tu.cardId}`);
      continue;
    }
    const res = await api("POST", `/cards/${tu.cardId}/topup`, {
      amount: tu.amount,
      description: tu.description,
    });
    if (res.status === 200) {
      console.log(`  Topped up card ${tu.cardId}: +${tu.amount} (${tu.description})`);
    } else {
      console.warn(`  Top-up failed for card ${tu.cardId}: ${res.status} ${JSON.stringify(res.data)}`);
    }
  }
}

async function freezeCard(cards: CardInfo[], cardLabel: string | null): Promise<void> {
  if (!cardLabel) return;

  const card = cards.find(c => c.label === cardLabel);
  if (!card) return;

  if (card.status === "frozen") {
    console.log(`${cardLabel} card already frozen, skipping.`);
    return;
  }

  console.log(`Freezing ${cardLabel} card...`);
  const res = await api("POST", `/cards/${card.id}/freeze`, { frozen: true });
  if (res.status === 200) {
    console.log("  Card frozen.");
  } else {
    console.warn(`  Freeze failed: ${res.status} ${JSON.stringify(res.data)}`);
  }
}

async function ensureSupportTickets(tickets: typeof USERS[number]["tickets"]): Promise<void> {
  console.log("Checking existing support tickets...");
  const existingRes = await api("GET", "/support/tickets");
  const existing = existingRes.status === 200 && Array.isArray(existingRes.data) ? existingRes.data : [];
  const existingSubjects = new Set(existing.map((t: any) => t.subject));

  let created = 0;
  for (const ticket of tickets) {
    if (existingSubjects.has(ticket.subject)) {
      console.log(`  Ticket "${ticket.subject}" already exists, skipping.`);
      continue;
    }
    const res = await api("POST", "/support/tickets", ticket);
    if (res.status === 201) {
      console.log(`  Created ticket: "${ticket.subject}"`);
      created++;
    } else {
      console.warn(`  Ticket creation failed: ${res.status} ${JSON.stringify(res.data)}`);
    }
  }

  if (created === 0) {
    console.log("  All tickets already exist.");
  }
}

async function seedUser(user: typeof USERS[number]): Promise<void> {
  console.log(`\n--- Seeding user: ${user.email} ---`);
  sessionCookie = "";
  await ensureUser(user);
  await updateProfile(user.profile);
  const cards = await ensureCards(user.cards);
  await topUpCards(cards, user.cards);
  await freezeCard(cards, user.freezeCard);
  await ensureSupportTickets(user.tickets);
}

async function main() {
  console.log(`Seeding production via API: ${BASE_URL}\n`);

  for (const user of USERS) {
    await seedUser(user);
  }

  console.log("\n\nProduction seed complete!");
  for (const user of USERS) {
    console.log(`  ${user.email} / ${user.password}`);
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
