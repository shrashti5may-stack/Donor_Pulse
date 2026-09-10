/**
 * DonorPulse Client-Side Hash Router
 * Enables fluid navigation across all views without page reloads while preserving browser history.
 */

class PulseRouter {
  constructor() {
    this.routes = {
      'landing': 'view-landing',
      'role-selection': 'view-role-selection',
      'donor-register': 'view-donor-dashboard',
      'donor-dashboard': 'view-donor-dashboard',
      'nearby-requests': 'view-donor-dashboard',
      'dashboard/requests': 'view-donor-dashboard',
      'donor-dashboard/requests': 'view-donor-dashboard',
      'donor-requests': 'view-donor-dashboard',
      'donor-requests-section': 'view-donor-dashboard',
      'donation-history': 'view-donor-dashboard',
      'donor-history': 'view-donor-dashboard',
      'donor-history-section': 'view-donor-dashboard',
      'hospital-register': 'view-hospital-dashboard',
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

    // Registration feature disabled: redirect directly to dashboards
    if (path === 'donor-register') {
      this.navigate('donor-dashboard');
      return;
    }
    if (path === 'hospital-register') {
      this.navigate('hospital-dashboard');
      return;
    }

    // Direct in-page anchor check (e.g. #donor-requests-section)
    const directTarget = document.getElementById(pathPart);
    if (directTarget) {
      const parentView = directTarget.closest('.view-section');
      if (parentView) {
        this.currentRoute = path;
        this.routeParams = params;
        this.activateView(parentView.id, path, params);
        setTimeout(() => {
          directTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
        return;
      }
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

    // Taskbar should ONLY be visible on the 1st page (view-landing) and not on other pages
    const mainHeader = document.getElementById('main-app-header');
    const mainElement = document.querySelector('main');
    if (viewId === 'view-landing') {
      if (mainHeader) mainHeader.classList.remove('hidden');
      if (mainElement) {
        mainElement.classList.add('pt-20');
        mainElement.classList.remove('pt-4');
      }
    } else {
      if (mainHeader) mainHeader.classList.add('hidden');
      if (mainElement) {
        mainElement.classList.remove('pt-20');
        mainElement.classList.add('pt-4');
      }
    }

    // Handle smooth in-page positioning for sub-dashboard routes
    if (['nearby-requests', 'dashboard/requests', 'donor-dashboard/requests', 'donor-requests', 'donor-requests-section'].includes(path)) {
      setTimeout(() => {
        const sec = document.getElementById('donor-requests-section');
        if (sec) {
          sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          sec.classList.add('transition-all', 'duration-500', 'ring-2', 'ring-primary/40', 'rounded-2xl');
          setTimeout(() => sec.classList.remove('ring-2', 'ring-primary/40'), 1800);
        }
      }, 70);
    } else if (['donation-history', 'donor-history', 'donor-history-section'].includes(path)) {
      setTimeout(() => {
        const sec = document.getElementById('donor-history-section');
        if (sec) {
          sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          sec.classList.add('transition-all', 'duration-500', 'ring-2', 'ring-primary/40', 'rounded-2xl');
          setTimeout(() => sec.classList.remove('ring-2', 'ring-primary/40'), 1800);
        }
      }, 70);
    } else {
      // Scroll smoothly to top for standard full page views
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // Update global top nav link active classes
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

    // Update donor dashboard sidebar item active states
    const donorNavItems = document.querySelectorAll('[data-donor-nav]');
    if (donorNavItems.length > 0) {
      donorNavItems.forEach(item => {
        const navKey = item.getAttribute('data-donor-nav');
        const isMatch = (navKey === 'requests' && ['nearby-requests', 'dashboard/requests', 'donor-dashboard/requests', 'donor-requests', 'donor-requests-section'].includes(path)) ||
                        (navKey === 'history' && ['donation-history', 'donor-history', 'donor-history-section'].includes(path)) ||
                        (navKey === 'dashboard' && path === 'donor-dashboard');
        
        if (isMatch) {
          item.classList.add('bg-surface-container', 'text-primary');
          item.classList.remove('text-on-surface-variant');
          if (!item.querySelector('.dot-active')) {
            const dot = document.createElement('span');
            dot.className = 'w-1.5 h-1.5 rounded-full bg-primary dot-active';
            item.appendChild(dot);
          }
        } else {
          item.classList.remove('bg-surface-container', 'text-primary');
          item.classList.add('text-on-surface-variant');
          const dot = item.querySelector('.dot-active');
          if (dot) dot.remove();
        }
      });
    }

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
