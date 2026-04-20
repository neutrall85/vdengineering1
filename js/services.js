/**
 * Объединённые сервисы: EventBus, StorageService
 * ООО "Волга-Днепр Инжиниринг"
 * 
 * ApiClient вынесен в отдельный файл js/services/api/ApiClient.js
 */

const Services = (function() {
  // ========== Шина событий ==========
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
            Logger.ERROR('EventBus callback error:', error);
          }
        });
      }
    }

    clear() {
      this.events.clear();
    }
  }

  // ========== Хранилище ==========
  class StorageService {
    constructor(storage = localStorage) {
      this.storage = storage;
    }

    get(key, defaultValue = null) {
      try {
        const value = this.storage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
      } catch (error) {
        Logger.WARN('StorageService get error:', error);
        return defaultValue;
      }
    }

    set(key, value) {
      try {
        this.storage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        Logger.ERROR('StorageService set error:', error);
        return false;
      }
    }

    remove(key) {
      try {
        this.storage.removeItem(key);
        return true;
      } catch (error) {
        Logger.ERROR('StorageService remove error:', error);
        return false;
      }
    }

    clear() {
      try {
        this.storage.clear();
        return true;
      } catch (error) {
        Logger.ERROR('StorageService clear error:', error);
        return false;
      }
    }
  }

  // Создаём экземпляры по умолчанию
  const eventBus = new EventBus();
  const storage = new StorageService();

  return { EventBus, StorageService, eventBus, storage };
})();

// Экспортируем в глобальную область
window.Services = Services;
window.eventBus = Services.eventBus;
window.storage = Services.storage;
