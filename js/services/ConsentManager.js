/**
 * Менеджер cookie-согласий
 * Координирует работу сервисов (KISS, DRY, событийная модель)
 */

class ConsentManager {
  constructor() {
    this.consentService = null;
    this.consentUI = null;
  }

  init() {
    if (!window.Services?.eventBus) {
      Logger.ERROR('EventBus not available for ConsentManager');
      return;
    }

    const eventBus = window.Services.eventBus;
    const storage = window.Services.storage;

    // Инициализация сервисов (разделение ответственностей)
    this.consentService = new CookieConsentService(storage, eventBus);
    this.consentUI = new CookieConsentUI(this.consentService, eventBus);

    // Запуск сервисов
    this.consentService.init();
    this.consentUI.init();

    Logger.INFO('ConsentManager initialized with event-driven architecture');
  }
}

// Экспортируем в глобальную область для использования в index.html
window.ConsentManager = ConsentManager;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ConsentManager };
}