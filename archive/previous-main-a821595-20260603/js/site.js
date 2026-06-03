const nav = document.getElementById('nav');
const toggle = document.querySelector('[data-menu-toggle]');
const links = document.querySelector('[data-nav-links]');
const page = document.body.dataset.page || 'home';
const cleanPages = new Set(['hardware', 'use-cases', 'competitions', 'team', 'developers', 'pilot', 'platform', 'company']);
const pathSegments = window.location.pathname.split('/').filter(Boolean);
const lastSegment = pathSegments[pathSegments.length - 1] || '';
const parentSegment = pathSegments[pathSegments.length - 2] || '';
const rootPrefix = cleanPages.has(lastSegment) || (lastSegment === 'index.html' && cleanPages.has(parentSegment)) ? '../' : '';

const dockItems = [
  { page: 'home', href: `${rootPrefix}#top`, label: 'Home', icon: '<path d="M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4v-9.5Z"/>' },
  { page: 'hardware', href: `${rootPrefix}hardware/`, label: 'Hardware', icon: '<path d="M6 8h12v8H6z"/><path d="M9 5v3M15 5v3M9 16v3M15 16v3M3 11h3M18 11h3"/>' },
  { page: 'use-cases', href: `${rootPrefix}use-cases/`, label: 'Use', icon: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 5v3M19 12h-3M12 19v-3M5 12h3"/>' },
  { page: 'pilot', href: `${rootPrefix}pilot/`, label: 'Pilot', icon: '<path d="M5 12h4l2-6 3 12 2-6h3"/>' },
];

function updateNavState() {
  nav?.classList.toggle('scrolled', window.scrollY > 40);
}

function closeMenu() {
  document.body.classList.remove('menu-open');
  toggle?.setAttribute('aria-expanded', 'false');
}

window.addEventListener('scroll', updateNavState, { passive: true });
updateNavState();

toggle?.addEventListener('click', () => {
  const open = !document.body.classList.contains('menu-open');
  document.body.classList.toggle('menu-open', open);
  toggle.setAttribute('aria-expanded', String(open));
});

links?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMenu);
});

const mobileDock = document.createElement('nav');
mobileDock.className = 'mobile-dock';
mobileDock.setAttribute('aria-label', 'Mobile quick navigation');
mobileDock.innerHTML = dockItems.map((item) => `
  <a href="${item.href}" ${item.page === page ? 'class="active" aria-current="page"' : ''}>
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">${item.icon}</svg>
    <span>${item.label}</span>
  </a>
`).join('');
document.body.appendChild(mobileDock);

const configsSection = document.getElementById('configs');
if (configsSection && configsSection.querySelector('[data-config]')) {
  let configsLoaded = false;
  const loadConfigs = () => {
    if (configsLoaded) return;
    configsLoaded = true;
    import('./configs.js?v=27').catch((error) => {
      console.error('Could not load configuration previews', error);
    });
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      loadConfigs();
    }, { rootMargin: '700px 0px' });
    observer.observe(configsSection);
  } else {
    window.addEventListener('scroll', loadConfigs, { once: true, passive: true });
  }
}

const configStudio = document.querySelector('[data-config-studio]');
if (configStudio) {
  const tabs = [...configStudio.querySelectorAll('[data-config-tab]')];
  const panels = [...configStudio.querySelectorAll('[data-config-panel]')];
  const visuals = [...configStudio.querySelectorAll('[data-config], [data-config-visual]')];
  const readout = configStudio.querySelector('[data-studio-title]');

  const setActiveConfig = (key) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.configTab === key;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      if (active && readout) readout.textContent = tab.textContent.trim();
    });
    panels.forEach((panel) => panel.classList.toggle('is-active', panel.dataset.configPanel === key));
    visuals.forEach((visual) => {
      const visualKey = visual.dataset.config || visual.dataset.configVisual;
      visual.classList.toggle('is-active', visualKey === key);
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => setActiveConfig(tab.dataset.configTab));
  });
}

document.querySelectorAll('[data-youtube-id]').forEach((button) => {
  button.addEventListener('click', () => {
    const id = button.dataset.youtubeId;
    const title = button.dataset.youtubeTitle || 'OpenPulse pitch video';
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1`;
    iframe.title = title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    button.replaceWith(iframe);
  }, { once: true });
});
