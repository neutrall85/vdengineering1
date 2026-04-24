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
    banner: null,
    settingsIcon: null,
    observer: null,
    recoveryTimer: null,
    eventBus: null
  },

  /**
   * Инициализация менеджера согласий
   */
  init() {
    if (!window.Services?.eventBus) {
      console.error('[ConsentManager] EventBus not available');
      return;
    }

    this.state.eventBus = window.Services.eventBus;
    const storage = window.Services.storage;

    // Проверка существующих согласий
    const consent = this.getConsent(storage);
    if (!consent) {
      this.state.eventBus.emit('preferences:required');
    } else {
      this._applyConsent(consent.categories);
    }

    // Рендеринг UI компонента
    this._render();
    
    // Настройка наблюдения за удалением баннера
    this._setupMutationObserver();

    console.log('[ConsentManager] Initialized with integrated UI');
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
  saveConsent(consent, storage) {
    const consentKey = 'user_preferences_v1';
    const consentData = {
      timestamp: new Date().toISOString(),
      version: this.config.version,
      categories: consent
    };
    
    storage.set(consentKey, consentData);
    this._applyConsent(consent);
    this.state.eventBus.emit('preferences:saved', consentData);
    this.hide();
  },

  /**
   * Отозвать согласие
   */
  withdrawConsent(storage) {
    const consentKey = 'user_preferences_v1';
    storage.remove(consentKey);
    this.state.eventBus.emit('preferences:withdrawn');
    this.show();
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
  _applyConsent(categories) {
    if (categories && !categories.analytics) {
      this._disableAnalytics();
    }
    
    if (categories && !categories.marketing) {
      this.state.eventBus.emit('marketing:disabled');
    }

    this.state.eventBus.emit('preferences:applied', categories);
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
   * Рендеринг UI баннера
   */
  _render() {
    if (document.getElementById('user-notice-banner')) return;

    const categories = this.getCategories();
    const sanitizer = Utils.Sanitizer || { escapeHtml: (str) => str };
    
    const bannerHTML = `
      <div id="user-notice-banner" class="user-notice-banner" role="dialog" aria-modal="true" aria-labelledby="user-notice-title">
        <div class="user-notice-content">
          <!-- Уровень 1: Краткое уведомление -->
          <div class="user-notice-level-1" id="user-notice-level-1">
            <h3 id="user-notice-title" class="user-notice-title">Настройки сайта</h3>
            <p class="user-notice-text">
              Для улучшения работы сайта используются технологии хранения данных (cookie):<br>
            </p>
            <div class="user-notice-buttons">
              <button type="button" class="user-btn user-btn-primary" id="user-accept-all">
                Принять всё
              </button>
              <button type="button" class="user-btn user-btn-secondary" id="user-reject-all">
                Отклонить всё
              </button>
            </div>
            <div class="user-notice-links">
             <a href="#" class="user-privacy-link" id="user-privacy-link">Политика конфиденциальности</a> <a href="#" class="user-cookie-policy-link" id="user-cookie-policy-link">Политика в отношении файлов cookie</a>
            </div>
          </div>
        </div>
        
        <!-- Кнопка отзыва согласия (видима после принятия) -->
        <button type="button" class="user-settings-icon" id="user-settings-icon" title="Настройки">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
        </button>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', bannerHTML);
    this.state.banner = document.getElementById('user-notice-banner');
    this.state.settingsIcon = document.getElementById('user-settings-icon');
    this._attachEvents();
    
    // Подписка на события после рендеринга
    this._subscribeToEvents();
    
    // Проверка состояния после подписки
    const storage = window.Services.storage;
    const consent = this.getConsent(storage);
    if (!consent) {
      this.show();
    }
  },

  /**
   * Подписка на события
   */
  _subscribeToEvents() {
    this.state.eventBus.on('preferences:required', () => this.show());
    this.state.eventBus.on('preferences:saved', () => this.hide());
    this.state.eventBus.on('preferences:withdrawn', () => this.show());
  },

  /**
   * Привязка обработчиков событий
   */
  _attachEvents() {
    const storage = window.Services.storage;
    
    // Кнопки cookie баннера
    document.getElementById('user-accept-all')?.addEventListener('click', () => {
      this.saveConsent({
        functional: true,
        analytics: true,
        marketing: true
      }, storage);
    });

    document.getElementById('user-reject-all')?.addEventListener('click', () => {
      this.saveConsent({
        functional: true,
        analytics: false,
        marketing: false
      }, storage);
    });

    // Ссылка на политику конфиденциальности
    document.getElementById('user-privacy-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof PolicyModalManager !== 'undefined') {
        PolicyModalManager.openPolicyModal('privacy');
      } else {
        Logger.WARN('PolicyModalManager not available for privacy link');
      }
    });

    // Ссылка на политику в отношении файлов cookie
    document.getElementById('user-cookie-policy-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof PolicyModalManager !== 'undefined') {
        PolicyModalManager.openPolicyModal('cookies');
      } else {
        Logger.WARN('PolicyModalManager not available for cookies link');
      }
    });

    // Кнопка отзыва согласия
    document.getElementById('user-settings-icon')?.addEventListener('click', () => {
      this.withdrawConsent(storage);
    });
  },

  /**
   * Показать баннер
   */
  show() {
    if (this.state.banner) {
      this.state.banner.classList.add('active', 'visible');
      this.state.banner.classList.remove('hidden');
    }
  },

  /**
   * Скрыть баннер
   */
  hide() {
    if (this.state.banner) {
      this.state.banner.classList.remove('active');
      this.state.banner.classList.add('hidden');
      this.state.banner.classList.remove('visible');
    }
    
    if (this.state.settingsIcon) {
      this.state.settingsIcon.classList.add('visible');
      this.state.settingsIcon.classList.remove('hidden');
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
        this._render();
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
