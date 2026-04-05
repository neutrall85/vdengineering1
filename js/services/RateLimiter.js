/**
 * Лимитирование запросов
 * ООО "Волга-Днепр Инжиниринг"
 */

class RateLimiter {
  constructor(storage, key = 'lastFormSubmit', limitMs = CONFIG.FORM.RATE_LIMIT_MS) {
    this.storage = storage;
    this.key = key;
    this.limitMs = limitMs;
  }

  canProceed() {
    const lastSubmit = this.storage.get(this.key);
    if (!lastSubmit) return true;
    return Date.now() - lastSubmit >= this.limitMs;
  }

  record() {
    this.storage.set(this.key, Date.now());
    return this;
  }

  reset() {
    this.storage.remove(this.key);
    return this;
  }

  getRemainingTime() {
    const lastSubmit = this.storage.get(this.key);
    if (!lastSubmit) return 0;
    const elapsed = Date.now() - lastSubmit;
    return Math.max(0, this.limitMs - elapsed);
  }
}

const formRateLimiter = new RateLimiter(storage);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RateLimiter, formRateLimiter };
}