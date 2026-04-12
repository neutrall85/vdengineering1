/**
 * NewsNavigation - Управление URL новостей
 * DRY: Вынесено из utils.js в отдельный файл
 * KISS: Простая синхронизация состояния с адресной строкой
 */

const NewsNavigation = {
    basePath: '',
    newsManager: null,

    init(newsManager) {
        this.newsManager = newsManager;
        this.basePath = window.location.pathname.split('/').slice(0, -1).join('/') + '/';
        
        window.addEventListener('popstate', (e) => {
            if (e.state?.newsId) {
                this.newsManager.openNewsModal(e.state.newsId, false);
            } else {
                this.newsManager.closeNewsModal();
            }
        });

        this.checkDirectLink();
    },

    checkDirectLink() {
        const path = window.location.pathname;
        const match = path.match(/\/(\d{4})\/(\d{2})\/(\d{2})\/(.+)$/);
        if (!match) return;

        const slugPart = match[4];
        const lastDashIndex = slugPart.lastIndexOf('-');
        if (lastDashIndex <= 0) return;

        const id = parseInt(slugPart.slice(lastDashIndex + 1), 10);
        if (!isNaN(id)) {
            setTimeout(() => this.newsManager.openNewsModal(id, false), 50);
        }
    },

    openNewsUrl(id, title) {
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const slug = `${window.SlugUtils.generateSlug(title)}-${id}`;
        
        history.pushState({ newsId: id }, '', `/${yyyy}/${mm}/${dd}/${slug}`);
    },

    restoreBaseUrl() {
        history.replaceState(null, '', this.basePath);
    }
};

window.NewsNavigation = NewsNavigation;