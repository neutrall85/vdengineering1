/**
 * ComponentLoader - загрузчик общих компонентов (header, footer, modals)
 * Устраняет дублирование HTML между страницами
 * 
 * Использует модули:
 * - HeaderLoader для навигации
 * - FooterLoader для футера
 * - ModalBuilder для модальных окон
 */

const ComponentLoader = {
    /**
     * Инициализация компонентов на странице
     * @param {Object} options - Опции загрузки
     * @param {Function} callback - Функция обратного вызова после загрузки
     */
    init(options = {}, callback = null) {
        const { 
            loadNavbar = true, 
            loadFooter = true, 
            loadModal = true,
            activePage = '' 
        } = options;

        // Загрузка навигации через HeaderLoader
        if (loadNavbar) {
            HeaderLoader.load({ activePage });
            
            // Вызываем callback после загрузки навигации
            if (callback) {
                setTimeout(callback, UIConstants.TIMINGS.CALLBACK_DELAY);
            }
        
        // Отправляем событие о завершении загрузки компонентов
        document.dispatchEvent(new CustomEvent('components:loaded'));
        }

        // Загрузка футера через FooterLoader
        if (loadFooter) {
            FooterLoader.load();
        }

        // Загрузка модальных окон через ModalBuilder
        if (loadModal) {
            ModalBuilder.loadProposalModal();
            ModalBuilder.loadUniversalModal();
        }

        // Подсветка активной ссылки (если не было сделано при загрузке навигации)
        if (activePage && !loadNavbar) {
            HeaderLoader.setActiveLink(activePage);
        }
    },
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentLoader;
}
