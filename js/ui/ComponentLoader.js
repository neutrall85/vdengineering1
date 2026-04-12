/**
 * ComponentLoader - загрузчик общих компонентов (header, footer)
 * Устраняет дублирование HTML между страницами
 */

const ComponentLoader = {
    // Навигация
    navbar: `
<nav class="navbar" id="navbar">
  <div class="navbar-content">
    <div class="logo">
      <a href="index.html">
        <img src="assets/images/logo.svg" alt="Волга-Днепр Инжиниринг" class="logo-image">
      </a>
    </div>
    <ul class="nav-links">
      <li><a href="index.html">Главная</a></li>
      <li><a href="about.html">О нас</a></li>
      <li><a href="services.html">Услуги</a></li>
      <li><a href="news.html">Новости</a></li>
      <li><a href="projects.html">Проекты</a></li>
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
  <a href="index.html">Главная</a>
  <a href="about.html">О нас</a>
  <a href="services.html">Услуги</a>
  <a href="news.html">Новости</a>
  <a href="projects.html">Проекты</a>
  <a href="index.html#partners">Партнёры</a>
  <a href="index.html#contact">Контакты</a>
</div>
<div class="mobile-menu-overlay" id="mobileMenuOverlay"></div>`,

    // Футер
    footer: `
<footer class="footer">
  <div class="footer-content">
    <div class="footer-brand">
      <div class="logo">
        <a href="index.html">
          <img src="assets/images/logo.svg" alt="Волга-Днепр Инжиниринг" class="logo-image">
        </a>
      </div>
      <p>ООО "Волга-Днепр Инжиниринг" - разработка модификаций авиационной техники.</p>
    </div>
    <div class="footer-links">
      <h4>Компания</h4>
      <ul>
        <li><a href="about.html">О нас</a></li>
        <li><a href="services.html">Услуги</a></li>
        <li><a href="news.html">Новости</a></li>
        <li><a href="projects.html">Проекты</a></li>
      </ul>
    </div>
    <div class="footer-links">
      <h4>Ресурсы</h4>
      <ul>
        <li><a href="index.html#contact">Контакты</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <p>© <span id="currentYear"></span> ООО "Волга-Днепр Инжиниринг". Все права защищены.</p>
  </div>
</footer>

<button class="scroll-to-top" id="scrollToTop" onclick="window.scrollToTop && window.scrollToTop()" aria-label="Наверх">
  <svg viewBox="0 0 24 24"><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/></svg>
</button>`,

    // Модальное окно коммерческого предложения
    proposalModal: `
<!-- Commercial Proposal Modal -->
<div class="modal-overlay" id="modalOverlay" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
  <div class="modal-container">
    <button class="modal-close" onclick="window.closeModal && window.closeModal()" aria-label="Закрыть">
      <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    </button>
    <div class="modal-header">
      <h2 class="modal-title" id="modalTitle">Запрос коммерческого предложения</h2>
      <p class="modal-subtitle">Заполните форму ниже, и мы свяжемся с вами в течение 24 часов</p>
    </div>
    <div class="modal-body">
      <div class="rate-limit-warning" id="rateLimitWarning">
        <p>⚠️ Слишком много запросов. Пожалуйста, подождите 60 секунд перед следующей отправкой.</p>
      </div>

      <div class="success-message" id="successMessage">
        <div class="success-icon">
          <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        </div>
        <h3 class="success-title">Заявка отправлена!</h3>
        <p class="success-text">Спасибо за ваш запрос. Наш специалист свяжется с вами в течение 24 часов.</p>
      </div>

      <input type="hidden" id="csrfToken" name="csrf_token" value="">

      <div class="hp-field">
        <label for="hp_website">Website</label>
        <input type="text" id="hp_website" name="website" tabindex="-1" autocomplete="off">
      </div>

      <form id="proposalForm" novalidate>
        <div class="form-group">
          <label class="form-label" for="companyName">Название компании <span class="required">*</span></label>
          <input type="text" class="form-input" id="companyName" name="companyName" placeholder="Введите название компании" required minlength="2" maxlength="200" autocomplete="organization">
          <p class="error-message" id="companyNameError">Пожалуйста, введите корректное название компании</p>
        </div>
        <div class="form-group">
          <label class="form-label" for="contactPerson">Контактное лицо <span class="required">*</span></label>
          <input type="text" class="form-input" id="contactPerson" name="contactPerson" placeholder="Ваше полное имя" required minlength="2" maxlength="100" autocomplete="name">
          <p class="error-message" id="contactPersonError">Пожалуйста, введите ваше имя</p>
        </div>
        <div class="form-group">
          <label class="form-label" for="email">Электронная почта <span class="required">*</span></label>
          <input type="email" class="form-input" id="email" name="email" placeholder="ваш.email@company.com" required maxlength="255" autocomplete="email">
          <p class="error-message" id="emailError">Пожалуйста, введите корректный email</p>
        </div>
        <div class="form-group">
          <label class="form-label" for="phone">Телефон <span class="required">*</span></label>
          <input type="tel" class="form-input" id="phone" name="phone" placeholder="+7 (000) 000-00-00" required minlength="10" maxlength="20" autocomplete="tel">
          <p class="error-message" id="phoneError">Пожалуйста, введите корректный номер телефона</p>
        </div>
        <div class="form-group">
          <label class="form-label" for="aircraftType">Тип воздушного судна <span class="required">*</span></label>
          <input type="text" class="form-input" id="aircraftType" name="aircraftType" placeholder="Введите тип воздушного судна (например, Boeing 777)" required minlength="2" maxlength="100" autocomplete="off">
          <p class="error-message" id="aircraftTypeError">Пожалуйста, введите тип воздушного судна</p>
        </div>
        <div class="form-group">
          <label class="form-label" for="serviceType">Требуемая услуга <span class="required">*</span></label>
          <select class="form-select" id="serviceType" name="serviceType" required>
            <option value="">Выберите тип услуги</option>
            <option value="design">Проектирование модификаций</option>
            <option value="repair">Разработка ремонтной КД</option>
            <option value="other">Другое</option>
          </select>
          <p class="error-message" id="serviceTypeError">Пожалуйста, выберите тип услуги</p>
        </div>
        <div class="form-group">
          <label class="form-label" for="taskDescription">Краткое описание задачи <span class="required">*</span></label>
          <textarea class="form-textarea" id="taskDescription" name="taskDescription" placeholder="Пожалуйста, опишите требования к модификации, сроки и любые конкретные детали..." required minlength="10" maxlength="2000"></textarea>
          <p class="error-message" id="taskDescriptionError">Пожалуйста, опишите вашу задачу (минимум 10 символов)</p>
        </div>
        <div class="form-group">
          <label class="form-label">Вложение (опционально)</label>
          <div class="form-file" id="fileDrop">
            <input type="file" id="fileAttachment" name="fileAttachment" accept=".pdf,.doc,.docx,.xls,.xlsx" aria-label="Загрузить файл" multiple>
            <div class="form-file-icon">
              <svg viewBox="0 0 24 24"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/></svg>
            </div>
            <p class="form-file-text">Выбрать файл...</p>
            <p class="form-file-hint">PDF, DOC, DOCX, XLS, XLSX (Max 10MB)</p>
            <div class="form-file-list" id="fileList"></div>
            <div class="form-file-limit-warning" id="fileLimitWarningModal" style="display: none;">
              <p>⚠️ Превышен лимит: максимум 5 файлов или 10MB на файл</p>
            </div>
          </div>
        </div>
        <div class="form-agreement">
          <p class="form-agreement-text">
            Отправляя эту форму, вы соглашаетесь с нашей
            <a href="#" target="_blank" rel="noopener noreferrer">Политикой конфиденциальности</a>,
            <a href="#" target="_blank" rel="noopener noreferrer">Политикой обработки персональных данных</a> и
            <a href="#" target="_blank" rel="noopener noreferrer">Условиями обслуживания</a>.
          </p>
        </div>
        <button type="submit" class="form-submit" id="submitBtn">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          <span>Отправить запрос</span>
        </button>
      </form>
    </div>
  </div>
</div>`,

    /**
     * Инициализация компонентов на странице
     * @param {Object} options - Опции загрузки
     */
    init(options = {}) {
        const { 
            loadNavbar = true, 
            loadFooter = true, 
            loadModal = true,
            activePage = '' 
        } = options;

        // Загрузка навигации - вставляем перед первым элементом body
        if (loadNavbar) {
            const existingNav = document.querySelector('body > nav.navbar');
            if (!existingNav) {
                const navContainer = document.createElement('div');
                navContainer.innerHTML = this.navbar.trim();
                const firstBodyChild = document.body.firstChild;
                document.body.insertBefore(navContainer.firstElementChild, firstBodyChild);
                this.setActiveLink(activePage);
            } else {
                // Если навигация уже есть в HTML (для обратной совместимости), обновляем её
                existingNav.outerHTML = this.navbar;
                this.setActiveLink(activePage);
            }
        }

        // Загрузка футера - вставляем перед закрывающим тегом body
        if (loadFooter) {
            const existingFooter = document.querySelector('body > footer.footer');
            if (!existingFooter) {
                const footerContainer = document.createElement('div');
                footerContainer.innerHTML = this.footer.trim();
                document.body.appendChild(footerContainer.firstElementChild);
                this.updateYear();
            } else {
                // Если футер уже есть в HTML (для обратной совместимости), обновляем его
                existingFooter.outerHTML = this.footer;
                this.updateYear();
            }
        }

        // Загрузка модального окна
        if (loadModal) {
            const existingModal = document.getElementById('modalOverlay');
            if (!existingModal) {
                const modalContainer = document.createElement('div');
                modalContainer.innerHTML = this.proposalModal.trim();
                document.body.appendChild(modalContainer.firstElementChild);
            }
        }

        // Подсветка активной ссылки
        if (activePage) {
            this.setActiveLink(activePage);
        }
    },

    /**
     * Установка активной ссылки в навигации
     * @param {string} activePage - Имя активной страницы
     */
    setActiveLink(activePage) {
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === activePage || 
                link.getAttribute('href') === `${activePage}.html`) {
                link.classList.add('active');
            }
        });
    },

    /**
     * Обновление года в футере
     */
    updateYear() {
        const yearElement = document.getElementById('currentYear');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
    }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentLoader;
}
