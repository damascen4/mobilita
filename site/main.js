(() => {
  'use strict';

  const PRIMARY_PHONE = '5519998108070';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  /* 0. Loading inicial curto (<1s, não bloqueia conteúdo) */
  const splash = document.getElementById('page-splash');
  if (splash) {
    if (prefersReducedMotion) {
      splash.hidden = true;
    } else {
      window.setTimeout(() => {
        splash.classList.add('is-done');
        window.setTimeout(() => {
          splash.hidden = true;
        }, 440);
      }, 260);
    }
  }

  /* 0b. Barra de progresso de scroll (GPU scaleX, rAF throttled) */
  const progressBar = document.getElementById('scroll-progress-bar');
  if (progressBar && !prefersReducedMotion) {
    let progTicking = false;
    const updateProgress = () => {
      progTicking = false;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
      progressBar.style.transform = `scaleX(${ratio.toFixed(4)})`;
    };
    const requestProgress = () => {
      if (!progTicking) {
        progTicking = true;
        requestAnimationFrame(updateProgress);
      }
    };
    window.addEventListener('scroll', requestProgress, { passive: true });
    window.addEventListener('resize', requestProgress);
    updateProgress();
  }

  /* 1. Header elevation on scroll */
  const header = document.getElementById('topo');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* 2. Mobile drawer menu (aria-expanded, Esc closes, focus trap) */
  const menuToggle = document.getElementById('menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const menuClose = document.getElementById('menu-close');

  if (menuToggle && mobileNav && menuClose) {
    let lastFocused = null;
    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const openMenu = () => {
      lastFocused = document.activeElement;
      mobileNav.hidden = false;
      menuToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        mobileNav.classList.add('is-open');
        menuClose.focus();
      });
    };

    const closeMenu = (restoreFocus = true) => {
      mobileNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      const finish = () => {
        mobileNav.hidden = true;
        if (restoreFocus && lastFocused instanceof HTMLElement) {
          lastFocused.focus();
        }
      };
      if (prefersReducedMotion) {
        finish();
      } else {
        window.setTimeout(finish, 200);
      }
    };

    menuToggle.addEventListener('click', () => {
      if (mobileNav.hidden) openMenu();
      else closeMenu(true);
    });

    menuClose.addEventListener('click', () => closeMenu(true));

    mobileNav.querySelectorAll('[data-close-menu]').forEach((el) => {
      el.addEventListener('click', () => closeMenu(true));
    });

    mobileNav.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', () => closeMenu(false));
    });

    document.addEventListener('keydown', (event) => {
      if (mobileNav.hidden) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu(true);
        return;
      }
      if (event.key === 'Tab') {
        const focusables = Array.from(mobileNav.querySelectorAll(focusableSelector));
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* 3. Active nav link tracking */
  const navLinks = Array.from(document.querySelectorAll('.main-nav .nav-link'));
  const trackedSections = navLinks
    .map((link) => {
      const id = link.getAttribute('href')?.slice(1);
      const section = id ? document.getElementById(id) : null;
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  if (trackedSections.length && 'IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        navLinks.forEach((l) => l.classList.remove('is-active'));
        const match = trackedSections.find((item) => item.section === visible.target);
        if (match) match.link.classList.add('is-active');
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.25, 0.5] }
    );
    trackedSections.forEach(({ section }) => navObserver.observe(section));
  }

  /* 4. Scroll reveal & SVG stroke-draw trigger */
  const reveals = Array.from(document.querySelectorAll('.reveal, [data-draw]'));
  if (!prefersReducedMotion && 'IntersectionObserver' in window && reveals.length) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -32px 0px' }
    );
    reveals.forEach((el) => revealObserver.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* 5. Skeleton shimmer resolution for lazy images */
  document.querySelectorAll('.img-skel').forEach((wrapper) => {
    const img = wrapper.querySelector('img');
    if (!img) {
      wrapper.classList.add('is-loaded');
      return;
    }
    const markLoaded = () => wrapper.classList.add('is-loaded');
    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
    } else {
      img.addEventListener('load', markLoaded, { once: true });
      img.addEventListener('error', markLoaded, { once: true });
    }
  });

  /* 6. Parallax direto em transform (sem recalcular variáveis CSS em subárvores) */
  if (!prefersReducedMotion) {
    const items = Array.from(document.querySelectorAll('[data-parallax]')).map((el) => ({
      el,
      k: parseFloat(el.getAttribute('data-parallax')) || 0.1,
    }));
    if (items.length) {
      let ticking = false;
      const update = () => {
        ticking = false;
        const vh = window.innerHeight;
        items.forEach(({ el, k }) => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -120 || r.top > vh + 120) return;
          const py = (vh / 2 - (r.top + r.height / 2)) * k;
          el.style.transform = `translate3d(0, ${py.toFixed(1)}px, 0)`;
        });
      };
      const request = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      };
      window.addEventListener('scroll', request, { passive: true });
      window.addEventListener('resize', request);
      update();
    }
  }

  /* 7. Smart WhatsApp routing (keeps wa.me href as no-JS fallback) */
  const openWhatsApp = (phone, text) => {
    const encoded = encodeURIComponent(text);
    const mobileUrl = `whatsapp://send?phone=${phone}&text=${encoded}`;
    const desktopUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encoded}`;

    if (isMobileUA) {
      if (typeof window.__mobilitaNavigate === 'function') {
        window.__mobilitaNavigate(mobileUrl);
      } else {
        window.location.href = mobileUrl;
      }
      return mobileUrl;
    }
    window.open(desktopUrl, '_blank', 'noopener,noreferrer');
    return desktopUrl;
  };

  document.querySelectorAll('a[data-wa-phone]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const phone = link.getAttribute('data-wa-phone') || PRIMARY_PHONE;
      const text = link.getAttribute('data-wa-text') || 'Olá, gostaria de informações sobre transporte executivo.';
      openWhatsApp(phone, text);
    });
  });

  /* 8. Light BR phone mask */
  const phoneInput = document.getElementById('telefone');
  if (phoneInput instanceof HTMLInputElement) {
    phoneInput.addEventListener('input', () => {
      const digits = phoneInput.value.replace(/\D/g, '');
      if (digits.length === 11) {
        phoneInput.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
      } else if (digits.length === 10) {
        phoneInput.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
      }
    });
  }

  /* 9. Accessible contact form validation + Web3Forms email submit (with WhatsApp fallback) */
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('form-status');
  const submitBtn = document.getElementById('contact-submit');

  if (form instanceof HTMLFormElement && statusEl) {
    const WEB3FORMS_URL = form.getAttribute('action') || 'https://api.web3forms.com/submit';
    const fields = {
      nome: {
        el: document.getElementById('nome'),
        err: document.getElementById('nome-erro'),
        validate: (v) => (v.trim().length >= 2 ? '' : 'Informe seu nome para podermos responder.'),
      },
      telefone: {
        el: document.getElementById('telefone'),
        err: document.getElementById('telefone-erro'),
        validate: (v) => (v.replace(/\D/g, '').length >= 8 ? '' : 'Informe um telefone com DDD (ex.: (19) 99999-9999).'),
      },
      email: {
        el: document.getElementById('email'),
        err: document.getElementById('email-erro'),
        validate: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Informe um e-mail válido (ex.: nome@empresa.com.br).'),
      },
      mensagem: {
        el: document.getElementById('mensagem'),
        err: document.getElementById('mensagem-erro'),
        validate: (v) => (v.trim().length >= 5 ? '' : 'Escreva sua mensagem ou detalhes da viagem.'),
      },
    };

    const setFieldError = (field, message) => {
      if (!field.el || !field.err) return;
      if (message) {
        field.el.setAttribute('aria-invalid', 'true');
        field.err.textContent = message;
        field.err.hidden = false;
      } else {
        field.el.removeAttribute('aria-invalid');
        field.err.textContent = '';
        field.err.hidden = true;
      }
    };

    const setStatus = (kind, html) => {
      statusEl.className = `form-status${kind ? ` is-${kind}` : ''}`;
      statusEl.setAttribute('role', kind === 'error' ? 'alert' : 'status');
      statusEl.innerHTML = html;
      statusEl.hidden = false;
    };

    Object.values(fields).forEach((field) => {
      field.el?.addEventListener('input', () => {
        if (field.el.getAttribute('aria-invalid') === 'true') {
          setFieldError(field, field.validate(field.el.value));
        }
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      let firstInvalid = null;

      Object.values(fields).forEach((field) => {
        const msg = field.validate(field.el?.value || '');
        setFieldError(field, msg);
        if (msg && !firstInvalid) firstInvalid = field.el;
      });

      if (firstInvalid) {
        statusEl.hidden = true;
        firstInvalid.focus();
        return;
      }

      const honeypot = form.querySelector('input[name="botcheck"]');
      if (honeypot instanceof HTMLInputElement && honeypot.checked) {
        setStatus('success', 'Mensagem enviada com sucesso! Responderemos em breve.');
        form.reset();
        return;
      }

      const nome = fields.nome.el.value.trim();
      const telefone = fields.telefone.el.value.trim();
      const email = fields.email.el.value.trim();
      const mensagem = fields.mensagem.el.value.trim();
      const accessKey = form.querySelector('input[name="access_key"]')?.value || '';
      const subject = form.querySelector('input[name="subject"]')?.value || 'Novo contato pelo site — Mobilità Transportes';
      const fromName = form.querySelector('input[name="from_name"]')?.value || 'Site Mobilità Transportes';

      const composed = [
        'Olá, Mobilità Transportes!',
        `Nome: ${nome}`,
        `Telefone: ${telefone}`,
        `E-mail: ${email}`,
        `Mensagem: ${mensagem}`,
      ].join('\n');
      const fallbackHref = `https://wa.me/${PRIMARY_PHONE}?text=${encodeURIComponent(composed)}`;

      if (submitBtn instanceof HTMLButtonElement) {
        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.textContent = 'Enviando...';
      }
      setStatus('sending', 'Enviando sua mensagem...');

      try {
        const response = await fetch(WEB3FORMS_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            access_key: accessKey,
            subject,
            from_name: fromName,
            botcheck: false,
            nome,
            telefone,
            email,
            mensagem,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success !== true) {
          throw new Error(data.message || 'Falha no envio');
        }
        setStatus(
          'success',
          `Mensagem enviada com sucesso! Responderemos em breve. Se preferir atendimento imediato, <a id="whatsapp-fallback-link" href="${fallbackHref}" target="_blank" rel="noopener noreferrer">fale pelo WhatsApp</a>.`
        );
        form.reset();
      } catch {
        setStatus(
          'error',
          `Não foi possível enviar por e-mail agora. Tente novamente ou <a id="whatsapp-fallback-link" href="${fallbackHref}" target="_blank" rel="noopener noreferrer">envie sua mensagem pelo WhatsApp</a>.`
        );
      } finally {
        if (submitBtn instanceof HTMLButtonElement) {
          submitBtn.disabled = false;
          submitBtn.removeAttribute('aria-busy');
          submitBtn.textContent = 'Enviar mensagem';
        }
      }
    });
  }
})();
