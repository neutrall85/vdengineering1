/**
 * Модуль управления предпочтениями пользователя
 * Маскированный путь: /js/modules/preferences.js
 * DRY, KISS, событийная модель
 */

(function() {
  'use strict';

  // Проверка наличия EventBus
  if (!window.Services?.eventBus) {
    console.warn('[Preferences] EventBus not available');
    return;
  }

  const eventBus = window.Services.eventBus;
  const storage = window.Services.storage;

  // Маскированный ключ хранения
  const STORAGE_KEY = 'user_preferences_v1';

  // Конфигурация категорий
  const CONFIG = {
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

  // Получение текущего согласия
  function getConsent() {
    try {
      return storage.get(STORAGE_KEY, null);
    } catch (e) {
      return null;
    }
  }

  // Сохранение согласия
  function saveConsent(consent) {
    const consentData = {
      timestamp: new Date().toISOString(),
      version: CONFIG.version,
      categories: consent
    };

    try {
      storage.set(STORAGE_KEY, consentData);
      applyConsent(consent);
      eventBus.emit('preferences:saved', consentData);
      return true;
    } catch (e) {
      console.error('[Preferences] Save error:', e);
      return false;
    }
  }

  // Отзыв согласия
  function withdrawConsent() {
    try {
      storage.remove(STORAGE_KEY);
      eventBus.emit('preferences:withdrawn');
      return true;
    } catch (e) {
      console.error('[Preferences] Withdraw error:', e);
      return false;
    }
  }

  // Применение настроек
  function applyConsent(categories) {
    if (!categories) return;

    // Отключение аналитики если не разрешена
    if (!categories.analytics) {
      disableAnalytics();
    }

    // Событие для маркетинга
    if (!categories.marketing) {
      eventBus.emit('marketing:disabled');
    }

    eventBus.emit('preferences:applied', categories);
  }

  // Отключение аналитики (Yandex Metrica)
  function disableAnalytics() {
    try {
      const counterId = window.CONFIG?.YANDEX?.METRIKA_COUNTER_ID || '108333042';

      if (typeof window.ym !== 'undefined') {
        window.ym(counterId, 'userParams', { analytics_enabled: false });
        window.ym(counterId, 'hit', window.location.href, {
          params: { analytics: 'disabled' }
        });
        console.log('[Preferences] Analytics disabled');
      }
    } catch (e) {
      console.warn('[Preferences] Error disabling analytics:', e.message);
    }
  }

  // Инициализация модуля
  function init() {
    const consent = getConsent();

    if (!consent) {
      // Согласие не получено - требуется показ баннера
      eventBus.emit('preferences:required');
    } else {
      // Применяем сохранённые настройки
      applyConsent(consent.categories);
    }
  }

  // Экспорт публичного API
  window.UserPreferencesModule = {
    init: init,
    getConsent: getConsent,
    saveConsent: saveConsent,
    withdrawConsent: withdrawConsent,
    getCategories: function() { return CONFIG.categories; },
    applyConsent: applyConsent
  };

  // Авто-инициализация с задержкой
  setTimeout(function() {
    init();
  }, 800 + Math.random() * 700);

})();
