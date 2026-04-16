/**
 * Управление формой
 * ООО "Волга-Днепр Инжиниринг"
 */

class FormManager {
  constructor(apiClient, rateLimiter, validator) {
    this.apiClient = apiClient;
    this.rateLimiter = rateLimiter;
    this.validator = validator;
    this.currentFiles = [];
    this.maxFiles = 10;
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
  }

  init() {
    try {
      this._initPhoneMask();
      this._initFormSubmit();
      this._initFloatingButton();
      // Инициализируем загрузку файлов для основной формы на странице
      setTimeout(() => {
        const mainForm = document.getElementById('commercial-offer');
        if (mainForm) {
          this._initFileUpload(mainForm);
        } else {
          this._initFileUpload();
        }
      }, 50);
      console.log('FormManager initialized');
    } catch (error) {
      console.error('FormManager init failed:', error);
    }
  }
  
  openModal() {
    if (!this.rateLimiter.canProceed()) {
      const warning = DOM.getElement('rateLimitWarning');
      if (warning) {
        DOM.addClass(warning, 'show');
        setTimeout(() => DOM.removeClass(warning, 'show'), 5000);
      }
      return;
    }

    const warning = DOM.getElement('rateLimitWarning');
    if (warning) DOM.removeClass(warning, 'show');

    // Клонируем форму в модальное окно перед открытием (для index.html)
    this._cloneFormToModal();

    if (typeof modalManager !== 'undefined') {
      modalManager.open('form');
    } else {
      console.error('ModalManager not available');
    }
  }

  /**
   * Клонирует форму из основного контейнера в модальное окно
   * Вызывается при каждом открытии модального окна для актуального состояния
   */
  _cloneFormToModal() {
    const modalBodyContainer = document.getElementById('modalBodyContainer');
    if (!modalBodyContainer) return;

    const originalFormContainer = document.getElementById('commercial-offer');
    
    if (originalFormContainer) {
      // Клонируем существующую форму с страницы
      modalBodyContainer.innerHTML = '';
      
      const formClone = originalFormContainer.cloneNode(true);
      formClone.removeAttribute('id');
      modalBodyContainer.appendChild(formClone);
      
      // Обрабатываем дублирующиеся ID
      const cloneElements = modalBodyContainer.querySelectorAll('[id]');
      
      cloneElements.forEach(el => {
        // Оставляем id только для важных элементов формы
        if (el.id && (el.id === 'proposalForm' || el.id === 'submitBtn' || 
            el.id === 'fileAttachment' || el.id === 'fileDrop' || el.id === 'fileList' ||
            el.id === 'phone')) {
          // Для поля телефона добавляем уникальный класс чтобы можно было найти его в модалке
          if (el.id === 'phone') {
            el.classList.add('modal-phone-input');
          }
          // Для зоны загрузки файлов добавляем класс чтобы можно было найти её в модалке
          if (el.id === 'fileDrop') {
            el.classList.add('modal-file-drop');
          }
        } else if (el.id) {
          el.removeAttribute('id');
        }
      });
      
      // Скрываем предупреждения и сообщения об успехе
      const rateLimitWarning = modalBodyContainer.querySelector('.rate-limit-warning');
      if (rateLimitWarning) rateLimitWarning.classList.remove('show');
      
      const successMessage = modalBodyContainer.querySelector('.success-message');
      if (successMessage) successMessage.classList.remove('show');
    } else {
      // Формы нет на странице - используем содержимое из модального окна по умолчанию
      // Модальное окно уже содержит форму благодаря ComponentLoader
      this._resetFormInModal(modalBodyContainer);
    }
    
    // Инициализируем автоподстановку +7 для поля телефона в модалке
    this._initPhoneAutoPrefix(modalBodyContainer);
  }
  
