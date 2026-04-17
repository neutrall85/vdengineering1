/**
 * ModalBuilder - конструктор модальных окон
 * Отвечает за создание, отображение и управление модальными окнами
 * ООО "Волга-Днепр Инжиниринг"
 */

const ModalBuilder = {
    // Модальное окно коммерческого предложения
    proposalModal: `
<!-- Commercial Proposal Modal -->
<div class="modal-overlay" id="modalOverlay" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
  <div class="modal-container">
    <button class="modal-close" id="modalCloseBtn" aria-label="Закрыть">
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

    // Универсальное модальное окно для заявок
    universalApplicationModal: `
<!-- Universal Application Modal -->
<div class="modal-overlay" id="universalApplicationModalOverlay" role="dialog" aria-modal="true" aria-labelledby="universalApplicationModalTitle">
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
     * Загрузка модального окна коммерческого предложения
     */
    loadProposalModal() {
        const existingModal = document.getElementById(UIConstants.MODALS.PROPOSAL_OVERLAY);
        if (!existingModal) {
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = this.proposalModal.trim();
            document.body.appendChild(modalContainer.firstElementChild);
            
            // Инициализация автоподстановки +7 для поля телефона в модалке
            setTimeout(() => {
                const modalPhoneInput = document.querySelector(`#${UIConstants.MODALS.PROPOSAL_OVERLAY} #phone`);
                if (modalPhoneInput) {
                    Utils.PhoneUtils.setupAutoPrefix(modalPhoneInput);
                }
            }, 0);
        }
    },

    /**
     * Загрузка универсального модального окна для заявок
     */
    loadUniversalModal() {
        const existingUniversalModal = document.getElementById(UIConstants.MODALS.UNIVERSAL_OVERLAY);
        if (!existingUniversalModal) {
            const universalModalContainer = document.createElement('div');
            universalModalContainer.innerHTML = this.universalApplicationModal.trim();
            document.body.appendChild(universalModalContainer.firstElementChild);
            
            // Инициализация обработчиков для универсального модального окна
            setTimeout(() => {
                this.initUniversalApplicationModal();
            }, 100);
        }
    },

    /**
     * Инициализация универсального модального окна заявок
     */
    initUniversalApplicationModal() {
        // Глобальная функция для открытия универсального модального окна
        window.openApplicationModal = (triggerElement) => {
            const overlay = document.getElementById(UIConstants.MODALS.UNIVERSAL_OVERLAY);
            if (!overlay) return;

            // Определяем режим по атрибуту data-vacancy-id
            let mode = UIConstants.MODAL_MODES.VACANCY;
            const vacancyId = triggerElement ? triggerElement.getAttribute(UIConstants.ATTRIBUTES.VACANCY_ID) : null;
            
            if (!vacancyId) {
                mode = UIConstants.MODAL_MODES.APPLICATION;
            }

            // Динамическая настройка текстов в зависимости от режима
            this._updateModalTexts(mode);

            // Блокируем скролл body
            this._lockScroll();

            overlay.classList.add(UIConstants.CLASSES.ACTIVE);
            
            // Фокус на первом поле
            setTimeout(() => {
                const firstInput = overlay.querySelector('input, textarea');
                if (firstInput) firstInput.focus();
            }, UIConstants.TIMINGS.FOCUS_DELAY);
        };

        window.closeUniversalApplicationModal = () => {
            const overlay = document.getElementById(UIConstants.MODALS.UNIVERSAL_OVERLAY);
            if (!overlay) return;

            // Используем modalManager если доступен
            if (typeof modalManager !== 'undefined' && modalManager.modals.has('universal')) {
                modalManager.close('universal');
            } else {
                this._unlockScroll();
                overlay.classList.remove(UIConstants.CLASSES.ACTIVE);
            }
        };

        // Инициализация валидации формы
        this._initUniversalFormValidation();
        
        // Инициализация загрузки файлов
        this._initUniversalFileUpload();
        
        // Обработчик закрытия по клику на оверлей
        this._initOverlayClickHandler();
    },

    /**
     * Обновление текстов модального окна в зависимости от режима
     * @param {string} mode - режим (vacancy или application)
     */
    _updateModalTexts(mode) {
        const modalTitle = document.getElementById('universalApplicationModalTitle');
        const submitBtnText = document.getElementById('universalSubmitBtnText');
        const successTitle = document.getElementById('universalSuccessTitle');
        
        if (mode === UIConstants.MODAL_MODES.APPLICATION) {
            if (modalTitle) modalTitle.textContent = 'Отправить заявку';
            if (submitBtnText) submitBtnText.textContent = 'Отправить информацию';
            if (successTitle) successTitle.textContent = 'Данные отправлены!';
        } else {
            if (modalTitle) modalTitle.textContent = 'Отклик на вакансию';
            if (submitBtnText) submitBtnText.textContent = 'Отправить отклик';
            if (successTitle) successTitle.textContent = 'Отклик отправлен!';
        }
    },

    /**
     * Блокировка скролла страницы
     */
    _lockScroll() {
        const scrollbarWidth = HeaderLoader.getScrollbarWidth();
        if (scrollbarWidth > 0) {
            document.body.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
            document.body.classList.add(UIConstants.CLASSES.SCROLL_PADDING_FIX);
        }
        document.body.classList.add(UIConstants.CLASSES.NO_SCROLL);
    },

    /**
     * Разблокировка скролла страницы
     */
    _unlockScroll() {
        document.body.classList.remove(UIConstants.CLASSES.NO_SCROLL);
        document.body.classList.remove(UIConstants.CLASSES.SCROLL_PADDING_FIX);
        document.body.style.removeProperty('--scrollbar-width');
    },

    /**
     * Инициализация валидации формы универсального модального окна
     */
    _initUniversalFormValidation() {
        const consentCheckbox = document.getElementById('universalConsent');
        const submitBtn = document.getElementById('universalSubmitBtn');
        const fullNameInput = document.getElementById('universalFullName');
        const phoneInput = document.getElementById('universalPhone');
        const emailInput = document.getElementById('universalEmail');
        const aboutInput = document.getElementById('universalAbout');
        const fileInput = document.getElementById('universalFileAttachment');
        
        // Применяем автопрефикс +7 к полю телефона
        Utils.PhoneUtils.setupAutoPrefix(phoneInput);
        
        const checkFormValidity = () => {
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
        };
        
        if (consentCheckbox && submitBtn) {
            consentCheckbox.addEventListener('change', checkFormValidity);
            if (fullNameInput) fullNameInput.addEventListener('input', checkFormValidity);
            if (phoneInput) phoneInput.addEventListener('input', checkFormValidity);
            if (emailInput) emailInput.addEventListener('input', checkFormValidity);
            if (aboutInput) aboutInput.addEventListener('input', checkFormValidity);
            if (fileInput) fileInput.addEventListener('change', checkFormValidity);
            
            checkFormValidity();
        }

        // Обработчик отправки формы
        this._initUniversalFormSubmit(fullNameInput, phoneInput, emailInput, aboutInput, fileInput, consentCheckbox);
    },

    /**
     * Инициализация обработчика отправки формы
     */
    _initUniversalFormSubmit(fullNameInput, phoneInput, emailInput, aboutInput, fileInput, consentCheckbox) {
        const universalForm = document.getElementById(UIConstants.MODALS.UNIVERSAL_FORM);
        if (!universalForm) return;

        universalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Проверка чекбокса
            if (!consentCheckbox || !consentCheckbox.checked) {
                const consentError = document.getElementById('universalConsentError');
                if (consentError) consentError.classList.add(UIConstants.CLASSES.SHOW);
                return;
            }
            
            // Проверка обязательных полей
            let isValid = true;
            
            if (!fullNameInput || fullNameInput.value.trim().length < 2) {
                const error = document.getElementById('universalFullNameError');
                if (error) error.classList.add(UIConstants.CLASSES.SHOW);
                isValid = false;
            }
            
            if (!phoneInput || !Utils.Validator.phone(phoneInput.value)) {
                const error = document.getElementById('universalPhoneError');
                if (error) error.classList.add(UIConstants.CLASSES.SHOW);
                isValid = false;
            }
            
            if (!emailInput || !Utils.Validator.email(emailInput.value)) {
                const error = document.getElementById('universalEmailError');
                if (error) error.classList.add(UIConstants.CLASSES.SHOW);
                isValid = false;
            }
            
            if (!aboutInput || aboutInput.value.trim().length < 10) {
                const error = document.getElementById('universalAboutError');
                if (error) error.classList.add(UIConstants.CLASSES.SHOW);
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

            Logger.INFO('Отправка заявки...');
            
            // Показываем сообщение об успехе
            const successMessage = document.getElementById('universalSuccessMessage');
            const form = document.getElementById(UIConstants.MODALS.UNIVERSAL_FORM);
            
            if (successMessage && form) {
                form.classList.add('form-element-hidden');
                successMessage.classList.add(UIConstants.CLASSES.SHOW);
                
                // Закрываем модалку через 3 секунды
                setTimeout(() => {
                    window.closeUniversalApplicationModal();
                    form.reset();
                    form.classList.remove('form-element-hidden');
                    successMessage.classList.remove(UIConstants.CLASSES.SHOW);
                    
                    // Сбрасываем файлы
                    if (window.formManager) {
                        window.formManager.currentFiles = [];
                        const fileList = document.getElementById('universalFileList');
                        if (fileList) fileList.innerHTML = '';
                        const fileText = document.querySelector('#universalFileDrop .form-file-text');
                        if (fileText) fileText.textContent = 'Выбрать файл...';
                    }
                }, UIConstants.TIMINGS.MODAL_CLOSE_DELAY);
            }
        });
    },

    /**
     * Инициализация загрузки файлов для универсального модального окна
     */
    _initUniversalFileUpload() {
        if (window.formManager) {
            setTimeout(() => {
                const universalFileDrop = document.getElementById('universalFileDrop');
                if (universalFileDrop) {
                    window.formManager._initFileUpload(document.getElementById(UIConstants.MODALS.UNIVERSAL_OVERLAY));
                }
            }, 150);
        }
    },

    /**
     * Инициализация обработчика клика по оверлею
     */
    _initOverlayClickHandler() {
        const overlay = document.getElementById(UIConstants.MODALS.UNIVERSAL_OVERLAY);
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    window.closeUniversalApplicationModal();
                }
            });
        }
    }
};

// Экспорт
window.ModalBuilder = ModalBuilder;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalBuilder;
}
