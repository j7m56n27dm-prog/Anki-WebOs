
import { Card, Rating, QueueType } from './types';

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

export class Scheduler {
  static review(card: Card, rating: Rating, now: number = Date.now()): Card {
    const updated = { ...card, lastReviewedAt: now };
    
    // Learning Phase (Queue 0, 1, 3)
    if (card.queue !== QueueType.REVIEW) {
      if (rating === Rating.AGAIN) {
        updated.queue = QueueType.LEARNING;
        updated.due = now + 1 * MINUTE;
        updated.interval = 0;
      } else if (rating === Rating.HARD) {
        updated.due = now + 6 * MINUTE;
      } else if (rating === Rating.GOOD) {
        updated.queue = QueueType.REVIEW;
        updated.interval = 1;
        updated.due = now + 1 * DAY;
      } else if (rating === Rating.EASY) {
        updated.queue = QueueType.REVIEW;
        updated.interval = 4;
        updated.due = now + 4 * DAY;
      }
    } 
    // Review Phase (Queue 2)
    else {
      if (rating === Rating.AGAIN) {
        updated.lapses++;
        updated.queue = QueueType.RELEARNING;
        updated.ease = Math.max(1300, card.ease - 200);
        updated.interval = 0;
        updated.due = now + 1 * MINUTE;
      } else {
        let factor = card.ease / 1000;
        if (rating === Rating.HARD) {
          factor = 1.2;
          updated.ease = Math.max(1300, card.ease - 150);
        } else if (rating === Rating.GOOD) {
          // Keep ease, use full factor
        } else if (rating === Rating.EASY) {
          factor *= 1.3;
          updated.ease += 150;
        }
        
        updated.interval = Math.max(1, Math.ceil(card.interval * factor));
        updated.due = now + updated.interval * DAY;
      }
    }
    
    updated.repetitions++;
    return updated;
  }

  static getEstimate(card: Card, rating: Rating): string {
    if (card.queue !== QueueType.REVIEW) {
      if (rating === Rating.AGAIN) return '<1m';
      if (rating === Rating.HARD) return '6m';
      if (rating === Rating.GOOD) return '1d';
      return '4d';
    }
    
    const factor = card.ease / 1000;
    if (rating === Rating.AGAIN) return '<1m';
    if (rating === Rating.HARD) return Math.ceil(card.interval * 1.2) + 'd';
    if (rating === Rating.GOOD) return Math.ceil(card.interval * factor) + 'd';
    return Math.ceil(card.interval * factor * 1.3) + 'd';
  }
}
