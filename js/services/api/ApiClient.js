/**
 * ApiClient - единый сервис для API-вызовов
 * ООО "Волга-Днепр Инжиниринг"
 * 
 * Вынесен в отдельный слой для разделения ответственностей (UI vs API)
 */

class ApiClient {
  constructor(baseUrl = '', defaultHeaders = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders
    };
  }

  /**
   * Базовый метод для выполнения запросов
   * @param {string} endpoint - URL endpoint
   * @param {Object} options - опции fetch
   * @returns {Promise<Object>}
   */
  async _request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      Logger.ERROR('API request failed:', error);
      return { 
        success: false, 
        error: error.message || 'Network error' 
      };
    }
  }

  /**
   * GET запрос
   */
  async get(endpoint, headers = {}) {
    return this._request(endpoint, { method: 'GET', headers });
  }

  /**
   * POST запрос
   */
  async post(endpoint, data, headers = {}) {
    return this._request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers
    });
  }

  /**
   * PUT запрос
   */
  async put(endpoint, data, headers = {}) {
    return this._request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers
    });
  }

  /**
   * DELETE запрос
   */
  async delete(endpoint, headers = {}) {
    return this._request(endpoint, { method: 'DELETE', headers });
  }

  /**
   * Отправка формы с файлами (FormData)
   * @param {FormData} formData - FormData объект с данными и файлами
   * @param {Object} headers - дополнительные заголовки
   * @returns {Promise<Object>}
   */
  async submitFormWithFiles(formData, headers = {}) {
    // Удаляем Content-Type чтобы браузер установил его автоматически с boundary
    const customHeaders = { ...headers };
    delete customHeaders['Content-Type'];
    
    return this._request('/api/form/submit', {
      method: 'POST',
      body: formData,
      headers: customHeaders
    });
  }

  /**
   * Отправка формы (JSON)
   * @param {Object} data - данные формы
   * @param {Object} headers - дополнительные заголовки
   * @returns {Promise<Object>}
   */
  async submitForm(data, headers = {}) {
    return this.post('/api/form/submit', data, headers);
  }
}

// Экспортируем в глобальную область
if (typeof window !== 'undefined') {
  window.ApiClient = ApiClient;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiClient;
}
