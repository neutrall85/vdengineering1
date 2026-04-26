/**
 * Объединённые сервисы: EventBus, StorageService, ApiClient
 * ООО "Волга-Днепр Инжиниринг"
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
        return defaultValue;
      }
    }

    set(key, value) {
      try {
        this.storage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        return false;
      }
    }

    remove(key) {
      try {
        this.storage.removeItem(key);
        return true;
      } catch (error) {
        return false;
      }
    }

    clear() {
      try {
        this.storage.clear();
        return true;
      } catch (error) {
        return false;
      }
    }
  }

  // ========== API Клиент ==========
  class ApiClient {
    constructor(baseUrl = '') {
      this.baseUrl = baseUrl;
    }

    async post(endpoint, data, options = {}) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 сек таймаут

      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          body: JSON.stringify(data),
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => response.statusText);
          throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Превышено время ожидания ответа сервера (30 сек)');
        }
        throw error;
      }
    }

    async submitForm(data, options = {}) {
      // Имитация отправки на сервер
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Проверяем наличие CSRF токена в заголовках
      if (options.headers && options.headers['X-CSRF-Token']) {
        const csrfToken = options.headers['X-CSRF-Token'];
        // В реальном приложении здесь была бы проверка токена на сервере
        Logger.DEBUG('CSRF Token received:', csrfToken);
      }
      
      return { success: true, message: 'Заявка успешно отправлена' };
    }
  }

  // Создаём экземпляры по умолчанию
  const eventBus = new EventBus();
  const storage = new StorageService();
  const apiClient = new ApiClient();

  return { EventBus, StorageService, ApiClient, eventBus, storage, apiClient };
})();

// Экспортируем только основной объект Services
// Доступ к отдельным сервисам через window.Services.eventBus, window.Services.storage, window.Services.apiClient
window.Services = Services;