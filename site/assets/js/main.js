// Mark JS as loaded — enables reveal animations
document.documentElement.classList.add('js');

// Mobile menu
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', nav.classList.contains('is-open'));
  });
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => nav.classList.remove('is-open'));
  });
}

// Reveal on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Header scroll state — pill background appears past threshold
const SCROLL_THRESHOLD = 80;
const updateScrollState = () => {
  document.documentElement.classList.toggle('is-scrolled', window.scrollY > SCROLL_THRESHOLD);
};
updateScrollState();
window.addEventListener('scroll', updateScrollState, { passive: true });

// Hero overlap state (SP) — toggle white logo / white hamburger over hero,
// switch to white bar header after scrolling past hero
const heroEl = document.querySelector('.hero');
if (heroEl) {
  const updateHeroState = () => {
    const rect = heroEl.getBoundingClientRect();
    const HEADER_PASS = 60;
    const overHero = rect.bottom > HEADER_PASS;
    document.documentElement.classList.toggle('is-over-hero', overHero);
    document.documentElement.classList.toggle('is-past-hero', !overHero);
  };
  updateHeroState();
  window.addEventListener('scroll', updateHeroState, { passive: true });
  window.addEventListener('resize', updateHeroState, { passive: true });
}

// Craft category filter + paged carousel (top page)
const filterCats = document.querySelectorAll('[data-filter-cats] [data-filter]');
const filterGrid = document.querySelector('[data-filter-grid]');
if (filterCats.length && filterGrid) {
  const allCards = Array.from(filterGrid.querySelectorAll('.craft-card[data-cat]'));
  const defaultCards = allCards.filter(c => c.hasAttribute('data-default'));
  const empty = filterGrid.querySelector('[data-filter-empty]');
  const emptyLink = filterGrid.querySelector('[data-filter-empty-link]');
  const navEl = document.querySelector('[data-filter-nav]');
  const prevBtn = navEl?.querySelector('[data-filter-prev]');
  const nextBtn = navEl?.querySelector('[data-filter-next]');
  const pageEl = navEl?.querySelector('[data-filter-page]');
  const PAGE_SIZE = 4;
  const state = { filter: null, page: 0 };

  const getPool = () => state.filter
    ? allCards.filter(c => c.dataset.cat === state.filter)
    : defaultCards;

  const render = () => {
    const pool = getPool();
    const totalPages = Math.max(1, Math.ceil(pool.length / PAGE_SIZE));
    if (state.page >= totalPages) state.page = 0;
    const start = state.page * PAGE_SIZE;
    const visible = new Set(pool.slice(start, start + PAGE_SIZE));
    allCards.forEach(c => c.classList.toggle('is-hidden', !visible.has(c)));
    if (empty) {
      empty.hidden = pool.length > 0;
      if (emptyLink && state.filter) emptyLink.href = `projects.html#${state.filter}`;
    }
    if (navEl) {
      const showNav = pool.length > PAGE_SIZE;
      navEl.hidden = !showNav;
      if (showNav) {
        if (pageEl) pageEl.textContent = `${state.page + 1} / ${totalPages}`;
        if (prevBtn) prevBtn.disabled = state.page === 0;
        if (nextBtn) nextBtn.disabled = state.page >= totalPages - 1;
      }
    }
  };

  filterCats.forEach(cat => {
    cat.addEventListener('click', (e) => {
      e.preventDefault();
      const target = cat.dataset.filter;
      const wasActive = cat.classList.contains('is-active');
      if (wasActive) {
        filterCats.forEach(c => c.classList.remove('is-active'));
        state.filter = null;
      } else {
        filterCats.forEach(c => c.classList.toggle('is-active', c === cat));
        state.filter = target;
      }
      state.page = 0;
      render();
    });
  });

  prevBtn?.addEventListener('click', () => {
    if (state.page > 0) { state.page--; render(); }
  });
  nextBtn?.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(getPool().length / PAGE_SIZE));
    if (state.page < totalPages - 1) { state.page++; render(); }
  });

  render();
}

// Contact form (company.html) — graceful submit until backend is wired
const contactForm = document.querySelector('[data-contact-form]');
if (contactForm) {
  const status = contactForm.querySelector('[data-contact-status]');
  contactForm.addEventListener('submit', (e) => {
    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      e.preventDefault();
      return;
    }
    if (!contactForm.action) {
      e.preventDefault();
      if (status) {
        status.hidden = false;
        status.classList.remove('is-error');
        status.classList.add('is-success');
        status.textContent = 'お問い合わせフォームの送信先は現在準備中です。お急ぎの方はお電話（0965-32-1100）でご連絡ください。';
      }
    }
  });
}
