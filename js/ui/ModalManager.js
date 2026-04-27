/**
 * Управление модальными окнами
 * ООО "Волга-Днепр Инжиниринг"
 * 
 * Единая точка управления закрытием модалок:
 * - Клик по кнопке закрытия (.modal-close)
 * - Клик вне области модалки (по overlay)
 * - Нажатие клавиши Escape
 */

class ModalManager {
  constructor() {
    this.modals = new Map();
    this.activeModal = null;
    this.activeModalStack = []; // Стек для хранения родительских модалок
    this.cleanupHandlers = new Map();
    this._boundKeyHandler = null;
    this._boundFocusTrapHandler = null;
    this._initGlobalHandlers();
  }

  register(key, config) {
    this.modals.set(key, {
      overlayId: config.overlayId,
      onOpen: config.onOpen || null,
      onClose: config.onClose || null,
      focusSelector: config.focusSelector || null
    });
    this._setupOverlayClick(key);
    return this;
  }

  /**
   * Настраивает клик по overlay для закрытия модалки
   * Клик обрабатывается только если цель - сам overlay (а не контент внутри)
   * Также добавляет кнопку закрытия в модалку если её нет
   */
  _setupOverlayClick(key) {
    const config = this.modals.get(key);
    if (!config) return;
    const overlay = document.getElementById(config.overlayId);
    if (!overlay) return;
    
    // Добавляем кнопку закрытия если её ещё нет
    this._ensureCloseButton(overlay);
    
    // Проверяем, не был ли уже добавлен обработчик
    if (overlay._clickHandlerAttached) return;
    
    const clickHandler = (e) => {
      // Защита от XSS: проверяем что e.target существует и является элементом
      if (!e.target || !e.target.nodeType) return;
      
      // Закрываем только если клик был по самому overlay (не по контенту)
      if (e.target === overlay) {
        this.close(key);
      }
    };
    
    // Используем capture phase для более надёжного перехвата события
    overlay.addEventListener('click', clickHandler, { capture: false });
    overlay._clickHandlerAttached = true;
    overlay._clickHandler = clickHandler;
    
    // Сохраняем ссылку на обработчик для последующего удаления
    this.cleanupHandlers.set(key, { overlay, clickHandler });
  }

  /**
   * Добавляет кнопку закрытия в модалку если она отсутствует
   * DRY: единая точка создания кнопки для всех модалок
   */
  _ensureCloseButton(overlay) {
    const container = overlay.querySelector('.modal-container, .modal-container-proposal, .details-modal-container');
    if (!container) return;
    
    // Проверяем, есть ли уже кнопка
    if (container.querySelector('.modal-close')) return;
    
    // Создаём кнопку закрытия
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.setAttribute('aria-label', 'Закрыть');
    
    // Создаём SVG через DOM API вместо innerHTML для безопасности
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z');
    svg.appendChild(path);
    closeBtn.appendChild(svg);
    
    // Вставляем кнопку в начало контейнера
    container.insertBefore(closeBtn, container.firstChild);
  }

