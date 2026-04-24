// Данные услуг (12 пунктов) с детальными списками для модальных окон
const servicesData = {
  1: {
    title: 'Модификация конструкции планера',
    details: [
      'Внесение изменений в фюзеляж',
      'Модификация крыльев и оперения',
      'Изменения в гондолах/пилонах',
      'Двери, люки, створки',
      'Окна, фонари',
      'Шасси и системы крепления'
    ],
    category: 'Конструкция планера'
  },
  2: {
    title: 'Модификация газотурбинных двигателей',
    details: [
      'Капот и крепление двигателя',
      'Воздухозаборник и дренаж',
      'Топливная система двигателя',
      'Зажигание и отбор воздуха',
      'Управление двигателем и приборы контроля',
      'Выхлоп (включая реверс тяги)',
      'Масляная система и запуск'
    ],
    category: 'Двигательные системы'
  },
  3: {
    title: 'Модификация авионики и пилотажно-навигационного оборудования',
    details: [
      'Информация об условиях полёта',
      'Пространственное положение и курс',
      'Автономное и зависимое определение положения',
      'Приборные доски, панели управления',
      'Бортовые регистраторы и вычислители',
      'Системы оповещения, индикации, сбора и передачи данных'
    ],
    category: 'Авионика'
  },
  4: {
    title: 'Модификация систем кондиционирования и жизнеобеспечения',
    details: [
      'Наддув и распределение воздуха',
      'Регулирование давления',
      'Обогрев и охлаждение',
      'Регулирование температуры и влажности',
      'Интегрированная система жизнеобеспечения'
    ],
    category: 'Кондиционирование'
  },
  5: {
    title: 'Модификация систем электроснабжения и связи',
    details: [
      'Генераторы, подсистемы переменного и постоянного тока',
      'Наземное питание и распределение',
      'Контроль и защита, управление электроснабжением',
      'Голосовая, спутниковая связь',
      'Цифровой обмен данными',
      'Оповещение пассажиров, внутренняя связь',
      'Звуко- и видеозапись'
    ],
    category: 'Электрооборудование'
  },
  6: {
    title: 'Модификация топливной, гидравлической и противообледенительной систем',
    details: [
      'Хранение, распределение, слив топлива',
      'Управление заправкой и центровкой',
      'Основная и резервная гидравлические системы',
      'Защита аэродинамических поверхностей',
      'Защита воздухозаборников, приёмников давления',
      'Защита окон, антенн, винтов, водопроводов',
      'Средства обнаружения и сигнализации обледенения'
    ],
    category: 'Системы'
  },
  7: {
    title: 'Модификация систем управления воздушным судном',
    details: [
      'Поперечное, путевое, продольное управление',
      'Управление стабилизатором',
      'Управление закрылками, интерцепторами',
      'Тормозные щитки, механизация крыла',
      'Стояночные стопоры и демпферы'
    ],
    category: 'Управление'
  },
  8: {
    title: 'Модификация систем обеспечения полёта',
    details: [
      'Кислородная система (экипаж, пассажиры, переносная)',
      'Пневматическая система (распределение, сигнализация)',
      'Вакуумная система (распределение, сигнализация)',
      'Водоснабжение и утилизация отходов'
    ],
    category: 'Обеспечение полёта'
  },
  9: {
    title: 'Модификация грузового оборудования и средств наземного обслуживания',
    details: [
      'Грузовые отсеки и системы погрузки',
      'Крепление грузов',
      'Воздушное десантирование',
      'Наземное оборудование для загрузки, разгрузки, обработки грузов'
    ],
    category: 'Грузовое оборудование'
  },
  10: {
    title: 'Модификация бытового, аварийно-спасательного, светотехнического оборудования и пассажирских систем',
    details: [
      'Кабина экипажа, пассажирский салон (кресла, буфет/кухня, туалеты)',
      'Аварийно-спасательное оборудование',
      'Изоляция, облицовка',
      'Освещение (кабина, салоны, отсеки, наружное, аварийное)',
      'Пассажирские электронные системы (развлечения, связь, накопители, мониторинг)'
    ],
    category: 'Интерьер'
  },
  11: {
    title: 'Разработка документации для наземного обслуживания, нивелировки, взвешивания, информации для экипажа и маркировки',
    details: [
      'Буксировка, руление, подъём на подъёмниках',
      'Крепление, аварийная эвакуация',
      'Транспортирование, заправка/слив',
      'Плановое и неплановое обслуживание',
      'Нивелировка, взвешивание, контроль массы и центровки',
      'Информация для экипажа',
      'Внешние цветовые схемы, маркировки, трафареты, надписи'
    ],
    category: 'Документация'
  },
  12: {
    title: 'Доказательство соответствия лётной годности и сертификация второстепенных изменений',
    details: [
      'Расчёт выработки ресурса',
      'Прогнозирование усталости конструкции',
      'Анализ эксплуатационных нагрузок (компоненты II и III класса)',
      'Оформление изменений, не требующих масштабной сертификации',
      'Выпуск технической документации для внедрения'
    ],
    category: 'Сертификация'
  }
};

// Функция открытия модального окна с деталями услуги
function openServiceModal(title, details, category) {
  const modalTitle = document.getElementById('serviceModalTitle');
  const modalContent = document.getElementById('serviceModalContent');
  const modalCategory = document.getElementById('serviceModalCategory');

  if (modalTitle && modalContent) {
    const sanitizer = window.Utils?.Sanitizer;
    modalTitle.textContent = sanitizer ? sanitizer.escapeHtml(title) : title;
    modalCategory.textContent = sanitizer ? sanitizer.escapeHtml(category) : category;
    
    // Безопасное создание списка через DOM API
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

    const mgr = window.UI?.modalManager || window.modalManager;
    if (mgr) {
      mgr.open('service');
    } else {
      console.warn('ModalManager not available');
    }
  }
}

function closeServiceModal() {
  const mgr = window.UI?.modalManager || window.modalManager;
  if (mgr) {
    mgr.close('service');
  }
}

// Инициализация страницы: назначение обработчиков кнопкам "Подробнее"
window.initServicesPage = function() {
  const serviceButtons = document.querySelectorAll('.service-details-btn');
  serviceButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const serviceId = this.getAttribute('data-service-id');
      const service = servicesData[serviceId];
      if (service) {
        openServiceModal(service.title, service.details, service.category);
      } else {
        console.warn(`Service with id ${serviceId} not found`);
      }
    });
  });

  const closeBtn = document.getElementById('serviceModalCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeServiceModal);
  }

  // Кнопка "Запросить КП" внутри страницы (если есть)
  const requestQuoteBtn = document.getElementById('servicesRequestQuoteBtn');
  if (requestQuoteBtn) {
    requestQuoteBtn.addEventListener('click', () => {
      if (typeof window.openModal === 'function') {
        window.openModal();
      }
    });
  }
};