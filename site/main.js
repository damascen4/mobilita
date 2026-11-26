(function () {
  'use strict';

  const WHATSAPP_NUMBER = '5519998108070';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    document.documentElement.classList.add('js-enabled');
  }

  // Mobile UA detection for direct WhatsApp app launch
  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
  }

  function sanitizePhone(phone) {
    return String(phone || WHATSAPP_NUMBER).replace(/\D/g, '');
  }

  function buildFallbackWaUrl(phone, text) {
    const cleanPhone = sanitizePhone(phone);
    const encoded = encodeURIComponent(text || '');
    return 'https://wa.me/' + cleanPhone + (encoded ? '?text=' + encoded : '');
  }

  function buildDirectWhatsAppUrl(phone, text) {
    const cleanPhone = sanitizePhone(phone);
    const encoded = encodeURIComponent(text || '');
    const query = 'phone=' + cleanPhone + (encoded ? '&text=' + encoded : '');

    if (isMobileDevice()) {
      return {
        mode: 'mobile',
        url: 'whatsapp://send?' + query,
        fallbackUrl: buildFallbackWaUrl(cleanPhone, text),
      };
    }

    return {
      mode: 'desktop',
      url: 'https://web.whatsapp.com/send?' + query,
      fallbackUrl: buildFallbackWaUrl(cleanPhone, text),
    };
  }

  /**
   * Abre o WhatsApp diretamente sem passar pela página intermediária do wa.me.
   * - Mobile (Android/iOS): whatsapp://send?phone=...&text=... com fallback para wa.me após 1500ms se a aba continuar visível.
   * - Desktop: abre https://web.whatsapp.com/send?phone=...&text=... em nova aba.
   */
  function openWhatsApp(phone, text) {
    const target = buildDirectWhatsAppUrl(phone, text);
    document.documentElement.dataset.lastWhatsappMode = target.mode;
    document.documentElement.dataset.lastWhatsappUrl = target.url;
    document.documentElement.dataset.lastWhatsappFallback = target.fallbackUrl;

    const event = new CustomEvent('mobilita:whatsapp', {
      cancelable: true,
      detail: {
        phone: sanitizePhone(phone),
        text: text || '',
        mode: target.mode,
        url: target.url,
        fallbackUrl: target.fallbackUrl,
      },
    });
    const shouldNavigate = window.dispatchEvent(event);

    if (target.mode === 'mobile') {
      let appOpened = false;
      function handleVisibilityChange() {
        if (document.visibilityState === 'hidden') {
          appOpened = true;
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
      }
      document.addEventListener('visibilitychange', handleVisibilityChange);

      if (shouldNavigate) {
        window.location.href = target.url;
      }

      window.setTimeout(function () {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (!appOpened && document.visibilityState === 'visible' && shouldNavigate) {
          window.location.href = target.fallbackUrl;
        }
      }, 1500);
    } else if (shouldNavigate) {
      window.open(target.url, '_blank', 'noopener,noreferrer');
    }

    return target;
  }

  window.openWhatsApp = openWhatsApp;

  // Intercepta todos os CTAs WhatsApp mantendo href="https://wa.me/..." como fallback sem JS/SEO
  document.querySelectorAll('a[data-wa-phone]').forEach(function (anchor) {
    anchor.addEventListener('click', function (event) {
      event.preventDefault();
      const phone = anchor.dataset.waPhone || WHATSAPP_NUMBER;
      const text = anchor.dataset.waText || '';
      openWhatsApp(phone, text);
    });
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

  // Gentle reveal on scroll
  const revealElements = document.querySelectorAll('.reveal');
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
      { threshold: 0.12, rootMargin: '0px 0px -24px 0px' }
    );

    revealElements.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealElements.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  // Light parallax for fleet image
  const fleetStage = document.getElementById('fleet-parallax-stage');
  const fleetImg = document.getElementById('fleet-parallax-img');
  if (!prefersReducedMotion && fleetStage && fleetImg) {
    let ticking = false;
    function updateParallax() {
      ticking = false;
      const rect = fleetStage.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 800;
      if (rect.bottom < 0 || rect.top > viewportHeight) return;
      const progress = (rect.top + rect.height * 0.5 - viewportHeight * 0.5) / viewportHeight;
      const offset = Math.max(-18, Math.min(18, progress * -26));
      fleetImg.style.transform = 'translate3d(0, ' + offset.toFixed(1) + 'px, 0)';
    }

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(updateParallax);
        }
      },
      { passive: true }
    );
    updateParallax();
  }

  // Format date (YYYY-MM-DD) for readable Portuguese message
  function formatDateBr(value) {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length !== 3) return value;
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  function buildQuoteMessage(data) {
    const lines = [
      'Olá, Mobilità! Vim pelo site e gostaria de solicitar um orçamento:',
      '',
      'Nome: ' + data.nome,
      'Telefone: ' + data.telefone,
      'Origem: ' + data.origem,
      'Destino: ' + data.destino,
      'Data: ' + formatDateBr(data.data),
      'Horário: ' + data.hora,
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

      if (formError) {
        formError.textContent = '';
        formError.hidden = true;
      }

      const message = buildQuoteMessage(data);
      const fallbackUrl = buildFallbackWaUrl(WHATSAPP_NUMBER, message);
      quoteForm.dataset.lastWhatsappUrl = fallbackUrl;

      if (generatedLink) {
        generatedLink.href = fallbackUrl;
        generatedLink.dataset.waPhone = WHATSAPP_NUMBER;
        generatedLink.dataset.waText = message;
      }
      if (formResult) {
        formResult.hidden = false;
      }

      openWhatsApp(WHATSAPP_NUMBER, message);
    });
  }

  // Footer year
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
})();
