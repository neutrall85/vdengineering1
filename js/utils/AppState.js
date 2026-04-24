/**
 * Централизованный менеджер состояния приложения
 * ООО "Волга-Днепр Инжиниринг"
 * 
 *统一管理应用程序状态，避免全局变量分散
 */

const AppState = (function() {
  'use strict';

  /**
   * Начальное состояние приложения
   */
  const defaultState = {
    // Навигация
    navigation: {
      currentPage: '',
      currentSection: '',
      isMobileMenuOpen: false,
      scrollPosition: 0
    },
    
    // UI состояние
    ui: {
      isLoading: false,
      modalOpen: null,
      activeTab: null,
      theme: 'light'
    },
    
    // Устройство
    device: {
      isMobile: false,
      isTablet: false,
      prefersReducedMotion: false
    },
    
    // Данные форм
    forms: {
      submissionCount: 0,
      lastSubmissionTime: null,
      hasErrors: false
    },
    
    // Новости
    news: {
      currentIndex: 0,
      lightboxOpen: false,
      loadedCount: 0
    }
  };

  /**
   * Хранилище состояния
   */
  let state = JSON.parse(JSON.stringify(defaultState));
  
  /**
   * Подписчики на изменения состояния
   */
  const subscribers = new Map();

  /**
   * Ключи для sessionStorage
   */
  const STORAGE_KEYS = {
    THEME: 'app_theme',
    LAST_PAGE: 'app_last_page',
    CONSENT: 'app_consent'
  };

  /**
   * Получить глубокую копию значения по пути
   */
  function getDeepValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Установить глубокое значение по пути
   */
  function setDeepValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Сравнить два объекта на равенство
   */
  function isEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  /**
   * Класс менеджера состояния
   */
  class AppStateManager {
    constructor() {
      this.state = state;
      this._loadFromStorage();
      this._detectDevice();
      this._initMediaQueries();
    }

    /**
     * Получить значение состояния
     * @param {string} key - Путь к ключу (например, 'navigation.currentPage')
     * @param {*} defaultValue - Значение по умолчанию
     * @returns {*} Значение состояния
     */
    getState(key, defaultValue) {
      if (!key) {
        return JSON.parse(JSON.stringify(this.state));
      }
      
      const value = getDeepValue(this.state, key);
      return value !== undefined ? value : defaultValue;
    }

    /**
     * Установить значение состояния
     * @param {string|object} key - Путь к ключу или объект с обновлениями
     * @param {*} value - Новое значение
     * @param {boolean} silent - Не уведомлять подписчиков
     */
    setState(key, value, silent = false) {
      const updates = typeof key === 'object' ? key : { [key]: value };
      const changedKeys = [];

      for (const [path, newValue] of Object.entries(updates)) {
        const currentValue = getDeepValue(this.state, path);
        
        if (!isEqual(currentValue, newValue)) {
          setDeepValue(this.state, path, newValue);
          changedKeys.push(path);
          
          // Сохраняем важные данные в storage
          this._saveToStorageIfNeeded(path, newValue);
        }
      }

      if (!silent && changedKeys.length > 0) {
        this._notifySubscribers(changedKeys);
      }

      return this;
    }

    /**
     * Массовое обновление состояния
     * @param {object} updates - Объект с обновлениями
     * @param {boolean} silent - Не уведомлять подписчиков
     */
    batchUpdate(updates, silent = false) {
      return this.setState(updates, null, silent);
    }

    /**
     * Подписаться на изменения состояния
     * @param {string|string[]} keys - Ключи для подписки
     * @param {function} callback - Функция обратного вызова
     * @returns {function} Функция отписки
     */
    subscribe(keys, callback) {
      const keyList = Array.isArray(keys) ? keys : [keys];
      const subscriptionId = `sub_${Date.now()}_${Math.random()}`;

      subscribers.set(subscriptionId, {
        keys: keyList,
        callback
      });

      // Возвращаем функцию отписки
      return () => {
        subscribers.delete(subscriptionId);
      };
    }

    /**
     * Отписаться от изменений
     * @param {string} subscriptionId - ID подписки
     */
    unsubscribe(subscriptionId) {
      subscribers.delete(subscriptionId);
    }

    /**
     * Сбросить состояние к значению по умолчанию
     * @param {string} key - Ключ для сброса (опционально)
     */
    reset(key) {
      if (key) {
        const defaultValue = getDeepValue(defaultState, key);
        if (defaultValue !== undefined) {
          this.setState(key, defaultValue);
        }
      } else {
        this.state = JSON.parse(JSON.stringify(defaultState));
        this._notifySubscribers(Object.keys(this.state));
      }
    }

    /**
     * Получить снимок текущего состояния
     */
    snapshot() {
      return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * Восстановить состояние из снимка
     */
    restore(snapshot) {
      this.state = JSON.parse(JSON.stringify(snapshot));
      this._notifySubscribers(Object.keys(this.state));
    }

    /**
     * Определить тип устройства
     */
    _detectDevice() {
      const width = window.innerWidth;
      this.setState({
        'device.isMobile': width < 768,
        'device.isTablet': width >= 768 && width < 1024
      }, true);
    }

    /**
     * Инициализировать медиа-запросы для отслеживания изменений
     */
    _initMediaQueries() {
      const mobileQuery = window.matchMedia('(max-width: 767px)');
      const tabletQuery = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

      const handleDeviceChange = () => {
        const width = window.innerWidth;
        this.setState({
          'device.isMobile': width < 768,
          'device.isTablet': width >= 768 && width < 1024
        });
      };

      const handleMotionChange = () => {
        this.setState({
          'device.prefersReducedMotion': reducedMotionQuery.matches
        });
      };

      mobileQuery.addEventListener('change', handleDeviceChange);
      tabletQuery.addEventListener('change', handleDeviceChange);
      reducedMotionQuery.addEventListener('change', handleMotionChange);

      // Инициализация
      handleDeviceChange();
      handleMotionChange();
    }

    /**
     * Сохранить важные данные в sessionStorage
     */
    _saveToStorageIfNeeded(key, value) {
      try {
        switch (key) {
          case 'ui.theme':
            sessionStorage.setItem(STORAGE_KEYS.THEME, value);
            break;
          case 'navigation.currentPage':
            sessionStorage.setItem(STORAGE_KEYS.LAST_PAGE, value);
            break;
        }
      } catch (e) {
        Logger.WARN('Failed to save state to storage:', e.message);
      }
    }

    /**
     * Загрузить данные из sessionStorage
     */
    _loadFromStorage() {
      try {
        const theme = sessionStorage.getItem(STORAGE_KEYS.THEME);
        const lastPage = sessionStorage.getItem(STORAGE_KEYS.LAST_PAGE);

        if (theme) {
          setDeepValue(this.state, 'ui.theme', theme);
        }

        if (lastPage) {
          setDeepValue(this.state, 'navigation.currentPage', lastPage);
        }
      } catch (e) {
        Logger.WARN('Failed to load state from storage:', e.message);
      }
    }

    /**
     * Уведомить подписчиков об изменениях
     */
    _notifySubscribers(changedKeys) {
      subscribers.forEach(({ keys, callback }, id) => {
        const shouldNotify = keys.some(key => 
          changedKeys.some(changedKey => 
            changedKey.startsWith(key) || key.startsWith(changedKey)
          )
        );

        if (shouldNotify) {
          try {
            callback(this.snapshot(), changedKeys);
          } catch (e) {
            Logger.ERROR('Subscriber callback error:', e.message);
          }
        }
      });
    }
  }

  // Создаем единственный экземпляр
  const instance = new AppStateManager();

  // Экспортируем в глобальную область
  window.AppState = instance;
  
  return instance;
})();