  /**
   * Сбрасывает форму в модальном окне к начальному состоянию
   */
  _resetFormInModal(container) {
    const form = container.querySelector('#proposalForm');
    if (form) {
      form.reset();
      // Скрываем все сообщения об ошибках
      const errorMessages = container.querySelectorAll('.error-message');
      errorMessages.forEach(el => el.style.display = '');
      // Снимаем классы ошибок
      const errorInputs = container.querySelectorAll('.input-error');
      errorInputs.forEach(el => el.classList.remove('input-error'));
      // Скрываем предупреждения
      const rateLimitWarning = container.querySelector('.rate-limit-warning');
      if (rateLimitWarning) rateLimitWarning.classList.remove('show');
      const successMessage = container.querySelector('.success-message');
      if (successMessage) successMessage.classList.remove('show');
      // Очищаем список файлов
      this.currentFiles = [];
      const fileList = container.querySelector('.form-file-list');
      if (fileList) fileList.innerHTML = '';
      const fileDropText = container.querySelector('.form-file-text');
      if (fileDropText) fileDropText.textContent = 'Выбрать файл...';
      const fileInput = container.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
    }
  }

  /**
   * Инициализация автоподстановки +7 для поля телефона
   */
  _initPhoneAutoPrefix(container) {
    const phoneInputs = container.querySelectorAll('#phone, .modal-phone-input');
    phoneInputs.forEach(input => {
      if (input && !input._phonePrefixHandler) {
        input.addEventListener('blur', function() {
          let value = this.value.trim();
          if (value.length > 0 && !value.startsWith('+')) {
            if (value.startsWith('8') && value.length > 1) {
              value = '+7' + value.substring(1);
            } else if (value.length >= 10) {
              value = '+7' + value;
            }
            this.value = value;
          }
        });
        input._phonePrefixHandler = true;
      }
    });
  }

  /**
   * Инициализация загрузки файлов - вызывается при открытии модального окна
   */
  initFileUploadOnModalOpen() {
    // Даем время на рендеринг модального окна перед инициализацией
    setTimeout(() => {
      const modalBody = document.getElementById('modalBodyContainer');
      if (modalBody) {
        this._initFileUpload(modalBody);
        // Инициализируем автоподстановку телефона для формы в модалке
        this._initPhoneAutoPrefix(modalBody);
      } else {
        this._initFileUpload();
      }
    }, 150);
  }

