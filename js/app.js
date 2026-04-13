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
      console.log('Initializing Volga-Dnepr Engineering website...');
      
      // 1. Сначала инициализация ComponentLoader для загрузки общих компонентов
      // Это критично, так как все модули зависят от наличия элементов в DOM
      if (typeof ComponentLoader !== 'undefined') {
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
        ComponentLoader.init({ 
          loadNavbar: true, 
          loadFooter: true, 
          loadModal: true,
          activePage: currentPage === 'index' ? '' : currentPage
        });
        console.log('ComponentLoader initialized');
        
        // Ждём пока элементы навигации появятся в DOM
        await new Promise((resolve) => {
          const checkNavElements = () => {
            const nav = document.getElementById('navbar');
            const mobileMenu = document.getElementById('mobileMenu');
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
            
            if (nav && mobileMenu && mobileMenuBtn && mobileMenuOverlay) {
              console.log('Navigation elements found in DOM');
              resolve();
            } else {
              console.log('Waiting for navigation elements...', { nav: !!nav, mobileMenu: !!mobileMenu, mobileMenuBtn: !!mobileMenuBtn, mobileMenuOverlay: !!mobileMenuOverlay });
              setTimeout(checkNavElements, 50);
            }
          };
          checkNavElements();
        });
      }

      this._initGlobalHelpers();
      this._setCurrentYear();
      
      // Повторная регистрация модулей после загрузки компонентов
      this._registerModules();
      
      // Инициализируем модули последовательно с обработкой ошибок
      for (const module of this.modules) {
        try {
          if (module && typeof module.init === 'function') {
            await module.init();
            console.log(`Module ${module.constructor?.name || 'unknown'} initialized`);
          }
        } catch (err) {
          const errorMsg = `Module ${module.constructor?.name || 'unknown'} init failed: ${err.message}`;
          console.warn(errorMsg, err);
          this.errors.push(errorMsg);
          
          // Отправляем событие об ошибке
          if (window.Services?.eventBus) {
            window.Services.eventBus.emit('module:error', { module: module.constructor?.name, error: err.message });
          }
        }
      }
      
      this._initFloatingCTA();
      this._initFadeInObserver();
      this._initImageLazyLoading();
      this._initPrefersReducedMotion();
      
      this.initialized = true;
      console.log('Application initialized successfully');
      
      if (this.errors.length > 0) {
        console.warn('Application initialized with errors:', this.errors);
      }
      
      if (window.Services?.eventBus) {
        window.Services.eventBus.emit('app:ready');
      }
    } catch (error) {
      console.error('Application initialization failed:', error);
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
    
    console.log(`Registered ${this.modules.length} modules`);
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
        console.warn('FormManager not ready, opening modal directly');
        modalManager.open('form');
      } else {
        console.error('No modal manager available');
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
        modalList.innerHTML = details.map(item => `<li>${sanitizer ? sanitizer.escapeHtml(item) : item}</li>`).join('');
        // Управление скроллом делегировано ModalManager
        if (typeof modalManager !== 'undefined') modalManager.open('details');
      }
    };
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

  _initFadeInObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '50px' });
    
    document.querySelectorAll('.fade-in').forEach(el => {
      observer.observe(el);
    });
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
      errorContainer.innerHTML = `
        <div class="error-message" style="background:#f8d7da;color:#721c24;padding:1rem;margin:1rem;border-radius:8px;">
          <h2>Ошибка загрузки приложения</h2>
          <p>Произошла ошибка при инициализации сайта. Пожалуйста, обновите страницу.</p>
          <p style="font-size:0.85rem;margin-top:0.5rem;">${Utils.DOM.escapeHtml(error.message)}</p>
          <button onclick="window.location.reload()" style="margin-top:0.5rem;padding:0.5rem 1rem;cursor:pointer;">Обновить страницу</button>
        </div>
      `;
    } else {
      console.error('Fatal error:', error);
      alert('Ошибка загрузки приложения: ' + error.message);
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
  console.log('initApp started');
  
  // Проверяем наличие глобальных объектов
  const hasConfig = typeof window.CONFIG !== 'undefined';
  const hasServices = typeof window.Services !== 'undefined';
  const hasUtils = typeof window.Utils !== 'undefined';
  
  console.log('Dependencies:', { hasConfig, hasServices, hasUtils });
  
  if (!hasConfig || !hasServices || !hasUtils) {
    console.error('Missing required dependencies!');
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
        console.log('News modules initialized');
      } else {
        console.warn('NewsRenderer or NewsManager not loaded, news will be disabled');
      }
    } catch (err) {
      console.error('News modules initialization failed:', err);
    }
  }
  
  // 2. Инициализация FormManager (после ComponentLoader!)
  if (hasServices && hasUtils) {
    try {
      const formRateLimiter = new window.Utils.RateLimiter(window.Services.storage);
      formManager = new FormManager(
        window.Services.apiClient, 
        formRateLimiter, 
        window.Utils.Validator
      );
      formManager.init();
      window.formManager = formManager;
      console.log('FormManager initialized');
    } catch (err) {
      console.error('FormManager initialization failed:', err);
    }
  } else {
    console.warn('Services or Utils not fully loaded, FormManager not initialized');
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
      { key: 'project', overlayId: 'projectModalOverlay', required: false },
      { key: 'service', overlayId: 'serviceModalOverlay', required: false }
    ];
    
    modalsToRegister.forEach(modal => {
      if (!modalManager.modals.has(modal.key)) {
        const overlay = document.getElementById(modal.overlayId);
        if (overlay || modal.required !== false) {
          modalManager.register(modal.key, { overlayId: modal.overlayId, onClose: modal.onClose });
        }
      }
    });
    console.log('Modals registered');
  } else {
    console.error('ModalManager not found!');
  }
  
  // 4. Запуск основного приложения
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