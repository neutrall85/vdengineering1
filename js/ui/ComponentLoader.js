/**
 * ComponentLoader - загрузчик общих компонентов (header, footer)
 * Устраняет дублирование HTML между страницами
 * 
 * Зависимости:
 * - templates/ComponentTemplates.js - HTML-шаблоны компонентов
 * - templates/ModalTemplates.js - HTML-шаблоны модальных окон
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
            const navContainer = document.getElementById('navbar');
            if (navContainer && !navContainer.hasChildNodes()) {
                navContainer.innerHTML = this.navbar.trim();
                this.setActiveLink(activePage);
            } else if (!navContainer) {
                const newNavContainer = document.createElement('div');
                newNavContainer.id = 'navbar';
                newNavContainer.innerHTML = this.navbar.trim();
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
                    // Инициализация через UniversalApplicationModalManager
                    if (typeof UniversalApplicationModalManager !== 'undefined') {
                        UniversalApplicationModalManager.init();
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
                // Инициализация политик через PolicyModalManager
                if (typeof PolicyModalManager !== 'undefined') {
                    PolicyModalManager.init();
                }
            } else {
                existingFooter.outerHTML = this.footer;
                this.updateYear();
                if (typeof PolicyModalManager !== 'undefined') {
                    PolicyModalManager.init();
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
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentLoader;
}
}