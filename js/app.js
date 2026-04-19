/**
 * Главный файл инициализации приложения
 * ООО "Волга-Днепр Инжиниринг"
 */

class Application {
  constructor() {
    this.initialized = false;
    this.modules = [];
    this.errors = [];
  }

  async init() {
    try {
      
      // 1. Сначала инициализация ComponentLoader для загрузки общих компонентов
      // Это критично, так как все модули зависят от наличия элементов в DOM
      if (typeof ComponentLoader !== 'undefined') {
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
        
        // Подписываемся на событие components:loaded вместо использования setTimeout
        const componentsLoadedPromise = new Promise((resolve) => {
          const onComponentsLoaded = () => {
            document.removeEventListener('components:loaded', onComponentsLoaded);
            resolve();
          };
          document.addEventListener('components:loaded', onComponentsLoaded);
          
          // Инициализируем загрузчик
          ComponentLoader.init({ 
            loadNavbar: true, 
            loadFooter: true, 
            loadModal: true,
            activePage: currentPage === 'index' ? '' : currentPage
          }, () => {
            // Компоненты загружены, событие будет отправлено в ComponentLoader
          });
        });
        
        await componentsLoadedPromise;
      }
      
      // Скрываем лоадер и показываем контент после загрузки компонентов
      this._hidePageLoader();

      this._initGlobalHelpers();
      this._setCurrentYear();
      
      // Повторная регистрация модулей после загрузки компонентов
      this._registerModules();
      
      // Инициализируем модули последовательно с обработкой ошибок
      for (const module of this.modules) {
        try {
          if (module && typeof module.init === 'function') {
            await module.init();
          }
        } catch (err) {
          const errorMsg = `Module ${module.constructor?.name || 'unknown'} init failed: ${err.message}`;
          this.errors.push(errorMsg);
          
          // Отправляем событие об ошибке
          if (window.Services?.eventBus) {
            window.Services.eventBus.emit('module:error', { module: module.constructor?.name, error: err.message });
          }
        }
      }
      
      this._initFloatingCTA();
      this._initImageLazyLoading();
      this._initPrefersReducedMotion();
      
      this.initialized = true;
      
      if (this.errors.length > 0) {
        Logger.WARN('Application initialized with errors:', this.errors);
      }
      
      if (window.Services?.eventBus) {
        window.Services.eventBus.emit('app:ready');
      }
    } catch (error) {
      this._showError(error);
    }
  }

  _registerModules() {
    this.modules = [
      typeof navigationManager !== 'undefined' ? navigationManager : null,
      typeof animationManager !== 'undefined' ? animationManager : null,
      typeof mapManager !== 'undefined' ? mapManager : null,
      typeof formManager !== 'undefined' ? formManager : null,
      typeof newsManager !== 'undefined' ? newsManager : null
    ].filter(m => m != null);
  }

