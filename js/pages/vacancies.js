/**
 * Инициализация обработчиков для страницы вакансий
 * ООО "Волга-Днепр Инжиниринг"
 * 
 * Примечание: Основные обработчики открытия модалок реализованы
 * через делегирование событий в app.js (data-modal-open="proposal")
 */

// Экспортируем функцию инициализации для module режима
window.initVacanciesPage = function() {
  // Логика для передачи данных о вакансии в модальное окно
  const applicationButtons = document.querySelectorAll('[data-modal-open="application"]');
  
  applicationButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const vacancyCard = button.closest('.vacancy-card');
      if (!vacancyCard) return;
      
      const vacancyTitle = vacancyCard.querySelector('.vacancy-title')?.textContent || '';
      const vacancyDepartment = vacancyCard.querySelector('.vacancy-department')?.textContent || '';
      
      // Обновляем заголовок модального окна
      const modalTitle = document.getElementById('universalApplicationModalTitle');
      const modalSubtitle = document.getElementById('universalApplicationModalSubtitle');
      
      if (modalTitle) {
        modalTitle.textContent = `Отклик на вакансию: ${vacancyTitle}`;
      }
      if (modalSubtitle) {
        modalSubtitle.textContent = vacancyDepartment ? `${vacancyDepartment} — Заполните форму ниже, и мы рассмотрим вашу кандидатуру` : 'Заполните форму ниже, и мы рассмотрим вашу кандидатуру';
      }
    }, { passive: true });
  });
  
  console.log('Страница вакансий инициализирована');
};
