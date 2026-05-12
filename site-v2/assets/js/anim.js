// =========================================================
// Toyooka Kensetsu — site-v2 advanced scroll animations
// GSAP + ScrollTrigger + Lenis
// =========================================================
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  // Respect prefers-reduced-motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    return;
  }

  // ---------- Lenis smooth scroll ----------
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // ---------- Helpers ----------
  function splitWords(el) {
    if (!el || el.dataset.split === 'done') return el.querySelectorAll('.word');
    const html = el.innerHTML;
    // Walk text nodes only — preserve <br> and inline tags
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const text = node.nodeValue;
      const frag = document.createDocumentFragment();
      // Split by character for JP, by word for non-JP (mixed handled by char split with whitespace preserved)
      const re = /(\s+|[、。「」『』（）()！？!?ー－—])/;
      const parts = text.split(re).filter(p => p !== '');
      parts.forEach(p => {
        if (/^\s+$/.test(p)) {
          frag.appendChild(document.createTextNode(p));
        } else {
          const span = document.createElement('span');
          span.className = 'word';
          span.textContent = p;
          frag.appendChild(span);
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
    el.dataset.split = 'done';
    return el.querySelectorAll('.word');
  }

  // ---------- HERO pin sequence ----------
  // Wait until the initial intro animation has had a chance to play once,
  // then pin the hero and let scroll drive the rest.
  const hero = document.querySelector('.hero');
  if (hero) {
    const heroSvgStrokes = hero.querySelector('.hero__svg .strokes');
    const heroDims = hero.querySelector('.hero__svg .dims-group');
    const heroPhoto = hero.querySelector('.hero__photo');
    const heroTint = hero.querySelector('.hero__tint');
    const heroTitle = hero.querySelector('.hero__title-wrap');
    const heroCaptionB = hero.querySelector('.hero__caption-b');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: '+=120%',
        pin: true,
        pinSpacing: true,
        scrub: 0.8,
        anticipatePin: 1,
      },
    });

    // Phase 1 — photo de-tints, strokes recede
    if (heroPhoto) tl.to(heroPhoto, { filter: 'saturate(1) contrast(1.05) brightness(1) hue-rotate(0deg)' }, 0);
    if (heroTint)  tl.to(heroTint, { opacity: 0.15 }, 0);
    if (heroSvgStrokes) tl.to(heroSvgStrokes, { opacity: 0.35 }, 0);

    // Phase 2 — title moves up & fades, caption B fades in
    if (heroTitle) tl.to(heroTitle, { y: -80, opacity: 0 }, 0.4);
    if (heroCaptionB) tl.fromTo(heroCaptionB, { opacity: 0, y: 80 }, { opacity: 1, y: 0 }, 0.55);

    // Phase 3 — caption B fades, photo zooms slightly
    if (heroPhoto) tl.to(heroPhoto, { scale: 1.08 }, 0.8);
    if (heroCaptionB) tl.to(heroCaptionB, { opacity: 0, y: -40 }, 0.95);
    if (heroDims) tl.to(heroDims, { opacity: 0 }, 0.6);
  }

  // ---------- Section heads — dim-mark + title stroke reveal + word fade ----------
  gsap.utils.toArray('[data-anim="head"]').forEach(head => {
    const eyebrow = head.querySelector('.craft__eyebrow');
    const title = head.querySelector('.craft__title');
    const lead = head.querySelector('.section-head__lead, .lead');
    const dimMark = head.querySelector('.dim-mark');

    const tl = gsap.timeline({
      scrollTrigger: { trigger: head, start: 'top 78%', toggleActions: 'play none none reverse' }
    });
    if (dimMark) {
      tl.from(dimMark.querySelectorAll('.dim-mark__line'), {
        scaleX: 0, transformOrigin: 'inside', duration: 0.7, ease: 'power3.out', stagger: 0.05
      }, 0);
      tl.from(dimMark.querySelectorAll('.dim-mark__num, .dim-mark__cap'), {
        opacity: 0, duration: 0.4
      }, 0.4);
    }
    if (eyebrow) tl.from(eyebrow, { opacity: 0, x: -16, duration: 0.5 }, 0.2);
    if (title) {
      const spans = title.querySelectorAll('span');
      tl.from(spans, {
        opacity: 0, y: 26, duration: 0.7, stagger: 0.08, ease: 'power3.out'
      }, 0.35);
    }
    if (lead) {
      const words = splitWords(lead);
      tl.from(words, {
        opacity: 0, y: 10, duration: 0.4, stagger: 0.012, ease: 'power2.out'
      }, 0.55);
    }
  });

  // ---------- Parallax — grid + decoration ----------
  gsap.utils.toArray('[data-parallax]').forEach(el => {
    const speed = parseFloat(el.dataset.parallax) || 0.2;
    gsap.fromTo(el,
      { y: () => window.innerHeight * speed * -0.3 },
      {
        y: () => window.innerHeight * speed * 0.6,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
      }
    );
  });

  // ---------- Stats count-up ----------
  gsap.utils.toArray('.stat').forEach(stat => {
    const num = stat.querySelector('.stat__num');
    if (!num) return;
    const target = parseFloat(stat.dataset.target || '0');
    const suffix = stat.dataset.suffix || '';
    const decimals = parseInt(stat.dataset.decimals || '0', 10);
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 2.2,
      ease: 'power3.out',
      scrollTrigger: { trigger: stat, start: 'top 80%', toggleActions: 'play none none reverse' },
      onUpdate() {
        num.textContent = obj.v.toFixed(decimals) + suffix;
      },
      onComplete() {
        num.textContent = target.toFixed(decimals) + suffix;
      }
    });
    // strike-through dimension under each
    const dim = stat.querySelector('.stat__dim');
    if (dim) {
      gsap.from(dim, {
        scaleX: 0, transformOrigin: 'left', duration: 1.4, ease: 'power3.out',
        scrollTrigger: { trigger: stat, start: 'top 80%' }
      });
    }
  });

  // ---------- Horizontal scroll — Featured Works ----------
  const featPin = document.querySelector('.featured__pin');
  const featTrack = document.querySelector('.featured__track');
  if (featPin && featTrack) {
    const getDist = () => Math.max(0, featTrack.scrollWidth - window.innerWidth + 48);
    const featTween = gsap.to(featTrack, {
      x: () => -getDist(),
      ease: 'none',
      scrollTrigger: {
        trigger: featPin,
        pin: true,
        start: 'top top',
        end: () => '+=' + getDist(),
        scrub: 0.6,
        invalidateOnRefresh: true,
      }
    });
    // each card tilts slightly as it moves through center
    gsap.utils.toArray('.featured-card').forEach((card, i) => {
      gsap.from(card, {
        rotation: (i % 2 === 0) ? -2 : 2,
        y: 30,
        opacity: 0.55,
        ease: 'none',
        scrollTrigger: {
          trigger: card,
          containerAnimation: featTween,
          start: 'left 95%',
          end: 'left 35%',
          scrub: true,
        }
      });
    });
  }

  // ---------- Timeline since 1962 ----------
  const tlTrack = document.querySelector('.timeline__track');
  if (tlTrack) {
    const line = tlTrack.querySelector('.timeline__line');
    if (line) {
      gsap.from(line, {
        scaleY: 0, transformOrigin: 'top',
        ease: 'none',
        scrollTrigger: {
          trigger: tlTrack,
          start: 'top 65%',
          end: 'bottom 75%',
          scrub: 0.6,
        }
      });
    }
    gsap.utils.toArray('.timeline__item').forEach((item, i) => {
      const dot = item.querySelector('.timeline__dot');
      const card = item.querySelector('.timeline__card');
      const year = item.querySelector('.timeline__year');
      gsap.timeline({
        scrollTrigger: { trigger: item, start: 'top 78%', toggleActions: 'play none none reverse' }
      })
      .from(dot, { scale: 0, duration: 0.4, ease: 'back.out(2)' }, 0)
      .from(year, { opacity: 0, x: -20, duration: 0.5 }, 0.05)
      .from(card, { opacity: 0, x: (i % 2 === 0) ? 30 : -30, duration: 0.6, ease: 'power3.out' }, 0.05);
    });
  }

  // ---------- Generic reveal — for legacy .reveal usage ----------
  gsap.utils.toArray('.reveal').forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => el.classList.add('is-visible')
    });
  });

  // ---------- Card hover tilt on craft cards ----------
  gsap.utils.toArray('.craft-card, .featured-card').forEach(card => {
    const img = card.querySelector('img');
    card.addEventListener('mouseenter', () => {
      gsap.to(card, { y: -6, rotate: 0.4, duration: 0.4, ease: 'power2.out' });
      if (img) gsap.to(img, { scale: 1.06, duration: 0.8, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { y: 0, rotate: 0, duration: 0.5, ease: 'power3.out' });
      if (img) gsap.to(img, { scale: 1, duration: 0.6, ease: 'power3.out' });
    });
  });

  // ---------- PAGE-SPECIFIC ----------

  // Scroll progress bar (top of page, projects)
  const progress = document.querySelector('.scroll-progress');
  if (progress) {
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: self => {
        progress.style.setProperty('--p', (self.progress * 100).toFixed(2) + '%');
      }
    });
  }

  // Projects TOC — highlight active section
  const tocLinks = document.querySelectorAll('[data-toc] a');
  if (tocLinks.length) {
    tocLinks.forEach(a => {
      const id = a.getAttribute('href');
      if (!id || !id.startsWith('#')) return;
      const target = document.querySelector(id);
      if (!target) return;
      ScrollTrigger.create({
        trigger: target,
        start: 'top 30%',
        end: 'bottom 30%',
        onToggle: self => a.classList.toggle('is-active', self.isActive),
      });
    });
  }

  // Company colophon rows — stagger fade in
  const colophon = document.querySelector('.colophon');
  if (colophon) {
    gsap.from(colophon.querySelectorAll('.colophon__row'), {
      opacity: 0, x: -16, duration: 0.5, stagger: 0.06,
      scrollTrigger: { trigger: colophon, start: 'top 80%' }
    });
  }

  // About: csr cards — kanji float in
  gsap.utils.toArray('.csr-card').forEach((card, i) => {
    const kanji = card.querySelector('.csr-card__kanji');
    gsap.from(card, {
      y: 30, opacity: 0, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 82%' }
    });
    if (kanji) {
      gsap.from(kanji, {
        scale: 0.7, opacity: 0, duration: 1.2, ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 82%' }
      });
    }
  });

  // About: SDGs items — stagger in
  const sdgsList = document.querySelector('.sdgs-list');
  if (sdgsList) {
    gsap.from(sdgsList.querySelectorAll('.sdgs-item'), {
      opacity: 0, y: 14, duration: 0.5, stagger: 0.05,
      scrollTrigger: { trigger: sdgsList, start: 'top 82%' }
    });
  }

  // History timeline (about) — apply `.history` class so styling adapts to paper bg
  document.querySelectorAll('.timeline-section + .timeline-section .timeline__track, .section:not(.section--dark) .timeline__track').forEach(t => t.classList.add('history'));

  // Projects: card hover lift (in addition to existing handler)
  gsap.utils.toArray('.proj-card').forEach(card => {
    const img = card.querySelector('img');
    card.addEventListener('mouseenter', () => {
      gsap.to(card, { y: -4, duration: 0.4, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { y: 0, duration: 0.5, ease: 'power3.out' });
    });
  });

  // refresh after fonts load to avoid mis-pinning
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
