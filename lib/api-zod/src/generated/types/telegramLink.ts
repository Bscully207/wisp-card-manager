export interface TelegramLink {
  id: number;
  cardId: number;
  userId: number;
  telegramId: string;
  telegramUsername?: string | null;
  telegramFirstName?: string | null;
  createdAt: string;
}

export interface TelegramLinkResponse {
  linked: boolean;
  telegramLink?: TelegramLink | null;
}

export interface LinkTelegramRequest {
  telegramId: string;
  telegramUsername?: string;
  telegramFirstName?: string;
}
