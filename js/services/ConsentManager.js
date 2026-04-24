/**
 * Менеджер согласий пользователя
 * Координирует работу сервисов (KISS, DRY, событийная модель)
 * Маскированная загрузка через /js/modules/preferences.js
 */

class ConsentManager {
  constructor() {
    this.preferencesService = null;
    this.userNoticeUI = null;
    this.observer = null;
    this.recoveryTimer = null;
  }

  init() {
    if (!window.Services?.eventBus) {
      console.error('[ConsentManager] EventBus not available');
      return;
    }

    const eventBus = window.Services.eventBus;
    const storage = window.Services.storage;

    // Инициализация сервисов (разделение ответственностей)
    this.preferencesService = new UserPreferencesService(storage, eventBus);
    this.userNoticeUI = new UserNoticeUI(this.preferencesService, eventBus);

    // Запуск сервисов — теперь вызывается из Application.init() без задержки
    this.preferencesService.init();
    this.userNoticeUI.init();
    this._setupMutationObserver();

    console.log('[ConsentManager] Initialized with event-driven architecture');
  }

  /**
   * MutationObserver для восстановления баннера при удалении блокировщиком
   */
  _setupMutationObserver() {
    const self = this;
    const bannerId = 'user-notice-banner';

    this.observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.removedNodes.forEach(function(node) {
          if (node.nodeType === 1 && node.id === bannerId) {
            console.log('[ConsentManager] Banner removed, scheduling recovery...');
            self._scheduleRecovery();
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Планирование восстановления баннера через 2 секунды
   */
  _scheduleRecovery() {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
    }

    this.recoveryTimer = setTimeout(() => {
      const consent = this.preferencesService.getConsent();
      if (!consent && !document.getElementById('user-notice-banner')) {
        console.log('[ConsentManager] Recovering banner...');
        this.userNoticeUI.show();
      }
    }, 2000);
  }

  /**
   * Очистка ресурсов при уничтожении
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }
  }
}

// Экспортируем в глобальную область для использования в index.html
window.ConsentManager = ConsentManager;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ConsentManager };
}