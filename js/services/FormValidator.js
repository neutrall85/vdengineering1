/**
 * FormValidator - единый сервис валидации форм
 * ООО "Волга-Днепр Инжиниринг"
 * 
 * Централизует логику валидации для всех форм проекта
 * Устраняет дублирование между FormManager и ComponentLoader
 */

const FormValidator = (function() {
  // Ссылка на Utils.Validator если доступен
  const validator = typeof window !== 'undefined' && window.Utils?.Validator;

  /**
   * Конфигурация полей формы
   */
  const fieldConfigs = {
    // Основная форма КП
    proposal: {
      companyName: {
        required: true,
        minLength: 2,
        maxLength: 200,
        errorId: 'companyNameError'
      },
      contactPerson: {
        required: true,
        minLength: 2,
        maxLength: 100,
        errorId: 'contactPersonError'
      },
      email: {
        required: true,
        email: true,
        maxLength: 255,
        errorId: 'emailError'
      },
      phone: {
        required: true,
        phone: true,
        minLength: 10,
        maxLength: 20,
        errorId: 'phoneError'
      },
      aircraftType: {
        required: true,
        minLength: 2,
        maxLength: 100,
        errorId: 'aircraftTypeError'
      },
      serviceType: {
        required: true,
        errorId: 'serviceTypeError'
      },
      taskDescription: {
        required: true,
        minLength: 10,
        maxLength: 2000,
        errorId: 'taskDescriptionError'
      }
    },
    // Универсальная форма заявки
    universal: {
      fullName: {
        required: true,
        minLength: 2,
        maxLength: 200,
        errorId: 'universalFullNameError'
      },
      phone: {
        required: true,
        phone: true,
        minLength: 10,
        maxLength: 20,
        errorId: 'universalPhoneError'
      },
      email: {
        required: true,
        email: true,
        maxLength: 255,
        errorId: 'universalEmailError'
      },
      about: {
        required: true,
        minLength: 10,
        maxLength: 2000,
        errorId: 'universalAboutError'
      },
      consent: {
        required: true,
        checkbox: true,
        errorId: 'universalConsentError'
      },
      fileAttachment: {
        required: true,
        file: true,
        errorId: 'universalFileError'
      }
    }
  };

  /**
   * Валидация одного поля
   * @param {string} value - значение поля
   * @param {Object} config - конфигурация валидации
   * @returns {Object} результат валидации
   */
  function validateField(value, config) {
    const result = { valid: true, errors: [] };

    if (!value && config.required) {
      result.valid = false;
      result.errors.push('required');
      return result;
    }

    if (config.checkbox) {
      result.valid = value === true || value === 'on';
      if (!result.valid) result.errors.push('checkbox');
      return result;
    }

    if (!value) return result;

    if (config.email && validator && !validator.email(value)) {
      result.valid = false;
      result.errors.push('email');
    }

    if (config.phone && validator && !validator.phone(value)) {
      result.valid = false;
      result.errors.push('phone');
    }

    if (config.minLength && value.length < config.minLength) {
      result.valid = false;
      result.errors.push(`minLength:${config.minLength}`);
    }

    if (config.maxLength && value.length > config.maxLength) {
      result.valid = false;
      result.errors.push(`maxLength:${config.maxLength}`);
    }

    if (config.file && validator) {
      const fileValidation = validator.file(value);
      if (!fileValidation.valid) {
        result.valid = false;
        result.errors.push(fileValidation.error);
      }
    }

    return result;
  }

  /**
   * Валидация всей формы
   * @param {string} formType - тип формы (proposal, universal)
   * @param {Object} formData - данные формы
   * @returns {Object} результат валидации
   */
  function validateForm(formType, formData) {
    const config = fieldConfigs[formType];
    if (!config) {
      return { valid: false, errors: { _form: 'Unknown form type' } };
    }

    const result = { valid: true, errors: {}, fields: {} };

    for (const [fieldId, fieldConfig] of Object.entries(config)) {
      const value = formData[fieldId];
      const validation = validateField(value, fieldConfig);

      if (!validation.valid) {
        result.valid = false;
        result.fields[fieldId] = validation.errors;
        
        if (fieldConfig.errorId) {
          result.errors[fieldId] = fieldConfig.errorId;
        }
      }
    }

    return result;
  }

  /**
   * Валидация формы с обновлением UI
   * @param {string} formType - тип формы
   * @param {HTMLFormElement} formElement - элемент формы
   * @returns {boolean} результат валидации
   */
  function validateFormUI(formType, formElement) {
    if (!formElement) return false;

    const config = fieldConfigs[formType];
    if (!config) return false;

    let isValid = true;

    for (const [fieldId, fieldConfig] of Object.entries(config)) {
      const element = formElement.querySelector(`#${fieldId}`);
      const errorEl = fieldConfig.errorId ? document.getElementById(fieldConfig.errorId) : null;
      
      let value;
      if (fieldConfig.checkbox) {
        value = element?.checked;
      } else if (fieldConfig.file) {
        value = element?.files?.[0];
      } else {
        value = element?.value?.trim() || '';
      }

      const validation = validateField(value, fieldConfig);

      if (!validation.valid) {
        isValid = false;
        if (element) element.classList.add('error');
        if (errorEl) errorEl.classList.add('show');
      } else {
        if (element) element.classList.remove('error');
        if (errorEl) errorEl.classList.remove('show');
      }
    }

    // Проверка honeypot поля
    const honeypot = formElement.querySelector('#hp_website');
    if (honeypot && honeypot.value) {
      return false;
    }

    return isValid;
  }

  /**
   * Сброс ошибок валидации
   * @param {string} formType - тип формы
   * @param {HTMLFormElement} formElement - элемент формы
   */
  function resetErrors(formType, formElement) {
    if (!formElement) return;

    const config = fieldConfigs[formType];
    if (!config) return;

    for (const fieldConfig of Object.values(config)) {
      const fieldId = fieldConfig.errorId;
      if (fieldId) {
        const errorEl = document.getElementById(fieldId);
        if (errorEl) errorEl.classList.remove('show');
      }
    }

    formElement.querySelectorAll('.error').forEach(el => {
      el.classList.remove('error');
    });
  }

  /**
   * Добавление новой конфигурации формы
   * @param {string} formType - тип формы
   * @param {Object} config - конфигурация полей
   */
  function registerForm(formType, config) {
    fieldConfigs[formType] = config;
  }

  return {
    validateField,
    validateForm,
    validateFormUI,
    resetErrors,
    registerForm,
    fieldConfigs
  };
})();

// Экспортируем в глобальную область
if (typeof window !== 'undefined') {
  window.FormValidator = FormValidator;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormValidator;
}
