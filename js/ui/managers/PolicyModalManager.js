/**
 * PolicyModalManager - менеджер модальных окон политик
 * Отвечает за открытие/закрытие модальных окон с текстами политик
 * ООО "Волга-Днепр Инжиниринг"
 * 
 * Использует централизованный ModalHelpers для управления модалками
 */

const PolicyModalManager = {
    /**
     * Инициализация обработчиков для ссылок на политики
     */
    init() {
        document.addEventListener('click', (e) => {
            const policyLink = e.target.closest('[data-policy]');
            if (policyLink) {
                e.preventDefault();
                const policyKey = policyLink.getAttribute('data-policy');
                ModalHelpers.open('policy');
            }
        });
    },

    /**
     * Открытие модального окна с текстом политики
     * @param {string} policyKey - ключ политики (terms, privacy, personal-data, cookies)
     * @param {boolean} keepParentModal - если true, не закрывать родительскую модалку
     */
    openPolicyModal(policyKey, keepParentModal = true) {
        const policy = POLICY_DOCUMENTS[policyKey];
        if (!policy) {
            Logger.WARN(`Policy "${policyKey}" not found`);
            return;
        }

        let modalOverlay = document.getElementById('policyModalOverlay');
        if (!modalOverlay) {
            modalOverlay = this._createPolicyModal();
        }

        document.getElementById('policyModalTitle').textContent = policy.title;
        const sanitizer = Utils.Sanitizer || { sanitizeHtml: (html) => html };
        const safeContent = sanitizer.sanitizeHtml(policy.content, {
          allowedTags: ['h2', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a'],
          allowedAttributes: { 'a': ['href', 'target', 'rel'] }
        });
        
        // Безопасная вставка через DOM API и DOMParser
        const contentContainer = document.getElementById('policyModalContent');
        contentContainer.replaceChildren();
        
        // Используем DOMParser для безопасного парсинга HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(safeContent, 'text/html');
        
        // Переносим узлы с проверкой
        Array.from(doc.body.childNodes).forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Удаляем опасные атрибуты
            Array.from(node.attributes).forEach(attr => {
              if (attr.name.startsWith('on') || attr.name.toLowerCase() === 'srcdoc') {
                node.removeAttribute(attr.name);
              }
            });
          }
          contentContainer.appendChild(node.cloneNode(true));
        });

        // Открываем через централизованный ModalHelpers
        ModalHelpers.open('policy', { keepParentModal });
    },

    /**
     * Закрытие модального окна политики
     */
    closePolicyModal() {
        // Используем централизованный ModalHelpers
        ModalHelpers.close('policy');
    },

    /**
     * Создание DOM-структуры модального окна политики
     * @returns {HTMLElement} overlay элемент модального окна
     */
    _createPolicyModal() {
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

        // Регистрация в ModalManager через централизованный ModalHelpers
        if (typeof ModalHelpers !== 'undefined') {
            ModalHelpers.register('policy', { overlayId: 'policyModalOverlay' });
        }
        
        return modalOverlay;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PolicyModalManager;
}
