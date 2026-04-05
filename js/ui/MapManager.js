/**
 * Управление картой
 * ООО "Волга-Днепр Инжиниринг"
 */

class MapManager {
  constructor(mapUrl = CONFIG.CONTACT.MAP_URL) {
    this.mapUrl = mapUrl;
    this.container = null;
  }

  init() {
    this.container = DOMHelper.getElement('mapContainer');
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
    }
  }

  openMap() {
    window.open(this.mapUrl, '_blank', 'noopener,noreferrer');
  }
}

const mapManager = new MapManager();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MapManager, mapManager };
}