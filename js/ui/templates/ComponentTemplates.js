/**
 * ComponentTemplates - HTML-шаблоны общих компонентов (header, footer)
 * Вынесены из ComponentLoader для улучшения читаемости
 * ООО "Волга-Днепр Инжиниринг"
 */

const ComponentTemplates = {
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
      <li><a href="services.html">Компетенции</a></li>
      <li><a href="news.html">Новости</a></li>
      <li><a href="projects.html">Проекты</a></li>
      <li><a href="docs.html">Документы</a></li>
      <li><a href="vacancies.html">Вакансии</a></li>
      <li><a href="index.html#partners">Партнёры</a></li>
      <li><a href="index.html#contact-details">Контакты</a></li>
    </ul>
    <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Меню">
      <span></span>
      <span></span>
      <span></span>
    </button>
  </div>
</nav>

<div class="mobile-menu" id="mobileMenu">
  <a href="index.html" class="home-link-mobile">Главная</a>
  <a href="about.html">О нас</a>
  <a href="services.html">Компетенции</a>
  <a href="news.html">Новости</a>
  <a href="projects.html">Проекты</a>
  <a href="docs.html">Документы</a>
  <a href="vacancies.html">Вакансии</a>
  <a href="index.html#partners">Партнёры</a>
  <a href="index.html#contact-details">Контакты</a>
</div>`,

    // Футер
    footer: `
<footer class="footer">
  <div class="footer-legal">
    <ul>
      <li><a href="#" data-policy="terms">Условия обслуживания</a></li>
      <li><a href="#" data-policy="privacy">Политика конфиденциальности</a></li>
      <li><a href="#" data-policy="personal-data">Политика обработки персональных данных</a></li>
      <li><a href="#" data-policy="cookies">Политика в отношении файлов cookie</a></li>
    </ul>
  </div>
  <div class="footer-bottom">
    <p>© <span id="currentYear"></span> ООО "Волга-Днепр Инжиниринг". Все права защищены.</p>
  </div>
</footer>

<button class="scroll-to-top" id="scrollToTop" aria-label="Наверх">
  <svg viewBox="0 0 24 24"><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/></svg>
</button>`
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentTemplates;
}
