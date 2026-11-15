/* TRIMAP / Multi-page interactions. Deliberately no GSAP dependency.
   Preserves the original lightweight tech Canvas animation below. */
(() => {
  'use strict';
  const root = document.documentElement;
  const loader = document.getElementById('pageLoader');
  const start = performance.now();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let finished = false;
  function enterSite() {
    if (finished) return;
    finished = true;
    // Prepare text only once: initial hidden state is already present in CSS.
    root.classList.add('site-ready');
    if (loader) {
      loader.classList.add('loaded');
      setTimeout(() => loader.remove(), reduced ? 100 : 800);
    }
  }
  function scheduleEntry() {
    const remaining = Math.max(0, (reduced ? 100 : 1400) - (performance.now() - start));
    setTimeout(enterSite, remaining);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleEntry, { once: true });
  } else scheduleEntry();
  // Loading a slow external resource must not trap the visitor under the loader.
  setTimeout(enterSite, 3200);

  const header = document.querySelector('.site-header');
  const nav = document.querySelector('.nav');
  const menuToggle = document.querySelector('.menu-toggle');
  const progress = document.querySelector('#scrollProgress');
  const process = document.querySelector('.process-grid');
  let ticking = false;
  function updateScrollUI() {
    if (header) header.classList.toggle('scrolled', scrollY > 15);
    const pageTravel = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${pageTravel > 0 ? Math.max(0, Math.min(1, scrollY / pageTravel)) : 0})`;
    if (process) {
      const r = process.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (innerHeight * .78 - r.top) / (r.height || 1)));
      process.style.setProperty('--process-progress', p);
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(updateScrollUI) }
  }, { passive: true });
  window.addEventListener('resize', updateScrollUI, { passive: true });
  updateScrollUI();

  // TRIMAP — Menu laterale mobile: drawer indipendente dalla navbar desktop.
  // Usa gli stessi collegamenti del menu originale, senza duplicare HTML tra le pagine.
  if (menuToggle && nav) {
    const mobileBreakpoint = window.matchMedia('(max-width: 900px)');
    const backdrop = document.createElement('div');
    backdrop.className = 'trimap-menu-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');

    const drawer = document.createElement('aside');
    drawer.className = 'trimap-menu-drawer';
    drawer.id = 'trimapMobileDrawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'Menu di navigazione TRIMAP');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.inert = true;

    const drawerHeader = document.createElement('div');
    drawerHeader.className = 'trimap-drawer-head';
    drawerHeader.innerHTML = '<span class="trimap-drawer-kicker">TRIMAP <i></i> MENU</span>';

    const drawerClose = document.createElement('button');
    drawerClose.type = 'button';
    drawerClose.className = 'trimap-drawer-close';
    drawerClose.setAttribute('aria-label', 'Chiudi menu');
    drawerClose.innerHTML = '<span aria-hidden="true"></span><span aria-hidden="true"></span>';
    drawerHeader.appendChild(drawerClose);

    const drawerNav = document.createElement('nav');
    drawerNav.className = 'trimap-drawer-nav';
    drawerNav.setAttribute('aria-label', 'Navigazione mobile');
    const originalLinks = [...nav.querySelectorAll('a')];
    originalLinks.forEach((link, index) => {
      const mobileLink = link.cloneNode(true);
      mobileLink.classList.add('trimap-drawer-link');
      mobileLink.style.setProperty('--link-order', index);
      drawerNav.appendChild(mobileLink);
    });

    const drawerFooter = document.createElement('div');
    drawerFooter.className = 'trimap-drawer-footer';
    drawerFooter.innerHTML = '<span>YOUR BUSINESS.</span><strong>OUR TECHNOLOGY.</strong><small>TRIMAP / DIGITAL SOLUTIONS</small>';

    drawer.append(drawerHeader, drawerNav, drawerFooter);
    document.body.append(backdrop, drawer);
    menuToggle.setAttribute('aria-controls', drawer.id);

    // iOS Safari: un gesto orizzontale sul drawer poteva spostare
    // l'intero pannello fuori viewport e farlo rimbalzare in posizione.
    // Il menu può continuare a scorrere verticalmente se necessario.
    let touchOriginX = 0;
    let touchOriginY = 0;
    drawer.addEventListener('touchstart', (event) => {
      if (!event.touches.length) return;
      touchOriginX = event.touches[0].clientX;
      touchOriginY = event.touches[0].clientY;
    }, { passive: true });
    drawer.addEventListener('touchmove', (event) => {
      if (!isMenuOpen || !event.touches.length || !event.cancelable) return;
      const dx = event.touches[0].clientX - touchOriginX;
      const dy = event.touches[0].clientY - touchOriginY;
      if (Math.abs(dx) > 9 && Math.abs(dx) > Math.abs(dy) * 1.15) {
        event.preventDefault();
      }
    }, { passive: false });
    backdrop.addEventListener('touchmove', (event) => {
      if (isMenuOpen && event.cancelable) event.preventDefault();
    }, { passive: false });

    let isMenuOpen = false;
    let restoreFocus = null;
    function closeMenu(refocus = false) {
      if (!isMenuOpen) return;
      isMenuOpen = false;
      root.classList.remove('trimap-menu-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Apri menu');
      drawer.setAttribute('aria-hidden', 'true');
      drawer.inert = true;
      if (refocus && restoreFocus && typeof restoreFocus.focus === 'function') {
        restoreFocus.focus({ preventScroll: true });
      }
    }
    function openMenu() {
      if (isMenuOpen || !mobileBreakpoint.matches) return;
      restoreFocus = document.activeElement;
      isMenuOpen = true;
      drawer.inert = false;
      drawer.setAttribute('aria-hidden', 'false');
      root.classList.add('trimap-menu-open');
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', 'Chiudi menu');
      drawerClose.focus({ preventScroll: true });
    }

    menuToggle.addEventListener('click', () => {
      if (isMenuOpen) closeMenu(true);
      else openMenu();
    });
    drawerClose.addEventListener('click', () => closeMenu(true));
    backdrop.addEventListener('click', () => closeMenu(true));
    drawerNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => closeMenu());
    });
    document.addEventListener('keydown', event => {
      if (!isMenuOpen) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu(true);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...drawer.querySelectorAll('a[href],button:not([disabled])')];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    // Se il telefono ruota e passa a layout desktop, chiude la tendina.
    window.addEventListener('resize', () => {
      if (isMenuOpen && !mobileBreakpoint.matches) closeMenu();
    }, { passive: true });
  }

  const reveals = [...document.querySelectorAll('.reveal')];
  if (!('IntersectionObserver' in window) || reduced) {
    reveals.forEach(x => x.classList.add('visible'));
  } else {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) }
    }), { threshold: .075, rootMargin: '0px 0px 45px 0px' });
    reveals.forEach(el => io.observe(el));
  }
  document.querySelectorAll('.year').forEach(el => el.textContent = new Date().getFullYear());

  // Multi-page navigation, including links to anchors on other pages, uses native links.
  // Cross-page contact forms share the original Formspree endpoint.
  for (const form of document.querySelectorAll('form[data-contact-form]')) {
    const button = form.querySelector('button[type=submit]');
    const status = form.querySelector('.form-status');
    const buttonHTML = button?.innerHTML || 'Invia richiesta';
    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      if (!form.reportValidity()) return;
      if (button) { button.disabled = true; button.textContent = 'Invio in corso...' }
      if (status) { status.className = 'form-status'; status.textContent = '' }
      try {
        const r = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error('Formspree HTTP ' + r.status);
        form.reset();
        if (status) { status.className = 'form-status success'; status.textContent = 'Richiesta inviata correttamente. Grazie, ti risponderemo utilizzando i recapiti indicati.' }
      } catch (err) {
        if (status) { status.className = 'form-status error'; status.textContent = 'Invio non riuscito. Riprova oppure scrivi a contact.trimap@gmail.com.' }
      } finally {
        if (button) { button.disabled = false; button.innerHTML = buttonHTML }
      }
    });
  }

  // Siti Web: pricing CTAs select the package and request type in the form.
  // Native #preventivo navigation stays functional even if JS is disabled.
  if (document.body.dataset.page === 'web') {
    const packageSelect = document.getElementById('sitePackage');
    const requestTypeSelect = document.getElementById('siteRequestType');
    if (packageSelect) {
      document.querySelectorAll('a[data-site-package]').forEach(link => {
        link.addEventListener('click', () => {
          const selected = link.dataset.sitePackage;
          if ([...packageSelect.options].some(option => option.value === selected)) {
            packageSelect.value = selected;
            if (requestTypeSelect) {
              requestTypeSelect.value = link.dataset.siteRequest || 'Preventivo';
            }
            packageSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      });
    }
  }

  // Pricing cards: no preselected offer. Hover/focus highlights on desktop;
  // on touch, tapping a card highlights it without opening a link unexpectedly.
  if (document.body.dataset.page === 'web') {
    const cards = [...document.querySelectorAll('#pacchetti .pricing-card')];
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(other => other.classList.toggle('is-selected', other === card));
      });
      card.addEventListener('keydown', event => {
        if (event.target === card && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          cards.forEach(other => other.classList.toggle('is-selected', other === card));
        }
      });
    });
    document.addEventListener('pointerdown', event => {
      if (!event.target.closest('#pacchetti .pricing-card')) {
        cards.forEach(card => card.classList.remove('is-selected'));
      }
    }, { passive: true });
  }

  // Lightweight on-hover spotlight without moving the cards or fighting reveal transforms.
  if (matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.solution-wide,.mini-service,.sector-card,.catalog-card,.pricing-card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--px', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--py', ((e.clientY - r.top) / r.height * 100) + '%');
      }, { passive: true });
    });
  }
})();

/* =====================================================
   TRIMAP — PROCEDURAL TECH HERO V2
   30 FPS cap, DPR cap, paused off-screen/tab hidden.
===================================================== */
(() => {
  const canvas = document.getElementById("heroCanvas");
  const hero = document.querySelector(".hero");
  if (!canvas || !hero) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  let w = 0;
  let h = 0;
  let dpr = 1;
  let nodes = [];
  let stars = [];
  const isHome = document.body.dataset.page === "home";
  let raf = 0;
  let running = true;
  let lastFrame = 0;
  let time = 0;

  const mouse = { x: .74, y: .44, tx: .74, ty: .44 };

  const isMobile = () => window.innerWidth <= 620;
  const nodeCount = () => isHome ? (isMobile() ? 39 : 78) : (isMobile() ? 28 : 66);
  const maxLinkDistance = () => isMobile() ? 112 : 158;

  function makeNode(i) {
    const rightBias = Math.pow(Math.random(), .48);
    return {
      x: w * (.32 + rightBias * .73),
      y: Math.random() * h,
      ox: 0,
      oy: 0,
      vx: (Math.random() - .5) * .055,
      vy: (Math.random() - .5) * .055,
      r: .55 + Math.random() * 1.3,
      a: .26 + Math.random() * .56,
      phase: Math.random() * Math.PI * 2,
      drift: 8 + Math.random() * 18,
      band: i % 3
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = Math.max(1, rect.width);
    h = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, isMobile() ? 1.15 : 1.4);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    nodes = Array.from({ length: nodeCount() }, (_, i) => makeNode(i));
    // A fine, evenly distributed starfield behind the centered title on the Home.
    stars = isHome ? Array.from({ length: isMobile() ? 86 : 190 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: .35 + Math.random() * .9,
      opacity: .20 + Math.random() * .43,
      phase: Math.random() * Math.PI * 2
    })) : [];
    draw(0);
  }

  function drawRibbon(baseY, amp, speed, phase, alpha, thickness) {
    const points = 70;
    const startX = w * .43;
    const endX = w * 1.05;

    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const p = i / points;
      const x = startX + (endX - startX) * p;
      const perspective = .35 + p * .92;
      const y = baseY
        + Math.sin(p * 8.2 + time * speed + phase) * amp * perspective
        + Math.sin(p * 3.1 - time * speed * .45 + phase) * amp * .28;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    const grad = ctx.createLinearGradient(startX, 0, endX, 0);
    grad.addColorStop(0, "rgba(110,231,200,0)");
    grad.addColorStop(.22, `rgba(110,231,200,${alpha * .48})`);
    grad.addColorStop(.62, `rgba(119,198,255,${alpha})`);
    grad.addColorStop(1, "rgba(159,223,255,0)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = thickness;
    ctx.stroke();
  }

  function drawPerspectiveGrid() {
    const horizonY = h * .58;
    const originX = w * .78 + (mouse.x - .5) * 24;
    const bottomY = h * 1.06;

    ctx.save();
    ctx.globalAlpha = .14;
    ctx.lineWidth = .6;

    for (let i = -9; i <= 9; i++) {
      const bx = originX + i * (w * .075);
      const g = ctx.createLinearGradient(originX, horizonY, bx, bottomY);
      g.addColorStop(0, "rgba(110,231,200,0)");
      g.addColorStop(.22, "rgba(110,231,200,.16)");
      g.addColorStop(1, "rgba(107,184,255,.045)");
      ctx.strokeStyle = g;
      ctx.beginPath();
      ctx.moveTo(originX, horizonY);
      ctx.lineTo(bx, bottomY);
      ctx.stroke();
    }

    for (let j = 0; j < 10; j++) {
      const p = j / 9;
      const eased = p * p;
      const y = horizonY + eased * (bottomY - horizonY);
      const half = (w * .055) + eased * w * .53;
      ctx.strokeStyle = `rgba(124,218,242,${.035 + p * .05})`;
      ctx.beginPath();
      ctx.moveTo(originX - half, y);
      ctx.lineTo(originX + half, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawOrbit() {
    const cx = w * (.79 + (mouse.x - .5) * .015);
    const cy = h * (.40 + (mouse.y - .5) * .02);
    const rx = Math.min(w, h) * .245;
    const ry = rx * .34;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-.32);

    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * (1 + i * .17), ry * (1 + i * .19), 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(137,224,255,${.055 - i * .012})`;
      ctx.lineWidth = i === 0 ? 1.05 : .65;
      ctx.stroke();
    }

    const pulseAngle = time * .28;
    const px = Math.cos(pulseAngle) * rx;
    const py = Math.sin(pulseAngle) * ry;
    const rg = ctx.createRadialGradient(px, py, 0, px, py, 13);
    rg.addColorStop(0, "rgba(240,255,255,.9)");
    rg.addColorStop(.25, "rgba(110,231,200,.55)");
    rg.addColorStop(1, "rgba(110,231,200,0)");
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(px, py, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function updateNodes(dt) {
    const px = (mouse.x - .5) * 9;
    const py = (mouse.y - .5) * 7;

    nodes.forEach((n, i) => {
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      n.ox = Math.sin(time * (.16 + n.band * .025) + n.phase) * n.drift + px * (n.band + 1) * .26;
      n.oy = Math.cos(time * (.13 + n.band * .018) + n.phase) * n.drift * .58 + py * .32;

      if (n.x > w + 25) n.x = w * .31;
      if (n.x < w * .27) n.x = w + 20;
      if (n.y > h + 20) n.y = -20;
      if (n.y < -20) n.y = h + 20;
    });
  }

  function drawNetwork() {
    const distLimit = maxLinkDistance();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      const ax = a.x + a.ox;
      const ay = a.y + a.oy;

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const bx = b.x + b.ox;
        const by = b.y + b.oy;
        const dx = ax - bx;
        const dy = ay - by;
        const d2 = dx * dx + dy * dy;

        if (d2 < distLimit * distLimit) {
          const d = Math.sqrt(d2);
          const strength = (1 - d / distLimit) * .17;
          const grad = ctx.createLinearGradient(ax, ay, bx, by);
          grad.addColorStop(0, `rgba(110,231,200,${strength})`);
          grad.addColorStop(1, `rgba(110,185,255,${strength * .86})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = .62;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();

          // Rare moving data packet on a connection
          if (((i * 13 + j * 7) % 41) === 0) {
            const u = (time * .08 + (i + j) * .071) % 1;
            const px = ax + (bx - ax) * u;
            const py = ay + (by - ay) * u;
            ctx.fillStyle = `rgba(221,255,250,${strength * 2.1})`;
            ctx.beginPath();
            ctx.arc(px, py, 1.25, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    for (const n of nodes) {
      const x = n.x + n.ox;
      const y = n.y + n.oy;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 8 + n.r * 3);
      glow.addColorStop(0, `rgba(238,255,253,${n.a})`);
      glow.addColorStop(.18, `rgba(110,231,200,${n.a * .48})`);
      glow.addColorStop(1, "rgba(87,168,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 8 + n.r * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(235,253,255,${Math.min(.86, n.a + .18)})`;
      ctx.beginPath();
      ctx.arc(x, y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawStarfield() {
    if (!stars.length) return;
    ctx.save();
    for (const star of stars) {
      const shimmer = .78 + .22 * Math.sin(time * .7 + star.phase);
      ctx.fillStyle = `rgba(198,237,250,${star.opacity * shimmer})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function draw(ts) {
    ctx.clearRect(0, 0, w, h);
    drawStarfield();

    mouse.x += (mouse.tx - mouse.x) * .035;
    mouse.y += (mouse.ty - mouse.y) * .035;

    drawPerspectiveGrid();
    drawRibbon(h * .36, h * .055, .34, .0, .10, .85);
    drawRibbon(h * .48, h * .075, .25, 1.9, .075, .72);
    drawRibbon(h * .66, h * .050, .31, 3.4, .065, .62);
    drawOrbit();
    drawNetwork();
  }

  function loop(ts) {
    if (!running) return;
    if (ts - lastFrame < 33) {
      raf = requestAnimationFrame(loop);
      return;
    }

    const dt = Math.min(40, ts - (lastFrame || ts));
    lastFrame = ts;
    time += dt / 1000;
    updateNodes(dt);
    draw(ts);
    raf = requestAnimationFrame(loop);
  }

  if (!coarsePointer) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      mouse.tx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      mouse.ty = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    }, { passive: true });

    hero.addEventListener("pointerleave", () => {
      mouse.tx = .74;
      mouse.ty = .44;
    }, { passive: true });
  }

  const heroVisibility = new IntersectionObserver((entries) => {
    const visible = entries[0]?.isIntersecting ?? true;
    running = visible && !document.hidden && !reduceMotion;
    cancelAnimationFrame(raf);
    if (running) {
      lastFrame = performance.now();
      raf = requestAnimationFrame(loop);
    } else {
      draw(performance.now());
    }
  }, { threshold: 0.01 });

  heroVisibility.observe(hero);

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden && !reduceMotion && hero.getBoundingClientRect().bottom > 0;
    cancelAnimationFrame(raf);
    if (running) raf = requestAnimationFrame(loop);
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  }, { passive: true });

  resize();
  if (reduceMotion) {
    draw(performance.now());
  } else {
    lastFrame = performance.now();
    raf = requestAnimationFrame(loop);
  }
})();


/* TRIMAP WEB: stable device showcase.
   Desktop keeps the scroll-linked motion.
   iPhone/mobile: a single reveal of the complete laptop + phone, no sticky
   pinning, no scrolling through an empty scene, and no separate lid animation. */
(() => {
  const section = document.querySelector('body[data-page="web"] .web-device-story');
  if (!section) return;
  const stage = section.querySelector('.web-device-stage');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileQuery = matchMedia('(max-width: 680px)');
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  let frame = 0;
  let progress = 0;
  let target = 0;
  let wasMobile = null;
  let revealObserver = null;

  function fitMobile() {
    // Use actual container width, not innerWidth: respects iOS safe areas.
    const width = Math.max(240, stage.clientWidth);
    const laptopScale = (width - 14) / 850;
    const phoneWidth = clamp(width * .35, 100, 145);
    const phoneScale = phoneWidth / 215;
    const laptopLeft = (width - 850 * laptopScale) / 2 + 10 * laptopScale;
    const phoneLeft = width - phoneWidth - 5;
    const phoneTop = Math.round(340 * laptopScale);
    const height = Math.ceil(Math.max(616 * laptopScale, phoneTop + 433 * phoneScale) + 15);

    stage.style.setProperty('--web-mobile-laptop-fit', laptopScale.toFixed(5));
    stage.style.setProperty('--web-mobile-phone-fit', phoneScale.toFixed(5));
    stage.style.setProperty('--web-mobile-laptop-left', `${laptopLeft.toFixed(1)}px`);
    stage.style.setProperty('--web-mobile-phone-left', `${phoneLeft.toFixed(1)}px`);
    stage.style.setProperty('--web-mobile-phone-top', `${phoneTop}px`);
    stage.style.setProperty('--web-mobile-stage-height', `${height}px`);
  }

  function enableMobile() {
    if (revealObserver) { revealObserver.disconnect(); revealObserver = null; }
    section.classList.remove('web-story-enhanced');
    section.classList.add('web-story-mobile');
    fitMobile();
    // Reveals the WHOLE laptop with its display attached. Phone follows briefly.
    if (reduced || !('IntersectionObserver' in window)) {
      section.classList.add('web-story-inview');
    } else if (!section.classList.contains('web-story-inview')) {
      revealObserver = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          section.classList.add('web-story-inview');
          revealObserver?.disconnect();
          revealObserver = null;
        }
      }, {threshold: .06, rootMargin: '0px 0px 80px 0px'});
      revealObserver.observe(section);
    }
  }

  function fitDesktop() {
    const fit = Math.max(.2, Math.min(1.15, (innerWidth - 22) / 1020, (innerHeight - 45) / 690));
    stage.style.setProperty('--web-stage-fit', String(fit));
  }

  function paintDesktop(p) {
    const l = smooth(p / .46);
    const phone = smooth((p - .25) / .58);
    section.style.setProperty('--web-laptop-y', `${Math.round((1 - l) * 105)}px`);
    section.style.setProperty('--web-laptop-tilt', `${(-13 * (1 - l)).toFixed(2)}deg`);
    section.style.setProperty('--web-laptop-scale', (.82 + l * .18).toFixed(3));
    section.style.setProperty('--web-laptop-opacity', (.35 + l * .65).toFixed(3));
    section.style.setProperty('--web-phone-x', `${Math.round((1 - phone) * 165)}px`);
    section.style.setProperty('--web-phone-y', `${Math.round((1 - phone) * 95)}px`);
    section.style.setProperty('--web-phone-tilt', `${(-22 * (1 - phone)).toFixed(2)}deg`);
    section.style.setProperty('--web-phone-roll', `${(11 * (1 - phone)).toFixed(2)}deg`);
    section.style.setProperty('--web-phone-opacity', phone.toFixed(3));
  }

  function recalcDesktop() {
    if (mobileQuery.matches) return;
    const rect = section.getBoundingClientRect();
    target = clamp(-rect.top / Math.max(1, rect.height - innerHeight));
    if (reduced) { progress = 1; paintDesktop(1); return; }
    if (!frame) frame = requestAnimationFrame(tick);
  }
  function tick() {
    frame = 0;
    if (mobileQuery.matches) return;
    progress += (target - progress) * .17;
    if (Math.abs(target - progress) < .001) progress = target;
    paintDesktop(progress);
    if (progress !== target) frame = requestAnimationFrame(tick);
  }
  function refresh() {
    const mobile = mobileQuery.matches;
    if (mobile) {
      if (wasMobile !== true) enableMobile();
      else fitMobile();
    } else {
      if (revealObserver) { revealObserver.disconnect(); revealObserver = null; }
      section.classList.remove('web-story-mobile');
      fitDesktop();
      if (wasMobile !== false) {
        const rect = section.getBoundingClientRect();
        target = clamp(-rect.top / Math.max(1, rect.height - innerHeight));
        progress = reduced ? 1 : target;
        paintDesktop(progress);
        section.classList.add('web-story-enhanced');
      }
      recalcDesktop();
    }
    wasMobile = mobile;
  }

  refresh();
  addEventListener('scroll', recalcDesktop, {passive:true});
  addEventListener('resize', refresh, {passive:true});
  addEventListener('pageshow', refresh);
})();