  _initGlobalHelpers() {
    window.scrollToTop = () => {
      if (navigationManager) navigationManager.scrollToTop();
    };
    
    window.toggleMobileMenu = () => {
      if (navigationManager) navigationManager.toggleMobileMenu();
    };
    
    window.openModal = () => {
      if (formManager && typeof formManager.openModal === 'function') {
        formManager.openModal();
      } else if (typeof modalManager !== 'undefined') {
        modalManager.open('form');
      } else {
        Logger.WARN('openModal: Neither formManager nor modalManager is available');
      }
    };
    
    window.closeModal = () => {
      if (typeof modalManager !== 'undefined') modalManager.close('form');
    };
    
    window.removeFile = (event, index) => {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      if (formManager && typeof formManager.removeFile === 'function') {
        // Передаем индекс файла для удаления конкретного файла
        formManager.removeFile(index);
      }
    };
    
    window.closeMobileMenu = () => {
      if (navigationManager) navigationManager.closeMobileMenu();
    };
    
    window.closeAboutModal = () => {
      if (typeof modalManager !== 'undefined') modalManager.close('about');
    };
    
    window.closeDetailsModal = () => {
      if (typeof modalManager !== 'undefined') modalManager.close('details');
    };
    
    window.closeNewsModal = () => {
      if (newsManager && typeof newsManager.closeNewsModal === 'function') {
        newsManager.closeNewsModal();
      } else if (typeof modalManager !== 'undefined') {
        modalManager.close('news');
      }
    };
    
    // Глобальные функции для модального окна политик
    window.closePolicyModal = () => {
      if (typeof ComponentLoader !== 'undefined') {
        ComponentLoader.closePolicyModal();
      }
    };
    
    window.toggleWidget = (header) => {
      const widget = header.closest('.certificate-widget');
      if (widget) {
        widget.classList.toggle('active');
      }
    };
    
    window.openDetailsModal = (title, details) => {
      const modalTitle = document.getElementById('detailsModalTitle');
      const modalList = document.getElementById('detailsModalList');
      
      if (modalTitle && modalList) {
        const sanitizer = window.Utils?.Sanitizer;
        modalTitle.textContent = sanitizer ? sanitizer.escapeHtml(title) : title;
        
        // Создаем список через DOM API вместо innerHTML для безопасности
        modalList.replaceChildren();
        const ul = document.createElement('ul');
        details.forEach(item => {
          const li = document.createElement('li');
          li.textContent = sanitizer ? sanitizer.escapeHtml(item) : item;
          ul.appendChild(li);
        });
        modalList.appendChild(ul);
        // Управление скроллом делегировано ModalManager
        if (typeof modalManager !== 'undefined') modalManager.open('details');
      }
    };
    
    // Универсальный обработчик для открытия модалки "Запросить КП" (DRY)
    document.addEventListener('click', (e) => {
      const modalTrigger = e.target.closest('[data-modal-open="proposal"]');
      if (modalTrigger) {
        e.preventDefault();
        if (typeof modalManager !== 'undefined') {
          modalManager.open('proposal');
        } else {
          Logger.WARN('openProposalModal: ModalManager not available');
        }
      }
      
      // Универсальный обработчик для открытия модалки "Отклик на вакансию" (DRY)
      const applicationTrigger = e.target.closest('[data-modal-open="application"]');
      if (applicationTrigger) {
        e.preventDefault();
        if (window.openApplicationModal) window.openApplicationModal(applicationTrigger);
      }
    });
  }

  _hidePageLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
      // Добавляем класс app-ready на body для показа контента
      document.body.classList.add('app-ready');
      
      // Скрываем лоадер с небольшой задержкой для плавного перехода
      setTimeout(() => {
        loader.classList.add('hidden');
        // Полностью удаляем лоадер из DOM после завершения анимации
        setTimeout(() => {
          loader.style.display = 'none';
        }, 300);
      }, 100);
    }
  }

  _setCurrentYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  }

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
      const isTitleAbove = rect.bottom <= 0; // Заголовок ушел выше экрана

      if (isTitleVisible) {
        floatingBtn.classList.remove('visible');
        hasPassedTitle = false;
        return;
      }

      if (isTitleAbove) {
        hasPassedTitle = true;
        floatingBtn.classList.remove('visible'); // Не показываем кнопку после заголовка
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

  _initImageLazyLoading() {
    // Lazy loading для всех изображений с атрибутом data-src
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.getAttribute('data-src');
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              img.classList.add('loaded');
            }
            imageObserver.unobserve(img);
          }
        });
      }, { rootMargin: '100px' });
      
      lazyImages.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback для старых браузеров
      lazyImages.forEach(img => {
        const src = img.getAttribute('data-src');
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
        }
      });
    }
  }

  _initPrefersReducedMotion() {
    // Проверяем, не хочет ли пользователь отключить анимацию
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion.matches) {
      // Добавляем класс на body для отключения анимаций
      document.body.classList.add('reduced-motion');
      
      // Отключаем все анимации через CSS класс
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
    
    // Следим за изменением настроек
    prefersReducedMotion.addEventListener('change', (e) => {
      if (e.matches) {
        document.body.classList.add('reduced-motion');
      } else {
        document.body.classList.remove('reduced-motion');
      }
    });
  }

  _showError(error) {
    const errorContainer = document.getElementById('appError');
    if (errorContainer) {
      errorContainer.style.display = 'block';
      
      // Создаем элементы через DOM API вместо innerHTML для безопасности
      errorContainer.replaceChildren();
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.style.background = '#f8d7da';
      errorDiv.style.color = '#721c24';
      errorDiv.style.padding = '1rem';
      errorDiv.style.margin = '1rem';
      errorDiv.style.borderRadius = '8px';
      
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
      reloadBtn.style.marginTop = '0.5rem';
      reloadBtn.style.padding = '0.5rem 1rem';
      reloadBtn.style.cursor = 'pointer';
      reloadBtn.textContent = 'Обновить страницу';
      reloadBtn.addEventListener('click', function() {
        window.location.reload();
      });
      errorDiv.appendChild(reloadBtn);
      
      errorContainer.appendChild(errorDiv);
    } else {
      alert('Ошибка загрузки приложения: ' + Utils.Sanitizer.escapeHtml(error.message));
    }
  }
}

