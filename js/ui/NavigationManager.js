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
      this.navbar = document.getElementById('navbar');
      this.scrollToTopBtn = document.getElementById('scrollToTop');
      this.mobileMenu = document.getElementById('mobileMenu');
      this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
      this.mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
      
      if (!this.navbar || !this.mobileMenu || !this.mobileMenuBtn) {
        console.warn('Navigation elements not found, skipping initialization');
        return;
      }
      
      this._initSmoothScroll();
      this._initScrollHandler();
      this._initMobileMenu();
      this._handleScroll();
      
      console.log('NavigationManager initialized');
    } catch (error) {
      console.error('NavigationManager init failed:', error);
    }
  }

  _initSmoothScroll() {
    document.querySelectorAll('a[href]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#' || !href) return;
        
        // Проверяем, является ли ссылка якорем на текущей странице
        const isHashLink = href.startsWith('#');
        const hasHash = href.includes('#') && !isHashLink;
        
        try {
          let target = null;
          
          if (isHashLink) {
            // Чистый якорь (#partners)
            target = document.querySelector(href);
          } else if (hasHash) {
            // Ссылка с якорем (index.html#contact)
            const [pagePath, hash] = href.split('#');
            
            // Если мы уже на главной странице или это ссылка на главную
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            const isCurrentPage = pagePath === '' || pagePath === currentPage || pagePath === 'index.html';
            
            if (isCurrentPage) {
              // Плавный скролл к якорю на текущей странице
              target = document.querySelector(`#${hash}`);
            }
          }
          
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
        this.navbar.classList.add('scrolled');
      } else {
        this.navbar.classList.remove('scrolled');
      }
    }
    
    if (this.scrollToTopBtn) {
      if (scrollY > this.scrollTopThreshold) {
        this.scrollToTopBtn.classList.add('visible');
      } else {
        this.scrollToTopBtn.classList.remove('visible');
      }
    }
  }

  _initMobileMenu() {
    if (!this.mobileMenu) return;
    
    const closeBtn = document.getElementById('mobileMenuClose');
    
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
    
    this.mobileMenu.classList.add('active');
    if (this.mobileMenuOverlay) this.mobileMenuOverlay.classList.add('active');
    if (this.mobileMenuBtn) this.mobileMenuBtn.classList.add('active');
    document.body.classList.add('no-scroll');
  }

  closeMobileMenu() {
    if (!this.mobileMenu) return;
    
    this.mobileMenu.classList.remove('active');
    if (this.mobileMenuOverlay) this.mobileMenuOverlay.classList.remove('active');
    if (this.mobileMenuBtn) this.mobileMenuBtn.classList.remove('active');
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
window.navigationManager = navigationManager;

window.NavigationManager = NavigationManager;