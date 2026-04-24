/**
 * ComponentLoader - загрузчик общих компонентов (header, footer)
 * Устраняет дублирование HTML между страницами
 * 
 * Зависимости:
 * - templates/ComponentTemplates.js - HTML-шаблоны компонентов
 * - templates/ModalTemplates.js - HTML-шаблоны модальных окон
 * - managers/PolicyModalManager.js - управление модальными окнами политик
 * - managers/UniversalApplicationModalManager.js - управление модальным окном заявок
 */

const ComponentLoader = {
    // Импортируем шаблоны из внешних файлов (должны быть подключены перед этим скриптом)
    navbar: typeof ComponentTemplates !== 'undefined' ? ComponentTemplates.navbar : '',
    footer: typeof ComponentTemplates !== 'undefined' ? ComponentTemplates.footer : '',
    proposalModal: typeof ModalTemplates !== 'undefined' ? ModalTemplates.proposalModal : '',
    universalApplicationModal: typeof ModalTemplates !== 'undefined' ? ModalTemplates.universalApplicationModal : '',

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

        // Загрузка навигации
        if (loadNavbar) {
            const existingNav = document.querySelector('body > nav.navbar');
            if (!existingNav) {
                const navContainer = document.createElement('div');
                navContainer.innerHTML = this.navbar.trim();
                const firstBodyChild = document.body.firstChild;
                document.body.insertBefore(navContainer.firstElementChild, firstBodyChild);
                this.setActiveLink(activePage);
            } else {
                existingNav.outerHTML = this.navbar;
                this.setActiveLink(activePage);
            }
            
            if (!document.getElementById('mobileMenuOverlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'mobile-menu-overlay';
                overlay.id = 'mobileMenuOverlay';
                document.body.appendChild(overlay);
            }
            
            if (callback) {
                setTimeout(callback, 50);
            }
        }
        
        // Загрузка модальных окон
        if (loadModal) {
            const existingModal = document.getElementById('modalOverlay');
            if (!existingModal) {
                const modalContainer = document.createElement('div');
                modalContainer.innerHTML = this.proposalModal.trim();
                document.body.appendChild(modalContainer.firstElementChild);
                setTimeout(() => {
                    const modalPhoneInput = document.querySelector('#modalOverlay #phone');
                    if (modalPhoneInput) {
                        Utils.PhoneUtils.setupAutoPrefix(modalPhoneInput);
                    }
                }, 0);
            }
            
            const existingUniversalModal = document.getElementById('universalApplicationModalOverlay');
            if (!existingUniversalModal) {
                const universalModalContainer = document.createElement('div');
                universalModalContainer.innerHTML = this.universalApplicationModal.trim();
                document.body.appendChild(universalModalContainer.firstElementChild);
                setTimeout(() => {
                    // Используем UniversalApplicationModalManager если доступен
                    if (typeof UniversalApplicationModalManager !== 'undefined') {
                        UniversalApplicationModalManager.init();
                    } else {
                        this.initUniversalApplicationModal();
                    }
                }, 100);
            }
        }

        // Загрузка футера
        if (loadFooter) {
            const existingFooter = document.querySelector('body > footer.footer');
            if (!existingFooter) {
                const footerContainer = document.createElement('div');
                footerContainer.innerHTML = this.footer.trim();
                document.body.appendChild(footerContainer.firstElementChild);
                this.updateYear();
                // Используем PolicyModalManager если доступен
                if (typeof PolicyModalManager !== 'undefined') {
                    PolicyModalManager.init();
                } else {
                    this.initPolicyLinks();
                }
            } else {
                existingFooter.outerHTML = this.footer;
                this.updateYear();
                if (typeof PolicyModalManager !== 'undefined') {
                    PolicyModalManager.init();
                } else {
                    this.initPolicyLinks();
                }
            }
        }

        document.dispatchEvent(new CustomEvent('components:loaded'));

        if (activePage) {
            this.setActiveLink(activePage);
        }
    },

    setActiveLink(activePage) {
        const isHomePage = activePage === '' || activePage === 'index';
        const homeLinkDesktop = document.querySelector('.nav-links .home-link');
        if (homeLinkDesktop) {
            if (isHomePage) homeLinkDesktop.classList.add('hidden');
            else homeLinkDesktop.classList.remove('hidden');
        }
        const homeLinkMobile = document.querySelector('.mobile-menu .home-link-mobile');
        if (homeLinkMobile) {
            if (isHomePage) homeLinkMobile.classList.add('hidden');
            else homeLinkMobile.classList.remove('hidden');
        }
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === activePage || link.getAttribute('href') === `${activePage}.html`) {
                link.classList.add('active');
            }
        });
        document.querySelectorAll('.mobile-menu a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === activePage || link.getAttribute('href') === `${activePage}.html`) {
                link.classList.add('active');
            }
        });
    },

    updateYear() {
        const yearElement = document.getElementById('currentYear');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
    },

    /**
     * Инициализация обработчиков для ссылок на политики (устаревший метод)
     * Рекомендуется использовать PolicyModalManager.init()
     */
    initPolicyLinks() {
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
     * Открытие модального окна с текстом политики (устаревший метод)
     * Рекомендуется использовать PolicyModalManager.openPolicyModal()
     * @param {string} policyKey - ключ политики (terms, privacy, personal-data, cookies)
     */
    openPolicyModal(policyKey) {
        // Делегируем вызов PolicyModalManager если доступен
        if (typeof PolicyModalManager !== 'undefined') {
            PolicyModalManager.openPolicyModal(policyKey);
            return;
        }
        
        // Fallback для обратной совместимости
        const policy = POLICY_DOCUMENTS[policyKey];
        if (!policy) {
            Logger.WARN(`Policy "${policyKey}" not found`);
            return;
        }

        let modalOverlay = document.getElementById('policyModalOverlay');
        if (!modalOverlay) {
            modalOverlay = this._createPolicyModalDOM();
        }

        document.getElementById('policyModalTitle').textContent = policy.title;
        const sanitizer = Utils.Sanitizer || { sanitizeHtml: (html) => html };
        document.getElementById('policyModalContent').innerHTML = sanitizer.sanitizeHtml(policy.content, {
          allowedTags: ['h2', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a'],
          allowedAttributes: { 'a': ['href', 'target', 'rel'] }
        });

        if (typeof modalManager !== 'undefined') {
            modalManager.open('policy');
        } else {
            Logger.WARN('ModalManager not available for policy modal');
        }
    },

    /**
     * Закрытие модального окна политики (устаревший метод)
     * Рекомендуется использовать PolicyModalManager.closePolicyModal()
     */
    closePolicyModal() {
        if (typeof PolicyModalManager !== 'undefined') {
            PolicyModalManager.closePolicyModal();
        } else if (typeof modalManager !== 'undefined') {
            modalManager.close('policy');
        } else {
            Logger.WARN('ModalManager not available for policy modal close');
        }
    },

    /**
     * Создание DOM-структуры модального окна политики (вспомогательный метод)
     * @returns {HTMLElement} overlay элемент модального окна
     */
    _createPolicyModalDOM() {
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'policyModalOverlay';
        modalOverlay.className = 'modal-overlay';
        modalOverlay.setAttribute('role', 'dialog');
        modalOverlay.setAttribute('aria-modal', 'true');
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.id = 'policyModalCloseBtn';
        closeBtn.setAttribute('aria-label', 'Закрыть');
        const svgNS = 'http://www.w3.org/2000/svg';
        const svgEl = document.createElementNS(svgNS, 'svg');
        svgEl.setAttribute('viewBox', '0 0 24 24');
        const pathEl = document.createElementNS(svgNS, 'path');
        pathEl.setAttribute('d', 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z');
        svgEl.appendChild(pathEl);
        closeBtn.appendChild(svgEl);
        
        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal-container';
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        const modalTitle = document.createElement('h2');
        modalTitle.className = 'modal-title';
        modalTitle.id = 'policyModalTitle';
        modalHeader.appendChild(modalTitle);
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        modalBody.id = 'policyModalContent';
        
        modalContainer.appendChild(closeBtn);
        modalContainer.appendChild(modalHeader);
        modalContainer.appendChild(modalBody);
        modalOverlay.appendChild(modalContainer);
        document.body.appendChild(modalOverlay);

        if (typeof modalManager !== 'undefined') {
            modalManager.register('policy', { overlayId: 'policyModalOverlay' });
        }
        
        return modalOverlay;
    },

    /**
     * Инициализация универсального модального окна заявок (устаревший метод)
     * Рекомендуется использовать UniversalApplicationModalManager.init()
     */
    initUniversalApplicationModal() {
        // Делегируем вызов UniversalApplicationModalManager если доступен
        if (typeof UniversalApplicationModalManager !== 'undefined') {
            UniversalApplicationModalManager.init();
            return;
        }
        
        // Fallback для обратной совместимости
        window.openApplicationModal = (triggerElement) => {
            const overlay = document.getElementById('universalApplicationModalOverlay');
            if (!overlay) return;

            let mode = 'vacancy';
            const vacancyId = triggerElement ? triggerElement.getAttribute('data-vacancy-id') : null;
            if (!vacancyId) mode = 'application';

            const modalTitle = document.getElementById('universalApplicationModalTitle');
            const submitBtnText = document.getElementById('universalSubmitBtnText');
            const successTitle = document.getElementById('universalSuccessTitle');
            
            if (mode === 'application') {
                if (modalTitle) modalTitle.textContent = 'Отправить заявку';
                if (submitBtnText) submitBtnText.textContent = 'Отправить информацию';
                if (successTitle) successTitle.textContent = 'Данные отправлены!';
            } else {
                if (modalTitle) modalTitle.textContent = 'Отклик на вакансию';
                if (submitBtnText) submitBtnText.textContent = 'Отправить отклик';
                if (successTitle) successTitle.textContent = 'Отклик отправлен!';
            }

            if (typeof modalManager !== 'undefined') {
                modalManager.open('universal');
            } else {
                Logger.WARN('ModalManager not available for universal application modal');
            }
        };

        window.closeUniversalApplicationModal = () => {
            if (typeof modalManager !== 'undefined') {
                modalManager.close('universal');
            } else {
                Logger.WARN('ModalManager not available for universal application modal close');
            }
        };

        const universalForm = document.getElementById('universalApplicationForm');
        let formValidator = null;
        
        if (universalForm && typeof FormValidation !== 'undefined') {
            formValidator = FormValidation.createValidator(universalForm, {
                validateOnInput: true,
                messages: {
                    required: 'Это поле обязательно для заполнения',
                    email: 'Введите корректный email адрес',
                    phone: 'Введите корректный номер телефона',
                    minLength: (min) => `Минимальная длина — ${min} символов`,
                    consent: 'Необходимо согласие на обработку данных',
                    fileRequired: 'Пожалуйста, прикрепите резюме'
                }
            });
        }

        if (universalForm) {
            universalForm.addEventListener('form:valid', (e) => {
                Logger.INFO('Форма валидна, отправка заявки...');
                const successMessage = document.getElementById('universalSuccessMessage');
                const form = document.getElementById('universalApplicationForm');
                
                if (successMessage && form) {
                    form.classList.add('form-element-hidden');
                    successMessage.classList.add('show');
                    
                    setTimeout(() => {
                        window.closeUniversalApplicationModal();
                        form.reset();
                        form.classList.remove('form-element-hidden');
                        successMessage.classList.remove('show');
                        
                        if (window.formManager) {
                            window.formManager.currentFiles = [];
                            const fileList = document.getElementById('universalFileList');
                            if (fileList) fileList.innerHTML = '';
                            const fileText = document.querySelector('#universalFileDrop .form-file-text');
                            if (fileText) fileText.textContent = 'Выбрать файл...';
                        }
                        
                        if (formValidator) formValidator.reset();
                    }, 3000);
                }
            });
        }

        const phoneInput = document.getElementById('universalPhone');
        if (phoneInput && Utils.PhoneUtils) {
            Utils.PhoneUtils.setupAutoPrefix(phoneInput);
        }

        if (window.formManager) {
            setTimeout(() => {
                const universalFileDrop = document.getElementById('universalFileDrop');
                if (universalFileDrop) {
                    window.formManager._initFileUpload(document.getElementById('universalApplicationModalOverlay'));
                }
            }, 150);
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentLoader;
}