  _initFileUpload(container = null) {
    // Если передан контейнер (например, модальное окно), ищем зоны загрузки внутри него
    // Иначе ищем по всей странице
    const root = container || document;
    const fileDrops = root.querySelectorAll('.form-file');
    
    fileDrops.forEach(fileDrop => {
      const fileInput = fileDrop.querySelector('input[type="file"]');
      if (!fileInput) return;

      // Добавляем атрибут multiple для поддержки нескольких файлов
      fileInput.setAttribute('multiple', 'multiple');
      
      // Проверяем, был ли уже добавлен обработчик change для этого input
      if (fileInput._changeHandlerAttached) return;
      
      // Обработчик выбора файлов через input
      fileInput.addEventListener('change', (e) => {
        this._handleFileSelect(e.target.files, fileDrop);
      });
      fileInput._changeHandlerAttached = true;

      // Проверяем, были ли уже добавлены drag & drop обработчики
      if (fileDrop._dragDropHandlerAttached) return;
      
      // Drag & drop обработчики
      fileDrop.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDrop.style.borderColor = 'var(--vd-blue)';
        fileDrop.style.background = 'rgba(0, 51, 160, 0.05)';
      });

      fileDrop.addEventListener('dragleave', () => {
        fileDrop.style.borderColor = '';
        fileDrop.style.background = '';
      });

      fileDrop.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDrop.style.borderColor = '';
        fileDrop.style.background = '';
        this._handleFileSelect(e.dataTransfer.files, fileDrop);
      });
      fileDrop._dragDropHandlerAttached = true;
    });
  }

  _handleFileSelect(files, fileDrop) {
    if (!files || files.length === 0) return;
    
    // Находим элемент предупреждения о лимитах для этой зоны загрузки
    const fileLimitWarning = fileDrop?.querySelector('.form-file-limit-warning');

    // Проверяем файлы на дубликаты и другие ограничения перед добавлением
    const validNewFiles = [];

    for (const file of Array.from(files)) {
      // Проверка размера файла
      if (file.size > this.maxFileSize) {
        this._showUploadWarning(`Файл "${file.name}" превышает максимальный размер 10MB`, fileDrop);
        continue;
      }

      // Проверка типа файла
      const validation = this.validator.file(file);
      if (!validation.valid) {
        this._showUploadWarning(validation.error, fileDrop);
        continue;
      }

      // Проверка на дубликаты среди уже загруженных файлов
      const fileKey = `${file.name}:${file.size}`;
      const isDuplicate = this.currentFiles.some(f => `${f.name}:${f.size}` === fileKey);
      
      if (isDuplicate) {
        continue;
      }

      // Проверка на дубликаты внутри текущей партии
      const isDuplicateInBatch = validNewFiles.some(f => `${f.name}:${f.size}` === fileKey);
      if (isDuplicateInBatch) {
        continue;
      }

      validNewFiles.push(file);
    }

    // Добавляем новые файлы к существующим
    this.currentFiles = [...this.currentFiles, ...validNewFiles];

    // Ограничиваем количество файлов
    if (this.currentFiles.length > this.maxFiles) {
      this.currentFiles = this.currentFiles.slice(0, this.maxFiles);
      this._showUploadWarning(`Максимальное количество файлов: ${this.maxFiles}`, fileDrop);
    }

    this._renderFileList(fileDrop);
  }

  _renderFileList(fileDrop) {
    // Если fileDrop не передан, пытаемся найти первый доступный
    if (!fileDrop) {
      // Сначала ищем в модалке, потом на странице
      fileDrop = document.querySelector('.modal-file-drop') || document.querySelector('.form-file');
    }
    
    // Находим контейнер списка файлов внутри этой зоны загрузки (без # чтобы работало с классом)
    let container;
    if (fileDrop) {
      container = fileDrop.querySelector('.form-file-list');
    }

    // Если контейнер списка файлов не существует, создаём его
    if (!container && fileDrop) {
      const containerNew = document.createElement('div');
      containerNew.className = 'form-file-list';
      fileDrop.appendChild(containerNew);
      container = containerNew;
    }
    
    if (!container) return;

    // Очищаем контейнер перед перерисовкой
    container.innerHTML = '';

    if (this.currentFiles.length === 0) {
      // Обновляем текст в зоне загрузки
      const fileDropText = fileDrop?.querySelector('.form-file-text');
      if (fileDropText) {
        fileDropText.textContent = 'Выбрать файл...';
      }
    } else {
      // Безопасное создание элементов списка файлов без innerHTML
      container.innerHTML = '';
      this.currentFiles.forEach((file, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'form-file-item';
        itemDiv.dataset.index = index;
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'form-file-item-name';
        nameSpan.textContent = file.name; // textContent автоматически экранирует
        
        const sizeSpan = document.createElement('span');
        sizeSpan.className = 'form-file-item-size';
        sizeSpan.textContent = this._formatFileSize(file.size);
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'form-file-item-remove';
        removeBtn.dataset.index = index;
        removeBtn.setAttribute('aria-label', 'Удалить файл');
        removeBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
        
        itemDiv.appendChild(nameSpan);
        itemDiv.appendChild(sizeSpan);
        itemDiv.appendChild(removeBtn);
        container.appendChild(itemDiv);
      });

      // Используем делегирование событий для кнопок удаления - вешаем обработчик только один раз на контейнер
      // Удаляем старый обработчик если он был, чтобы избежать дублирования при перерисовке
      const oldHandler = container._clickHandler;
      if (oldHandler) {
        container.removeEventListener('click', oldHandler);
      }
      
      const clickHandler = (e) => {
        const removeBtn = e.target.closest('.form-file-item-remove');
        if (removeBtn) {
          e.preventDefault();
          e.stopPropagation();
          const index = parseInt(removeBtn.getAttribute('data-index'), 10);
          this.removeFile(index, fileDrop);
        }
      };
      
      container.addEventListener('click', clickHandler);
      container._clickHandler = clickHandler;
      
      // Обновляем текст в зоне загрузки
      const fileDropText = fileDrop?.querySelector('.form-file-text');
      if (fileDropText) {
        fileDropText.textContent = `Выбрано файлов: ${this.currentFiles.length}`;
      }
    }
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  _formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  _showError(message, fileLimitWarning) {
    console.error('Form error:', message);
    
    // Если передан элемент предупреждения о лимитах файлов, используем его
    if (fileLimitWarning) {
      const p = document.createElement('p');
      p.textContent = `⚠️ ${message}`;
      fileLimitWarning.innerHTML = '';
      fileLimitWarning.appendChild(p);
      fileLimitWarning.style.display = 'block';
      setTimeout(() => {
        fileLimitWarning.style.display = 'none';
      }, 5000);
      return;
    }
    
    // Иначе используем стандартное предупреждение
    const warning = DOM.getElement('rateLimitWarning');
    if (warning) {
      const p = document.createElement('p');
      p.textContent = `⚠️ ${message}`;
      warning.innerHTML = '';
      warning.appendChild(p);
      DOM.addClass(warning, 'show');
      setTimeout(() => DOM.removeClass(warning, 'show'), 5000);
    } else {
      alert(message);
    }
  }

  /**
   * Показывает всплывающее предупреждение над зоной загрузки файлов
   */
  _showUploadWarning(message, fileDrop) {
    if (!fileDrop) return;
    
    // Находим или создаём контейнер предупреждения внутри зоны загрузки
    let warningContainer = fileDrop.querySelector('.upload-warning-container');
    if (!warningContainer) {
      warningContainer = document.createElement('div');
      warningContainer.className = 'upload-warning-container';
      // Вставляем перед иконкой и текстом, но после input
      const input = fileDrop.querySelector('input[type="file"]');
      if (input && input.nextSibling) {
        fileDrop.insertBefore(warningContainer, input.nextSibling);
      } else {
        fileDrop.insertBefore(warningContainer, fileDrop.firstChild);
      }
    }
    
    warningContainer.innerHTML = '';
    const warningDiv = document.createElement('div');
    warningDiv.className = 'upload-warning';
    warningDiv.textContent = `⚠️ ${message}`;
    warningContainer.appendChild(warningDiv);
    warningContainer.style.display = 'block';
    
    // Скрываем предыдущий таймер если он был
    if (this.uploadWarningTimeout) {
      clearTimeout(this.uploadWarningTimeout);
    }
    
    // Автоматически скрываем через 3 секунды
    this.uploadWarningTimeout = setTimeout(() => {
      warningContainer.style.display = 'none';
    }, 3000);
  }

  removeFile(index, fileDrop) {
    // Удаляем файл по индексу
    const indexNum = parseInt(index, 10);
    
    if (!isNaN(indexNum) && indexNum >= 0 && indexNum < this.currentFiles.length) {
      this.currentFiles.splice(indexNum, 1);
    } else {
      console.error('Invalid file index:', index);
      return;
    }

    // Сбрасываем value у input в переданном fileDrop, чтобы можно было добавить тот же файл снова
    if (fileDrop) {
      const fileInput = fileDrop.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
    } else {
      // Если fileDrop не передан, сбрасываем во всех зонах загрузки
      const fileInputs = document.querySelectorAll('.form-file input[type="file"]');
      fileInputs.forEach(input => {
        input.value = '';
      });
    }

    // Если fileDrop не передан, пытаемся найти первый доступный
    if (!fileDrop) {
      fileDrop = document.querySelector('.form-file');
    }
    
    this._renderFileList(fileDrop);
  }

  _initPhoneMask() {
    // Маска телефона отключена - поле работает в свободном формате
    // Никакие обработчики не добавляются
  }

  _initFormSubmit() {
    const form = DOM.getElement('proposalForm');
    if (form) {
      form.addEventListener('submit', (e) => this._handleSubmit(e));
    }
  }

  _initFloatingButton() {
    // Инициализация плавающей кнопки и кнопок "Запросить КП" после полной загрузки DOM
    // Используем отложенную инициализацию чтобы убедиться что все элементы загружены
    setTimeout(() => {
      const initButton = (btn) => {
        if (!btn || btn._handlerAttached) return;
        btn.addEventListener('click', () => this.openModal());
        btn._handlerAttached = true;
      };
      
      // Инициализация плавающей кнопки
      const floatingBtns = document.querySelectorAll('.floating-cta-btn');
      floatingBtns.forEach(initButton);
      
      // Инициализация кнопок "Запросить КП" в hero секции
      const heroBtns = document.querySelectorAll('#heroRequestQuoteBtn');
      heroBtns.forEach(initButton);
      
      console.log('Floating buttons initialized:', floatingBtns.length + heroBtns.length);
    }, 100);
  }

  _validateForm() {
    const fields = [
      { id: 'companyName', validate: (v) => this.validator.required(v) && this.validator.minLength(v, 2) },
      { id: 'contactPerson', validate: (v) => this.validator.required(v) && this.validator.minLength(v, 2) },
      { id: 'email', validate: (v) => this.validator.required(v) && this.validator.email(v) },
      { id: 'phone', validate: (v) => this.validator.required(v) && this.validator.phone(v) },
      { id: 'aircraftType', validate: (v) => this.validator.required(v) },
      { id: 'serviceType', validate: (v) => this.validator.required(v) },
      { id: 'taskDescription', validate: (v) => this.validator.required(v) && this.validator.minLength(v, 10) }
    ];

    let isValid = true;

    fields.forEach(field => {
      const element = DOM.getElement(field.id);
      const errorEl = DOM.getElement(`${field.id}Error`);
      const value = element?.value?.trim() || '';

      if (!field.validate(value)) {
        if (element) DOM.addClass(element, 'error');
        if (errorEl) DOM.addClass(errorEl, 'show');
        isValid = false;
      } else {
        if (element) DOM.removeClass(element, 'error');
        if (errorEl) DOM.removeClass(errorEl, 'show');
      }
    });

    const honeypot = DOM.getElement('hp_website');
    if (honeypot && honeypot.value) {
      return false;
    }

    return isValid;
  }

  async _handleSubmit(e) {
    e.preventDefault();

    if (!this._validateForm()) return;

    if (!this.rateLimiter.canProceed()) {
      const warning = DOM.getElement('rateLimitWarning');
      if (warning) DOM.addClass(warning, 'show');
      return;
    }

    this.rateLimiter.record();

    const submitBtn = DOM.getElement('submitBtn');
    const originalContent = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div><span>Отправка...</span>';

    try {
      const formData = {
        companyName: DOM.getElement('companyName')?.value.trim() || '',
        contactPerson: DOM.getElement('contactPerson')?.value.trim() || '',
        email: DOM.getElement('email')?.value.trim() || '',
        phone: DOM.getElement('phone')?.value.trim() || '',
        aircraftType: DOM.getElement('aircraftType')?.value || '',
        serviceType: DOM.getElement('serviceType')?.value || '',
        taskDescription: DOM.getElement('taskDescription')?.value.trim() || '',
        files: this.currentFiles.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        }))
      };

      // Для реальной отправки файлов нужно использовать FormData
      // const formDataWithFiles = new FormData();
      // Object.keys(formData).forEach(key => formDataWithFiles.append(key, formData[key]));
      // this.currentFiles.forEach(file => formDataWithFiles.append('attachments', file));
      // const result = await this.apiClient.submitFormWithFiles(formDataWithFiles);

      const result = await this.apiClient.submitForm(formData);

      if (result.success) {
        const form = DOM.getElement('proposalForm');
        const successMessage = DOM.getElement('successMessage');

        if (form) form.style.display = 'none';
        if (successMessage) DOM.addClass(successMessage, 'show');

        setTimeout(() => {
          if (typeof modalManager !== 'undefined') {
            modalManager.close('form');
          }
          this._resetForm();
        }, window.CONFIG?.ANIMATION?.MODAL_CLOSE_DELAY_MS || 3000);
      } else {
        this._showError(result.error || 'Произошла ошибка при отправке');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      this._showError('Произошла ошибка при отправке. Пожалуйста, попробуйте позже.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalContent;
    }
  }

  _resetForm() {
    const form = DOM.getElement('proposalForm');
    const successMessage = DOM.getElement('successMessage');
    const fileList = DOM.getElement('fileList');

    if (form) {
      form.reset();
      form.style.display = 'block';
    }

    if (successMessage) DOM.removeClass(successMessage, 'show');

    DOM.queryAll('.form-input, .form-select, .form-textarea').forEach(el => {
      DOM.removeClass(el, 'error');
    });

    DOM.queryAll('.error-message').forEach(el => {
      DOM.removeClass(el, 'show');
    });

    this.currentFiles = [];
    
    // Находим зону загрузки для сброса текста
    const fileDrop = document.querySelector('#fileDrop');
    this._renderFileList(fileDrop);
  }
}

window.FormManager = FormManager;