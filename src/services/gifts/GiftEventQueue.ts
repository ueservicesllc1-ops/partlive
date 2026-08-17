import { GiftAnimationEvent } from '../../hooks/useGiftEvents';

export interface QueuedGiftEvent {
  event: GiftAnimationEvent;
  priority: number; // 4 = global, 3 = big, 2 = medium, 1 = small
  addedAt: number;
}

class GiftEventQueueService {
  private queue: QueuedGiftEvent[] = [];
  private processedIds: Set<string> = new Set();
  private maxActiveAnimations: number = 3;
  private currentActiveCount: number = 0;
  private onPlayCallback?: (event: GiftAnimationEvent) => void;

  constructor() {
    // Periodically clean up old processed IDs to free memory
    setInterval(() => {
      if (this.processedIds.size > 200) {
        this.processedIds.clear();
      }
    }, 60000);
  }

  public setPlayCallback(callback: (event: GiftAnimationEvent) => void) {
    this.onPlayCallback = callback;
  }

  public enqueue(event: GiftAnimationEvent): boolean {
    if (!event || !event.id) return false;

    // Deduplication check
    if (this.processedIds.has(event.id)) {
      return false;
    }
    this.processedIds.add(event.id);

    let priority = 1;
    switch (event.animationType) {
      case 'global':
        priority = 4;
        break;
      case 'big':
        priority = 3;
        break;
      case 'medium':
        priority = 2;
        break;
      case 'small':
      default:
        priority = 1;
        break;
    }

    const item: QueuedGiftEvent = {
      event,
      priority,
      addedAt: Date.now(),
    };

    // Insert into priority queue (highest priority first)
    this.queue.push(item);
    this.queue.sort((a, b) => b.priority - a.priority || a.addedAt - b.addedAt);

    this.processQueue();
    return true;
  }

  public processQueue() {
    if (this.currentActiveCount >= this.maxActiveAnimations || this.queue.length === 0) {
      return;
    }

    const nextItem = this.queue.shift();
    if (nextItem && this.onPlayCallback) {
      this.currentActiveCount++;
      this.onPlayCallback(nextItem.event);
    }
  }

  public finishAnimation() {
    if (this.currentActiveCount > 0) {
      this.currentActiveCount--;
    }
    this.processQueue();
  }

  public clearQueue() {
    this.queue = [];
    this.currentActiveCount = 0;
  }
}

export const GiftEventQueue = new GiftEventQueueService();
