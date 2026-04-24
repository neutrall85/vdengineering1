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
    this.cleanupHandlers = new Map();
    this._boundKeyHandler = null;
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
    closeBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
    
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
      
      // Fallback для policy modal (если не зарегистрирована в ModalManager)
      const policyModal = document.getElementById('policyModalOverlay');
      if (policyModal && policyModal.classList.contains('active')) {
        if (typeof ComponentLoader !== 'undefined') {
          ComponentLoader.closePolicyModal();
        }
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
      } else if (overlayId === 'policyModalOverlay' && typeof ComponentLoader !== 'undefined') {
        ComponentLoader.closePolicyModal();
      } else if (overlayId === 'universalApplicationModalOverlay' && typeof window.closeUniversalApplicationModal === 'function') {
        window.closeUniversalApplicationModal();
      } else {
        // Fallback для незарегистрированных модалок
        overlay.classList.remove('active');
        ScrollManager.unlock();
      }
    };
    document.addEventListener('click', this._boundClickHandler, { capture: false });
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

    if (this.activeModal && this.activeModal !== key) {
      this.close(this.activeModal);
    }

    const overlay = document.getElementById(config.overlayId);
    if (!overlay) return false;

    // ✅ Устанавливаем активное окно синхронно
    this.activeModal = key;

    // Обновляем состояние через AppState
    if (window.AppState) {
      AppState.setState('ui.modalOpen', key);
    }

    // Блокируем скролл через централизованный ScrollManager
    ScrollManager.lock();

    setTimeout(() => {
      overlay.classList.add('active');

      if (key === 'form' && window.formManager) {
        window.formManager.initFileUploadOnModalOpen();
      }

      const focusTarget = options.focusSelector 
        ? document.querySelector(options.focusSelector)
        : config.focusSelector
          ? overlay.querySelector(config.focusSelector)
          : overlay.querySelector('.modal-close, button, [href], input, select, textarea');
      
      if (focusTarget) {
        setTimeout(() => focusTarget.focus(), 100);
      }

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

    overlay.classList.remove('active');
    
    // Обновляем состояние через AppState
    if (window.AppState) {
      AppState.setState('ui.modalOpen', null);
    }
    
    // Разблокируем скролл через ScrollManager
    ScrollManager.unlock();
    
    this.activeModal = null;

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
   * Очистка ресурсов при уничтожении
   */
  destroy() {
    if (this._boundKeyHandler) {
      document.removeEventListener('keydown', this._boundKeyHandler);
    }
    if (this._boundClickHandler) {
      document.removeEventListener('click', this._boundClickHandler);
    }
    this.modals.clear();
    this.activeModal = null;
  }
}

const modalManager = new ModalManager();

window.UI = window.UI || {};
window.UI.modalManager = modalManager;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ModalManager, modalManager };
}