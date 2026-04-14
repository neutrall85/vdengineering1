/**
 * ComponentLoader - загрузчик общих компонентов (header, footer)
 * Устраняет дублирование HTML между страницами
 */

// Документы политик (DRY подход - единый источник истины)
const POLICY_DOCUMENTS = {
  terms: {
    title: 'Условия обслуживания',
    content: `
      <h2>1. Общие положения</h2>
      <p>Настоящие Условия обслуживания регулируют отношения между ООО "Волга-Днепр Инжиниринг" и пользователями сайта.</p>
      
      <h2>2. Предмет соглашения</h2>
      <p>Компания предоставляет услуги по разработке модификаций авиационной техники в соответствии с действующим законодательством.</p>
      
      <h2>3. Обязательства сторон</h2>
      <p>Пользователь обязуется использовать информацию сайта в соответствии с законодательством РФ.</p>
      
      <h2>4. Ответственность</h2>
      <p>Компания не несет ответственности за убытки, возникшие в результате использования информации сайта.</p>
      
      <h2>5. Изменение условий</h2>
      <p>Компания вправе вносить изменения в настоящие Условия без предварительного уведомления.</p>
    `
  },
  privacy: {
    title: 'Политика конфиденциальности',
    content: `
      <h2>1. Общие положения</h2>
      <p>Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей.</p>
      
      <h2>2. Сбор персональных данных</h2>
      <p>Мы собираем только те данные, которые необходимы для предоставления услуг.</p>
      
      <h2>3. Использование данных</h2>
      <p>Персональные данные используются исключительно для связи с пользователем и предоставления услуг.</p>
      
      <h2>4. Защита данных</h2>
      <p>Компания применяет все необходимые меры для защиты персональных данных пользователей.</p>
      
      <h2>5. Передача данных третьим лицам</h2>
      <p>Передача данных возможна только в случаях, предусмотренных законодательством РФ.</p>
    `
  },
  'personal-data': {
    title: 'Политика обработки персональных данных',
    content: `
      <h2>1. Общие положения</h2>
      <p>Политика разработана в соответствии с Федеральным законом № 152-ФЗ "О персональных данных".</p>
      
      <h2>2. Цели обработки</h2>
      <p>Обработка персональных данных осуществляется для заключения и исполнения договоров.</p>
      
      <h2>3. Правовые основания</h2>
      <p>Обработка осуществляется с согласия субъекта персональных данных.</p>
      
      <h2>4. Объем и категории данных</h2>
      <p>Обрабатываются: ФИО, контактные данные, информация о компании.</p>
      
      <h2>5. Срок обработки</h2>
      <p>Данные хранятся до достижения целей обработки или отзыва согласия.</p>
    `
  },
  cookies: {
    title: 'Политика в отношении файлов cookie',
    content: `
      <h2>1. Что такое cookie</h2>
      <p>Cookie — это небольшие текстовые файлы, сохраняемые на устройстве пользователя.</p>
      
      <h2>2. Какие cookie мы используем</h2>
      <p>Мы используем технические cookie для обеспечения работы сайта.</p>
      
      <h2>3. Управление cookie</h2>
      <p>Пользователь может отключить cookie в настройках браузера.</p>
      
      <h2>4. Сторонние cookie</h2>
      <p>На сайте могут использоваться сервисы третьих лиц (Яндекс.Метрика).</p>
      
      <h2>5. Обновление политики</h2>
      <p>Политика может обновляться. Актуальная версия размещена на сайте.</p>
    `
  }
};

const ComponentLoader = {
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
  <a href="index.html#partners">Партнёры</a>
  <a href="index.html#contact">Контакты</a>
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
          <label class="form-label">Телефон <span class="required">*</span></label>
          <div style="display: flex; gap: 10px;">
            <input type="tel" class="form-input" id="phone" name="phone" placeholder="+7 (999) 000-00-00" required minlength="10" maxlength="20" autocomplete="tel" style="flex: 1;">
            <input type="text" class="form-input" id="extension" name="extension" placeholder="доб." maxlength="6" autocomplete="off" style="width: 100px;">
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
                        modalPhoneInput.addEventListener('blur', function() {
                            let value = this.value.trim();
                            if (value.length > 0 && !value.startsWith('+')) {
                                if (value.startsWith('8') && value.length > 1) {
                                    value = '+7' + value.substring(1);
                                } else if (value.length >= 10) {
                                    value = '+7' + value;
                                }
                                this.value = value;
                            }
                        });
                    }
                }, 0);
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
        // Скрываем ссылку "Главная" на главной странице (index.html)
        const isHomePage = activePage === '' || activePage === 'index';
        
        // Обрабатываем десктопное меню
        const homeLinkDesktop = document.querySelector('.nav-links .home-link');
        if (homeLinkDesktop) {
            homeLinkDesktop.style.display = isHomePage ? 'none' : 'block';
        }
        
        // Обрабатываем мобильное меню
        const homeLinkMobile = document.querySelector('.mobile-menu .home-link-mobile');
        if (homeLinkMobile) {
            homeLinkMobile.style.display = isHomePage ? 'none' : 'block';
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
            console.warn(`Policy "${policyKey}" not found`);
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
            modalOverlay.innerHTML = `
                <div class="modal-container">
                    <button class="modal-close" onclick="window.closePolicyModal && window.closePolicyModal()" aria-label="Закрыть">
                        <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </button>
                    <div class="modal-header">
                        <h2 class="modal-title" id="policyModalTitle"></h2>
                    </div>
                    <div class="modal-body" id="policyModalContent"></div>
                </div>
            `;
            document.body.appendChild(modalOverlay);

            // Закрытие по клику на overlay
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closePolicyModal();
                }
            });
        }

        // Заполняем контент
        document.getElementById('policyModalTitle').textContent = policy.title;
        document.getElementById('policyModalContent').innerHTML = policy.content;

        // Блокируем скролл
        document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
        document.body.classList.add('no-scroll');

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
        document.body.classList.remove('no-scroll');
        document.body.style.paddingRight = '';
    }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentLoader;
}
