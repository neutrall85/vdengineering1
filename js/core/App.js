/**
 * App - единый класс инициализации приложения с DI
 * ООО "Волга-Днепр Инжиниринг"
 * 
 * Унифицирует инициализацию всех модулей через dependency injection
 * Устраняет проверку typeof и глобальные переменные
 */

class App {
  constructor() {
    this.initialized = false;
    this.modules = new Map();
    this.errors = [];
    this.services = {};
  }

  /**
   * Регистрация сервиса
   * @param {string} name - имя сервиса
   * @param {Object} instance - экземпляр сервиса
   */
  registerService(name, instance) {
    this.services[name] = instance;
    return this;
  }

  /**
   * Получение сервиса
   * @param {string} name - имя сервиса
   * @returns {Object|null}
   */
  getService(name) {
    return this.services[name] || null;
  }

  /**
   * Регистрация модуля
   * @param {string} name - имя модуля
   * @param {Object} module - экземпляр модуля
   */
  registerModule(name, module) {
    this.modules.set(name, module);
    return this;
  }

  /**
   * Инициализация приложения
   * @param {Object} options - опции инициализации
   */
  async init(options = {}) {
    try {
      Logger.INFO('App: Starting initialization...');

      // 1. Инициализация сервисов по умолчанию
      this._initDefaultServices();

      // 2. Загрузка компонентов (header, footer, modals)
      await this._loadComponents(options);

      // 3. Скрытие лоадера
      this._hidePageLoader();

      // 4. Инициализация глобальных хелперов
      this._initGlobalHelpers();

      // 5. Установка текущего года
      this._setCurrentYear();

      // 6. Регистрация модулей
      this._registerModules();

      // 7. Последовательная инициализация модулей
      await this._initModules();

      // 8. Инициализация дополнительных функций
      this._initFloatingCTA();
      this._initPrefersReducedMotion();

      this.initialized = true;

      // 9. Отправка события готовности
      if (this.services.eventBus) {
        this.services.eventBus.emit('app:ready');
      }

      if (this.errors.length > 0) {
        Logger.WARN('App: Initialized with errors:', this.errors);
      }

      Logger.INFO('App: Initialization complete');
    } catch (error) {
      this._showError(error);
    }
  }

  /**
   * Инициализация сервисов по умолчанию
   */
  _initDefaultServices() {
    // Используем уже созданные экземпляры из window.Services
    if (window.Services) {
      this.registerService('eventBus', window.Services.eventBus);
      this.registerService('storage', window.Services.storage);
    }

    // ApiClient создаём новый или используем существующий
    if (window.ApiClient) {
      this.registerService('apiClient', new window.ApiClient());
    } else if (window.Services?.apiClient) {
      this.registerService('apiClient', window.Services.apiClient);
    }
  }

  /**
   * Загрузка компонентов
   */
  async _loadComponents(options) {
    if (typeof ComponentLoader === 'undefined') {
      Logger.WARN('App: ComponentLoader not available');
      return;
    }

    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    
    return new Promise((resolve) => {
      const onComponentsLoaded = () => {
        document.removeEventListener('components:loaded', onComponentsLoaded);
        resolve();
      };
      
      document.addEventListener('components:loaded', onComponentsLoaded);

      ComponentLoader.init({
        loadNavbar: true,
        loadFooter: true,
        loadModal: true,
        activePage: currentPage === 'index' ? '' : currentPage
      });
    });
  }

  /**
   * Скрытие лоадера страницы
   */
  _hidePageLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
      document.body.classList.add('app-ready');
      
