/**
 * ComponentLoader - загрузчик общих компонентов (header, footer)
 * Устраняет дублирование HTML между страницами
 */

// Импортируем документы политик из отдельного файла
// const POLICY_DOCUMENTS определяется в policyDocuments.js

const ComponentLoader = {
    // Вспомогательная функция для получения ширины скроллбара
    getScrollbarWidth() {
        return window.innerWidth - document.documentElement.clientWidth;
    },
    
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
      <li><a href="index.html#contact-info">Контакты</a></li>
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
  <a href="services.html">Услуги</a>
  <a href="news.html">Новости</a>
  <a href="projects.html">Проекты</a>
  <a href="docs.html">Документы</a>
  <a href="vacancies.html">Вакансии</a>
  <a href="index.html#partners">Партнёры</a>
  <a href="index.html#contact-info">Контакты</a>
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
</button>`,

    // Модальное окно коммерческого предложения
    proposalModal: `
<!-- Commercial Proposal Modal -->
<div class="modal-overlay modal-overlay-proposal" id="proposalModalOverlay" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
  <div class="modal-container modal-container-proposal">
    <button class="modal-close" id="proposalModalCloseBtn" aria-label="Закрыть">
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
          <label class="form-label">Телефон <span class="required">*</span></label>
          <div class="form-phone-group">
            <input type="tel" class="form-input" id="phone" name="phone" placeholder="+7 (999) 000-00-00" required minlength="10" maxlength="20" autocomplete="tel" class="form-input-phone">
            <input type="text" class="form-input" id="extension" name="extension" placeholder="доб." maxlength="6" autocomplete="off" class="form-input-extension">
          </div>
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

    // Универсальное модальное окно для заявок (используется для кнопок "Откликнуться" и "Отправить заявку")
    universalApplicationModal: `
<!-- Universal Application Modal -->
<div class="modal-overlay modal-overlay-universal" id="universalApplicationModalOverlay" role="dialog" aria-modal="true" aria-labelledby="universalApplicationModalTitle">
  <div class="modal-container">
    <button class="modal-close" id="universalModalCloseBtn" aria-label="Закрыть">
      <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    </button>
    <div class="modal-header">
      <h2 class="modal-title" id="universalApplicationModalTitle">Отклик на вакансию</h2>
      <p class="modal-subtitle" id="universalApplicationModalSubtitle">Заполните форму ниже, и мы рассмотрим вашу кандидатуру</p>
    </div>
    <div class="modal-body">
      <div class="rate-limit-warning" id="universalRateLimitWarning">
        <p>⚠️ Слишком много запросов. Пожалуйста, подождите 60 секунд перед следующей отправкой.</p>
      </div>

      <div class="success-message" id="universalSuccessMessage">
        <div class="success-icon">
          <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        </div>
        <h3 class="success-title" id="universalSuccessTitle">Отклик отправлен!</h3>
        <p class="success-text">Спасибо за ваш интерес. Мы рассмотрим резюме и свяжемся с вами в ближайшее время.</p>
      </div>

      <form id="universalApplicationForm" novalidate>
        <div class="form-group">
          <label class="form-label" for="universalFullName">ФИО <span class="required">*</span></label>
          <input type="text" class="form-input" id="universalFullName" name="fullName" placeholder="Введите ваши ФИО полностью" required minlength="2" maxlength="200" autocomplete="name">
          <p class="error-message" id="universalFullNameError">Пожалуйста, введите корректное ФИО</p>
        </div>
        <div class="form-group">
          <label class="form-label" for="universalPhone">Номер телефона <span class="required">*</span></label>
          <input type="tel" class="form-input" id="universalPhone" name="phone" placeholder="+7 (999) 000-00-00" required minlength="10" maxlength="20" autocomplete="tel">
          <p class="error-message" id="universalPhoneError">Пожалуйста, введите корректный номер телефона</p>
        </div>
        <div class="form-group">
          <label class="form-label" for="universalEmail">Адрес e-mail <span class="required">*</span></label>
          <input type="email" class="form-input" id="universalEmail" name="email" placeholder="ваш.email@example.com" required maxlength="255" autocomplete="email">
          <p class="error-message" id="universalEmailError">Пожалуйста, введите корректный email</p>
        </div>
        <div class="form-group">
          <label class="form-label" for="universalAbout">Расскажите о себе <span class="required">*</span></label>
          <textarea class="form-textarea" id="universalAbout" name="about" placeholder="Расскажите о вашем опыте, навыках и почему вы хотите работать у нас..." required minlength="10" maxlength="2000"></textarea>
          <p class="error-message" id="universalAboutError">Пожалуйста, расскажите о себе (минимум 10 символов)</p>
        </div>
        <div class="form-group">
          <label class="form-label">Резюме (файл) <span class="required">*</span></label>
          <div class="form-file" id="universalFileDrop">
            <input type="file" id="universalFileAttachment" name="fileAttachment" accept=".pdf,.doc,.docx,.xls,.xlsx" aria-label="Загрузить резюме" required multiple>
            <div class="form-file-icon">
              <svg viewBox="0 0 24 24"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/></svg>
            </div>
            <p class="form-file-text">Выбрать файл...</p>
            <p class="form-file-hint">PDF, DOC, DOCX, XLS, XLSX (Max 10MB)</p>
            <div class="form-file-list" id="universalFileList"></div>
            <div class="form-file-limit-warning form-file-limit-hidden" id="universalFileLimitWarning">
              <p>⚠️ Превышен лимит: максимум 5 файлов или 10MB на файл</p>
            </div>
          </div>
        </div>
        <div class="form-agreement form-agreement-checkbox">
          <label class="checkbox-label">
            <input type="checkbox" id="universalConsent" name="consent" required>
            <span class="checkbox-text">Я согласен с <a href="#" data-policy="personal-data" target="_blank" rel="noopener noreferrer">Условиями обработки персональных данных</a> <span class="required">*</span></span>
          </label>
          <p class="error-message" id="universalConsentError">Необходимо подтвердить согласие</p>
        </div>
        <button type="submit" class="form-submit" id="universalSubmitBtn" disabled>
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          <span id="universalSubmitBtnText">Отправить отклик</span>
        </button>
      </form>
    </div>
  </div>
</div>`,

    /**
     * Инициализация компонентов на странице
     * @param {Object} options - Опции загрузки
     * @param {Function} callback - Функция обратного вызова после загрузки
     */
    init(options = {}, callback = null) {
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
                
                // Добавляем mobile-menu-overlay после навигации
                const overlay = document.createElement('div');
                overlay.className = 'mobile-menu-overlay';
                overlay.id = 'mobileMenuOverlay';
                document.body.appendChild(overlay);
                
                this.setActiveLink(activePage);
            } else {
                // Если навигация уже есть в HTML (для обратной совместимости), обновляем её
                existingNav.outerHTML = this.navbar;
                this.setActiveLink(activePage);
            }
            
            // Вызываем callback после загрузки навигации
            if (callback) {
                setTimeout(callback, 50);
            }
        }
        
        // Загрузка модального окна
        if (loadModal) {
            const existingModal = document.getElementById('modalOverlay');
            if (!existingModal) {
                const modalContainer = document.createElement('div');
                modalContainer.innerHTML = this.proposalModal.trim();
                document.body.appendChild(modalContainer.firstElementChild);
                
                // Инициализация автоподстановки +7 для поля телефона в модалке
                setTimeout(() => {
                    const modalPhoneInput = document.querySelector('#modalOverlay #phone');
                    if (modalPhoneInput) {
                        Utils.PhoneUtils.setupAutoPrefix(modalPhoneInput);
                    }
                }, 0);
            }
            
            // Загрузка универсального модального окна для заявок
            const existingUniversalModal = document.getElementById('universalApplicationModalOverlay');
            if (!existingUniversalModal) {
                const universalModalContainer = document.createElement('div');
                universalModalContainer.innerHTML = this.universalApplicationModal.trim();
                document.body.appendChild(universalModalContainer.firstElementChild);
                
                // Инициализация обработчиков для универсального модального окна
                setTimeout(() => {
                    this.initUniversalApplicationModal();
                }, 100);
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
                // Инициализируем обработчики ссылок политик после загрузки футера
                this.initPolicyLinks();
            } else {
                // Если футер уже есть в HTML (для обратной совместимости), обновляем его
                existingFooter.outerHTML = this.footer;
                this.updateYear();
                // Инициализируем обработчики ссылок политик после загрузки футера
                this.initPolicyLinks();
            }
        }

        // Отправляем событие о завершении загрузки компонентов ПОСЛЕ загрузки всех модалок и футера
        document.dispatchEvent(new CustomEvent('components:loaded'));

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
        // Скрываем ссылку "Главная" на главной странице (index.html)
        const isHomePage = activePage === '' || activePage === 'index';
        
        // Обрабатываем десктопное меню
        const homeLinkDesktop = document.querySelector('.nav-links .home-link');
        if (homeLinkDesktop) {
            if (isHomePage) {
                homeLinkDesktop.classList.add('hidden');
            } else {
                homeLinkDesktop.classList.remove('hidden');
            }
        }
        
        // Обрабатываем мобильное меню
        const homeLinkMobile = document.querySelector('.mobile-menu .home-link-mobile');
        if (homeLinkMobile) {
            if (isHomePage) {
                homeLinkMobile.classList.add('hidden');
            } else {
                homeLinkMobile.classList.remove('hidden');
            }
        }
        
        // Подсветка активной ссылки
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === activePage || 
                link.getAttribute('href') === `${activePage}.html`) {
                link.classList.add('active');
            }
        });
        
        // Также подсвечиваем активную ссылку в мобильном меню
        document.querySelectorAll('.mobile-menu a').forEach(link => {
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
    },

    /**
     * Инициализация обработчиков для ссылок политик в футере
     */
    initPolicyLinks() {
        // Делегирование событий для ссылок политик (DRY - один обработчик для всех)
        document.addEventListener('click', (e) => {
            const policyLink = e.target.closest('[data-policy]');
            if (policyLink) {
                e.preventDefault();
                const policyKey = policyLink.getAttribute('data-policy');
                this.openPolicyModal(policyKey);
            }
        });
    },

    /**
     * Открытие модального окна с текстом политики
     * @param {string} policyKey - ключ политики (terms, privacy, personal-data, cookies)
     */
    openPolicyModal(policyKey) {
        const policy = POLICY_DOCUMENTS[policyKey];
        if (!policy) {
            Logger.WARN(`Policy "${policyKey}" not found`);
            return;
        }

        // Создаем модальное окно если его нет
        let modalOverlay = document.getElementById('policyModalOverlay');
        if (!modalOverlay) {
            modalOverlay = document.createElement('div');
            modalOverlay.id = 'policyModalOverlay';
            modalOverlay.className = 'modal-overlay';
            modalOverlay.setAttribute('role', 'dialog');
            modalOverlay.setAttribute('aria-modal', 'true');
            
            // Создаем контейнер модального окна
            const modalContainer = document.createElement('div');
            modalContainer.className = 'modal-container';
            
            // Кнопка закрытия
            const closeBtn = document.createElement('button');
            closeBtn.className = 'modal-close';
            closeBtn.id = 'policyModalCloseBtn';
            closeBtn.setAttribute('aria-label', 'Закрыть');
            
            // SVG иконка закрытия
            const svgNS = 'http://www.w3.org/2000/svg';
            const svgEl = document.createElementNS(svgNS, 'svg');
            svgEl.setAttribute('viewBox', '0 0 24 24');
            const pathEl = document.createElementNS(svgNS, 'path');
            pathEl.setAttribute('d', 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z');
            svgEl.appendChild(pathEl);
            closeBtn.appendChild(svgEl);
            
            // Заголовок модального окна
            const modalHeader = document.createElement('div');
            modalHeader.className = 'modal-header';
            const modalTitle = document.createElement('h2');
            modalTitle.className = 'modal-title';
            modalTitle.id = 'policyModalTitle';
            modalHeader.appendChild(modalTitle);
            
            // Тело модального окна
            const modalBody = document.createElement('div');
            modalBody.className = 'modal-body';
            modalBody.id = 'policyModalContent';
            
            // Собираем структуру
            modalContainer.appendChild(closeBtn);
            modalContainer.appendChild(modalHeader);
            modalContainer.appendChild(modalBody);
            modalOverlay.appendChild(modalContainer);
            document.body.appendChild(modalOverlay);
            
            // Добавляем обработчик клика на кнопку закрытия
            closeBtn.addEventListener('click', () => {
              if (typeof window.closePolicyModal === 'function') {
                window.closePolicyModal();
              }
            });

            // Закрытие по клику на overlay
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closePolicyModal();
                }
            });
        }

        // Заполняем контент с санитизацией
        document.getElementById('policyModalTitle').textContent = policy.title;
        const sanitizer = Utils.Sanitizer || { sanitizeHtml: (html) => html };
        document.getElementById('policyModalContent').innerHTML = sanitizer.sanitizeHtml(policy.content, {
          allowedTags: ['h2', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a'],
          allowedAttributes: { 'a': ['href', 'target', 'rel'] }
        });

        // Используем централизованный ScrollManager для блокировки скролла
        if (window.ScrollManager) {
            ScrollManager.lock();
        } else {
            // Fallback для обратной совместимости
            const scrollbarWidth = this.getScrollbarWidth();
            if (scrollbarWidth > 0) {
                document.body.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
                document.body.classList.add('scroll-padding-fix');
            }
            document.body.classList.add('no-scroll');
        }

        // Показываем модальное окно
        setTimeout(() => {
            modalOverlay.classList.add('active');
            const closeBtn = modalOverlay.querySelector('.modal-close');
            if (closeBtn) closeBtn.focus();
        }, 50);
    },

    /**
     * Закрытие модального окна политики
     */
    closePolicyModal() {
        const modalOverlay = document.getElementById('policyModalOverlay');
        if (!modalOverlay) return;

        modalOverlay.classList.remove('active');
        
        // Используем централизованный ScrollManager для восстановления скролла
        if (window.ScrollManager) {
            ScrollManager.unlock();
        } else {
            // Fallback для обратной совместимости
            document.body.classList.remove('no-scroll');
            document.body.classList.remove('scroll-padding-fix');
            document.body.style.removeProperty('--scrollbar-width');
        }
    },

    /**
     * Инициализация универсального модального окна заявок
     * @param {string} mode - режим открытия ('vacancy' для кнопок "Откликнуться", 'application' для кнопки "Отправить заявку")
     */
    initUniversalApplicationModal() {
        // Глобальная функция для открытия универсального модального окна с поддержкой передачи элемента-триггера
        window.openApplicationModal = (triggerElement) => {
            const overlay = document.getElementById('universalApplicationModalOverlay');
            if (!overlay) return;

            // Определяем режим по атрибуту data-modal-open или data-vacancy-id
            let mode = 'vacancy';
            const vacancyId = triggerElement ? triggerElement.getAttribute('data-vacancy-id') : null;
            
            // Если есть ID вакансии - это отклик на конкретную вакансию
            // Если нет - это общая заявка (кнопка "Оставить заявку")
            if (!vacancyId) {
                mode = 'application';
            }

            // Динамическая настройка текстов в зависимости от режима
            const modalTitle = document.getElementById('universalApplicationModalTitle');
            const submitBtnText = document.getElementById('universalSubmitBtnText');
            const successTitle = document.getElementById('universalSuccessTitle');
            
            if (mode === 'application') {
                // Режим для кнопки "Отправить заявку"
                if (modalTitle) modalTitle.textContent = 'Отправить заявку';
                if (submitBtnText) submitBtnText.textContent = 'Отправить информацию';
                if (successTitle) successTitle.textContent = 'Данные отправлены!';
            } else {
                // Режим для кнопок "Откликнуться"
                if (modalTitle) modalTitle.textContent = 'Отклик на вакансию';
                if (submitBtnText) submitBtnText.textContent = 'Отправить отклик';
                if (successTitle) successTitle.textContent = 'Отклик отправлен!';
            }

            // Используем централизованный ScrollManager для блокировки скролла
            if (window.ScrollManager) {
                ScrollManager.lock();
            } else {
                // Fallback для обратной совместимости
                const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
                const scrollbarWidth = ComponentLoader.getScrollbarWidth();
                if (scrollbarWidth > 0) {
                    document.body.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
                    document.body.classList.add('scroll-padding-fix');
                }
                document.body.classList.add('no-scroll');
            }

            overlay.classList.add('active');
            
            // Фокус на первом поле
            setTimeout(() => {
                const firstInput = overlay.querySelector('input, textarea');
                if (firstInput) firstInput.focus();
            }, 100);
        };

        window.closeUniversalApplicationModal = () => {
            const overlay = document.getElementById('universalApplicationModalOverlay');
            if (!overlay) return;

            // Используем modalManager если доступен (для консистентности)
            if (typeof modalManager !== 'undefined' && modalManager.modals.has('universal')) {
                modalManager.close('universal');
            } else {
                overlay.classList.remove('active');
                
                // Используем централизованный ScrollManager для восстановления скролла
                if (window.ScrollManager) {
                    ScrollManager.unlock();
                } else {
                    // Fallback для обратной совместимости
                    document.body.classList.remove('no-scroll');
                    document.body.classList.remove('scroll-padding-fix');
                    document.body.style.removeProperty('--scrollbar-width');
                }
            }
        };

        // Обработчик чекбокса согласия и валидации формы
        const consentCheckbox = document.getElementById('universalConsent');
        const submitBtn = document.getElementById('universalSubmitBtn');
        const fullNameInput = document.getElementById('universalFullName');
        const phoneInput = document.getElementById('universalPhone');
        const emailInput = document.getElementById('universalEmail');
        const aboutInput = document.getElementById('universalAbout');
        const fileInput = document.getElementById('universalFileAttachment');
        
        // Применяем автопрефикс +7 к полю телефона в универсальной модалке
        Utils.PhoneUtils.setupAutoPrefix(phoneInput);
        
        function checkFormValidity() {
            if (!consentCheckbox || !consentCheckbox.checked) {
                submitBtn.disabled = true;
                return;
            }
            
            const isFullNameValid = fullNameInput && fullNameInput.value.trim().length >= 2;
            const isPhoneValid = phoneInput && Utils.Validator.phone(phoneInput.value);
            const isEmailValid = emailInput && Utils.Validator.email(emailInput.value);
            const isAboutValid = aboutInput && aboutInput.value.trim().length >= 10;
            const isFileValid = fileInput && fileInput.files && fileInput.files.length > 0;
            
            submitBtn.disabled = !(isFullNameValid && isPhoneValid && isEmailValid && isAboutValid && isFileValid);
        }
        
        if (consentCheckbox && submitBtn) {
            consentCheckbox.addEventListener('change', checkFormValidity);
            if (fullNameInput) fullNameInput.addEventListener('input', checkFormValidity);
            if (phoneInput) phoneInput.addEventListener('input', checkFormValidity);
            if (emailInput) emailInput.addEventListener('input', checkFormValidity);
            if (aboutInput) aboutInput.addEventListener('input', checkFormValidity);
            if (fileInput) fileInput.addEventListener('change', checkFormValidity);
            
            // Initial check
            checkFormValidity();
        }

        // Обработчик отправки формы
        const universalForm = document.getElementById('universalApplicationForm');
        if (universalForm) {
            universalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Проверка чекбокса
                if (!consentCheckbox || !consentCheckbox.checked) {
                    const consentError = document.getElementById('universalConsentError');
                    if (consentError) consentError.classList.add('show');
                    return;
                }
                
                // Проверка обязательных полей
                let isValid = true;
                
                if (!fullNameInput || fullNameInput.value.trim().length < 2) {
                    const error = document.getElementById('universalFullNameError');
                    if (error) error.classList.add('show');
                    isValid = false;
                }
                
                if (!phoneInput || !Utils.Validator.phone(phoneInput.value)) {
                    const error = document.getElementById('universalPhoneError');
                    if (error) error.classList.add('show');
                    isValid = false;
                }
                
                if (!emailInput || !Utils.Validator.email(emailInput.value)) {
                    const error = document.getElementById('universalEmailError');
                    if (error) error.classList.add('show');
                    isValid = false;
                }
                
                if (!aboutInput || aboutInput.value.trim().length < 10) {
                    const error = document.getElementById('universalAboutError');
                    if (error) error.classList.add('show');
                    isValid = false;
                }
                
                if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                    const fileError = document.createElement('p');
                    fileError.className = 'error-message show';
                    fileError.id = 'universalFileError';
                    fileError.textContent = 'Пожалуйста, прикрепите резюме';
                    
                    const existingError = document.getElementById('universalFileError');
                    if (!existingError && fileInput) {
                        fileInput.parentElement.appendChild(fileError);
                    }
                    isValid = false;
                }
                
                if (!isValid) return;

                // Здесь будет логика отправки формы
                Logger.INFO('Отправка заявки...');
                
                // Показываем сообщение об успехе
                const successMessage = document.getElementById('universalSuccessMessage');
                const form = document.getElementById('universalApplicationForm');
                
                if (successMessage && form) {
                    form.classList.add('form-element-hidden');
                    successMessage.classList.add('show');
                    
                    // Закрываем модалку через 3 секунды
                    setTimeout(() => {
                        window.closeUniversalApplicationModal();
                        // Сбрасываем форму
                        form.reset();
                        form.classList.remove('form-element-hidden');
                        successMessage.classList.remove('show');
                        
                        // Сбрасываем файлы
                        if (window.formManager) {
                            window.formManager.currentFiles = [];
                            const fileList = document.getElementById('universalFileList');
                            if (fileList) fileList.innerHTML = '';
                            const fileText = document.querySelector('#universalFileDrop .form-file-text');
                            if (fileText) fileText.textContent = 'Выбрать файл...';
                        }
                    }, 3000);
                }
            });
        }

        // Инициализация загрузки файлов для универсального модального окна
        if (window.formManager) {
            setTimeout(() => {
                const universalFileDrop = document.getElementById('universalFileDrop');
                if (universalFileDrop) {
                    window.formManager._initFileUpload(document.getElementById('universalApplicationModalOverlay'));
                }
            }, 150);
        }

        // Обработчик закрытия по клику на оверлей
        const overlay = document.getElementById('universalApplicationModalOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    window.closeUniversalApplicationModal();
                }
            });
        }
    },
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentLoader;
}
