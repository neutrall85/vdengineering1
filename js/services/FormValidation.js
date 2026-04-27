/**
 * Единый модуль валидации форм
 * ООО "Волга-Днепр Инжиниринг"
 * 
 * Централизованная валидация для всех форм проекта
 */

const FormValidation = (function() {
  'use strict';

  /**
   * Конфигурация сообщений об ошибках
   */
  const ERROR_MESSAGES = {
    required: 'Это поле обязательно для заполнения',
    email: 'Введите корректный email адрес',
    phone: 'Введите корректный номер телефона',
    minLength: (min) => `Минимальная длина — ${min} символов`,
    maxLength: (max) => `Максимальная длина — ${max} символов`,
    consent: 'Необходимо согласие на обработку данных',
    fileRequired: 'Пожалуйста, прикрепите файл',
    fileSize: (size) => `Максимальный размер файла: ${size}MB`,
    fileType: 'Недопустимый тип файла'
  };

  /**
   * Класс валидатора формы
   */
  class FormValidator {
    constructor(formElement, options = {}) {
      if (!formElement || formElement.tagName !== 'FORM') {
        throw new Error('FormValidator требует элемент FORM');
      }

      this.form = formElement;
      this.options = {
        errorClass: options.errorClass || 'error-message',
        successClass: options.successClass || 'success-message',
        showClass: options.showClass || 'show',
        validateOnInput: options.validateOnInput !== false,
        messages: { ...ERROR_MESSAGES, ...options.messages }
      };

      this.errors = new Map();
      this.fields = new Map();
      
      this._init();
    }

    _init() {
      this._collectFields();
      
      if (this.options.validateOnInput) {
        this._attachInputListeners();
      }

      this.form.addEventListener('submit', (e) => this._handleSubmit(e));
    }

    _collectFields() {
      const fieldSelectors = [
        'input[type="text"]:not([type="hidden"])',
        'input[type="email"]',
        'input[type="tel"]',
        'input[type="password"]',
        'textarea',
        'select',
        'input[type="checkbox"]',
        'input[type="radio"]'
      ];

      const fields = this.form.querySelectorAll(fieldSelectors.join(', '));
      
      fields.forEach(field => {
        const name = field.name || field.id;
        if (!name) return;

        const rules = this._parseRules(field);
        this.fields.set(name, {
          element: field,
          rules,
          errors: []
        });
      });
    }

    _parseRules(field) {
      const rules = [];

      if (field.hasAttribute('required')) {
        rules.push({ type: 'required', message: this.options.messages.required });
      }

      if (field.type === 'email') {
        rules.push({ type: 'email', message: this.options.messages.email });
      }

      if (field.type === 'tel') {
        rules.push({ type: 'phone', message: this.options.messages.phone });
      }

      const minLength = field.getAttribute('minlength');
      if (minLength) {
        rules.push({ 
          type: 'minLength', 
          value: parseInt(minLength, 10),
          message: this.options.messages.minLength(parseInt(minLength, 10))
        });
      }

      const maxLength = field.getAttribute('maxlength');
      if (maxLength) {
        rules.push({ 
          type: 'maxLength', 
          value: parseInt(maxLength, 10),
          message: this.options.messages.maxLength(parseInt(maxLength, 10))
        });
      }

      // Проверка чекбокса согласия
      if (field.type === 'checkbox' && field.name.includes('consent')) {
        rules.push({ type: 'consent', message: this.options.messages.consent });
      }

      return rules;
    }

    _attachInputListeners() {
      this.fields.forEach((fieldData, name) => {
        const { element } = fieldData;
        
        // Сохраняем ссылки на обработчики для последующего удаления
        const inputHandler = () => {
          this.validateField(name);
          this._clearError(name);
        };
        const blurHandler = () => {
          this.validateField(name);
        };
        
        element.addEventListener('input', inputHandler);
        element.addEventListener('blur', blurHandler);
        
        // Сохраняем обработчики для очистки
        fieldData.handlers = { input: inputHandler, blur: blurHandler };
      });
      
      // Сохраняем обработчик submit
      this._submitHandler = (e) => this._handleSubmit(e);
      this.form.addEventListener('submit', this._submitHandler);
    }

    _handleSubmit(e) {
      e.preventDefault();
      
      const isValid = this.validate();
      
      if (isValid) {
        this.form.dispatchEvent(new CustomEvent('form:valid', { 
          bubbles: true,
          detail: { formData: new FormData(this.form) }
        }));
      } else {
        this.form.dispatchEvent(new CustomEvent('form:invalid', { 
          bubbles: true,
          detail: { errors: this.errors }
        }));
      }

      return isValid;
    }

    /**
     * Валидировать отдельное поле
     */
    validateField(name) {
      const fieldData = this.fields.get(name);
      if (!fieldData) return true;

      const { element, rules } = fieldData;
      const value = this._getFieldValue(element);
      const errors = [];

      for (const rule of rules) {
        const isValid = this._validateRule(value, rule, element);
        if (!isValid) {
          errors.push(rule.message);
        }
      }

      fieldData.errors = errors;
      
      if (errors.length > 0) {
        this._showError(name, errors[0]);
        return false;
      } else {
        this._clearError(name);
        return true;
      }
    }

    _getFieldValue(element) {
      if (element.type === 'checkbox') {
        return element.checked;
      }
      if (element.type === 'radio') {
        const radios = this.form.querySelectorAll(`input[name="${element.name}"]`);
        for (const radio of radios) {
          if (radio.checked) return radio.value;
        }
        return null;
      }
      return element.value;
    }

    _validateRule(value, rule, element) {
      switch (rule.type) {
        case 'required':
          return Utils.Validator.required(value);
        
        case 'email':
          return Utils.Validator.email(value);
        
        case 'phone':
          return Utils.Validator.phone(value);
        
        case 'minLength':
          return Utils.Validator.minLength(value, rule.value);
        
        case 'maxLength':
          return Utils.Validator.maxLength(value, rule.value);
        
        case 'consent':
          return value === true;
        
        default:
          return true;
      }
    }

    _showError(name, message) {
      const fieldData = this.fields.get(name);
      if (!fieldData) return;

      const { element } = fieldData;
      const errorId = `${name}Error`;
      let errorElement = document.getElementById(errorId);

      if (!errorElement) {
        errorElement = document.createElement('p');
        errorElement.id = errorId;
        errorElement.className = `${this.options.errorClass} ${this.options.showClass}`;
        
        if (element.type === 'checkbox' || element.type === 'radio') {
          element.parentElement.appendChild(errorElement);
        } else {
          element.parentElement?.appendChild(errorElement);
        }
      }

      errorElement.textContent = message;
      errorElement.classList.add(this.options.showClass);
      element.setAttribute('aria-invalid', 'true');
    }

    _clearError(name) {
      const fieldData = this.fields.get(name);
      if (!fieldData) return;

      const { element } = fieldData;
      const errorId = `${name}Error`;
      const errorElement = document.getElementById(errorId);

      if (errorElement) {
        errorElement.classList.remove(this.options.showClass);
        setTimeout(() => {
          if (!errorElement.classList.contains(this.options.showClass)) {
            errorElement.remove();
          }
        }, 300);
      }

      element.removeAttribute('aria-invalid');
    }

    /**
     * Валидировать всю форму
     */
    validate() {
      let isValid = true;
      let firstErrorField = null;

      this.fields.forEach((fieldData, name) => {
        const fieldValid = this.validateField(name);
        if (!fieldValid && !firstErrorField) {
          firstErrorField = fieldData.element;
        }
        isValid = isValid && fieldValid;
      });

      if (!isValid && firstErrorField) {
        firstErrorField.focus();
      }

      return isValid;
    }

    /**
     * Сбросить все ошибки
     */
    reset() {
      this.fields.forEach((_, name) => this._clearError(name));
      this.errors.clear();
    }

    /**
     * Получить данные формы после валидации
     */
    getData() {
      if (!this.validate()) {
        return null;
      }

      const data = {};
      const formData = new FormData(this.form);

      formData.forEach((value, key) => {
        data[key] = value;
      });

      return data;
    }
  }

  /**
   * Утилиты для валидации файлов
   */
  const FileValidator = {
    validate(file, config = window.CONFIG?.FORM) {
      if (!file) {
        return { valid: true };
      }

      const result = Utils.Validator.file(file, config);
      
      if (!result.valid) {
        return {
          valid: false,
          message: result.error
        };
      }

      return { valid: true };
    },

    validateMultiple(files, config = window.CONFIG?.FORM) {
      const errors = [];
      
      for (const file of files) {
        const result = this.validate(file, config);
        if (!result.valid) {
          errors.push({ file: file.name, message: result.message });
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    }
  };

  /**
   * Фабрика для создания валидаторов
   */
  function createValidator(formElement, options = {}) {
    return new FormValidator(formElement, options);
  }

  return {
    FormValidator,
    FileValidator,
    createValidator,
    ERROR_MESSAGES
  };
})();

// Экспортируем в глобальную область
window.FormValidation = FormValidation;

/**
 * Очистка ресурсов при уничтожении валидатора
 */
FormValidation.destroy = function() {
  // Валидаторы FormValidator создают обработчики на элементах формы
  // При удалении формы из DOM обработчики будут автоматически удалены браузером
  // Дополнительная очистка не требуется так как используются анонимные функции
};

/**
 * Метод очистки для экземпляра FormValidator
 */
FormValidation.FormValidator.prototype.destroy = function() {
  // Удаляем обработчик submit
  if (this._submitHandler) {
    this.form.removeEventListener('submit', this._submitHandler);
    this._submitHandler = null;
  }
  
  // Удаляем обработчики input/blur с полей
  this.fields.forEach((fieldData, name) => {
    const { element, handlers } = fieldData;
    if (handlers) {
      element.removeEventListener('input', handlers.input);
      element.removeEventListener('blur', handlers.blur);
      fieldData.handlers = null;
    }
  });
  
  this.fields.clear();
  this.errors.clear();
  this.form = null;
};
