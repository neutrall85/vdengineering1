/**
 * HeaderLoader - загрузчик хедера и навигации
 * Отвечает за рендеринг navbar, мобильного меню и управление активными ссылками
 * ООО "Волга-Днепр Инжиниринг"
 */

const HeaderLoader = {
    // Навигация (ссылка "Главная" добавляется динамически)
    navbar: `
<nav class="navbar" id="navbar">
  <div class="navbar-content">
    <div class="logo">
      <a href="index.html">
        <img src="assets/images/logo.svg" alt="Волга-Днепр Инжиниринг" class="logo-image">
      </a>
    </div>
    <ul class="nav-links">
      <li class="home-link"><a href="index.html">Главная</a></li>
      <li><a href="about.html">О нас</a></li>
      <li><a href="services.html">Услуги</a></li>
      <li><a href="news.html">Новости</a></li>
      <li><a href="projects.html">Проекты</a></li>
      <li><a href="docs.html">Документы</a></li>
      <li><a href="vacancies.html">Вакансии</a></li>
      <li><a href="index.html#partners">Партнёры</a></li>
      <li><a href="index.html#contact">Контакты</a></li>
    </ul>
    <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Меню">
      <span></span>
      <span></span>
      <span></span>
    </button>
  </div>
</nav>

<div class="mobile-menu" id="mobileMenu">
  <button class="mobile-menu-close" id="mobileMenuClose" aria-label="Закрыть меню">
    <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
  </button>
  <a href="index.html" class="home-link-mobile">Главная</a>
  <a href="about.html">О нас</a>
  <a href="services.html">Услуги</a>
  <a href="news.html">Новости</a>
  <a href="projects.html">Проекты</a>
  <a href="docs.html">Документы</a>
  <a href="vacancies.html">Вакансии</a>
  <a href="index.html#partners">Партнёры</a>
  <a href="index.html#contact">Контакты</a>
</div>`,

    /**
     * Загрузка навигации на страницу
     * @param {Object} options - Опции загрузки
     * @param {string} options.activePage - Имя активной страницы для подсветки
     */
    load(options = {}) {
        const { activePage = '' } = options;
        
        const existingNav = document.querySelector('body > nav.navbar');
        if (!existingNav) {
            const navContainer = document.createElement('div');
            navContainer.innerHTML = this.navbar.trim();
            const firstBodyChild = document.body.firstChild;
            document.body.insertBefore(navContainer.firstElementChild, firstBodyChild);
            
            // Добавляем mobile-menu-overlay после навигации
            const overlay = document.createElement('div');
            overlay.className = 'mobile-menu-overlay';
            overlay.id = UIConstants.HEADER.MOBILE_MENU_OVERLAY.replace('#', '');
            document.body.appendChild(overlay);
            
            this.setActiveLink(activePage);
        } else {
            // Если навигация уже есть в HTML (для обратной совместимости), обновляем её
            existingNav.outerHTML = this.navbar;
            this.setActiveLink(activePage);
        }
    },

    /**
     * Установка активной ссылки в навигации
     * @param {string} activePage - Имя активной страницы
     */
    setActiveLink(activePage) {
        // Скрываем ссылку "Главная" на главной странице (index.html)
        const isHomePage = activePage === '' || activePage === 'index';
        
        // Обрабатываем десктопное меню
        const homeLinkDesktop = document.querySelector('.nav-links .home-link');
        if (homeLinkDesktop) {
            if (isHomePage) {
                homeLinkDesktop.classList.add(UIConstants.CLASSES.HIDDEN);
            } else {
                homeLinkDesktop.classList.remove(UIConstants.CLASSES.HIDDEN);
            }
        }
        
        // Обрабатываем мобильное меню
        const homeLinkMobile = document.querySelector('.mobile-menu .home-link-mobile');
        if (homeLinkMobile) {
            if (isHomePage) {
                homeLinkMobile.classList.add(UIConstants.CLASSES.HIDDEN);
            } else {
                homeLinkMobile.classList.remove(UIConstants.CLASSES.HIDDEN);
            }
        }
        
        // Подсветка активной ссылки
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove(UIConstants.CLASSES.ACTIVE);
            if (link.getAttribute('href') === activePage || 
                link.getAttribute('href') === `${activePage}.html`) {
                link.classList.add(UIConstants.CLASSES.ACTIVE);
            }
        });
        
        // Также подсвечиваем активную ссылку в мобильном меню
        document.querySelectorAll('.mobile-menu a').forEach(link => {
            link.classList.remove(UIConstants.CLASSES.ACTIVE);
            if (link.getAttribute('href') === activePage || 
                link.getAttribute('href') === `${activePage}.html`) {
                link.classList.add(UIConstants.CLASSES.ACTIVE);
            }
        });
    },

    /**
     * Получение ширины скроллбара
     * @returns {number} ширина скроллбара в пикселях
     */
    getScrollbarWidth() {
        return window.innerWidth - document.documentElement.clientWidth;
    }
};

// Экспорт
window.HeaderLoader = HeaderLoader;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeaderLoader;
}
