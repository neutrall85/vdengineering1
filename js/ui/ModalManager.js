/**
 * Управление модальными окнами
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
    // Просто перезаписываем без предупреждения
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
    
    const overlay = document.getElementById(config.overlayId);
    if (overlay) {
      // Удаляем старый обработчик, чтобы не дублировать
      const newOverlay = overlay.cloneNode(true);
      overlay.parentNode?.replaceChild(newOverlay, overlay);
      
      newOverlay.addEventListener('click', (e) => {
        if (e.target === newOverlay) {
          this.close(key);
        }
      });
      
      // Обновляем ссылку в конфиге (необязательно)
      if (config.overlayId) {
        document.getElementById(config.overlayId);
      }
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

    const overlay = document.getElementById(config.overlayId);
    if (!overlay) return false;

    overlay.classList.add('active');
    this.activeModal = key;

    if (config.shouldFocus) {
      const focusTarget = options.focusSelector 
        ? document.querySelector(options.focusSelector)
        : overlay.querySelector('.modal-close, button, [href], input, select, textarea');
      
      if (focusTarget) {
        setTimeout(() => focusTarget.focus(), 100);
      }
    }

    if (config.onOpen) config.onOpen(overlay);
    if (options.onOpen) options.onOpen(overlay);

    if (window.Services?.eventBus) {
      window.Services.eventBus.emit('modal:opened', { key, overlay });
    }
    return true;
  }

  close(key) {
    const config = this.modals.get(key);
    if (!config) return false;

    const overlay = document.getElementById(config.overlayId);
    if (!overlay) return false;

    overlay.classList.remove('active');
    
    if (this.activeModal === key) {
      this.activeModal = null;
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
}

// Создаём глобальный экземпляр
const modalManager = new ModalManager();

// Экспортируем в window.UI для совместимости
window.UI = window.UI || {};
window.UI.modalManager = modalManager;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ModalManager, modalManager };
}