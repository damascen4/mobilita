(function () {
  'use strict';

  const WHATSAPP_NUMBER = '5519998108070';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    document.documentElement.classList.add('js-enabled');
  }

  // WhatsApp direct routing helper (mobile deep link + fallback, desktop web.whatsapp.com)
  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  }

  function sanitizePhone(phone) {
    return String(phone || WHATSAPP_NUMBER).replace(/\D/g, '') || WHATSAPP_NUMBER;
  }

  function navigateTo(url) {
    if (typeof window.__mobilitaNavigate === 'function') {
      window.__mobilitaNavigate(url);
      return;
    }
    window.location.href = url;
  }

  function buildWaMeUrl(phone, text) {
    const digits = sanitizePhone(phone);
    const query = text ? '?text=' + encodeURIComponent(text) : '';
    return 'https://wa.me/' + digits + query;
  }

  function openWhatsApp(phone, text) {
    const digits = sanitizePhone(phone);
    const encoded = encodeURIComponent(text || '');
    const waMeUrl = buildWaMeUrl(digits, text);

    if (isMobileDevice()) {
      const deepLink = 'whatsapp://send?phone=' + digits + (encoded ? '&text=' + encoded : '');
      let leftPage = false;

      function onVisibilityChange() {
        if (document.hidden || document.visibilityState === 'hidden') {
          leftPage = true;
        }
      }

      function onBlur() {
        leftPage = true;
      }

      document.addEventListener('visibilitychange', onVisibilityChange);
      window.addEventListener('blur', onBlur);

      navigateTo(deepLink);

      window.setTimeout(function () {
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('blur', onBlur);
        if (!leftPage && !document.hidden) {
          navigateTo(waMeUrl);
        }
      }, 1500);

      return deepLink;
    }

    const webUrl = 'https://web.whatsapp.com/send?phone=' + digits + (encoded ? '&text=' + encoded : '');
    window.open(webUrl, '_blank', 'noopener,noreferrer');
    return webUrl;
  }

  window.openWhatsApp = openWhatsApp;

  // Intercept clicks on all WhatsApp links keeping href="https://wa.me/..." as no-JS fallback
  document.addEventListener('click', function (event) {
    const link = event.target.closest('a[data-wa-phone], a[href^="https://wa.me/"]');
    if (!link) return;

    event.preventDefault();

    let phone = link.dataset.waPhone || '';
    let text = link.dataset.waText || '';

    if (!phone || !text) {
      try {
        const parsed = new URL(link.href);
        if (!phone) phone = parsed.pathname.replace(/\D/g, '');
        if (!text) text = parsed.searchParams.get('text') || '';
      } catch (_) {
        // Ignore malformed href; sanitizePhone falls back to WHATSAPP_NUMBER
      }
    }

    openWhatsApp(phone, text);
  });

  // Header scroll state
  const header = document.querySelector('.site-header');
  function updateHeaderState() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 36);
  }
  updateHeaderState();
  window.addEventListener('scroll', updateHeaderState, { passive: true });

  // Mobile menu toggle
  const menuToggle = document.getElementById('menu-toggle');
  const mobileNav = document.getElementById('nav-mobile');

  function setMenuOpen(isOpen) {
    if (!menuToggle || !mobileNav) return;
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
    mobileNav.hidden = !isOpen;
  }

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', function () {
      const currentlyOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      setMenuOpen(!currentlyOpen);
    });

    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        setMenuOpen(false);
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        setMenuOpen(false);
        menuToggle.focus();
      }
    });
  }

  // ---- Cinematic layer ----
  const root = document.documentElement;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  // Loader de marca: só na 1ª visita da sessão, pulável, <=1.1s, nunca bloqueia cliques
  (function brandLoader() {
    if (prefersReducedMotion) return;
    let seen = false;
    try { seen = sessionStorage.getItem('mobilita-intro') === '1'; sessionStorage.setItem('mobilita-intro', '1'); } catch (_) { seen = true; }
    if (seen) return;
    const el = document.createElement('div');
    el.className = 'intro-loader';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<img src="assets/mobilita-logo-branco-grande.png" alt="" width="220" height="59">';
    document.body.appendChild(el);
    let done = false;
    function finish() {
      if (done) return;
      done = true;
      el.classList.add('is-done');
      window.setTimeout(function () { el.remove(); }, 700);
    }
    window.setTimeout(finish, 1000);
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) {
      window.addEventListener(ev, finish, { once: true, passive: true });
    });
  })();

  // Reveal on scroll com stagger entre irmãos
  const revealElements = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  revealElements.forEach(function (el) {
    const siblings = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains('reveal'); });
    el.style.setProperty('--d', Math.min(siblings.indexOf(el), 6) * 90 + 'ms');
  });
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealElements.forEach(function (el) { observer.observe(el); });
  } else {
    revealElements.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // Contadores animados (disparam ao entrar na viewport)
  const counters = document.querySelectorAll('[data-count]');
  function runCounter(el) {
    const target = parseInt(el.dataset.count, 10) || 0;
    const start = performance.now();
    const dur = 1400;
    (function tick(now) {
      const t = Math.min(1, (now - start) / dur);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) window.requestAnimationFrame(tick);
    })(start);
  }
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { runCounter(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { c.textContent = '0'; cio.observe(c); });
  }

  // Tilt sutil nos cards de serviço (só ponteiro fino)
  if (!prefersReducedMotion && finePointer) {
    document.querySelectorAll('.service-card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', (x * 7).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--rx', '0deg');
      });
    });
  }

  // Parallax (fundos fotográficos, folhas, frota entrando de lado) e rota animada
  const parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  const fleetStage = document.getElementById('fleet-parallax-stage');
  const routeEl = document.querySelector('.steps-route');
  if (!prefersReducedMotion) {
    let ticking = false;
    const vh = function () { return window.innerHeight || 800; };

    function update() {
      ticking = false;
      const h = vh();

      parallaxEls.forEach(function (el) {
        const holder = el.closest('section, footer, .hero') || el.parentElement;
        const rect = holder.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > h + 200) return;
        const speed = parseFloat(el.dataset.parallax) || 0;
        const center = rect.top + rect.height / 2 - h / 2;
        el.style.transform = 'translate3d(0,' + (center * speed * -1).toFixed(1) + 'px,0)';
      });

      if (fleetStage) {
        const rect = fleetStage.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < h) {
          const p = Math.max(0, Math.min(1, (rect.top - h * 0.15) / (h * 0.75)));
          fleetStage.style.setProperty('--fx', (p * 14).toFixed(2) + '%');
        }
      }

      if (routeEl) {
        const host = routeEl.parentElement.getBoundingClientRect();
        if (host.bottom > 0 && host.top < h) {
          const p = Math.max(0, Math.min(1, (h * 0.75 - host.top) / (host.height + h * 0.1)));
          routeEl.style.setProperty('--route', p.toFixed(3));
          const horizontal = window.matchMedia('(min-width: 900px)').matches;
          if (horizontal) {
            routeEl.style.setProperty('--route-x', (p * routeEl.getBoundingClientRect().width).toFixed(1) + 'px');
          } else {
            routeEl.style.setProperty('--route-y', (p * routeEl.getBoundingClientRect().height).toFixed(1) + 'px');
          }
        }
      }
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // Light BR phone mask (permite dígitos livres / internacionais)
  function formatBrPhone(raw) {
    const trimmed = String(raw || '');
    if (trimmed.trim().startsWith('+')) {
      return trimmed.replace(/[^\d+\s()-]/g, '');
    }

    const digits = trimmed.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length > 11) {
      return digits;
    }
    if (digits.length <= 2) {
      return '(' + digits;
    }
    if (digits.length <= 6) {
      return '(' + digits.slice(0, 2) + ') ' + digits.slice(2);
    }
    if (digits.length <= 10) {
      return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 6) + '-' + digits.slice(6);
    }
    return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 7) + '-' + digits.slice(7);
  }

  const phoneInput = document.getElementById('telefone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      const formatted = formatBrPhone(phoneInput.value);
      if (phoneInput.value !== formatted) {
        phoneInput.value = formatted;
      }
    });
  }

  // Local today string YYYY-MM-DD and min date on #data
  function getLocalTodayIso() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  const dateInput = document.getElementById('data');
  const todayIso = getLocalTodayIso();
  if (dateInput) {
    dateInput.min = todayIso;
  }

  // Format YYYY-MM-DD + HH:MM for readable Portuguese message
  function formatDateAndTime(dateVal, timeVal) {
    const parts = String(dateVal || '').split('-');
    const formattedDate = parts.length === 3 ? parts[2] + '/' + parts[1] + '/' + parts[0] : dateVal;
    return timeVal ? formattedDate + ' às ' + timeVal : formattedDate;
  }

  // Build WhatsApp message text from form fields
  function buildQuoteText(data) {
    const lines = [
      'Olá, Mobilità! Gostaria de solicitar um orçamento:',
      '',
      'Nome: ' + data.nome,
      'Telefone: ' + data.telefone,
      'Origem: ' + data.origem,
      'Destino: ' + data.destino,
      'Data e horário: ' + formatDateAndTime(data.data, data.hora),
      'Nº de passageiros: ' + data.passageiros,
    ];

    if (data.observacao) {
      lines.push('Observação: ' + data.observacao);
    }

    return lines.join('\n');
  }

  // Quote form handling
  const quoteForm = document.getElementById('quote-form');
  const formError = document.getElementById('form-error');
  const formResult = document.getElementById('form-result');
  const generatedLink = document.getElementById('whatsapp-generated-link');

  if (quoteForm) {
    quoteForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const data = {
        nome: quoteForm.nome.value.trim(),
        telefone: quoteForm.telefone.value.trim(),
        origem: quoteForm.origem.value.trim(),
        destino: quoteForm.destino.value.trim(),
        data: quoteForm.data.value.trim(),
        hora: quoteForm.hora.value.trim(),
        passageiros: quoteForm.passageiros.value.trim(),
        observacao: quoteForm.observacao.value.trim(),
      };

      const requiredFields = [
        { key: 'nome', label: 'Seu nome' },
        { key: 'telefone', label: 'Seu telefone / WhatsApp' },
        { key: 'origem', label: 'Origem' },
        { key: 'destino', label: 'Destino' },
        { key: 'data', label: 'Data da viagem' },
        { key: 'hora', label: 'Horário' },
        { key: 'passageiros', label: 'Nº de passageiros' },
      ];

      const missing = requiredFields.find(function (field) {
        return !data[field.key];
      });

      if (missing) {
        if (formError) {
          formError.textContent = 'Por favor, preencha o campo "' + missing.label + '" para continuar.';
          formError.hidden = false;
        }
        if (formResult) formResult.hidden = true;
        quoteForm[missing.key].focus();
        return;
      }

      if (data.data < getLocalTodayIso()) {
        if (formError) {
          formError.textContent = 'Por favor, escolha uma data igual ou posterior a hoje.';
          formError.hidden = false;
        }
        if (formResult) formResult.hidden = true;
        quoteForm.data.focus();
        return;
      }

      if (formError) {
        formError.textContent = '';
        formError.hidden = true;
      }

      const text = buildQuoteText(data);
      const waMeUrl = buildWaMeUrl(WHATSAPP_NUMBER, text);
      quoteForm.dataset.lastWhatsappUrl = waMeUrl;

      if (generatedLink) {
        generatedLink.href = waMeUrl;
        generatedLink.dataset.waPhone = WHATSAPP_NUMBER;
        generatedLink.dataset.waText = text;
      }
      if (formResult) {
        formResult.hidden = false;
      }

      openWhatsApp(WHATSAPP_NUMBER, text);
    });
  }

  // Footer year
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
})();
