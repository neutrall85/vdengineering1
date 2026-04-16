/**
 * Main entry point for projects page
 */

// Import configuration and utilities
import './config.js';
import './services.js';
import './utils.js';

// Import UI modules
import './ui/ComponentLoader.js';
import './ui/ModalManager.js';
import './ui/NavigationManager.js';
import './ui/AnimationManager.js';
import './ui/FormManager.js';
import './ui/NewsRenderer.js';
import './ui/NewsManager.js';

// Import data
import './data/newsData.js';

// Import page-specific module
import './pages/projects-page.js';

// Import and initialize main application
import './app.js';
