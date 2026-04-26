/**
 * Управление формой
 * ООО "Волга-Днепр Инжиниринг"
 * 
 * Использует централизованный модуль FormValidation для валидации
 * и ModalHelpers для управления модальными окнами
 */

class FormManager {
  constructor(apiClient, rateLimiter, validator) {
    this.apiClient = apiClient;
    this.rateLimiter = rateLimiter;
    this.validator = validator;
    this.currentFiles = [];
    this.maxFiles = 10;
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.formValidator = null;
    this.isSubmitting = false;
    this.submitTimeoutId = null;
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
      // Инициализируем валидатор для основной формы
      this._initFormValidator();
      Logger.INFO('FormManager initialized');
    } catch (error) {
      Logger.ERROR('FormManager init failed:', error);
    }
  }
  
  openModal() {
    if (!this.rateLimiter.canProceed()) {
      const warning = document.getElementById('rateLimitWarning');
      if (warning) {
        warning.classList.add('show');
        setTimeout(() => warning.classList.remove('show'), 5000);
      }
      return;
    }

    const warning = document.getElementById('rateLimitWarning');
    if (warning) warning.classList.remove('show');

    // Используем централизованный ModalHelpers
    ModalHelpers.open('form');
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

    const errors = [];
    const validNewFiles = [];

    for (const file of Array.from(files)) {
      // Проверка размера файла
      if (file.size > this.maxFileSize) {
        errors.push(`Файл "${file.name}" превышает 10MB`);
        continue;
      }

      // Проверка типа файла
      const validation = this.validator.file(file);
      if (!validation.valid) {
        errors.push(validation.error);
        continue;
      }

      // Проверка на дубликаты среди уже загруженных файлов
      const fileKey = `${file.name}:${file.size}`;
      const isDuplicate = this.currentFiles.some(f => `${f.name}:${f.size}` === fileKey);

      if (isDuplicate) {
        errors.push(`Файл "${file.name}" уже добавлен`);
        continue;
      }

      // Проверка на дубликаты внутри текущей партии
      const isDuplicateInBatch = validNewFiles.some(f => `${f.name}:${f.size}` === fileKey);
      if (isDuplicateInBatch) {
        errors.push(`Файл "${file.name}" уже добавлен в этой партии`);
        continue;
      }

      validNewFiles.push(file);
    }

    // Проверка лимита по количеству
    const totalAfterAdd = this.currentFiles.length + validNewFiles.length;
    let filesToAdd = validNewFiles;
    if (totalAfterAdd > this.maxFiles) {
      const space = this.maxFiles - this.currentFiles.length;
      if (space <= 0) {
        errors.push(`Достигнут лимит файлов (${this.maxFiles}). Удалите старые файлы.`);
        filesToAdd = [];
      } else {
        filesToAdd = validNewFiles.slice(0, space);
        errors.push(`Добавлено ${space} из ${validNewFiles.length} файлов. Лимит ${this.maxFiles}.`);
      }
    }

    // Показываем накопленные ошибки один раз
    if (errors.length > 0) {
      const uniqueErrors = [...new Set(errors)];
      this._showUploadWarning(uniqueErrors.join('; '), fileDrop);
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
    const warning = document.getElementById('rateLimitWarning');
    if (warning) {
      warning.replaceChildren();
      const p = document.createElement('p');
      p.textContent = `⚠️ ${message}`;
      warning.appendChild(p);
      warning.classList.add('show');
      setTimeout(() => warning.classList.remove('show'), 5000);
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

  /**
   * Инициализация валидатора формы через FormValidation
   */
  _initFormValidator() {
    const form = document.getElementById('proposalForm');
    if (!form || typeof FormValidation === 'undefined') return;

    this.formValidator = FormValidation.createValidator(form, {
      validateOnInput: true,
      messages: {
        required: 'Это поле обязательно для заполнения',
        email: 'Введите корректный email адрес',
        phone: 'Введите корректный номер телефона',
        minLength: (min) => `Минимальная длина — ${min} символов`,
        consent: 'Необходимо согласие на обработку данных'
      }
    });
  }

  _initFormSubmit() {
    const form = document.getElementById('proposalForm');
    if (form) {
      form.addEventListener('submit', (e) => this._handleSubmit(e));
    }
  }

  _initFloatingButton() {
    const btn = document.querySelector('.floating-cta-btn');
    if (btn) {
      btn.addEventListener('click', () => this.openModal());
    }
  }

  /**
   * Валидация формы через FormValidation
   * Использует декларативные правила из data-атрибутов
   */
  _validateForm() {
    const form = document.getElementById('proposalForm');
    if (!form) return false;

    // Проверяем honeypot
    const honeypot = document.getElementById('hp_website');
    if (honeypot && honeypot.value) {
      return false;
    }

    // Используем инициализированный валидатор или создаём временный
    if (this.formValidator) {
      return this.formValidator.validate();
    } else if (typeof FormValidation !== 'undefined') {
      const validator = FormValidation.createValidator(form);
      return validator.validate();
    }
    
    return false;
  }

  async _handleSubmit(e) {
    e.preventDefault();

    // Защита от гонки состояний: предотвращаем повторную отправку
    if (this.isSubmitting) {
      Logger.WARN('Form submission already in progress, ignoring duplicate request');
      return;
    }

    const form = document.getElementById('proposalForm');
    
    if (!this._validateForm()) return;

    if (!this.rateLimiter.canProceed()) {
      const warning = document.getElementById('rateLimitWarning');
      if (warning) warning.classList.add('show');
      return;
    }

    this.rateLimiter.record();
    this.isSubmitting = true;

    const submitBtn = document.getElementById('submitBtn');
    
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

    // Таймаут защиты от зависания (30 секунд)
    this.submitTimeoutId = setTimeout(() => {
      if (this.isSubmitting) {
        Logger.ERROR('Form submission timeout after 30 seconds');
        this._showError('Превышено время ожидания ответа сервера. Пожалуйста, попробуйте позже.');
        this._resetSubmitState(submitBtn, originalText);
      }
    }, 30000);

    try {
      // Получаем CSRF токен из скрытого поля формы или из sessionStorage
      const csrfTokenField = form.querySelector('input[name="csrf_token"]');
      const csrfToken = csrfTokenField?.value || window.CONFIG?.CSRF_TOKEN || '';
      
      const formData = {
        companyName: Utils.Sanitizer.escapeHtml(document.getElementById('companyName')?.value.trim() || ''),
        contactPerson: Utils.Sanitizer.escapeHtml(document.getElementById('contactPerson')?.value.trim() || ''),
        email: Utils.Sanitizer.escapeHtml(document.getElementById('email')?.value.trim() || ''),
        phone: Utils.Sanitizer.escapeHtml(document.getElementById('phone')?.value.trim() || ''),
        aircraftType: Utils.Sanitizer.escapeHtml(document.getElementById('aircraftType')?.value || ''),
        serviceType: Utils.Sanitizer.escapeHtml(document.getElementById('serviceType')?.value || ''),
        taskDescription: Utils.Sanitizer.escapeHtml(document.getElementById('taskDescription')?.value.trim() || ''),
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
        const formEl = document.getElementById('proposalForm');
        const successMessage = document.getElementById('successMessage');

        if (formEl) formEl.classList.add('hidden-form');
        if (successMessage) successMessage.classList.add('show');

        setTimeout(() => {
          // Используем централизованный ModalHelpers для закрытия
          ModalHelpers.close('form');
          this._resetForm();
        }, window.CONFIG?.ANIMATION?.MODAL_CLOSE_DELAY_MS || 3000);
      } else {
        this._showError(result.error || 'Произошла ошибка при отправке');
      }
    } catch (error) {
      Logger.ERROR('Form submission error:', error);
      const errorMessage = error.message.includes('HTTP') 
        ? `Ошибка сервера: ${error.message}`
        : 'Произошла ошибка при отправке. Пожалуйста, попробуйте позже.';
      this._showError(errorMessage);
    } finally {
      this._resetSubmitState(submitBtn, originalText);
    }
  }

  /**
   * Сброс состояния отправки формы
   */
  _resetSubmitState(submitBtn, originalText) {
    if (this.submitTimeoutId) {
      clearTimeout(this.submitTimeoutId);
      this.submitTimeoutId = null;
    }
    this.isSubmitting = false;
    
    if (submitBtn) {
      submitBtn.disabled = false;
      // Восстанавливаем оригинальное содержимое кнопки
      submitBtn.replaceChildren();
      submitBtn.textContent = originalText;
    }
  }

  _resetForm() {
    const form = document.getElementById('proposalForm');
    const successMessage = document.getElementById('successMessage');
    const fileList = document.getElementById('fileList');

    if (form) {
      form.reset();
      form.classList.remove('hidden-form');
    }

    if (successMessage) successMessage.classList.remove('show');

    document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => {
      el.classList.remove('error');
    });

    document.querySelectorAll('.error-message').forEach(el => {
      el.classList.remove('show');
    });

    this.currentFiles = [];
    
    // Находим зону загрузки для сброса текста
    const fileDrop = document.querySelector('#fileDrop');
    this._renderFileList(fileDrop);
  }
}

// Экспорт удален - регистрация происходит через Application.services