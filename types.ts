
export enum CardType {
  BASIC = 'basic',
  CLOZE = 'cloze'
}

export enum QueueType {
  NEW = 0,
  LEARNING = 1,
  REVIEW = 2,
  RELEARNING = 3
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  createdAt: number;
}

export interface Note {
  id: string;
  deckId: string;
  type: CardType;
  fields: {
    front?: string;
    back?: string;
    text?: string;
    backExtra?: string;
  };
  tags: string[];
  createdAt: number;
}

export interface Card {
  id: string;
  noteId: string;
  deckId: string;
  ordinal: number; // Card index (e.g., 1 for c1, 2 for c2)
  due: number;
  interval: number;
  ease: number;
  repetitions: number;
  lapses: number;
  queue: QueueType;
  lastReviewedAt?: number;
}

export enum Rating {
  AGAIN = 1,
  HARD = 2,
  GOOD = 3,
  EASY = 4
}
