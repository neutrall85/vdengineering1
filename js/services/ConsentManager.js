/**
 * Менеджер согласий пользователя
 * Координирует работу с cookie-баннером и предпочтениями пользователя
 * Единая точка входа для работы с согласиями
 */

const ConsentManager = {
  // Конфигурация категорий согласий
  config: {
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
  },

  // Состояние
  state: {
    preferencesService: null,
    userNoticeUI: null,
    observer: null,
    recoveryTimer: null
  },

  /**
   * Инициализация менеджера согласий
   */
  init() {
    if (!window.Services?.eventBus) {
      console.error('[ConsentManager] EventBus not available');
      return;
    }

    const eventBus = window.Services.eventBus;
    const storage = window.Services.storage;

    // Инициализация UI компонента
    this.state.userNoticeUI = new UserNoticeUI(this, eventBus);

    // Проверка существующих согласий
    const consent = this.getConsent(storage);
    if (!consent) {
      eventBus.emit('preferences:required');
    } else {
      this._applyConsent(consent.categories, eventBus);
    }

    // Запуск UI
    this.state.userNoticeUI.init();
    
    // Настройка наблюдения за удалением баннера
    this._setupMutationObserver();

    console.log('[ConsentManager] Initialized with event-driven architecture');
  },

  /**
   * Получить сохранённые согласия
   */
  getConsent(storage) {
    const consentKey = 'user_preferences_v1';
    return storage.get(consentKey, null);
  },

  /**
   * Сохранить согласия пользователя
   */
  saveConsent(consent, storage, eventBus) {
    const consentKey = 'user_preferences_v1';
    const consentData = {
      timestamp: new Date().toISOString(),
      version: this.config.version,
      categories: consent
    };
    
    storage.set(consentKey, consentData);
    this._applyConsent(consent, eventBus);
    eventBus.emit('preferences:saved', consentData);
  },

  /**
   * Отозвать согласие
   */
  withdrawConsent(storage, eventBus) {
    const consentKey = 'user_preferences_v1';
    storage.remove(consentKey);
    eventBus.emit('preferences:withdrawn');
  },

  /**
   * Получить категории согласий
   */
  getCategories() {
    return this.config.categories;
  },

  /**
   * Применить настройки согласий
   */
  _applyConsent(categories, eventBus) {
    if (categories && !categories.analytics) {
      this._disableAnalytics();
    }
    
    if (categories && !categories.marketing) {
      eventBus.emit('marketing:disabled');
    }

    eventBus.emit('preferences:applied', categories);
  },

  /**
   * Отключить аналитику
   */
  _disableAnalytics() {
    try {
      const counterId = window.CONFIG?.YANDEX?.METRIKA_COUNTER_ID || '108333042';
      
      if (typeof window.ym !== 'undefined') {
        window.ym(counterId, 'userParams', { analytics_enabled: false });
        window.ym(counterId, 'hit', window.location.href, {
          params: { analytics: 'disabled' }
        });
        console.log('[ConsentManager] Analytics disabled by user');
      }
    } catch (error) {
      console.warn('[ConsentManager] Error disabling analytics:', error.message);
    }
  },

  /**
   * MutationObserver для восстановления баннера при удалении блокировщиком
   */
  _setupMutationObserver() {
    const self = this;
    const bannerId = 'user-notice-banner';

    this.state.observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.removedNodes.forEach(function(node) {
          if (node.nodeType === 1 && node.id === bannerId) {
            console.log('[ConsentManager] Banner removed, scheduling recovery...');
            self._scheduleRecovery();
          }
        });
      });
    });

    this.state.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  },

  /**
   * Планирование восстановления баннера через 2 секунды
   */
  _scheduleRecovery() {
    if (this.state.recoveryTimer) {
      clearTimeout(this.state.recoveryTimer);
    }

    const storage = window.Services.storage;
    
    this.state.recoveryTimer = setTimeout(() => {
      const consent = this.getConsent(storage);
      if (!consent && !document.getElementById('user-notice-banner')) {
        console.log('[ConsentManager] Recovering banner...');
        this.state.userNoticeUI.show();
      }
    }, 2000);
  },

  /**
   * Очистка ресурсов при уничтожении
   */
  destroy() {
    if (this.state.observer) {
      this.state.observer.disconnect();
      this.state.observer = null;
    }
    if (this.state.recoveryTimer) {
      clearTimeout(this.state.recoveryTimer);
      this.state.recoveryTimer = null;
    }
  }
};

// Экспорт для модулей
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ConsentManager };
}
