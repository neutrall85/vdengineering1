/**
 * Управление модальными окнами
 * ООО "Волга-Днепр Инжиниринг"
 */

class ModalManager {
  constructor() {
    this.modals = new Map();
    this.activeModal = null;
    this.cleanupHandlers = new Map();
    this._boundKeyHandler = null;
    this._boundClickHandler = null;
    this._initGlobalHandlers();
  }

  register(key, config) {
    this.modals.set(key, {
      overlayId: config.overlayId,
      onOpen: config.onOpen || null,
      onClose: config.onClose || null,
      focusSelector: config.focusSelector || null
    });
    return this;
  }

  _getModalKeyByOverlayId(overlayId) {
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
    return modalKeyMap[overlayId];
  }

  _closeModalByOverlayId(overlayId) {
    const modalKey = this._getModalKeyByOverlayId(overlayId);
    if (modalKey && this.modals.has(modalKey)) {
      this.close(modalKey);
      return true;
    } else if (overlayId === 'policyModalOverlay' && typeof ComponentLoader !== 'undefined') {
      ComponentLoader.closePolicyModal();
      return true;
    } else if (overlayId === 'universalApplicationModalOverlay' && typeof window.closeUniversalApplicationModal === 'function') {
      window.closeUniversalApplicationModal();
      return true;
    }
    return false;
  }

  _initGlobalHandlers() {
    // Обработчик закрытия по клику на overlay и кнопке закрытия
    this._boundClickHandler = (e) => {
      const closeBtn = e.target.closest('.modal-close');
      const isCloseBtnClick = !!closeBtn;
      
      if (!isCloseBtnClick && e.target.classList.contains('modal-overlay')) {
        // Клик вне модалки (на overlay)
        this._closeModalByOverlayId(e.target.id);
        return;
      }
      
      if (isCloseBtnClick) {
        // Клик на кнопку закрытия
        const overlay = closeBtn.closest('.modal-overlay');
        if (!overlay) return;
        this._closeModalByOverlayId(overlay.id);
      }
    };
    document.addEventListener('click', this._boundClickHandler);

    // Обработчик закрытия по ESC
    this._boundKeyHandler = (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close(this.activeModal);
        return;
      }
      const policyModal = document.getElementById('policyModalOverlay');
      if (e.key === 'Escape' && policyModal && policyModal.classList.contains('active')) {
        if (typeof ComponentLoader !== 'undefined') {
          ComponentLoader.closePolicyModal();
        }
      }
    };
    document.addEventListener('keydown', this._boundKeyHandler);
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
}

const modalManager = new ModalManager();

window.UI = window.UI || {};
window.UI.modalManager = modalManager;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ModalManager, modalManager };
}