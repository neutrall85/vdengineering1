/**
 * Управление навигацией
 * ООО "Волга-Днепр Инжиниринг"
 */

class NavigationManager {
  constructor() {
    this.scrollThreshold = window.CONFIG?.NAVIGATION?.SCROLL_HEADER_THRESHOLD || 100;
    this.scrollTopThreshold = window.CONFIG?.NAVIGATION?.SCROLL_TOP_THRESHOLD || 500;
    this.swipeThreshold = 50;
    this.navbar = null;
    this.scrollToTopBtn = null;
    this.mobileMenu = null;
    this.mobileMenuBtn = null;
    this.mobileMenuOverlay = null;
    this.scrollHandler = null;
    this.resizeHandler = null;
    this.touchStartX = 0;
    this.touchCurrentX = 0;
  }

  init() {
    try {
      // Ждём пока ComponentLoader загрузит навигацию
      const checkElements = () => {
        this.navbar = Utils.DOM.getElement('navbar');
        this.scrollToTopBtn = Utils.DOM.getElement('scrollToTop');
        this.mobileMenu = Utils.DOM.getElement('mobileMenu');
        this.mobileMenuBtn = Utils.DOM.getElement('mobileMenuBtn');
        this.mobileMenuOverlay = Utils.DOM.getElement('mobileMenuOverlay');
        
        if (!this.navbar || !this.mobileMenu || !this.mobileMenuBtn) {
          Logger.WARN('Navigation elements not found, retrying...');
          setTimeout(checkElements, 100);
          return;
        }
        
        this._initSmoothScroll();
        this._initScrollHandler();
        this._initMobileMenu();
        this._handleScroll();
        
        Logger.INFO('NavigationManager initialized');
      };
      
      // Начинаем проверку элементов
      checkElements();
    } catch (error) {
      Logger.ERROR('NavigationManager init failed:', error);
    }
  }

  _initSmoothScroll() {
    document.querySelectorAll('a[href^="#"], a[href*="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#') return;
        
        try {
          // Извлекаем хэш из URL (например, #partners из index.html#partners)
          const hashIndex = href.indexOf('#');
          if (hashIndex === -1) return;
          
          const hash = href.substring(hashIndex);
          const target = Utils.DOM.query(hash);
          
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } catch (error) {
          Logger.WARN('Smooth scroll error:', error);
        }
      });
    });
    
    // Обработка кликов на ссылки в мобильном меню
    if (this.mobileMenu) {
      this.mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
          // Закрываем меню только если это не якорная ссылка на текущей странице
          const href = link.getAttribute('href');
          if (href && (href.startsWith('#') || href.includes(window.location.pathname))) {
            setTimeout(() => this.closeMobileMenu(), 300);
          }
        });
      });
    }
  }

  _initScrollHandler() {
    let scrollTimeout;
    let resizeTimeout;
    
    this.scrollHandler = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => this._handleScroll(), window.CONFIG?.PERFORMANCE?.SCROLL_DEBOUNCE_MS || 10);
    };
    
    this.resizeHandler = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this._handleResize(), window.CONFIG?.PERFORMANCE?.RESIZE_DEBOUNCE_MS || 150);
    };
    
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    window.addEventListener('resize', this.resizeHandler);
  }

  _handleResize() {
    // Обработка изменения размера окна
    if (window.innerWidth > 1048 && this.mobileMenu && this.mobileMenu.classList.contains('active')) {
      this.closeMobileMenu();
    }
  }

  _handleScroll() {
    const scrollY = window.scrollY;
    
    if (this.navbar) {
      if (scrollY > this.scrollThreshold) {
        Utils.DOM.addClass(this.navbar, 'scrolled');
      } else {
        Utils.DOM.removeClass(this.navbar, 'scrolled');
      }
    }
    
    if (this.scrollToTopBtn) {
      if (scrollY > this.scrollTopThreshold) {
        Utils.DOM.addClass(this.scrollToTopBtn, 'visible');
      } else {
        Utils.DOM.removeClass(this.scrollToTopBtn, 'visible');
      }
    }
  }

  _initMobileMenu() {
    if (!this.mobileMenu) return;
    
    // Обработка свайпов для закрытия меню
    this.mobileMenu.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
    }, { passive: true });
    
    this.mobileMenu.addEventListener('touchmove', (e) => {
      this.touchCurrentX = e.touches[0].clientX;
    }, { passive: true });
    
    this.mobileMenu.addEventListener('touchend', () => {
      const swipeDistance = this.touchCurrentX - this.touchStartX;
      if (swipeDistance > this.swipeThreshold) {
        this.closeMobileMenu();
      }
      this.touchStartX = 0;
      this.touchCurrentX = 0;
    });
    
    // Используем делегирование событий для кнопки меню (по ID)
    document.addEventListener('click', (e) => {
      if (e.target.closest('#mobileMenuBtn')) {
        e.stopPropagation();
        this.toggleMobileMenu();
      }
      // Закрытие по клику вне области меню (на overlay)
      if (e.target.id === 'mobileMenuOverlay') {
        this.closeMobileMenu();
      }
    });
    
    // Закрытие по ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.mobileMenu.classList.contains('active')) {
        this.closeMobileMenu();
      }
    });
    
    // Отдельный обработчик клика на overlay для гарантии закрытия
    if (this.mobileMenuOverlay) {
      this.mobileMenuOverlay.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeMobileMenu();
      });
    }
    
    // Предотвращаем всплытие кликов внутри мобильного меню, чтобы они не закрывали его
    this.mobileMenu.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1048 && this.mobileMenu.classList.contains('active')) {
        this.closeMobileMenu();
      }
    });
  }

  openMobileMenu() {
    if (!this.mobileMenu) return;
    
    Utils.DOM.addClass(this.mobileMenu, 'active');
    if (this.mobileMenuOverlay) Utils.DOM.addClass(this.mobileMenuOverlay, 'active');
    if (this.mobileMenuBtn) Utils.DOM.addClass(this.mobileMenuBtn, 'active');
    
    // Используем централизованный ScrollManager для блокировки скролла
    if (window.ScrollManager) {
      ScrollManager.lock();
    } else {
      document.body.classList.add('no-scroll');
    }
  }

  closeMobileMenu() {
    if (!this.mobileMenu) return;
    
    Utils.DOM.removeClass(this.mobileMenu, 'active');
    if (this.mobileMenuOverlay) Utils.DOM.removeClass(this.mobileMenuOverlay, 'active');
    if (this.mobileMenuBtn) Utils.DOM.removeClass(this.mobileMenuBtn, 'active');
    
    // Используем централизованный ScrollManager для восстановления скролла
    if (window.ScrollManager) {
      ScrollManager.unlock();
    } else {
      document.body.classList.remove('no-scroll');
    }
  }

  toggleMobileMenu() {
    if (this.mobileMenu && this.mobileMenu.classList.contains('active')) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  destroy() {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
  }
}

const navigationManager = new NavigationManager();

window.NavigationManager = NavigationManager;
window.scrollToTop = () => navigationManager.scrollToTop();