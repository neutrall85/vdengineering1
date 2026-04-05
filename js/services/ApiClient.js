/**
 * Клиент для API запросов
 * ООО "Волга-Днепр Инжиниринг"
 */

class ApiClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async post(endpoint, data, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(data),
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async submitForm(data) {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Form submitted:', data);
    return { success: true, message: 'Заявка успешно отправлена' };
  }
}

const apiClient = new ApiClient();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApiClient, apiClient };
}