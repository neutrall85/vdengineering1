/**
 * ModalHelpers - простой и универсальный интерфейс для работы с модальными окнами
 * ООО "Волга-Днепр Инжиниринг"
 * 
 * Единый API для всех модалок:
 * - ModalHelpers.open(key, options) - открыть модалку
 * - ModalHelpers.close(key) - закрыть модалку
 * - ModalHelpers.isOpen(key) - проверить состояние
 * - ModalHelpers.closeAll() - закрыть все модалки
 * 
 * Использование:
 *   ModalHelpers.open('form')
 *   ModalHelpers.open('proposal', { keepParentModal: true })
 *   ModalHelpers.close('form')
 */

const ModalHelpers = {
  /**
   * Инициализация: навешивает обработчики на data-атрибуты
   * Вызывается один раз при старте приложения
   */
  init() {
    this._setupDataAttributes();
    Logger.INFO('ModalHelpers initialized');
  },

  /**
   * Настройка обработчиков для [data-modal-open] и [data-modal-close]
   * Пример HTML: <button data-modal-open="proposal">Открыть КП</button>
   */
  _setupDataAttributes() {
    document.addEventListener('click', (e) => {
      // Открытие модалки
      const openTrigger = e.target.closest('[data-modal-open]');
      if (openTrigger) {
        e.preventDefault();
        const key = openTrigger.getAttribute('data-modal-open');
        this.open(key);
        return;
      }

      // Закрытие модалки
      const closeTrigger = e.target.closest('[data-modal-close]');
      if (closeTrigger) {
        e.preventDefault();
        const key = closeTrigger.getAttribute('data-modal-close') || null;
        if (key) {
          this.close(key);
        } else {
          this.closeAll();
        }
        return;
      }
    });
  },

  /**
   * Открыть модалку по ключу
   * @param {string} key - ключ модалки (form, proposal, news, details, universal, policy, project, service, about)
   * @param {Object} options - опции: { keepParentModal, focusSelector, onOpen }
   * @returns {boolean}
   */
  open(key, options = {}) {
    if (!window.modalManager) {
      Logger.WARN(`ModalManager not available for key: ${key}`);
      return false;
    }
    return window.modalManager.open(key, options);
  },

  /**
   * Закрыть модалку по ключу
   * @param {string} key - ключ модалки
   * @returns {boolean}
   */
  close(key) {
    if (!window.modalManager) {
      Logger.WARN(`ModalManager not available for key: ${key}`);
      return false;
    }
    return window.modalManager.close(key);
  },

  /**
   * Проверить, открыта ли модалка
   * @param {string|null} key - ключ или null для проверки любой активной
   * @returns {boolean}
   */
  isOpen(key = null) {
    return window.modalManager ? window.modalManager.isOpen(key) : false;
  },

  /**
   * Закрыть все модалки
   */
  closeAll() {
    if (window.modalManager) {
      window.modalManager.closeAll();
    }
  }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModalHelpers;
}
