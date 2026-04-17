/**
 * FooterLoader - загрузчик футера
 * Отвечает за рендеринг футера, обновление года и обработку ссылок политик
 * ООО "Волга-Днепр Инжиниринг"
 */

const FooterLoader = {
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

    /**
     * Загрузка футера на страницу
     */
    load() {
        const existingFooter = document.querySelector(UIConstants.FOOTER.FOOTER);
        if (!existingFooter) {
            const footerContainer = document.createElement('div');
            footerContainer.innerHTML = this.footer.trim();
            document.body.appendChild(footerContainer.firstElementChild);
            this.updateYear();
            this.initPolicyLinks();
        } else {
            // Если футер уже есть в HTML (для обратной совместимости), обновляем его
            existingFooter.outerHTML = this.footer;
            this.updateYear();
            this.initPolicyLinks();
        }
    },

    /**
     * Обновление года в футере
     */
    updateYear() {
        const yearElement = document.getElementById(UIConstants.FOOTER.CURRENT_YEAR.replace('#', ''));
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
            const policyLink = e.target.closest(UIConstants.ATTRIBUTES.POLICY_KEY);
            if (policyLink) {
                e.preventDefault();
                const policyKey = policyLink.getAttribute(UIConstants.ATTRIBUTES.POLICY_KEY);
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
        let modalOverlay = document.getElementById(UIConstants.MODALS.POLICY_OVERLAY);
        if (!modalOverlay) {
            modalOverlay = document.createElement('div');
            modalOverlay.id = UIConstants.MODALS.POLICY_OVERLAY;
            modalOverlay.className = 'modal-overlay';
            modalOverlay.setAttribute('role', 'dialog');
            modalOverlay.setAttribute('aria-modal', 'true');
            
            // Создаем контейнер модального окна
            const modalContainer = document.createElement('div');
            modalContainer.className = 'modal-container';
            
            // Кнопка закрытия
            const closeBtn = document.createElement('button');
            closeBtn.className = 'modal-close';
            closeBtn.id = UIConstants.MODALS.POLICY_CLOSE_BTN;
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
            modalTitle.id = UIConstants.MODALS.POLICY_TITLE;
            modalHeader.appendChild(modalTitle);
            
            // Тело модального окна
            const modalBody = document.createElement('div');
            modalBody.className = 'modal-body';
            modalBody.id = UIConstants.MODALS.POLICY_CONTENT;
            
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
        document.getElementById(UIConstants.MODALS.POLICY_TITLE).textContent = policy.title;
        const sanitizer = Utils.Sanitizer || { sanitizeHtml: (html) => html };
        document.getElementById(UIConstants.MODALS.POLICY_CONTENT).innerHTML = sanitizer.sanitizeHtml(policy.content, {
          allowedTags: ['h2', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a'],
          allowedAttributes: { 'a': ['href', 'target', 'rel'] }
        });

        // Блокируем скролл с помощью CSS класса
        const scrollbarWidth = HeaderLoader.getScrollbarWidth();
        if (scrollbarWidth > 0) {
            document.body.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
            document.body.classList.add(UIConstants.CLASSES.SCROLL_PADDING_FIX);
        }
        document.body.classList.add(UIConstants.CLASSES.NO_SCROLL);

        // Показываем модальное окно
        setTimeout(() => {
            modalOverlay.classList.add(UIConstants.CLASSES.ACTIVE);
            const closeBtn = modalOverlay.querySelector('.modal-close');
            if (closeBtn) closeBtn.focus();
        }, UIConstants.TIMINGS.MODAL_OPEN_DELAY);
    },

    /**
     * Закрытие модального окна политики
     */
    closePolicyModal() {
        const modalOverlay = document.getElementById(UIConstants.MODALS.POLICY_OVERLAY);
        if (!modalOverlay) return;

        modalOverlay.classList.remove(UIConstants.CLASSES.ACTIVE);
        document.body.classList.remove(UIConstants.CLASSES.NO_SCROLL);
        document.body.classList.remove(UIConstants.CLASSES.SCROLL_PADDING_FIX);
        document.body.style.removeProperty('--scrollbar-width');
    }
};

// Экспорт глобальной функции для совместимости
window.closePolicyModal = () => FooterLoader.closePolicyModal();

// Экспорт
window.FooterLoader = FooterLoader;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FooterLoader;
}
