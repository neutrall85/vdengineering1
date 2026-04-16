import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    minify: 'terser',
    rollupOptions: {
      input: {
        main: './index.html',
        about: './about.html',
        services: './services.html',
        projects: './projects.html',
        vacancies: './vacancies.html',
        news: './news.html',
        docs: './docs.html'
      },
      output: {
        entryFileNames: 'js/[name].[hash].js',
        chunkFileNames: 'js/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'css/[name].[hash][extname]';
          }
          return 'assets/[name].[hash][extname]';
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: []
      },
      format: {
        comments: false
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    headers: {
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    }
  }
});