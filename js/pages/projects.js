/**
 * Инициализация специфичных обработчиков для страницы проектов
 * ООО "Волга-Днепр Инжиниринг"
 */

// Данные проектов
const projectsData = {
  1: {
    title: 'Модернизация грузового отсека Ан-124-100',
    details: ['Разработка усиленной системы крепления', 'Модернизация конструкции грузового отсека', 'Испытания и сертификация по нормам АП-25', 'Увеличение грузоподъемности до 150 тонн', 'Совместимость с различными типами грузов'],
    image: 'assets/images/An-124-100.jpeg',
    category: 'Транспортная авиация'
  },
  2: {
    title: 'Установка современной навигационной системы',
    details: ['Интеграция комплекса К-НВС-10', 'Повышение точности навигации до 0.1 NM', 'Соответствие требованиям RNAV/RNP', 'Автоматическое планирование маршрута', 'Совместимость с существующими системами'],
    image: 'assets/images/about.jpg',
    category: 'Авионика'
  },
  3: {
    title: 'Модернизация газотурбинного двигателя',
    details: ['Увеличение межремонтного ресурса на 30%', 'Снижение расхода топлива на 5%', 'Внедрение новых материалов турбины', 'Улучшение системы охлаждения', 'Сертификация по нормам ИКАО'],
    image: 'assets/images/Rossiya.jpg',
    category: 'Двигательные системы'
  },
  4: {
    title: 'Сертификация модификаций Ил-76ТД',
    details: ['Комплексная модернизация навигационного оборудования', 'Установка нового связного оборудования', 'Получение сертификата типа', 'Соответствие требованиям ЕАС АВ', 'Поддержка эксплуатации'],
    image: 'assets/images/An-124-100.jpeg',
    category: 'Сертификация'
  },
  5: {
    title: 'Внедрение цифровой кабины пилота',
    details: ['Установка 6 LCD-дисплеев', 'Интеграция с бортовыми системами', 'Резервирование критических систем', 'Эргономичное расположение приборов', 'Снижение нагрузки на экипаж'],
    image: 'assets/images/about.jpg',
    category: 'Цифровизация'
  },
  6: {
    title: 'Разработка ремонтной документации',
    details: ['Разработка РЭ и Формуляра', 'Карты дефектации и контроля', 'Технологические инструкции', 'Каталоги деталей и сборочных единиц', 'Согласование с заказчиком и сертифицирующими органами'],
    image: 'assets/images/Rossiya.jpg',
    category: 'Документация'
  }
};

/**
 * Глобальная функция инициализации страницы проектов
 * Вызывается из HTML после загрузки DOM
 */
window.initProjectsPage = function() {
  // Обработчик для кнопок "Подробнее" через делегирование событий (как в NewsManager)
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.news-card-link[data-project-id]');
    if (btn) {
      e.preventDefault();
      const projectId = btn.getAttribute('data-project-id');
      const project = projectsData[projectId];
      if (project) {
        openProjectModal(project.title, project.details, project.image, project.category);
      }
    }
  });

  // Обработчик для кнопки закрытия модального окна
  const closeBtn = document.getElementById('projectModalCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeProjectModal);
  }

  // Обработчик для кнопки запроса КП
  const requestQuoteBtn = document.getElementById('projectsRequestQuoteBtn');
  if (requestQuoteBtn) {
    requestQuoteBtn.addEventListener('click', function() {
      if (typeof window.openApplicationModal === 'function') {
        window.openApplicationModal();
      }
    });
  }
};

function openProjectModal(title, details, image, category) {
  const modalTitle = document.getElementById('projectModalTitle');
  const modalContent = document.getElementById('projectModalContent');
  const modalCategory = document.getElementById('projectModalCategory');
  const modalImage = document.getElementById('projectModalImage');

  if (modalTitle && modalContent) {
    const sanitizer = window.Utils?.Sanitizer;
    modalTitle.textContent = sanitizer ? sanitizer.escapeHtml(title) : title;
    modalCategory.textContent = sanitizer ? sanitizer.escapeHtml(category) : category;
    modalImage.src = sanitizer ? (sanitizer.isValidUrl(image) ? image : 'assets/images/placeholder.jpg') : image;
    modalImage.alt = sanitizer ? sanitizer.escapeHtml(title) : title;
    
    // Создаем список через DOM API вместо innerHTML для безопасности
    modalContent.replaceChildren();
    const ul = document.createElement('ul');
    ul.className = 'modal-list-ul';
    details.forEach(item => {
      const li = document.createElement('li');
      li.className = 'modal-list-li';
      li.textContent = sanitizer ? sanitizer.escapeHtml(item) : item;
      ul.appendChild(li);
    });
    modalContent.appendChild(ul);

    if (typeof modalManager !== 'undefined') modalManager.open('project');
  }
}

function closeProjectModal() {
  if (typeof modalManager !== 'undefined') modalManager.close('project');
}
