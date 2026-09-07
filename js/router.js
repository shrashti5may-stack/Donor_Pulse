/**
 * DonorPulse Client-Side Hash Router
 * Enables fluid navigation across all views without page reloads while preserving browser history.
 */

class PulseRouter {
  constructor() {
    this.routes = {
      'landing': 'view-landing',
      'role-selection': 'view-role-selection',
      'donor-register': 'view-donor-register',
      'donor-dashboard': 'view-donor-dashboard',
      'hospital-register': 'view-hospital-register',
      'hospital-verification': 'view-hospital-verification',
      'hospital-dashboard': 'view-hospital-dashboard',
      'raise-request': 'view-raise-request',
      'request-confirmation': 'view-request-confirmation',
      'matched-donors': 'view-matched-donors',
      'request-tracking': 'view-request-tracking'
    };

    this.currentRoute = 'landing';
    this.routeParams = {};
    this.listeners = [];

    window.addEventListener('hashchange', () => this.handleHashChange());
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', () => this.handleHashChange());
    } else {
      setTimeout(() => this.handleHashChange(), 0);
    }
  }

  onRouteChange(callback) {
    this.listeners.push(callback);
  }

  notify(route, params) {
    this.listeners.forEach(cb => {
      try { cb(route, params); } catch (e) { console.error('Router callback error:', e); }
    });
  }

  navigate(path, params = {}) {
    let hash = `#/${path}`;
    const queryKeys = Object.keys(params);
    if (queryKeys.length > 0) {
      const queryString = queryKeys.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
      hash += `?${queryString}`;
    }
    window.location.hash = hash;
  }

  handleHashChange() {
    let rawHash = window.location.hash.replace(/^#\/?/, '').trim();
    if (!rawHash) {
      rawHash = 'landing';
    }

    // Split path and query parameters
    const [pathPart, queryPart] = rawHash.split('?');
    const path = pathPart.toLowerCase();

    const params = {};
    if (queryPart) {
      const pairs = queryPart.split('&');
      pairs.forEach(pair => {
        const [k, v] = pair.split('=');
        if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }

    const viewId = this.routes[path];
    if (viewId && document.getElementById(viewId)) {
      this.currentRoute = path;
      this.routeParams = params;
      this.activateView(viewId, path, params);
    } else {
      // Fallback to landing if unknown
      this.navigate('landing');
    }
  }

  activateView(viewId, path, params) {
    // Hide all view sections
    document.querySelectorAll('.view-section').forEach(section => {
      section.classList.remove('active');
    });

    // Activate the matching view section
    const target = document.getElementById(viewId);
    if (target) {
      target.classList.add('active');
    }

    // Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Update global nav link active classes
    document.querySelectorAll('[data-nav-path]').forEach(link => {
      const navPath = link.getAttribute('data-nav-path');
      if (navPath === path) {
        link.classList.add('text-primary', 'font-bold');
        link.classList.remove('text-on-surface-variant');
      } else {
        link.classList.remove('text-primary', 'font-bold');
        link.classList.add('text-on-surface-variant');
      }
    });

    // Update header Quick Switcher select value if it exists
    const quickSwitcher = document.getElementById('prototype-quick-select');
    if (quickSwitcher) {
      quickSwitcher.value = path;
    }

    // Notify application controllers
    this.notify(path, params);
  }
}

window.PulseRouter = new PulseRouter();