  /**
   * Инициализирует глобальные обработчики событий:
   * - KeyboardEvent (Escape) для закрытия активной модалки
   * - ClickEvent для кнопок .modal-close
   */
  _initGlobalHandlers() {
    // Обработчик нажатия клавиш (Escape)
    this._boundKeyHandler = (e) => {
      if (e.key !== 'Escape') return;
      
      // Закрываем активную модалку через ModalManager
      if (this.activeModal) {
        this.close(this.activeModal);
        return;
      }
      
      // Fallback для policy modal - используем централизованное закрытие
      const policyModal = document.getElementById('policyModalOverlay');
      if (policyModal && policyModal.classList.contains('active')) {
        this.close('policy');
      }
    };
    document.addEventListener('keydown', this._boundKeyHandler);

    // Делегированный обработчик кликов по кнопкам закрытия
    this._boundClickHandler = (e) => {
      const closeBtn = e.target.closest('.modal-close');
      if (!closeBtn) return;
      
      const overlay = closeBtn.closest('.modal-overlay');
      if (!overlay) return;
      
      const overlayId = overlay.id;
      const modalKeyMap = {
        'modalOverlay': 'form',
        'detailsModalOverlay': 'details',
        'newsModalOverlay': 'news',
        'proposalModalOverlay': 'proposal',
        'universalApplicationModalOverlay': 'universal',
        'aboutModalOverlay': 'about',
        'projectModalOverlay': 'project',
        'serviceModalOverlay': 'service',
        'policyModalOverlay': 'policy'
      };
      
      const modalKey = modalKeyMap[overlayId];
      
      // Закрываем через ModalManager если модалка зарегистрирована
      if (modalKey && this.modals.has(modalKey)) {
        this.close(modalKey);
      } else {
        // Fallback для незарегистрированных модалок
        overlay.classList.remove('active');
        ScrollManager.unlock();
      }
    };
    document.addEventListener('click', this._boundClickHandler, { capture: false });
    
    // Глобальный делегированный обработчик для открытия модалок через data-modal-open
    this._boundOpenHandler = (e) => {
      const trigger = e.target.closest('[data-modal-open]');
      if (!trigger) return;
      
      const modalType = trigger.getAttribute('data-modal-open');
      if (!modalType) return;
      
      e.preventDefault();
      this._handleModalOpen(modalType, trigger);
    };
    document.addEventListener('click', this._boundOpenHandler, { capture: false });
  }

  /**
   * Централизованная обработка открытия модалок
   * @param {string} modalType - тип модалки из data-modal-open
   * @param {HTMLElement} trigger - элемент-триггер
   */
  _handleModalOpen(modalType, trigger) {
    switch (modalType) {
      case 'proposal':
      case 'form':
        this.open('proposal');
        break;
        
      case 'application':
      case 'universal':
        this._openUniversalApplication(trigger);
        break;
        
      case 'project':
        this._openProject(trigger);
        break;
        
      case 'service':
        this._openService(trigger);
        break;
        
      default:
        Logger.WARN(`Unknown modal type: ${modalType}`);
    }
  }

  /**
   * Открывает универсальное модальное окно заявки
   */
  _openUniversalApplication(trigger) {
    const vacancyId = trigger ? trigger.getAttribute('data-vacancy-id') : null;
    const mode = vacancyId ? 'vacancy' : 'application';
    
    const modalTitle = document.getElementById('universalApplicationModalTitle');
    const modalSubtitle = document.getElementById('universalApplicationModalSubtitle');
    const submitBtnText = document.getElementById('universalSubmitBtnText');
    const successTitle = document.getElementById('universalSuccessTitle');
    
    if (mode === 'application') {
      if (modalTitle) modalTitle.textContent = 'Отправить заявку';
      if (submitBtnText) submitBtnText.textContent = 'Отправить информацию';
      if (successTitle) successTitle.textContent = 'Данные отправлены!';
    } else {
      // Режим вакансии — ищем данные в карточке
      const vacancyCard = trigger?.closest('.vacancy-card');
      const vacancyTitle = vacancyCard?.querySelector('.vacancy-title')?.textContent || '';
      const vacancyDepartment = vacancyCard?.querySelector('.vacancy-department')?.textContent || '';
      
      if (modalTitle) modalTitle.textContent = `Отклик на вакансию: ${vacancyTitle}`;
      if (modalSubtitle) modalSubtitle.textContent = vacancyDepartment ? `${vacancyDepartment} — Заполните форму ниже, и мы рассмотрим вашу кандидатуру` : 'Заполните форму ниже, и мы рассмотрим вашу кандидатуру';
      if (submitBtnText) submitBtnText.textContent = 'Отправить отклик';
      if (successTitle) successTitle.textContent = 'Отклик отправлен!';
    }
    
    this.open('universal');
  }

