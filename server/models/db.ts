import fs from 'fs';
import path from 'path';

// Define DB Models Types
export interface User {
  _id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
  notifications: Array<{
    id: string;
    message: string;
    type: string; // 'cron' | 'info'
    timestamp: string;
    read: boolean;
  }>;
}

export interface Deck {
  _id: string;
  name: string;
  description: string;
  userId: string;
  createdAt: string;
}

export interface Card {
  _id: string;
  deckId: string;
  question: string;
  answer: string;
  repetition: number;
  interval: number; // in days
  efactor: number;
  nextReview: string; // ISO date string
  createdAt: string;
}

interface DatabaseSchema {
  users: User[];
  decks: Deck[];
  cards: Card[];
}

const DB_FILE = path.join(process.cwd(), 'server-db.json');

class FileDatabase {
  private data: DatabaseSchema = {
    users: [],
    decks: [],
    cards: []
  };

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.save();
      }
    } catch (e) {
      console.error('Failed to load file-based DB, initializing empty:', e);
      this.data = { users: [], decks: [], cards: [] };
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save file-based DB to disk:', e);
    }
  }

  // Collection simulation wrappers
  public users = {
    find: async (filter?: Partial<User>): Promise<User[]> => {
      this.load();
      if (!filter) return this.data.users;
      return this.data.users.filter(u => 
        Object.entries(filter).every(([key, val]) => (u as any)[key] === val)
      );
    },
    findOne: async (filter: Partial<User>): Promise<User | null> => {
      this.load();
      return this.data.users.find(u => 
        Object.entries(filter).every(([key, val]) => (u as any)[key] === val)
      ) || null;
    },
    findById: async (id: string): Promise<User | null> => {
      this.load();
      return this.data.users.find(u => u._id === id) || null;
    },
    create: async (payload: Omit<User, '_id' | 'createdAt' | 'notifications'>): Promise<User> => {
      this.load();
      const newUser: User = {
        ...payload,
        _id: 'usr_' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        notifications: [
          {
            id: 'notif_welcome',
            message: `Chào mừng bạn ${payload.name} đến với HustMemo! Bạn đã sẵn sàng học tập chưa?`,
            type: 'info',
            timestamp: new Date().toISOString(),
            read: false
          }
        ]
      };
      this.data.users.push(newUser);
      this.save();
      return newUser;
    },
    findByIdAndUpdate: async (id: string, updates: Partial<User>): Promise<User | null> => {
      this.load();
      const idx = this.data.users.findIndex(u => u._id === id);
      if (idx === -1) return null;
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.save();
      return this.data.users[idx];
    }
  };

  public decks = {
    find: async (filter?: Partial<Deck>): Promise<Deck[]> => {
      this.load();
      if (!filter) return this.data.decks;
      return this.data.decks.filter(d => 
        Object.entries(filter).every(([key, val]) => (d as any)[key] === val)
      );
    },
    findByUser: async (userId: string): Promise<Deck[]> => {
      this.load();
      return this.data.decks.filter(d => d.userId === userId);
    },
    findOne: async (filter: Partial<Deck>): Promise<Deck | null> => {
      this.load();
      return this.data.decks.find(d => 
        Object.entries(filter).every(([key, val]) => (d as any)[key] === val)
      ) || null;
    },
    findById: async (id: string): Promise<Deck | null> => {
      this.load();
      return this.data.decks.find(d => d._id === id) || null;
    },
    create: async (payload: Omit<Deck, '_id' | 'createdAt'>): Promise<Deck> => {
      this.load();
      const newDeck: Deck = {
        ...payload,
        _id: 'deck_' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      };
      this.data.decks.push(newDeck);
      this.save();
      return newDeck;
    },
    findByIdAndUpdate: async (id: string, updates: Partial<Deck>): Promise<Deck | null> => {
      this.load();
      const idx = this.data.decks.findIndex(d => d._id === id);
      if (idx === -1) return null;
      this.data.decks[idx] = { ...this.data.decks[idx], ...updates };
      this.save();
      return this.data.decks[idx];
    },
    findByIdAndDelete: async (id: string): Promise<boolean> => {
      this.load();
      const lenBefore = this.data.decks.length;
      this.data.decks = this.data.decks.filter(d => d._id !== id);
      // Clean up orphaned cards
      this.data.cards = this.data.cards.filter(c => c.deckId !== id);
      this.save();
      return this.data.decks.length < lenBefore;
    }
  };

  public cards = {
    find: async (filter?: Partial<Card>): Promise<Card[]> => {
      this.load();
      if (!filter) return this.data.cards;
      return this.data.cards.filter(c => 
        Object.entries(filter).every(([key, val]) => (c as any)[key] === val)
      );
    },
    findByDeck: async (deckId: string): Promise<Card[]> => {
      this.load();
      return this.data.cards.filter(c => c.deckId === deckId);
    },
    findById: async (id: string): Promise<Card | null> => {
      this.load();
      return this.data.cards.find(c => c._id === id) || null;
    },
    create: async (payload: Omit<Card, '_id' | 'repetition' | 'interval' | 'efactor' | 'nextReview' | 'createdAt'>): Promise<Card> => {
      this.load();
      const newCard: Card = {
        ...payload,
        _id: 'card_' + Math.random().toString(36).substr(2, 9),
        repetition: 0,
        interval: 0,
        efactor: 2.5,
        nextReview: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      this.data.cards.push(newCard);
      this.save();
      return newCard;
    },
    findByIdAndUpdate: async (id: string, updates: Partial<Card>): Promise<Card | null> => {
      this.load();
      const idx = this.data.cards.findIndex(c => c._id === id);
      if (idx === -1) return null;
      this.data.cards[idx] = { ...this.data.cards[idx], ...updates };
      this.save();
      return this.data.cards[idx];
    },
    findByIdAndDelete: async (id: string): Promise<boolean> => {
      this.load();
      const lenBefore = this.data.cards.length;
      this.data.cards = this.data.cards.filter(c => c._id !== id);
      this.save();
      return this.data.cards.length < lenBefore;
    },
    raw: () => {
      this.load();
      return this.data.cards;
    },
    saveRaw: (allCards: Card[]) => {
      this.data.cards = allCards;
      this.save();
    }
  };
}

export const db = new FileDatabase();
