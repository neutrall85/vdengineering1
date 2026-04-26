/**
 * HeroSlideshow - покачивающееся слайд-шоу для hero секции
 * Автоматическое переключение слайдов с плавным переходом
 */
class HeroSlideshow {
  constructor() {
    this.container = document.querySelector('.slideshow-container');
    if (!this.container) return;
    
    this.slides = this.container.querySelectorAll('.slideshow-slide');
    this.currentSlide = 0;
    this.slideInterval = 4000;
    this.intervalId = null;
    this._boundMouseEnterHandler = null;
    this._boundMouseLeaveHandler = null;
    
    this.init();
  }
  
  init() {
    if (this.slides.length <= 1) return;
    
    this.startAutoPlay();
    
    // Пауза при наведении
    this._boundMouseEnterHandler = () => this.pause();
    this._boundMouseLeaveHandler = () => this.resume();
    this.container.addEventListener('mouseenter', this._boundMouseEnterHandler);
    this.container.addEventListener('mouseleave', this._boundMouseLeaveHandler);
  }
  
  startAutoPlay() {
    this.intervalId = setInterval(() => {
      this.nextSlide();
    }, this.slideInterval);
  }
  
  pause() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  resume() {
    if (!this.intervalId) {
      this.startAutoPlay();
    }
  }
  
  nextSlide() {
    this.slides[this.currentSlide].classList.remove('active');
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    this.slides[this.currentSlide].classList.add('active');
  }
  
  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this._boundMouseEnterHandler && this.container) {
      this.container.removeEventListener('mouseenter', this._boundMouseEnterHandler);
    }
    if (this._boundMouseLeaveHandler && this.container) {
      this.container.removeEventListener('mouseleave', this._boundMouseLeaveHandler);
    }
    this.container = null;
    this.slides = null;
  }
}

// Инициализация после загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new HeroSlideshow();
  });
} else {
  new HeroSlideshow();
}
