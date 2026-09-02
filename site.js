/* Shared engine: loads config.json, decides the active season out of
   spring / summer / autumn / winter, and applies the theme. Each page
   then calls its own render function with the loaded config + season. */

async function loadSiteConfig() {
  const res = await fetch('config.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not load config.json');
  return res.json();
}

function pad(n) { return String(n).padStart(2, '0'); }

function getSeason(config, now = new Date()) {
  const mmdd = `${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const entries = [
    ['spring', config.season.springStart],
    ['summer', config.season.summerStart],
    ['autumn', config.season.autumnStart],
    ['winter', config.season.winterStart],
  ].sort((a, b) => (a[1] < b[1] ? -1 : 1));

  // Default to the last season of the year (wraps around for dates
  // before the first configured start, e.g. January before springStart).
  let current = entries[entries.length - 1][0];
  for (const [name, start] of entries) {
    if (mmdd >= start) current = name;
    else break;
  }
  return current;
}

function applySeasonTheme(season) {
  document.documentElement.setAttribute('data-season', season);
}

function setActiveNav() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav.site-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === path) link.setAttribute('aria-current', 'page');
  });
}

function fillHeaderFooter(config) {
  document.querySelectorAll('[data-brand]').forEach(el => { el.textContent = config.business.name; });
  document.querySelectorAll('[data-phone]').forEach(el => {
    el.textContent = config.business.phone;
    if (el.tagName === 'A') el.href = `tel:${config.business.phone.replace(/[^\d+]/g, '')}`;
  });
  document.querySelectorAll('[data-email]').forEach(el => {
    el.textContent = config.business.email;
    if (el.tagName === 'A') el.href = `mailto:${config.business.email}`;
  });
  document.querySelectorAll('[data-address]').forEach(el => { el.textContent = config.business.address; });
  document.querySelectorAll('[data-hours]').forEach(el => { el.textContent = config.business.hours; });
}

/* A single HUD-ring frame (rotating dashed ring + corner ticks) wraps a
   season-specific circuit-style icon in the middle. Same frame every
   season; only the icon and the accent colors (via CSS vars) change. */
function heroArt(season) {
  const icons = {
    spring: `
      <g stroke="var(--accent)" stroke-width="2.5" fill="none" stroke-linecap="round">
        <path d="M160 220 L160 120"/>
        <path d="M160 170 C120 170, 100 140, 105 105"/>
        <path d="M160 145 C200 145, 220 118, 218 85"/>
        <circle cx="105" cy="102" r="5" fill="var(--accent)" stroke="none"/>
        <circle cx="218" cy="82" r="5" fill="var(--accent-2)" stroke="none"/>
        <circle cx="160" cy="222" r="5" fill="var(--accent-2)" stroke="none"/>
      </g>`,
    summer: `
      <g stroke="var(--accent)" stroke-width="2.5" fill="none" stroke-linecap="round">
        <circle cx="160" cy="160" r="34"/>
        <path d="M160 96 L160 76 M160 244 L160 224 M96 160 L76 160 M244 160 L224 160"/>
        <path d="M117 117 L102 102 M203 117 L218 102 M117 203 L102 218 M203 203 L218 218"/>
        <circle cx="160" cy="160" r="10" fill="var(--accent-2)" stroke="none"/>
      </g>`,
    autumn: `
      <g stroke="var(--accent)" stroke-width="2.5" fill="none" stroke-linecap="round">
        <path d="M100 220 C150 190, 165 140, 158 90"/>
        <path d="M158 120 C185 112, 205 96, 208 70"/>
        <path d="M150 165 C122 158, 100 142, 92 118"/>
        <circle cx="208" cy="68" r="5" fill="var(--accent)" stroke="none"/>
        <circle cx="90" cy="115" r="5" fill="var(--accent-2)" stroke="none"/>
        <circle cx="100" cy="222" r="5" fill="var(--accent-2)" stroke="none"/>
      </g>`,
    winter: `
      <g stroke="var(--accent)" stroke-width="2.5" fill="none" stroke-linecap="round">
        <path d="M160 110 L160 210 M118 130 L202 190 M202 130 L118 190"/>
        <path d="M160 110 L145 128 M160 110 L175 128"/>
        <path d="M160 210 L145 192 M160 210 L175 192"/>
        <circle cx="160" cy="160" r="6" fill="var(--accent-2)" stroke="none"/>
      </g>`,
  };

  return `
    <svg viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Rotating system status ring with a seasonal icon">
      <g class="hud-ring-rotate" style="transform-origin:160px 160px;">
        <circle cx="160" cy="160" r="140" stroke="var(--line)" stroke-width="1.5" stroke-dasharray="2 8"/>
      </g>
      <circle cx="160" cy="160" r="112" stroke="var(--accent)" stroke-width="1.5" opacity="0.5"/>
      <g stroke="var(--accent-2)" stroke-width="2">
        <path d="M160 20 L160 40 M160 280 L160 300 M20 160 L40 160 M280 160 L300 160"/>
      </g>
      ${icons[season]}
    </svg>`;
}

/* Initializes shared chrome (header/footer/nav/theme) and returns
   { config, season } so the page-specific script can render its content. */
async function initSite() {
  const config = await loadSiteConfig();
  const season = getSeason(config);
  applySeasonTheme(season);
  fillHeaderFooter(config);
  setActiveNav();
  return { config, season };
}
