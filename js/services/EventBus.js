/**
 * Централизованная шина событий
 * ООО "Волга-Днепр Инжиниринг"
 */

class EventBus {
  constructor() {
    this.events = new Map();
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.events.has(event)) {
      this.events.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.events.has(event)) {
      this.events.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  clear() {
    this.events.clear();
  }
}

const eventBus = new EventBus();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EventBus, eventBus };
}