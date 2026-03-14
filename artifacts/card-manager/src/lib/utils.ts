import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "EUR") {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function formatCardNumber(cardNumber: string) {
  if (!cardNumber) return "**** **** **** ****";
  return `**** **** **** ${cardNumber.slice(-4)}`;
}

export function getCurrencySymbol(currency: string = "EUR"): string {
  const symbols: Record<string, string> = { EUR: "€", USD: "$", GBP: "£" };
  return symbols[currency] || currency;
}
