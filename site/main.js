(function () {
  'use strict';

  const WHATSAPP_NUMBER = '5519998108070';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    document.documentElement.classList.add('js-enabled');
  }

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

  // Format datetime-local for readable Portuguese message
  function formatDateTime(value) {
    if (!value) return '';
    const parts = value.split('T');
    if (parts.length !== 2) return value;
    const dateParts = parts[0].split('-');
    if (dateParts.length !== 3) return value;
    return dateParts[2] + '/' + dateParts[1] + '/' + dateParts[0] + ' às ' + parts[1];
  }

  // Build WhatsApp URL from form fields
  function buildWhatsAppUrl(data) {
    const lines = [
      'Olá, Mobilità! Gostaria de solicitar um orçamento:',
      '',
      'Nome: ' + data.nome,
      'Telefone: ' + data.telefone,
      'Origem: ' + data.origem,
      'Destino: ' + data.destino,
      'Data e horário: ' + formatDateTime(data.dataHora),
      'Nº de passageiros: ' + data.passageiros,
    ];

    if (data.observacao) {
      lines.push('Observação: ' + data.observacao);
    }

    const text = lines.join('\n');
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
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
        dataHora: quoteForm.dataHora.value.trim(),
        passageiros: quoteForm.passageiros.value.trim(),
        observacao: quoteForm.observacao.value.trim(),
      };

      const requiredFields = [
        { key: 'nome', label: 'Seu nome' },
        { key: 'telefone', label: 'Seu telefone / WhatsApp' },
        { key: 'origem', label: 'Origem' },
        { key: 'destino', label: 'Destino' },
        { key: 'dataHora', label: 'Data e horário' },
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

      const waUrl = buildWhatsAppUrl(data);
      quoteForm.dataset.lastWhatsappUrl = waUrl;

      if (generatedLink) {
        generatedLink.href = waUrl;
      }
      if (formResult) {
        formResult.hidden = false;
      }

      window.open(waUrl, '_blank', 'noopener,noreferrer');
    });
  }

  // Footer year
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
})();
