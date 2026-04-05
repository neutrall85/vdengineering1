/**
 * Управление модальными окнами (Singleton)
 * ООО "Волга-Днепр Инжиниринг"
 */

class ModalManager {
  constructor() {
    this.modals = new Map();
    this.activeModal = null;
    this.cleanupHandlers = null;
    this._initGlobalHandlers();
  }

  register(key, config) {
    if (this.modals.has(key)) {
      console.warn(`Modal "${key}" already registered, overwriting`);
    }
    
    this.modals.set(key, {
      overlayId: config.overlayId,
      onOpen: config.onOpen || null,
      onClose: config.onClose || null,
      shouldFocus: config.shouldFocus !== false
    });
    
    this._setupOverlayClick(key);
    return this;
  }

  _setupOverlayClick(key) {
    const config = this.modals.get(key);
    if (!config) return;
    
    const overlay = DOMHelper.getElement(config.overlayId);
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.close(key);
        }
      });
    }
  }

  _initGlobalHandlers() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close(this.activeModal);
      }
    });
  }

  open(key, options = {}) {
    const config = this.modals.get(key);
    if (!config) {
      console.warn(`Modal "${key}" not registered`);
      return false;
    }

    if (this.activeModal && this.activeModal !== key) {
      this.close(this.activeModal);
    }

    const overlay = DOMHelper.getElement(config.overlayId);
    if (!overlay) return false;

    DOMHelper.addClass(overlay, 'active');
    DOMHelper.toggleBodyScroll(true);
    this.activeModal = key;

    if (config.shouldFocus) {
      this.cleanupHandlers = DOMHelper.trapFocus(overlay);
      const focusTarget = options.focusSelector 
        ? DOMHelper.query(options.focusSelector, overlay)
        : DOMHelper.query('.modal-close, button, [href], input, select, textarea', overlay);
      
      if (focusTarget) {
        setTimeout(() => focusTarget.focus(), 100);
      }
    }

    if (config.onOpen) config.onOpen(overlay);
    if (options.onOpen) options.onOpen(overlay);

    eventBus.emit('modal:opened', { key, overlay });
    return true;
  }

  close(key) {
    const config = this.modals.get(key);
    if (!config) return false;

    const overlay = DOMHelper.getElement(config.overlayId);
    if (!overlay) return false;

    DOMHelper.removeClass(overlay, 'active');
    DOMHelper.toggleBodyScroll(false);
    
    if (this.activeModal === key) {
      this.activeModal = null;
    }

    if (this.cleanupHandlers) {
      this.cleanupHandlers();
      this.cleanupHandlers = null;
    }

    if (config.onClose) config.onClose(overlay);
    eventBus.emit('modal:closed', { key });
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ModalManager, modalManager };
}