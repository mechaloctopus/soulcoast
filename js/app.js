/* ═══════════════════════════════════════════
   SOUL COAST DANCE — APP LOGIC
   Scroll animations, card toggles, counter
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── MARK JS AS LOADED ─── */
  document.body.classList.add('js-loaded');

  /* ─── FALLBACK: make all content visible after 2s even if animations fail ─── */
  setTimeout(function() {
    document.querySelectorAll('[data-animate]').forEach(function(el) {
      el.classList.add('visible');
    });
  }, 2000);

  /* ─── NAV SCROLL EFFECT ─── */
  const nav = document.getElementById('main-nav');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const y = window.pageYOffset;
    if (y > 80) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    lastScroll = y;
  }, { passive: true });

  /* ─── EXPANDABLE SCIENCE CARDS ─── */
  document.querySelectorAll('.card-header').forEach((header) => {
    header.addEventListener('click', () => {
      const card = header.closest('.science-card');
      const isActive = card.classList.contains('active');

      // Close all others
      document.querySelectorAll('.science-card.active').forEach((c) => {
        if (c !== card) c.classList.remove('active');
      });

      card.classList.toggle('active');

      // Update aria
      header.setAttribute('aria-expanded', !isActive);

      // Scroll into view if opening
      if (!isActive) {
        setTimeout(() => {
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    });

    // Keyboard support
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        header.click();
      }
    });
  });

  /* ─── SCROLL-TRIGGERED ANIMATIONS ─── */
  const animateElements = document.querySelectorAll('[data-animate]');

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  animateElements.forEach((el) => observer.observe(el));

  /* ─── HERO STAT COUNTER ─── */
  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const duration = 2000;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quart
      const ease = 1 - Math.pow(1 - progress, 4);
      el.textContent = Math.round(target * ease);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  const statEl = document.querySelector('.stat-number[data-count]');
  if (statEl) {
    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            statObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    statObserver.observe(statEl);
  }

  /* ─── GSAP SCROLL ANIMATIONS (if available) ─── */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Parallax hero content
    gsap.to('.hero-content', {
      y: -100,
      opacity: 0.3,
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
    });

    // Convergence section tags stagger
    gsap.from('.convergence-tags span', {
      y: 30,
      opacity: 0,
      stagger: 0.08,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.convergence-tags',
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });

    // Book cards stagger
    gsap.from('.book-card', {
      y: 50,
      opacity: 0,
      stagger: 0.1,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.books-grid',
        start: 'top 75%',
        toggleActions: 'play none none none',
      },
    });

    // Science cards parallax depth
    document.querySelectorAll('.science-card').forEach((card, i) => {
      gsap.from(card, {
        y: 60 + i * 10,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });

    // CTA section
    gsap.from('.cta-block', {
      y: 60,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#join',
        start: 'top 70%',
        toggleActions: 'play none none none',
      },
    });
  }

  /* ─── SMOOTH SCROLL FOR NAV LINKS ─── */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();
