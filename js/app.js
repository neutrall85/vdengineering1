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
      
      await Promise.all(this.modules.map(module => module.init()));
      
      // Инициализация плавающей кнопки
      this._initFloatingCTA();
      
      // Инициализация анимаций для всех fade-in элементов
      this._initFadeInObserver();
      
      // Инициализация счетчиков для всех страниц
      this._initCounters();
      
      this.initialized = true;
      console.log('Application initialized successfully');
      
      eventBus.emit('app:ready');
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
    ];
  }

  _initGlobalHelpers() {
    window.scrollToTop = () => navigationManager.scrollToTop();
    window.toggleMobileMenu = () => navigationManager.toggleMobileMenu();
    window.openModal = () => formManager.openModal();
    window.closeModal = () => modalManager.close('form');
    window.removeFile = (event) => formManager.removeFile();
    window.openAboutModal = () => modalManager.open('about');
    window.closeAboutModal = () => modalManager.close('about');
    window.closeDetailsModal = () => modalManager.close('details');
    window.closeNewsModal = () => modalManager.close('news');
    window.closeMobileMenu = () => navigationManager.closeMobileMenu();
    
    window.toggleWidget = (header) => {
      const widget = header.closest('.certificate-widget');
      if (widget) {
        widget.classList.toggle('active');
      }
    };
    
    window.openDetailsModal = (title, details) => {
      const modalTitle = DOMHelper.getElement('detailsModalTitle');
      const modalList = DOMHelper.getElement('detailsModalList');
      
      if (modalTitle && modalList) {
        modalTitle.textContent = title;
        modalList.innerHTML = details.map(item => `<li>${item}</li>`).join('');
        modalManager.open('details');
      }
    };
  }

  _setCurrentYear() {
    const yearElement = DOMHelper.getElement('currentYear');
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
    const errorContainer = DOMHelper.getElement('appError');
    if (errorContainer) {
      errorContainer.style.display = 'block';
      errorContainer.innerHTML = `
        <div class="error-message">
          <h2>Ошибка загрузки приложения</h2>
          <p>Произошла ошибка при инициализации сайта. Пожалуйста, обновите страницу.</p>
          ${CONFIG.DEBUG ? `<p class="error-details">${error.message}</p>` : ''}
          <button onclick="window.location.reload()">Обновить страницу</button>
        </div>
      `;
    } else {
      alert('Ошибка загрузки приложения: ' + error.message);
    }
  }
}

const app = new Application();

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

// Создание экземпляров
const newsRenderer = new NewsRenderer(NEWS_DATA);
const newsManager = new NewsManager(NEWS_DATA, newsRenderer);
const formManager = new FormManager(apiClient, formRateLimiter, Validator);

// Регистрация дополнительных модальных окон
modalManager.register('about', {
  overlayId: 'aboutModalOverlay'
});

modalManager.register('details', {
  overlayId: 'detailsModalOverlay'
});

modalManager.register('form', {
  overlayId: 'modalOverlay'
});

modalManager.register('news', {
  overlayId: 'newsModalOverlay'
});