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
      this.navbar = document.getElementById('navbar');
      this.scrollToTopBtn = document.getElementById('scrollToTop');
      this.mobileMenu = document.getElementById('mobileMenu');
      this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
      this.mobileMenuOverlay = document.getElementById('mobileMenuOverlay');

      if (!this.navbar || !this.mobileMenu || !this.mobileMenuBtn) {
        Logger.WARN('Navigation elements not found');
        return;
      }

      this._initSmoothScroll();
      this._initScrollHandler();
      this._initMobileMenu();
      this._initScrollToTop();
      this._handleScroll();

      Logger.INFO('NavigationManager initialized');
    } catch (error) {
      Logger.ERROR('NavigationManager init failed:', error);
    }
  }

  _initSmoothScroll() {
    // Обработчик клика на якорные ссылки для плавной прокрутки
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link || !link.hash) return;

      const targetId = link.hash.substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: 'smooth' });

        // Закрываем мобильное меню, если оно открыто
        if (this.mobileMenu && this.mobileMenu.classList.contains('active')) {
          this.closeMobileMenu();
        }
      }
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

    window.addEventListener('pageshow', (e) => {
      if (e.persisted || this.mobileMenu.classList.contains('active')) {
        this.closeMobileMenu();
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.closest('#mobileMenuBtn')) {
        e.stopPropagation();
        this.toggleMobileMenu();
      }
      if (e.target.id === 'mobileMenuOverlay') {
        this.closeMobileMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.mobileMenu.classList.contains('active')) {
        this.closeMobileMenu();
      }
    });

    if (this.mobileMenuOverlay) {
      this.mobileMenuOverlay.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeMobileMenu();
      });
    }

    this.mobileMenu.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Обработка кликов по ссылкам мобильного меню (закрытие меню + корректный якорь)
    this.mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href) return;

        // Закрываем меню (синхронно)
        this.closeMobileMenu();

        // Создаём URL относительно текущей страницы
        let url;
        try {
          url = new URL(href, window.location.href);
        } catch (err) {
          return; // некорректная ссылка
        }

        const isSamePage = url.pathname === window.location.pathname;
        const hasHash = url.hash && url.hash.length > 1;

        if (isSamePage && hasHash) {
          // Якорь на текущей странице – отменяем переход и скроллим
          e.preventDefault();
          const targetId = url.hash.substring(1);
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
        }
        // Если ссылка на другую страницу – ничего не делаем, браузер выполнит переход
        // (меню уже закрыто, скролл разблокирован)
      });
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1048 && this.mobileMenu.classList.contains('active')) {
        this.closeMobileMenu();
      }
    });
  }

  _initScrollToTop() {
    if (this.scrollToTopBtn) {
      this.scrollToTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.scrollToTop();
      });
    }
  }

  openMobileMenu() {
    if (!this.mobileMenu) return;

    this.mobileMenu.classList.add('active');
    if (this.mobileMenuOverlay) this.mobileMenuOverlay.classList.add('active');
    if (this.mobileMenuBtn) this.mobileMenuBtn.classList.add('active');

    // Обновляем состояние через AppState
    if (window.AppState) {
      AppState.setState('navigation.isMobileMenuOpen', true);
    }

    // Используем только ScrollManager для блокировки скролла
    if (window.ScrollManager) {
      ScrollManager.lock();
    } else {
      Logger.WARN('ScrollManager not available for mobile menu');
    }
  }

  closeMobileMenu() {
    if (!this.mobileMenu) return;

    this.mobileMenu.classList.remove('active');
    if (this.mobileMenuOverlay) this.mobileMenuOverlay.classList.remove('active');
    if (this.mobileMenuBtn) this.mobileMenuBtn.classList.remove('active');

    // Обновляем состояние через AppState
    if (window.AppState) {
      AppState.setState('navigation.isMobileMenuOpen', false);
    }

    // Используем только ScrollManager для разблокировки скролла
    if (window.ScrollManager) {
      ScrollManager.unlock();
    } else {
      Logger.WARN('ScrollManager not available for mobile menu close');
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

// Экспорт удален - регистрация происходит через Application.services
// window.scrollToTop остается как глобальная функция для обратной совместимости
window.scrollToTop = () => navigationManager.scrollToTop();