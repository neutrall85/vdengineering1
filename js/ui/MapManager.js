/**
 * Управление картой
 * ООО "Волга-Днепр Инжиниринг"
 */

class MapManager {
  constructor(mapUrl = window.CONFIG?.CONTACT?.MAP_URL || 'https://yandex.ru/maps/-/CDu~eKqJ') {
    this.mapUrl = mapUrl;
    this.container = null;
  }

  init() {
    // Используем Utils.DOM.getElement вместо DOMHelper.getElement
    this.container = window.Utils && window.Utils.DOM 
      ? window.Utils.DOM.getElement('mapContainer')
      : document.getElementById('mapContainer');
    
    if (this.container) {
      this.container.addEventListener('click', () => this.openMap());
      this.container.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openMap();
        }
      });
      this.container.setAttribute('role', 'button');
      this.container.setAttribute('tabindex', '0');
      console.log('MapManager initialized');
    } else {
      console.warn('MapContainer not found');
    }
  }

  openMap() {
    window.open(this.mapUrl, '_blank', 'noopener,noreferrer');
  }
}

const mapManager = new MapManager();

window.MapManager = MapManager;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MapManager, mapManager };
}