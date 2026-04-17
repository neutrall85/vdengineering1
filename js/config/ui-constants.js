/**
 * Конфигурация UI компонентов
 * Содержит константы, ID элементов и селекторы
 * ООО "Волга-Днепр Инжиниринг"
 */

const UIConstants = {
    // ID модальных окон
    MODALS: {
        PROPOSAL_OVERLAY: 'modalOverlay',
        PROPOSAL_CLOSE_BTN: 'modalCloseBtn',
        PROPOSAL_FORM: 'proposalForm',
        UNIVERSAL_OVERLAY: 'universalApplicationModalOverlay',
        UNIVERSAL_CLOSE_BTN: 'universalModalCloseBtn',
        UNIVERSAL_FORM: 'universalApplicationForm',
        POLICY_OVERLAY: 'policyModalOverlay',
        POLICY_CLOSE_BTN: 'policyModalCloseBtn',
        POLICY_CONTENT: 'policyModalContent',
        POLICY_TITLE: 'policyModalTitle'
    },

    // Селекторы хедера
    HEADER: {
        NAVBAR: '#navbar',
        MOBILE_MENU_BTN: '#mobileMenuBtn',
        MOBILE_MENU_CLOSE: '#mobileMenuClose',
        MOBILE_MENU: '#mobileMenu',
        MOBILE_MENU_OVERLAY: '#mobileMenuOverlay',
        NAV_LINKS: '.nav-links',
        MOBILE_NAV_LINKS: '.mobile-menu a'
    },

    // Селекторы футера
    FOOTER: {
        FOOTER: 'footer.footer',
        CURRENT_YEAR: '#currentYear',
        POLICY_LINKS: '[data-policy]'
    },

    // Классы для управления состоянием
    CLASSES: {
        ACTIVE: 'active',
        HIDDEN: 'hidden',
        NO_SCROLL: 'no-scroll',
        SCROLL_PADDING_FIX: 'scroll-padding-fix',
        SHOW: 'show'
    },

    // Атрибуты данных
    ATTRIBUTES: {
        POLICY_KEY: 'data-policy',
        VACANCY_ID: 'data-vacancy-id',
        MODAL_OPEN: 'data-modal-open'
    },

    // Режимы универсального модального окна
    MODAL_MODES: {
        VACANCY: 'vacancy',
        APPLICATION: 'application'
    },

    // Тайминги
    TIMINGS: {
        MODAL_OPEN_DELAY: 50,
        MODAL_CLOSE_DELAY: 3000,
        CALLBACK_DELAY: 50,
        FOCUS_DELAY: 100
    }
};

// Экспорт
window.UIConstants = UIConstants;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIConstants;
}
