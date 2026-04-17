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
      Logger.INFO('FormManager initialized');
    } catch (error) {
      Logger.ERROR('FormManager init failed:', error);
    }
  }
  
  openModal() {
    if (!this.rateLimiter.canProceed()) {
      const warning = Utils.DOM.getElement('rateLimitWarning');
      if (warning) {
        Utils.DOM.addClass(warning, 'show');
        setTimeout(() => Utils.DOM.removeClass(warning, 'show'), 5000);
      }
      return;
    }

    const warning = Utils.DOM.getElement('rateLimitWarning');
    if (warning) Utils.DOM.removeClass(warning, 'show');

    if (typeof modalManager !== 'undefined') {
      modalManager.open('form');
    } else {
      Logger.ERROR('ModalManager not available');
    }
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
    const newTotalCount = this.currentFiles.length + validNewFiles.length;
    
    // Ограничиваем количество файлов - проверяем ДО добавления
    let filesToAdd = validNewFiles;
    if (newTotalCount > this.maxFiles) {
      const spaceRemaining = Math.max(0, this.maxFiles - this.currentFiles.length);
      if (spaceRemaining === 0) {
        // Нет места для новых файлов
        this._showUploadWarning(`Превышен лимит файлов: ${this.maxFiles}. Удалите старые файлы перед добавлением новых.`, fileDrop);
        filesToAdd = [];
      } else if (spaceRemaining < validNewFiles.length) {
        // Добавляем только часть файлов
        filesToAdd = validNewFiles.slice(0, spaceRemaining);
        this._showUploadWarning(`Добавлено ${spaceRemaining} из ${validNewFiles.length} файлов. Превышен лимит: ${this.maxFiles}`, fileDrop);
      }
    }
    
    this.currentFiles = [...this.currentFiles, ...filesToAdd];

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
    container.replaceChildren();

    if (this.currentFiles.length === 0) {
      // Обновляем текст в зоне загрузки
      const fileDropText = fileDrop?.querySelector('.form-file-text');
      if (fileDropText) {
        fileDropText.textContent = 'Выбрать файл...';
      }
    } else {
      // Создаем элементы через DOM API вместо innerHTML для безопасности
      this.currentFiles.forEach((file, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('form-file-item');
        itemDiv.setAttribute('data-index', index);
        
        const nameSpan = document.createElement('span');
        nameSpan.classList.add('form-file-item-name');
        nameSpan.textContent = file.name;
        
        const sizeSpan = document.createElement('span');
        sizeSpan.classList.add('form-file-item-size');
        sizeSpan.textContent = this._formatFileSize(file.size);
        
        const removeBtn = document.createElement('button');
        removeBtn.setAttribute('type', 'button');
        removeBtn.classList.add('form-file-item-remove');
        removeBtn.setAttribute('data-index', index);
        removeBtn.setAttribute('aria-label', 'Удалить файл');
        
        // Добавляем SVG иконку через DOM API
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z');
        svg.appendChild(path);
        removeBtn.appendChild(svg);
        
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
    Logger.ERROR('Form error:', message);
    
    // Если передан элемент предупреждения о лимитах файлов, используем его
    if (fileLimitWarning) {
      fileLimitWarning.replaceChildren();
      const p = document.createElement('p');
      p.textContent = `⚠️ ${message}`;
      fileLimitWarning.appendChild(p);
      fileLimitWarning.classList.remove('form-file-limit-hidden');
      setTimeout(() => {
        fileLimitWarning.classList.add('form-file-limit-hidden');
      }, 5000);
      return;
    }
    
    // Иначе используем стандартное предупреждение
    const warning = Utils.DOM.getElement('rateLimitWarning');
    if (warning) {
      warning.replaceChildren();
      const p = document.createElement('p');
      p.textContent = `⚠️ ${message}`;
      warning.appendChild(p);
      Utils.DOM.addClass(warning, 'show');
      setTimeout(() => Utils.DOM.removeClass(warning, 'show'), 5000);
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
    
    warningContainer.replaceChildren();
    const warningDiv = document.createElement('div');
    warningDiv.className = 'upload-warning';
    warningDiv.textContent = `⚠️ ${message}`;
    warningContainer.appendChild(warningDiv);
    warningContainer.classList.remove('form-file-limit-hidden');
    
    // Скрываем предыдущий таймер если он был
    if (this.uploadWarningTimeout) {
      clearTimeout(this.uploadWarningTimeout);
    }
    
    // Автоматически скрываем через 3 секунды
    this.uploadWarningTimeout = setTimeout(() => {
      warningContainer.classList.add('form-file-limit-hidden');
    }, 3000);
  }

  removeFile(index, fileDrop) {
    // Удаляем файл по индексу
    const indexNum = parseInt(index, 10);
    
    if (!isNaN(indexNum) && indexNum >= 0 && indexNum < this.currentFiles.length) {
      this.currentFiles.splice(indexNum, 1);
    } else {
      Logger.ERROR('Invalid file index:', index);
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
    const form = Utils.DOM.getElement('proposalForm');
    if (form) {
      form.addEventListener('submit', (e) => this._handleSubmit(e));
    }
  }

  _initFloatingButton() {
    const btn = Utils.DOM.query('.floating-cta-btn');
    if (btn) {
      btn.addEventListener('click', () => this.openModal());
    }
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
      const element = Utils.DOM.getElement(field.id);
      const errorEl = Utils.DOM.getElement(`${field.id}Error`);
      const value = element?.value?.trim() || '';

      if (!field.validate(value)) {
        if (element) Utils.DOM.addClass(element, 'error');
        if (errorEl) Utils.DOM.addClass(errorEl, 'show');
        isValid = false;
      } else {
        if (element) Utils.DOM.removeClass(element, 'error');
        if (errorEl) Utils.DOM.removeClass(errorEl, 'show');
      }
    });

    const honeypot = Utils.DOM.getElement('hp_website');
    if (honeypot && honeypot.value) {
      return false;
    }

    return isValid;
  }

  async _handleSubmit(e) {
    e.preventDefault();

    if (!this._validateForm()) return;

    if (!this.rateLimiter.canProceed()) {
      const warning = Utils.DOM.getElement('rateLimitWarning');
      if (warning) Utils.DOM.addClass(warning, 'show');
      return;
    }

    this.rateLimiter.record();

    const submitBtn = Utils.DOM.getElement('submitBtn');
    
    // Сохраняем оригинальное содержимое кнопки (текст)
    const originalText = submitBtn.textContent;

    submitBtn.disabled = true;
    
    // Создаем индикатор загрузки через DOM API
    submitBtn.replaceChildren();
    const spinner = document.createElement('div');
    spinner.classList.add('spinner');
    const loadingText = document.createElement('span');
    loadingText.textContent = 'Отправка...';
    submitBtn.appendChild(spinner);
    submitBtn.appendChild(loadingText);

    try {
      // Получаем CSRF токен из скрытого поля формы или из sessionStorage
      const csrfTokenField = form.querySelector('input[name="csrf_token"]');
      const csrfToken = csrfTokenField?.value || window.CONFIG?.CSRF_TOKEN || '';
      
      const formData = {
        companyName: Utils.Sanitizer.escapeHtml(Utils.DOM.getElement('companyName')?.value.trim() || ''),
        contactPerson: Utils.Sanitizer.escapeHtml(Utils.DOM.getElement('contactPerson')?.value.trim() || ''),
        email: Utils.Sanitizer.escapeHtml(Utils.DOM.getElement('email')?.value.trim() || ''),
        phone: Utils.Sanitizer.escapeHtml(Utils.DOM.getElement('phone')?.value.trim() || ''),
        aircraftType: Utils.Sanitizer.escapeHtml(Utils.DOM.getElement('aircraftType')?.value || ''),
        serviceType: Utils.Sanitizer.escapeHtml(Utils.DOM.getElement('serviceType')?.value || ''),
        taskDescription: Utils.Sanitizer.escapeHtml(Utils.DOM.getElement('taskDescription')?.value.trim() || ''),
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

      // Передаем CSRF токен в заголовке запроса
      const result = await this.apiClient.submitForm(formData, { 'X-CSRF-Token': csrfToken });

      if (result.success) {
        const form = Utils.DOM.getElement('proposalForm');
        const successMessage = Utils.DOM.getElement('successMessage');

        if (form) Utils.DOM.addClass(form, 'form-element-hidden');
        if (successMessage) Utils.DOM.addClass(successMessage, 'show');

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
      Logger.ERROR('Form submission error:', error);
      this._showError('Произошла ошибка при отправке. Пожалуйста, попробуйте позже.');
    } finally {
      submitBtn.disabled = false;
      // Восстанавливаем оригинальное содержимое кнопки
      submitBtn.replaceChildren();
      submitBtn.textContent = originalText;
    }
  }

  _resetForm() {
    const form = Utils.DOM.getElement('proposalForm');
    const successMessage = Utils.DOM.getElement('successMessage');
    const fileList = Utils.DOM.getElement('fileList');

    if (form) {
      form.reset();
      Utils.DOM.removeClass(form, 'form-element-hidden');
    }

    if (successMessage) Utils.DOM.removeClass(successMessage, 'show');

    Utils.DOM.queryAll('.form-input, .form-select, .form-textarea').forEach(el => {
      Utils.DOM.removeClass(el, 'error');
    });

    Utils.DOM.queryAll('.error-message').forEach(el => {
      Utils.DOM.removeClass(el, 'show');
    });

    this.currentFiles = [];
    
    // Находим зону загрузки для сброса текста
    const fileDrop = document.querySelector('#fileDrop');
    this._renderFileList(fileDrop);
  }
}

window.FormManager = FormManager;