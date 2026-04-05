/**
 * Управление навигацией
 * ООО "Волга-Днепр Инжиниринг"
 */

class NavigationManager {
  constructor() {
    this.scrollThreshold = CONFIG.NAVIGATION.SCROLL_HEADER_THRESHOLD;
    this.scrollTopThreshold = CONFIG.NAVIGATION.SCROLL_TOP_THRESHOLD;
    this.navbar = null;
    this.scrollToTopBtn = null;
    this.mobileMenu = null;
    this.scrollHandler = null;
  }

  init() {
    this.navbar = DOMHelper.getElement('navbar');
    this.scrollToTopBtn = DOMHelper.getElement('scrollToTop');
    this.mobileMenu = DOMHelper.getElement('mobileMenu');
    
    this._initSmoothScroll();
    this._initScrollHandler();
    this._initMobileMenu();
    
    this._handleScroll();
  }

  _initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#') return;
        
        const target = DOMHelper.query(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          this._closeMobileMenu();
        }
      });
    });
  }

  _initScrollHandler() {
    let timeout;
    this.scrollHandler = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => this._handleScroll(), CONFIG.PERFORMANCE.SCROLL_DEBOUNCE_MS);
    };
    
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  _handleScroll() {
    const scrollY = window.scrollY;
    
    if (this.navbar) {
      if (scrollY > this.scrollThreshold) {
        DOMHelper.addClass(this.navbar, 'scrolled');
      } else {
        DOMHelper.removeClass(this.navbar, 'scrolled');
      }
    }
    
    if (this.scrollToTopBtn) {
      if (scrollY > this.scrollTopThreshold) {
        DOMHelper.addClass(this.scrollToTopBtn, 'visible');
      } else {
        DOMHelper.removeClass(this.scrollToTopBtn, 'visible');
      }
    }
  }

  _initMobileMenu() {
  this.mobileMenu = DOMHelper.getElement('mobileMenu');
  this.mobileMenuBtn = DOMHelper.query('.mobile-menu-btn');
  this.mobileMenuOverlay = DOMHelper.getElement('mobileMenuOverlay');
  const closeBtn = DOMHelper.getElement('mobileMenuClose');
  
  if (!this.mobileMenu) return;
  
  // Открытие меню
  if (this.mobileMenuBtn) {
    this.mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openMobileMenu();
    });
  }
  
  // Закрытие через кнопку
  if (closeBtn) {
    closeBtn.addEventListener('click', () => this.closeMobileMenu());
  }
  
  // Закрытие по клику на оверлей
  if (this.mobileMenuOverlay) {
    this.mobileMenuOverlay.addEventListener('click', () => this.closeMobileMenu());
  }
  
  // Закрытие при изменении размера окна
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1048 && this.mobileMenu.classList.contains('active')) {
      this.closeMobileMenu();
    }
  });
}

openMobileMenu() {
  if (!this.mobileMenu) return;
  
  DOMHelper.addClass(this.mobileMenu, 'active');
  if (this.mobileMenuOverlay) DOMHelper.addClass(this.mobileMenuOverlay, 'active');
  if (this.mobileMenuBtn) DOMHelper.addClass(this.mobileMenuBtn, 'active');
  DOMHelper.toggleBodyScroll(true);
}

closeMobileMenu() {
  if (!this.mobileMenu) return;
  
  DOMHelper.removeClass(this.mobileMenu, 'active');
  if (this.mobileMenuOverlay) DOMHelper.removeClass(this.mobileMenuOverlay, 'active');
  if (this.mobileMenuBtn) DOMHelper.removeClass(this.mobileMenuBtn, 'active');
  DOMHelper.toggleBodyScroll(false);
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NavigationManager, navigationManager };
}