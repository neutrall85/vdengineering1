/**
 * ScrollManager - централизованное управление скроллом страницы
 * ООО "Волга-Днепр Инжиниринг"
 * 
 * Устраняет дублирование логики скролла между ModalManager и ComponentLoader
 * Предоставляет единый API для блокировки/восстановления скролла
 */

const ScrollManager = {
  // Конфигурация (вынесена из магических чисел)
  config: {
    scrollPositionKey: 'scrollPosition',
    noScrollClass: 'no-scroll',
    scrollPaddingFixClass: 'scroll-padding-fix',
    scrollbarWidthVar: '--scrollbar-width'
  },

  // Состояние
  state: {
    scrollPosition: 0,
    isLocked: false,
    lockCount: 0 // Для поддержки вложенных модальных окон
  },

  /**
   * Получить ширину полосы прокрутки
   * @returns {number} Ширина скроллбара в пикселях
   */
  getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
  },

  /**
   * Заблокировать скролл страницы с сохранением позиции
   * Поддерживает подсчёт блокировок для вложенных модальных окон
   * @param {boolean} usePaddingFix - Использовать фикс padding-right
   */
  lock(usePaddingFix = true) {
    // Сохраняем позицию только при первой блокировке
    if (this.state.lockCount === 0) {
      this.state.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      
      // Устанавливаем CSS переменную для позиции скролла (используется в body.no-scroll)
      document.body.style.setProperty('--scroll-position', `-${this.state.scrollPosition}px`);
      
      // Фиксируем ширину скроллбара
      const scrollbarWidth = this.getScrollbarWidth();
      if (scrollbarWidth > 0 && usePaddingFix) {
        document.body.style.setProperty(this.config.scrollbarWidthVar, `${scrollbarWidth}px`);
        document.body.classList.add(this.config.scrollPaddingFixClass);
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      document.body.classList.add(this.config.noScrollClass);
      // Добавляем класс для фиксации позиции только если есть прокрутка
      if (this.state.scrollPosition > 0) {
        document.body.classList.add('no-scroll-position');
      }
      this.state.isLocked = true;
    }
    
    this.state.lockCount++;
    return this.state.scrollPosition;
  },

  /**
   * Восстановить скролл страницы
   * @param {boolean} usePaddingFix - Использовать фикс padding-right
   */
  unlock(usePaddingFix = true) {
    if (this.state.lockCount === 0) return;
    
    this.state.lockCount--;
    
    // Восстанавливаем позицию только при последней разблокировке
    if (this.state.lockCount === 0) {
      const scrollPosition = this.state.scrollPosition;
      
      // Сначала убираем классы блокировки
      document.body.classList.remove(this.config.noScrollClass);
      document.body.classList.remove('no-scroll-position');
      document.body.classList.remove(this.config.scrollPaddingFixClass);
      
      if (usePaddingFix) {
        document.body.style.removeProperty(this.config.scrollbarWidthVar);
        document.body.style.paddingRight = '';
      }
      
      // Небольшая задержка чтобы CSS применился перед восстановлением позиции
      requestAnimationFrame(() => {
        // Сбрасываем CSS-переменную после удаления класса
        document.body.style.setProperty('--scroll-position', '0px');
        
        // Восстанавливаем позицию скролла
        window.scrollTo(0, scrollPosition);
      });
      
      this.state.isLocked = false;
      this.state.scrollPosition = 0;
    }
  },

  /**
   * Проверить, заблокирован ли скролл
   * @returns {boolean}
   */
  isLocked() {
    return this.state.isLocked && this.state.lockCount > 0;
  },

  /**
   * Получить текущую позицию скролла
   * @returns {number}
   */
  getPosition() {
    return this.state.scrollPosition;
  },

  /**
   * Принудительно сбросить состояние (на случай ошибок)
   */
  forceReset() {
    this.state.lockCount = 0;
    this.state.isLocked = false;
    this.state.scrollPosition = 0;
    
    document.body.classList.remove(this.config.noScrollClass);
    document.body.classList.remove('no-scroll-position');
    document.body.classList.remove(this.config.scrollPaddingFixClass);
    document.body.style.removeProperty(this.config.scrollbarWidthVar);
    document.body.style.paddingRight = '';
    document.body.style.setProperty('--scroll-position', '0px');
  }
};

// Экспортируем в глобальную область
if (typeof window !== 'undefined') {
  window.ScrollManager = ScrollManager;
  
  // Также экспортируем в window.UI для совместимости
  window.UI = window.UI || {};
  window.UI.ScrollManager = ScrollManager;
}

// Экспорт для модулей
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScrollManager;
}
