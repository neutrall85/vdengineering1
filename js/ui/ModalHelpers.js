/**
 * ModalHelpers - утилиты для работы с модальными окнами
 * ООО "Волга-Днепр Инжиниринг"
 * 
 * Предоставляет единый API для открытия/закрытия модалок
 * с безопасной обработкой данных и централизованным управлением
 */

const ModalHelpers = {
  /**
   * Инициализация обработчиков для data-атрибутов
   * Автоматически находит все элементы с [data-modal-open] и вешает обработчики
   */
  init() {
    this._setupModalOpenHandlers();
    this._setupGlobalFunctions();
    Logger.INFO('ModalHelpers initialized');
  },

  /**
   * Настройка обработчиков для элементов с data-modal-open
   * Поддерживаемые значения: proposal, application
   */
  _setupModalOpenHandlers() {
    document.addEventListener('click', (e) => {
      // Обработка кнопки открытия КП
      const proposalTrigger = e.target.closest('[data-modal-open="proposal"]');
      if (proposalTrigger) {
        e.preventDefault();
        this.openProposalModal();
        return;
      }

      // Обработка кнопки отклика на вакансию
      const applicationTrigger = e.target.closest('[data-modal-open="application"]');
      if (applicationTrigger) {
        e.preventDefault();
        this.openApplicationModal(applicationTrigger);
        return;
      }
    });
  },

  /**
   * Настройка глобальных функций для обратной совместимости
   */
  _setupGlobalFunctions() {
    // Глобальная функция открытия основной формы
    window.openModal = () => {
      if (typeof formManager !== 'undefined') {
        formManager.openModal();
      } else {
        Logger.WARN('formManager not available for openModal');
      }
    };

    // Глобальная функция закрытия основной формы
    window.closeModal = () => {
      if (typeof modalManager !== 'undefined') {
        modalManager.close('form');
      }
    };
  },

  /**
   * Открытие модального окна КП
   * Использует централизованный ModalManager
   */
  openProposalModal() {
    if (typeof modalManager !== 'undefined') {
      modalManager.open('proposal');
    } else {
      Logger.WARN('ModalManager not available for proposal modal');
    }
  },

  /**
   * Открытие универсального модального окна заявки/отклика
   * @param {HTMLElement} triggerElement - элемент, вызвавший модалку
   */
  openApplicationModal(triggerElement) {
    if (typeof window.openApplicationModal === 'function') {
      window.openApplicationModal(triggerElement);
    } else {
      Logger.WARN('openApplicationModal function not available');
    }
  },

  /**
   * Универсальный метод открытия модалки по ключу
   * @param {string} key - ключ модалки (form, proposal, news, details, etc.)
   * @param {Object} options - опции для modalManager.open()
   * @returns {boolean}
   */
  open(key, options = {}) {
    if (typeof modalManager !== 'undefined') {
      return modalManager.open(key, options);
    }
    Logger.WARN(`ModalManager not available for key: ${key}`);
    return false;
  },

  /**
   * Универсальный метод закрытия модалки по ключу
   * @param {string} key - ключ модалки
   * @returns {boolean}
   */
  close(key) {
    if (typeof modalManager !== 'undefined') {
      return modalManager.close(key);
    }
    Logger.WARN(`ModalManager not available for key: ${key}`);
    return false;
  },

  /**
   * Проверка состояния модалки
   * @param {string|null} key - ключ модалки или null для любой активной
   * @returns {boolean}
   */
  isOpen(key = null) {
    if (typeof modalManager !== 'undefined') {
      return modalManager.isOpen(key);
    }
    return false;
  },

  /**
   * Закрытие всех модалок
   */
  closeAll() {
    if (typeof modalManager !== 'undefined') {
      modalManager.closeAll();
    }
  },

  /**
   * Получение экземпляра ModalManager с фоллбэком
   * @returns {ModalManager|null}
   */
  getManager() {
    return (typeof modalManager !== 'undefined') 
      ? modalManager 
      : (window.App?.services?.modalManager || null);
  }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModalHelpers;
}
