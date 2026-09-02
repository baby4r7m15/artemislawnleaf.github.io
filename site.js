/* Shared engine: loads config.json, decides autumn vs winter, and applies
   the theme. Each page then calls its own render function with the
   loaded config + the active season. */

async function loadSiteConfig() {
  const res = await fetch('config.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not load config.json');
  return res.json();
}

function pad(n) { return String(n).padStart(2, '0'); }

function getSeason(config, now = new Date()) {
  const mmdd = `${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const { autumnStart, winterStart } = config.season;

  if (autumnStart < winterStart) {
    // normal case: autumn window sits before winter window in the same year
    return (mmdd >= autumnStart && mmdd < winterStart) ? 'autumn' : 'winter';
  }
  // fallback for an unusual config where winterStart < autumnStart
  return (mmdd >= autumnStart || mmdd < winterStart) ? 'autumn' : 'winter';
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

function heroArt(season) {
  if (season === 'autumn') {
    return `
      <svg viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Line illustration of a falling leaf branch">
        <path d="M60 260 C120 220, 140 160, 130 60" stroke="var(--ink-soft)" stroke-width="2.5" fill="none"/>
        <path d="M130 100 C160 90, 185 70, 190 40" stroke="var(--accent)" stroke-width="2.5" fill="none"/>
        <path d="M120 150 C90 140, 65 120, 55 95" stroke="var(--accent-2)" stroke-width="2.5" fill="none"/>
        <ellipse cx="190" cy="38" rx="18" ry="10" transform="rotate(-30 190 38)" fill="var(--accent)"/>
        <ellipse cx="55" cy="92" rx="16" ry="9" transform="rotate(35 55 92)" fill="var(--accent-2)"/>
        <ellipse cx="245" cy="150" rx="20" ry="11" transform="rotate(15 245 150)" fill="var(--accent)" opacity="0.85"/>
        <ellipse cx="260" cy="220" rx="15" ry="9" transform="rotate(-10 260 220)" fill="var(--ink-soft)" opacity="0.6"/>
        <circle cx="230" cy="270" r="3" fill="var(--accent-2)"/>
        <circle cx="90" cy="55" r="3" fill="var(--accent)"/>
      </svg>`;
  }
  return `
    <svg viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Line illustration of an evergreen branch with snow">
      <path d="M160 40 L160 280" stroke="var(--ink-soft)" stroke-width="2.5"/>
      <path d="M160 80 L110 60 M160 80 L210 60" stroke="var(--accent-2)" stroke-width="2.5"/>
      <path d="M160 130 L95 105 M160 130 L225 105" stroke="var(--accent-2)" stroke-width="2.5"/>
      <path d="M160 180 L85 155 M160 180 L235 155" stroke="var(--accent-2)" stroke-width="2.5"/>
      <path d="M160 230 L100 210 M160 230 L220 210" stroke="var(--accent-2)" stroke-width="2.5"/>
      <circle cx="70" cy="70" r="3" fill="var(--accent)"/>
      <circle cx="250" cy="120" r="3" fill="var(--accent)"/>
      <circle cx="90" cy="200" r="3" fill="var(--accent)"/>
      <circle cx="230" cy="230" r="3" fill="var(--accent)"/>
      <circle cx="160" cy="260" r="3" fill="var(--accent)"/>
    </svg>`;
}

/* Initializes shared chrome (header/footer/nav/theme) and returns
   { config, season } so the page-specific script can render its content. */
async function initSite() {
  const config = await loadSiteConfig();
  const season = getSeason(config);
  applySeasonTheme(season);
  fillHeaderFooter(config);
  fillSeasonTag(season);
  setActiveNav();
  return { config, season };
}