// Функция для экранирования HTML (добавляем в Utils, если нет)
if (typeof Utils !== 'undefined' && Utils.DOM && !Utils.DOM.escapeHtml) {
  Utils.DOM.escapeHtml = function(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };
}

// Создание экземпляров глобальных объектов
let newsRenderer, newsManager, formManager;

// Функция инициализации после загрузки всех скриптов
function initApp() {
  
  // Проверяем наличие глобальных объектов
  const hasConfig = typeof window.CONFIG !== 'undefined';
  const hasServices = typeof window.Services !== 'undefined';
  const hasUtils = typeof window.Utils !== 'undefined';
  
  if (!hasConfig || !hasServices || !hasUtils) {
    setTimeout(() => initApp(), 100);
    return;
  }
  
  // 1. Инициализация менеджеров новостей
  if (typeof NEWS_DATA !== 'undefined') {
    try {
      if (typeof NewsRenderer !== 'undefined' && typeof NewsManager !== 'undefined') {
        newsRenderer = new NewsRenderer(NEWS_DATA);
        newsManager = new NewsManager(NEWS_DATA, newsRenderer);
        newsManager.init();
        window.newsManager = newsManager;
        
        // Инициализация роутинга новостей если доступен
        if (typeof NewsNavigation !== 'undefined') {
          NewsNavigation.init(newsManager);
        }
      } else {
        Logger.ERROR('NewsRenderer или NewsManager не определен');
      }
    } catch (err) {
      Logger.ERROR('Ошибка инициализации менеджеров новостей:', err);
    }
  }
  
  // 2. Инициализация FormManager (после ComponentLoader!)
  if (hasServices && hasUtils) {
    try {
      const formRateLimiter = new Utils.RateLimiter(window.Services.storage);
      formManager = new FormManager(
        window.Services.apiClient, 
        formRateLimiter, 
        Utils.Validator
      );
      formManager.init();
      window.formManager = formManager;
      window.openModal = () => formManager.openModal();
    } catch (err) {
      Logger.ERROR('Failed to initialize FormManager:', err);
    }
  } else {
    Logger.WARN('Required services or utils are not available for FormManager initialization');
  }
  
  // 3. Регистрация модальных окон (после ComponentLoader и FormManager)
  if (typeof modalManager !== 'undefined') {
    const modalsToRegister = [
      { key: 'about', overlayId: 'aboutModalOverlay', required: false },
      { key: 'details', overlayId: 'detailsModalOverlay', required: false },
      { key: 'form', overlayId: 'modalOverlay', required: true },
      { 
        key: 'news', 
        overlayId: 'newsModalOverlay',
        required: false,
        onClose: () => {
          // Восстанавливаем базовый URL при закрытии любым способом
          if (window.NewsNavigation) {
            window.NewsNavigation.restoreBaseUrl();
          }
        }
      },
      { key: 'proposal', overlayId: 'proposalModalOverlay', required: false },
      { key: 'universal', overlayId: 'universalApplicationModalOverlay', required: false },
      { key: 'project', overlayId: 'projectModalOverlay', required: false },
      { key: 'service', overlayId: 'serviceModalOverlay', required: false },
      { key: 'policy', overlayId: 'policyModalOverlay', required: false }
    ];
    
    modalsToRegister.forEach(modal => {
      if (!modalManager.modals.has(modal.key)) {
        const overlay = document.getElementById(modal.overlayId);
        if (overlay || modal.required !== false) {
          modalManager.register(modal.key, { overlayId: modal.overlayId, onClose: modal.onClose });
        }
      }
    });
  } else {
    Logger.WARN('modalManager is not defined, skipping modal registration');
  }
  
  // 4. Инициализация DocPreviewManager для страницы документов
  if (typeof DocPreviewManager !== 'undefined') {
    DocPreviewManager.init();
  }
  
  // 5. Запуск основного приложения
  const app = new Application();
  app.init();
}

// Запуск после загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Авторасширение textarea
document.addEventListener('input', function(e) {
  if (e.target.tagName === 'TEXTAREA' && e.target.classList.contains('form-textarea')) {
    e.target.style.height = 'auto';
    e.target.style.height = (e.target.scrollHeight) + 'px';
  }
});