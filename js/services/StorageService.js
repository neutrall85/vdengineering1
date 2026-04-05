/**
 * Абстракция для работы с хранилищем
 * ООО "Волга-Днепр Инжиниринг"
 */

class StorageService {
  constructor(storage = localStorage) {
    this.storage = storage;
  }

  get(key, defaultValue = null) {
    try {
      const value = this.storage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  set(key, value) {
    try {
      this.storage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  remove(key) {
    try {
      this.storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  clear() {
    try {
      this.storage.clear();
      return true;
    } catch {
      return false;
    }
  }
}

const storage = new StorageService();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StorageService, storage };
}