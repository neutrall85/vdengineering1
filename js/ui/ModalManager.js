/**
 * Управление модальными окнами
 * ООО "Волга-Днепр Инжиниринг"
 */

class ModalManager {
  constructor() {
    this.modals = new Map();
    this.activeModal = null;
    this.cleanupHandlers = new Map(); // Хранилище для cleanup-функций по ключам
    this._boundKeyHandler = null; // Сохраняем ссылку на обработчик Escape
    this._boundClickHandler = null; // Сохраняем ссылку на обработчик кликов
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
    if (overlay && !overlay._clickHandlerAttached) {
      const clickHandler = (e) => {
        if (e.target === overlay) {
          this.close(key);
        }
      };
      overlay.addEventListener('click', clickHandler);
      overlay._clickHandlerAttached = true;
      
      // Сохраняем handler для возможной очистки
      overlay._clickHandler = clickHandler;
    }
  }

  _initGlobalHandlers() {
    // Единый обработчик Escape для всех модальных окон
    this._boundKeyHandler = (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close(this.activeModal);
        return;
      }
      
      // Специальный случай для policy modal
      if (e.key === 'Escape') {
        const policyModal = document.getElementById('policyModalOverlay');
        if (policyModal && policyModal.classList.contains('active')) {
          if (typeof ComponentLoader !== 'undefined') {
            ComponentLoader.closePolicyModal();
          }
        }
      }
    };
    document.addEventListener('keydown', this._boundKeyHandler);
    
    // Единый обработчик для всех кнопок закрытия модальных окон (DRY, KISS)
    this._boundClickHandler = (e) => {
      const closeBtn = e.target.closest('.modal-close');
      if (!closeBtn) return;
      
      // Определяем overlay по кнопке закрытия
      const overlay = closeBtn.closest('.modal-overlay');
      if (!overlay) return;
      
      const overlayId = overlay.id;
      
      // Сопоставление overlay ID с ключами модальных окон в modalManager
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
      
      if (modalKey && this.modals.has(modalKey)) {
        // Закрываем через modalManager (предпочтительный способ)
        this.close(modalKey);
      } else if (overlayId === 'policyModalOverlay' && typeof ComponentLoader !== 'undefined') {
        // Специальный случай для policy modal
        ComponentLoader.closePolicyModal();
      } else if (overlayId === 'universalApplicationModalOverlay' && typeof window.closeUniversalApplicationModal === 'function') {
        // Специальный случай для universal application modal
        window.closeUniversalApplicationModal();
      } else {
        // Fallback: просто убираем класс active
        overlay.classList.remove('active');
        if (window.ScrollManager) {
          ScrollManager.unlock();
        } else {
          document.body.classList.remove('no-scroll');
          document.body.style.paddingRight = '';
        }
      }
    };
    document.addEventListener('click', this._boundClickHandler);
  }

  open(key, options = {}) {
    const config = this.modals.get(key);
    if (!config) {
      Logger.WARN(`Modal "${key}" not registered`);
      return false;
    }

    if (this.activeModal && this.activeModal !== key) {
      this.close(this.activeModal);
    }

    const overlay = document.getElementById(config.overlayId);
    if (!overlay) return false;

    // Используем централизованный ScrollManager для блокировки скролла
    if (window.ScrollManager) {
      ScrollManager.lock();
    } else {
      // Fallback для обратной совместимости
      const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
      document.body.classList.add('no-scroll');
    }

    // Небольшая задержка чтобы DOM обновился перед инициализацией
    setTimeout(() => {
      overlay.classList.add('active');
      this.activeModal = key;

      // Если это модальное окно формы, инициализируем загрузку файлов
      if (key === 'form' && window.formManager) {
        window.formManager.initFileUploadOnModalOpen();
      }

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
    }, 50);
    
    return true;
  }

  close(key) {
    const config = this.modals.get(key);
    if (!config) return false;

    const overlay = document.getElementById(config.overlayId);
    if (!overlay) return false;

    overlay.classList.remove('active');
    
    // Используем централизованный ScrollManager для восстановления скролла
    if (window.ScrollManager) {
      ScrollManager.unlock();
    } else {
      // Fallback для обратной совместимости
      const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      window.scrollTo(0, scrollPosition);
      document.body.classList.remove('no-scroll');
      document.body.style.paddingRight = '';
    }
    
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