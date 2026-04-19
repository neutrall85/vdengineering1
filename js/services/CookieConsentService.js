/**
 * Сервис управления cookie-согласиями
 * Отвечает только за бизнес-логику согласий
 */

class CookieConsentService {
  constructor(storageService, eventBus) {
    this.storage = storageService;
    this.eventBus = eventBus;
    this.consentKey = 'cookie_consent';
    this.config = {
      version: '1.0',
      categories: {
        functional: {
          id: 'functional',
          name: 'Функциональные',
          description: 'Для входа в личный кабинет и работы основных функций',
          required: true
        },
        analytics: {
          id: 'analytics',
          name: 'Аналитические',
          description: 'Для сбора статистики посещений и улучшения сайта',
          required: false
        },
        marketing: {
          id: 'marketing',
          name: 'Маркетинговые',
          description: 'Для показа релевантной рекламы',
          required: false
        }
      }
    };
  }

  init() {
    const consent = this.getConsent();
    if (!consent) {
      this.eventBus.emit('consent:required');
    } else {
      this._applyConsent(consent.categories);
    }
  }

  getConsent() {
    return this.storage.get(this.consentKey, null);
  }

  saveConsent(consent) {
    const consentData = {
      timestamp: new Date().toISOString(),
      version: this.config.version,
      categories: consent
    };
    this.storage.set(this.consentKey, consentData);
    this._applyConsent(consent);
    this.eventBus.emit('consent:saved', consentData);
  }

  withdrawConsent() {
    this.storage.remove(this.consentKey);
    this.eventBus.emit('consent:withdrawn');
  }

  getCategories() {
    return this.config.categories;
  }

  _applyConsent(categories) {
    if (categories && !categories.analytics) {
      this._disableAnalytics();
    }
    
    if (categories && !categories.marketing) {
      this.eventBus.emit('marketing:disabled');
    }

    this.eventBus.emit('consent:applied', categories);
  }

  _disableAnalytics() {
    try {
      const counterId = window.CONFIG?.YANDEX?.METRIKA_COUNTER_ID || '108333042';
      
      if (typeof window.ym !== 'undefined') {
        window.ym(counterId, 'userParams', { analytics_enabled: false });
        window.ym(counterId, 'hit', window.location.href, {
          params: { analytics: 'disabled' }
        });
        Logger.INFO('Yandex Metrica disabled by user');
      }
    } catch (error) {
      Logger.WARN('Error disabling Yandex Metrica:', error.message);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CookieConsentService };
}
