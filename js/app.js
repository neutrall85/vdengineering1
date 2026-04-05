/**
 * Главный файл инициализации приложения
 * ООО "Волга-Днепр Инжиниринг"
 */

class Application {
  constructor() {
    this.initialized = false;
    this.modules = [];
  }

  async init() {
    try {
      console.log('Initializing Volga-Dnepr Engineering website...');
      
      this._registerModules();
      this._initGlobalHelpers();
      this._setCurrentYear();
      
      // Инициализируем модули последовательно
      for (const module of this.modules) {
        try {
          if (module && typeof module.init === 'function') {
            await module.init();
          }
        } catch (err) {
          console.warn(`Module ${module.constructor?.name || 'unknown'} init failed:`, err);
        }
      }
      
      this._initFloatingCTA();
      this._initFadeInObserver();
      this._initCounters();
      
      this.initialized = true;
      console.log('Application initialized successfully');
      
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
      navigationManager,
      animationManager,
      mapManager,
      formManager,
      newsManager
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
      if (formManager) formManager.openModal();
    };
    window.closeModal = () => {
      if (typeof modalManager !== 'undefined') modalManager.close('form');
    };
    window.removeFile = (event) => {
      if (formManager) formManager.removeFile();
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
      if (typeof modalManager !== 'undefined') modalManager.close('news');
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
        modalTitle.textContent = title;
        modalList.innerHTML = details.map(item => `<li>${item}</li>`).join('');
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
    if (!floatingBtn) return;
    
    const toggleButton = () => {
      if (window.scrollY > 300) {
        floatingBtn.classList.add('visible');
      } else {
        floatingBtn.classList.remove('visible');
      }
    };
    
    toggleButton();
    window.addEventListener('scroll', toggleButton);
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

  _initCounters() {
    const counters = document.querySelectorAll('.stat-number[data-target]');
    
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const target = parseInt(element.getAttribute('data-target'), 10);
          if (!target || isNaN(target)) return;
          
          let current = 0;
          const step = target / 50;
          
          const updateCounter = () => {
            current += step;
            if (current < target) {
              element.textContent = Math.floor(current);
              requestAnimationFrame(updateCounter);
            } else {
              element.textContent = target;
            }
          };
          
          updateCounter();
          counterObserver.unobserve(element);
        }
      });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => counterObserver.observe(counter));
  }

  _showError(error) {
    const errorContainer = document.getElementById('appError');
    if (errorContainer) {
      errorContainer.style.display = 'block';
      errorContainer.innerHTML = `
        <div class="error-message" style="background:#f8d7da;color:#721c24;padding:1rem;margin:1rem;border-radius:8px;">
          <h2>Ошибка загрузки приложения</h2>
          <p>Произошла ошибка при инициализации сайта. Пожалуйста, обновите страницу.</p>
          <button onclick="window.location.reload()" style="margin-top:0.5rem;padding:0.5rem 1rem;cursor:pointer;">Обновить страницу</button>
        </div>
      `;
    } else {
      alert('Ошибка загрузки приложения: ' + error.message);
    }
  }
}

// Создание экземпляров глобальных объектов
let newsRenderer, newsManager, formManager;

// Функция инициализации после загрузки всех скриптов
function initApp() {
  if (typeof NEWS_DATA !== 'undefined') {
    newsRenderer = new NewsRenderer(NEWS_DATA);
    newsManager = new NewsManager(NEWS_DATA, newsRenderer);
  }
  
  if (window.Services?.apiClient && window.Utils?.RateLimiter && window.Utils?.Validator) {
    const formRateLimiter = new window.Utils.RateLimiter(window.Services.storage);
    formManager = new FormManager(window.Services.apiClient, formRateLimiter, window.Utils.Validator);
  }
  
  // Регистрация модальных окон (только один раз)
  if (typeof modalManager !== 'undefined') {
    // Проверяем, не зарегистрированы ли уже
    if (!modalManager.modals.has('about')) {
      modalManager.register('about', { overlayId: 'aboutModalOverlay' });
    }
    if (!modalManager.modals.has('details')) {
      modalManager.register('details', { overlayId: 'detailsModalOverlay' });
    }
    if (!modalManager.modals.has('form')) {
      modalManager.register('form', { overlayId: 'modalOverlay' });
    }
    if (!modalManager.modals.has('news')) {
      modalManager.register('news', { overlayId: 'newsModalOverlay' });
    }
  }
  
  const app = new Application();
  app.init();
}

// Запуск после загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}