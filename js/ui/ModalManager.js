/**
 * Управление модальными окнами
 * ООО "Волга-Днепр Инжиниринг"
 */

class ModalManager {
  constructor() {
    this.modals = new Map();
    this.activeModal = null;
    this.cleanupHandlers = null;
    this.scrollPosition = 0;
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
    // Обработчик Escape для всех модальных окон
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close(this.activeModal);
      }
    });
    
    // Обработчик Escape для модального окна политик
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const policyModal = document.getElementById('policyModalOverlay');
        if (policyModal && policyModal.classList.contains('active')) {
          if (typeof ComponentLoader !== 'undefined') {
            ComponentLoader.closePolicyModal();
          }
        }
      }
    });
    
    // Единый обработчик для всех кнопок закрытия модальных окон (DRY, KISS)
    // Закрывает модальное окно напрямую через overlay ID, без зависимости от глобальных функций
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('.modal-close, .details-modal-close');
      if (!closeBtn) return;
      
      // Определяем overlay по кнопке закрытия
      const overlay = closeBtn.closest('.modal-overlay, .details-modal-overlay');
      if (!overlay) return;
      
      const overlayId = overlay.id;
      
      // Сопоставление overlay ID с ключами модальных окон в modalManager
      const modalKeyMap = {
        'modalOverlay': 'form',
        'detailsModalOverlay': 'details',
        'newsModalOverlay': 'news',
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
      } else {
        // Fallback: просто убираем класс active
        overlay.classList.remove('active');
        document.body.classList.remove('no-scroll');
        document.body.style.paddingRight = '';
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

    // Сохраняем текущую позицию скролла
    this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    // Блокируем скролл body с сохранением позиции через padding-right
    document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
    document.body.classList.add('no-scroll');

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
    
    // Восстанавливаем позицию скролла
    document.body.classList.remove('no-scroll');
    document.body.style.paddingRight = '';
    window.scrollTo(0, this.scrollPosition);
    
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