export type EventHandler<T> = (...events: T[]) => void;
export type Unsubscriber = () => void;

export class EventEmitter {
  listeners: EventHandler<any>[] = [];

  emit<T>(...events: T[]): void {
    for (const handler of this.listeners) {
      if (typeof handler === 'function') {
        handler(...events);
      }
    }
  }

  subscribe<T>(handler: EventHandler<T>): Unsubscriber {
    if (Array.isArray(this.listeners)) {
      if (typeof handler === 'function' && !this.listeners.includes(handler)) {
        this.listeners.push(handler);
        return () => this.unsubscribe(handler);
      }
    }
  }

  unsubscribe<T>(handler: EventHandler<T>): void {
    if (Array.isArray(this.listeners)) {
      this.listeners.splice(this.listeners.indexOf(handler), 1);
    }
  }
}