      setTimeout(() => {
        loader.classList.add('hidden');
        setTimeout(() => {
          loader.style.display = 'none';
        }, 300);
      }, 100);
    }
  }

  /**
   * Инициализация глобальных хелперов
   */
  _initGlobalHelpers() {
    // scrollToTop
    window.scrollToTop = () => {
      const navManager = this.getService('navigationManager');
      if (navManager && typeof navManager.scrollToTop === 'function') {
        navManager.scrollToTop();
      }
    };

    // toggleMobileMenu
    window.toggleMobileMenu = () => {
      const navManager = this.getService('navigationManager');
      if (navManager && typeof navManager.toggleMobileMenu === 'function') {
        navManager.toggleMobileMenu();
      }
    };

    // closeMobileMenu
    window.closeMobileMenu = () => {
      const navManager = this.getService('navigationManager');
      if (navManager && typeof navManager.closeMobileMenu === 'function') {
        navManager.closeMobileMenu();
      }
    };

    // openModal/closeModal - делегируем ModalManager
    window.openModal = () => {
      if (typeof modalManager !== 'undefined') {
        modalManager.open('form');
      }
    };

    window.closeModal = () => {
      if (typeof modalManager !== 'undefined') {
        modalManager.close('form');
      }
    };

    // removeFile - делегируем FormManager
    window.removeFile = (event, index) => {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      const formManager = this.getService('formManager');
      if (formManager && typeof formManager.removeFile === 'function') {
        formManager.removeFile(index);
      }
    };

    // closeAboutModal
    window.closeAboutModal = () => {
      if (typeof modalManager !== 'undefined') {
        modalManager.close('about');
      }
    };

    // closeDetailsModal
    window.closeDetailsModal = () => {
      if (typeof modalManager !== 'undefined') {
        modalManager.close('details');
      }
    };

    // closeNewsModal
    window.closeNewsModal = () => {
      const newsManager = this.getService('newsManager');
      if (newsManager && typeof newsManager.closeNewsModal === 'function') {
        newsManager.closeNewsModal();
      } else if (typeof modalManager !== 'undefined') {
        modalManager.close('news');
      }
    };

    // closePolicyModal
    window.closePolicyModal = () => {
      if (typeof ComponentLoader !== 'undefined') {
        ComponentLoader.closePolicyModal();
      }
    };

    // toggleWidget
    window.toggleWidget = (header) => {
      const widget = header?.closest('.certificate-widget');
      if (widget) {
        widget.classList.toggle('active');
      }
    };

    // openDetailsModal - безопасное открытие модалки деталей
    window.openDetailsModal = (title, details) => {
      const modalTitle = document.getElementById('detailsModalTitle');
      const modalList = document.getElementById('detailsModalList');

      if (modalTitle && modalList) {
        modalTitle.textContent = Utils.Sanitizer.escapeHtml(title);
        modalList.replaceChildren();
        
        const ul = document.createElement('ul');
        details.forEach(item => {
          const li = document.createElement('li');
          li.textContent = Utils.Sanitizer.escapeHtml(item);
          ul.appendChild(li);
        });
        
        modalList.appendChild(ul);
        
        if (typeof modalManager !== 'undefined') {
          modalManager.open('details');
        }
      }
    };

    // Универсальный обработчик кликов для модалок
    document.addEventListener('click', (e) => {
      // Открытие модалки "Запросить КП"
      const proposalTrigger = e.target.closest('[data-modal-open="proposal"]');
      if (proposalTrigger) {
        e.preventDefault();
        if (typeof modalManager !== 'undefined') {
          modalManager.open('proposal');
        }
      }

      // Открытие модалки "Отклик на вакансию"
      const applicationTrigger = e.target.closest('[data-modal-open="application"]');
      if (applicationTrigger && typeof window.openApplicationModal === 'function') {
        e.preventDefault();
        window.openApplicationModal(applicationTrigger);
      }
    });
  }

  /**
   * Установка текущего года в футере
   */
  _setCurrentYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  }

  /**
   * Регистрация модулей
   */
  _registerModules() {
    // Навигация
    if (typeof navigationManager !== 'undefined') {
      this.registerModule('navigationManager', navigationManager);
      this.registerService('navigationManager', navigationManager);
    }

    // Анимации
    if (typeof animationManager !== 'undefined') {
      this.registerModule('animationManager', animationManager);
    }

    // Карта
    if (typeof mapManager !== 'undefined') {
      this.registerModule('mapManager', mapManager);
    }

    // Формы
    if (typeof formManager !== 'undefined') {
      this.registerModule('formManager', formManager);
      this.registerService('formManager', formManager);
    }

    // Новости
    if (typeof newsManager !== 'undefined') {
      this.registerModule('newsManager', newsManager);
      this.registerService('newsManager', newsManager);
    }

    // DocPreviewManager
    if (typeof DocPreviewManager !== 'undefined') {
      this.registerModule('docPreviewManager', DocPreviewManager);
    }

    // ConsentManager
    if (typeof consentManager !== 'undefined') {
      this.registerModule('consentManager', consentManager);
    }
  }

  /**
   * Инициализация модулей
   */
  async _initModules() {
    for (const [name, module] of this.modules) {
      try {
        if (module && typeof module.init === 'function') {
          await module.init();
          Logger.INFO(`App: Module ${name} initialized`);
        }
      } catch (error) {
        const errorMsg = `Module ${name} init failed: ${error.message}`;
        this.errors.push(errorMsg);
        Logger.ERROR(errorMsg, error);

        if (this.services.eventBus) {
          this.services.eventBus.emit('module:error', { module: name, error: error.message });
        }
      }
    }
  }

  /**
   * Инициализация плавающей CTA кнопки
   */
  _initFloatingCTA() {
    const floatingBtn = document.querySelector('.floating-cta-btn');
    const commercialOfferTitle = document.querySelector('#commercial-offer-title');

    if (!floatingBtn) return;

    let hasPassedTitle = false;

    const toggleButton = () => {
      const scrollY = window.scrollY;

      if (scrollY <= 350) {
        floatingBtn.classList.remove('visible');
        hasPassedTitle = false;
        return;
      }

      if (!commercialOfferTitle) {
        floatingBtn.classList.add('visible');
        return;
      }

      const rect = commercialOfferTitle.getBoundingClientRect();
      const isTitleVisible = rect.top < window.innerHeight && rect.bottom > 0;
      const isTitleAbove = rect.bottom <= 0;

      if (isTitleVisible) {
        floatingBtn.classList.remove('visible');
        hasPassedTitle = false;
        return;
      }

      if (isTitleAbove) {
        hasPassedTitle = true;
        floatingBtn.classList.remove('visible');
        return;
      }

      if (!hasPassedTitle) {
        floatingBtn.classList.add('visible');
      } else {
        floatingBtn.classList.remove('visible');
      }
    };

    toggleButton();
    window.addEventListener('scroll', toggleButton, { passive: true });
  }

  /**
   * Инициализация предпочтений reduced motion
   */
  _initPrefersReducedMotion() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (prefersReducedMotion.matches) {
      document.body.classList.add('reduced-motion');

      const style = document.createElement('style');
      style.textContent = `
        .reduced-motion *,
        .reduced-motion *::before,
        .reduced-motion *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      `;
      document.head.appendChild(style);
    }

    prefersReducedMotion.addEventListener('change', (e) => {
      if (e.matches) {
        document.body.classList.add('reduced-motion');
      } else {
        document.body.classList.remove('reduced-motion');
      }
    });
  }

  /**
   * Показ ошибки
   */
  _showError(error) {
    const errorContainer = document.getElementById('appError');
    if (errorContainer) {
      errorContainer.style.display = 'block';
      errorContainer.replaceChildren();
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.style.cssText = 'background:#f8d7da;color:#721c24;padding:1rem;margin:1rem;border-radius:8px;';

      const h2 = document.createElement('h2');
      h2.textContent = 'Ошибка загрузки приложения';
      errorDiv.appendChild(h2);

      const p1 = document.createElement('p');
      p1.textContent = 'Произошла ошибка при инициализации сайта. Пожалуйста, обновите страницу.';
      errorDiv.appendChild(p1);

      const p2 = document.createElement('p');
      p2.style.fontSize = '0.85rem';
      p2.style.marginTop = '0.5rem';
      p2.textContent = Utils.Sanitizer.escapeHtml(error.message);
      errorDiv.appendChild(p2);

      const reloadBtn = document.createElement('button');
      reloadBtn.id = 'reloadErrorBtn';
      reloadBtn.style.cssText = 'margin-top:0.5rem;padding:0.5rem 1rem;cursor:pointer;';
      reloadBtn.textContent = 'Обновить страницу';
      reloadBtn.addEventListener('click', () => window.location.reload());
      errorDiv.appendChild(reloadBtn);

      errorContainer.appendChild(errorDiv);
    } else {
      alert('Ошибка загрузки приложения: ' + Utils.Sanitizer.escapeHtml(error.message));
    }
  }
}

// Экспортируем в глобальную область
if (typeof window !== 'undefined') {
  window.App = App;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
}
