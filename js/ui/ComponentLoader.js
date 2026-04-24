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
    templates: {
        navbar: typeof ComponentTemplates !== 'undefined' ? ComponentTemplates.navbar : '',
        footer: typeof ComponentTemplates !== 'undefined' ? ComponentTemplates.footer : '',
        proposalModal: typeof ModalTemplates !== 'undefined' ? ModalTemplates.proposalModal : '',
        universalApplicationModal: typeof ModalTemplates !== 'undefined' ? ModalTemplates.universalApplicationModal : ''
    },

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
            this._loadNavbar(activePage);
            if (callback) {
                setTimeout(callback, 50);
            }
        }
        
        // Загрузка модальных окон
        if (loadModal) {
            this._loadModals();
        }

        // Загрузка футера
        if (loadFooter) {
            this._loadFooter(activePage);
        }

        document.dispatchEvent(new CustomEvent('components:loaded'));

        if (activePage) {
            this.setActiveLink(activePage);
        }
    },

    _loadNavbar(activePage) {
        const navContainer = document.getElementById('navbar');
        if (navContainer && !navContainer.hasChildNodes()) {
            navContainer.innerHTML = this.templates.navbar.trim();
            this.setActiveLink(activePage);
        } else if (!navContainer) {
            const newNavContainer = document.createElement('div');
            newNavContainer.id = 'navbar';
            newNavContainer.innerHTML = this.templates.navbar.trim();
            const firstBodyChild = document.body.firstChild;
            document.body.insertBefore(newNavContainer, firstBodyChild);
            this.setActiveLink(activePage);
        } else {
            this.setActiveLink(activePage);
        }
        
        if (!document.getElementById('mobileMenuOverlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'mobile-menu-overlay';
            overlay.id = 'mobileMenuOverlay';
            document.body.appendChild(overlay);
        }
    },

    _loadModals() {
        // Загрузка модального окна КП
        const existingModal = document.getElementById('modalOverlay');
        if (!existingModal) {
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = this.templates.proposalModal.trim();
            document.body.appendChild(modalContainer.firstElementChild);
            setTimeout(() => {
                const modalPhoneInput = document.querySelector('#modalOverlay #phone');
                if (modalPhoneInput) {
                    Utils.PhoneUtils.setupAutoPrefix(modalPhoneInput);
                }
            }, 0);
        }
        
        // Загрузка универсального модального окна заявок
        const existingUniversalModal = document.getElementById('universalApplicationModalOverlay');
        if (!existingUniversalModal) {
            const universalModalContainer = document.createElement('div');
            universalModalContainer.innerHTML = this.templates.universalApplicationModal.trim();
            document.body.appendChild(universalModalContainer.firstElementChild);
            setTimeout(() => {
                if (typeof UniversalApplicationModalManager !== 'undefined') {
                    UniversalApplicationModalManager.init();
                } else {
                    Logger.WARN('UniversalApplicationModalManager not available');
                }
            }, 100);
        }
    },

    _loadFooter(activePage) {
        const existingFooter = document.querySelector('body > footer.footer');
        if (!existingFooter) {
            const footerContainer = document.createElement('div');
            footerContainer.innerHTML = this.templates.footer.trim();
            document.body.appendChild(footerContainer.firstElementChild);
        } else {
            existingFooter.outerHTML = this.templates.footer;
        }
        
        this.updateYear();
        
        // Инициализация менеджера политик
        if (typeof PolicyModalManager !== 'undefined') {
            PolicyModalManager.init();
        } else {
            Logger.WARN('PolicyModalManager not available');
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
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentLoader;
}
