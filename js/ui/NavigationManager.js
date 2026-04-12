/**
 * Управление навигацией
 * ООО "Волга-Днепр Инжиниринг"
 */

class NavigationManager {
  constructor() {
    this.scrollThreshold = window.CONFIG?.NAVIGATION?.SCROLL_HEADER_THRESHOLD || 100;
    this.scrollTopThreshold = window.CONFIG?.NAVIGATION?.SCROLL_TOP_THRESHOLD || 500;
    this.navbar = null;
    this.scrollToTopBtn = null;
    this.mobileMenu = null;
    this.mobileMenuBtn = null;
    this.mobileMenuOverlay = null;
    this.scrollHandler = null;
  }

  init() {
    try {
      // Ждём пока ComponentLoader загрузит навигацию
      const checkElements = () => {
        this.navbar = DOM.getElement('navbar');
        this.scrollToTopBtn = DOM.getElement('scrollToTop');
        this.mobileMenu = DOM.getElement('mobileMenu');
        this.mobileMenuBtn = DOM.getElement('mobileMenuBtn');
        this.mobileMenuOverlay = DOM.getElement('mobileMenuOverlay');
        
        if (!this.navbar || !this.mobileMenu || !this.mobileMenuBtn) {
          console.warn('Navigation elements not found, retrying...');
          setTimeout(checkElements, 100);
          return;
        }
        
        this._initSmoothScroll();
        this._initScrollHandler();
        this._initMobileMenu();
        this._handleScroll();
        
        console.log('NavigationManager initialized');
      };
      
      // Начинаем проверку элементов
      checkElements();
    } catch (error) {
      console.error('NavigationManager init failed:', error);
    }
  }

  _initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#') return;
        
        try {
          const target = DOM.query(href);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            this._closeMobileMenu();
          }
        } catch (error) {
          console.warn('Smooth scroll error:', error);
        }
      });
    });
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
        DOM.addClass(this.navbar, 'scrolled');
      } else {
        DOM.removeClass(this.navbar, 'scrolled');
      }
    }
    
    if (this.scrollToTopBtn) {
      if (scrollY > this.scrollTopThreshold) {
        DOM.addClass(this.scrollToTopBtn, 'visible');
      } else {
        DOM.removeClass(this.scrollToTopBtn, 'visible');
      }
    }
  }

  _initMobileMenu() {
    if (!this.mobileMenu) return;
    
    const closeBtn = DOM.getElement('mobileMenuClose');
    
    // Используем делегирование событий для кнопки меню (по ID)
    document.addEventListener('click', (e) => {
      if (e.target.closest('#mobileMenuBtn')) {
        e.stopPropagation();
        this.openMobileMenu();
      }
    });
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeMobileMenu());
    }
    
    if (this.mobileMenuOverlay) {
      this.mobileMenuOverlay.addEventListener('click', () => this.closeMobileMenu());
    }
    
    // Закрытие по ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.mobileMenu.classList.contains('active')) {
        this.closeMobileMenu();
      }
    });
    
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1048 && this.mobileMenu.classList.contains('active')) {
        this.closeMobileMenu();
      }
    });
  }

  openMobileMenu() {
    if (!this.mobileMenu) return;
    
    DOM.addClass(this.mobileMenu, 'active');
    if (this.mobileMenuOverlay) DOM.addClass(this.mobileMenuOverlay, 'active');
    if (this.mobileMenuBtn) DOM.addClass(this.mobileMenuBtn, 'active');
    document.body.classList.add('no-scroll');
  }

  closeMobileMenu() {
    if (!this.mobileMenu) return;
    
    DOM.removeClass(this.mobileMenu, 'active');
    if (this.mobileMenuOverlay) DOM.removeClass(this.mobileMenuOverlay, 'active');
    if (this.mobileMenuBtn) DOM.removeClass(this.mobileMenuBtn, 'active');
    document.body.classList.remove('no-scroll');
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