  /**
   * Открывает модальное окно проекта
   */
  _openProject(trigger) {
    const projectId = trigger?.getAttribute('data-project-id');
    if (!projectId || !window.projectsData || !window.projectsData[projectId]) {
      Logger.WARN(`Project with id ${projectId} not found`);
      return;
    }
    
    const project = window.projectsData[projectId];
    const modalTitle = document.getElementById('projectModalTitle');
    const modalContent = document.getElementById('projectModalContent');
    const modalCategory = document.getElementById('projectModalCategory');
    const modalImageContainer = document.getElementById('projectModalImageContainer');
    const modalImage = document.getElementById('projectModalImage');
    
    if (!modalTitle || !modalContent || !modalCategory) {
      Logger.WARN('Элементы модального окна проекта не найдены');
      return;
    }
    
    const sanitizer = window.Utils?.Sanitizer;
    modalTitle.textContent = sanitizer ? sanitizer.escapeHtml(project.title) : project.title;
    modalCategory.textContent = sanitizer ? sanitizer.escapeHtml(project.category) : project.category;
    
    modalContent.replaceChildren();
    const ul = document.createElement('ul');
    ul.className = 'modal-list-ul';
    project.details.forEach(item => {
      const li = document.createElement('li');
      li.className = 'modal-list-li';
      li.textContent = sanitizer ? sanitizer.escapeHtml(item) : item;
      ul.appendChild(li);
    });
    modalContent.appendChild(ul);
    
    // Инициализация галереи
    if (typeof initProjectGallery === 'function') {
      initProjectGallery(project.images, modalImageContainer, modalImage);
    }
    
    this.open('project');
  }

  /**
   * Открывает модальное окно услуги
   */
  _openService(trigger) {
    const serviceId = trigger?.getAttribute('data-service-id');
    if (!serviceId || !window.servicesData || !window.servicesData[serviceId]) {
      Logger.WARN(`Service with id ${serviceId} not found`);
      return;
    }
    
    const service = window.servicesData[serviceId];
    const modalTitle = document.getElementById('serviceModalTitle');
    const modalContent = document.getElementById('serviceModalContent');
    const modalCategory = document.getElementById('serviceModalCategory');
    
    if (!modalTitle || !modalContent) {
      Logger.WARN('Элементы модального окна услуги не найдены');
      return;
    }
    
    const sanitizer = window.Utils?.Sanitizer;
    modalTitle.textContent = sanitizer ? sanitizer.escapeHtml(service.title) : service.title;
    modalCategory.textContent = sanitizer ? sanitizer.escapeHtml(service.category) : service.category;
    
    modalContent.replaceChildren();
    const ul = document.createElement('ul');
    ul.className = 'modal-list-ul';
    service.details.forEach(item => {
      const li = document.createElement('li');
      li.className = 'modal-list-li';
      li.textContent = sanitizer ? sanitizer.escapeHtml(item) : item;
      ul.appendChild(li);
    });
    modalContent.appendChild(ul);
    
    this.open('service');
  }

  open(key, options = {}) {
    const config = this.modals.get(key);
    if (!config) {
      Logger.WARN(`Modal "${key}" not registered`);
      return false;
    }

    // Синхронная проверка – предотвращает повторные вызовы
    if (this.activeModal === key) {
      return true;
    }

    // Проверяем флаг keepParentModal - если true, не закрываем текущую модалку, а сохраняем в стек
    const keepParentModal = options.keepParentModal === true;
    
    if (this.activeModal && this.activeModal !== key && !keepParentModal) {
      this.close(this.activeModal);
    } else if (this.activeModal && this.activeModal !== key && keepParentModal) {
      // Сохраняем текущую модалку в стек для последующего восстановления
      this.activeModalStack.push(this.activeModal);
    }

    const overlay = document.getElementById(config.overlayId);
    if (!overlay) return false;

    // ✅ Устанавливаем активное окно синхронно
    this.activeModal = key;

    // Блокируем скролл через централизованный ScrollManager
    ScrollManager.lock();

    setTimeout(() => {
      overlay.classList.add('active');

      if (key === 'form' && typeof formManager !== 'undefined') {
        formManager.initFileUploadOnModalOpen();
      }

      const focusTarget = options.focusSelector 
        ? document.querySelector(options.focusSelector)
        : config.focusSelector
          ? overlay.querySelector(config.focusSelector)
          : overlay.querySelector('.modal-close, button, [href], input, select, textarea');
      
      if (focusTarget) {
        setTimeout(() => focusTarget.focus(), 100);
      }

      // Инициализируем focus trap для доступности
      this._initFocusTrap(overlay);

      if (config.onOpen) config.onOpen(overlay);
      if (options.onOpen) options.onOpen(overlay);

      if (window.Services?.eventBus) {
        window.Services.eventBus.emit('modal:opened', { key, overlay });
      }
    }, 50);
    
    return true;
  }

