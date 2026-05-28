export interface UserNotification {
  id: string;
  message: string;
  type: string; // 'cron' | 'info'
  timestamp: string;
  read: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  notifications?: UserNotification[];
}

export interface Deck {
  _id: string;
  name: string;
  description: string;
  userId: string;
  createdAt: string;
  cardCount?: number;
  dueCount?: number;
}

export interface Card {
  _id: string;
  deckId: string;
  question: string;
  answer: string;
  repetition: number;
  interval: number;
  efactor: number;
  nextReview: string;
  createdAt: string;
}

export type ViewState = 'landing' | 'dashboard' | 'deck-detail' | 'study-session' | 'create-with-ai';