  close(key) {
    const config = this.modals.get(key);
    if (!config) return false;

    if (this.activeModal !== key) return false;

    const overlay = document.getElementById(config.overlayId);
    if (!overlay) return false;

    // Удаляем focus trap перед закрытием
    this._removeFocusTrap();

    overlay.classList.remove('active');
    
    // Проверяем, есть ли родительская модалка, которую нужно восстановить как активную
    const previousModal = this.activeModalStack && this.activeModalStack.length > 0 
      ? this.activeModalStack.pop() 
      : null;
    
    // Разблокируем скролл только если нет родительской модалки
    // ScrollManager сам посчитает количество блокировок через lockCount
    if (!previousModal) {
      ScrollManager.unlock();
    } else {
      // Если есть родительская модалка, уменьшаем счётчик блокировок
      // так как вложенная модалка закрывается
      ScrollManager.state.lockCount--;
    }
    
    this.activeModal = previousModal;

    // Сброс формы КП после закрытия модалки (только если это не вложенная модалка)
    if (key === 'proposal' && !previousModal && typeof formManager !== 'undefined' && typeof formManager._resetForm === 'function') {
      formManager._resetForm();
    }

    if (config.onClose) config.onClose(overlay);
    if (window.Services?.eventBus) {
      window.Services.eventBus.emit('modal:closed', { key });
    }
    return true;
  }

  isOpen(key = null) {
    if (key) {
      return this.activeModal === key;
    }
    return this.activeModal !== null;
  }

  closeAll() {
    this.modals.forEach((_, key) => {
      this.close(key);
    });
  }
  
  /**
   * Инициализирует focus trap для модального окна
   * Фокус циклически перемещается внутри модалки при навигации Tab
   */
  _initFocusTrap(overlay) {
    if (!overlay) return;
    
    // Находим все фокусируемые элементы внутри модалки
    const focusableElements = overlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    // Обработчик для перехвата Tab - создаем один раз и сохраняем ссылку
    this._boundFocusTrapHandler = (e) => {
      if (e.key !== 'Tab') return;
      
      // Если Shift+Tab и мы на первом элементе, переходим к последнему
      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
      // Если просто Tab и мы на последнем элементе, переходим к первому
      else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    };
    
    document.addEventListener('keydown', this._boundFocusTrapHandler);
  }
  
  /**
   * Удаляет focus trap
   */
  _removeFocusTrap() {
    if (this._boundFocusTrapHandler) {
      document.removeEventListener('keydown', this._boundFocusTrapHandler);
      this._boundFocusTrapHandler = null;
    }
  }
  
  /**
   * Очистка ресурсов при уничтожении
   */
  destroy() {
    if (this._boundKeyHandler) {
      document.removeEventListener('keydown', this._boundKeyHandler);
    }
    if (this._boundClickHandler) {
      document.removeEventListener('click', this._boundClickHandler);
    }
    if (this._boundOpenHandler) {
      document.removeEventListener('click', this._boundOpenHandler);
    }
    
    // Удаляем focus trap если активен
    this._removeFocusTrap();
    
    // Удаляем обработчики кликов по overlay
    this.cleanupHandlers.forEach((handlerData, key) => {
      const { overlay, clickHandler } = handlerData;
      if (overlay && clickHandler) {
        overlay.removeEventListener('click', clickHandler);
      }
    });
    this.cleanupHandlers.clear();
    
    this.modals.clear();
    this.activeModal = null;
    this.activeModalStack = [];
  }
}

const modalManager = new ModalManager();

// Делаем modalManager доступным глобально для всех скриптов
window.modalManager = modalManager;

// Экспорт через window.App.services.modalManager будет выполнен в Application

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ModalManager, modalManager };
}