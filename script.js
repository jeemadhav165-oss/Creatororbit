/* =========================================================
   CREATORORBIT — script.js
   Only what CSS can't do: nav state, mobile menu,
   scroll reveals, active link, optional contact wiring.
   ========================================================= */
(function () {
  'use strict';

  /* ---- CONTACT CONFIG ---------------------------------------
     Add real details here. Until then, all "Start a project /
     Let's talk" buttons simply scroll to the contact section,
     and no contact details are shown.                        */
  var CONTACT = {
    email: 'creatororbit48@gmail.com',
    instagram: 'creator_orbit',
    phone: ''
  };
  var PROJECTS = { shopniva: '', gamingMarketplace: '' };

  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('menu');
  var progress = document.getElementById('scrollProgress');
  var scrollQueued = false;

  /* Nav background on scroll */
  function onScroll() {
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? window.scrollY / max : 0;
    if (progress) progress.style.transform = 'scaleX(' + Math.max(0, Math.min(1, ratio)) + ')';
    scrollQueued = false;
  }
  onScroll();
  window.addEventListener('scroll', function () {
    if (!scrollQueued) { scrollQueued = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });

  /* Mobile menu */
  function getFocusable() { return Array.prototype.slice.call(menu.querySelectorAll('a[href], button:not([disabled])')); }
  function setMenu(open) {
    var wasOpen = menu.classList.contains('is-open');
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      requestAnimationFrame(function () { getFocusable()[0].focus(); });
    } else if (wasOpen) {
      toggle.focus();
    }
  }
  toggle.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false);
    if (e.key === 'Tab' && menu.classList.contains('is-open')) {
      var focusable = getFocusable();
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.matchMedia('(min-width: 861px)').addEventListener('change', function () { setMenu(false); });

  /* Scroll-triggered reveals */
  var items = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Active nav link */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__links a[href^="#"]:not(.btn)'));
  var map = {};
  links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  var sections = Object.keys(map).map(function (id) { return document.getElementById(id); }).filter(Boolean);
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) { a.classList.remove('is-active'); });
          map[en.target.id].classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { so.observe(s); });
  }

  /* Project screenshot fallback and fade-in */
  document.querySelectorAll('.shot__screen img').forEach(function (img) {
    function loaded() { img.classList.add('is-loaded'); }
    var openButton = img.closest('.shot__open');
    function enableOpen() {
      loaded();
      if (openButton) openButton.disabled = false;
    }
    if (img.complete && img.naturalWidth) enableOpen();
    else img.addEventListener('load', enableOpen);
    img.addEventListener('error', function () {
      if (openButton) openButton.remove();
      else img.remove();
    });
  });

  /* ShopNiva screenshot viewer */
  var lightbox = document.querySelector('.lightbox');
  var lightboxImage = lightbox.querySelector('.lightbox__image');
  var lightboxCaption = lightbox.querySelector('.lightbox__caption');
  var lightboxCounter = lightbox.querySelector('.lightbox__counter');
  var lightboxClose = lightbox.querySelector('.lightbox__close');
  var lightboxPrevious = lightbox.querySelector('.lightbox__prev');
  var lightboxNext = lightbox.querySelector('.lightbox__next');
  var lightboxStage = lightbox.querySelector('.lightbox__stage');
  var activeOpener = null;
  var activeIndex = 0;
  var previousBodyOverflow = '';
  var bodyLocked = false;

  function getLoadedShots() {
    return Array.prototype.slice.call(document.querySelectorAll('.gallery--shopniva .shot__open')).filter(function (button) {
      var image = button.querySelector('img');
      return !button.disabled && image && image.complete && image.naturalWidth > 0;
    });
  }
  function preloadNeighbor(index, shots) {
    if (shots.length < 2) return;
    var neighbor = shots[(index + 1) % shots.length].querySelector('img');
    if (neighbor) {
      var preload = new Image();
      preload.src = neighbor.currentSrc || neighbor.src;
    }
  }
  function showShot(index) {
    var shots = getLoadedShots();
    if (!shots.length) { lightbox.close(); return; }
    activeIndex = (index + shots.length) % shots.length;
    var button = shots[activeIndex];
    var image = button.querySelector('img');
    var figure = button.closest('figure');
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt;
    lightboxCaption.textContent = figure.querySelector('figcaption').textContent.trim();
    lightboxCounter.textContent = (activeIndex + 1) + ' / ' + shots.length;
    preloadNeighbor(activeIndex, shots);
  }
  function openLightbox(button) {
    var shots = getLoadedShots();
    var index = shots.indexOf(button);
    if (index < 0) return;
    activeOpener = button;
    if (!bodyLocked) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      bodyLocked = true;
    }
    lightbox.showModal();
    showShot(index);
    lightboxClose.focus();
  }
  function restoreAfterClose() {
    if (!bodyLocked) return;
    document.body.style.overflow = previousBodyOverflow;
    bodyLocked = false;
    if (activeOpener && activeOpener.isConnected && !activeOpener.disabled) activeOpener.focus();
    activeOpener = null;
    lightboxImage.removeAttribute('src');
  }
  function closeLightbox() {
    if (lightbox.open) {
      lightbox.close();
      restoreAfterClose();
    }
  }
  document.querySelectorAll('.gallery--shopniva .shot__open').forEach(function (button) {
    button.addEventListener('click', function () { openLightbox(button); });
  });
  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrevious.addEventListener('click', function () { showShot(activeIndex - 1); });
  lightboxNext.addEventListener('click', function () { showShot(activeIndex + 1); });
  lightbox.addEventListener('click', function (event) {
    if (event.target === lightbox) closeLightbox();
  });
  lightbox.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') { event.preventDefault(); closeLightbox(); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); showShot(activeIndex - 1); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); showShot(activeIndex + 1); }
    else if (event.key === 'Tab') {
      var focusable = Array.prototype.slice.call(lightbox.querySelectorAll('button:not(:disabled)'));
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  var touchStartX = null;
  lightboxStage.addEventListener('touchstart', function (event) {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  lightboxStage.addEventListener('touchend', function (event) {
    if (touchStartX === null) return;
    var distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) > 48) showShot(activeIndex + (distance < 0 ? 1 : -1));
    touchStartX = null;
  }, { passive: true });
  lightbox.addEventListener('close', function () {
    restoreAfterClose();
  });

  /* Service rows: active at the viewport centre */
  var serviceRows = document.querySelectorAll('.service-row');
  if ('IntersectionObserver' in window) {
    var rowObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add('is-active');
        else entry.target.classList.remove('is-active');
      });
    }, { threshold: 0.6 });
    serviceRows.forEach(function (row) { rowObserver.observe(row); });
  }

  /* Orbit discipline selector */
  var orbitDescriptions = [
    ['01 / BUILD', 'Fast, custom, responsive websites and shops.'],
    ['02 / WRITE', 'The words that explain the value and guide the visitor.'],
    ['03 / OPTIMIZE', 'Making the site easy to find in search and AI answers.'],
    ['04 / CONVERT', 'Shaping layout and journey so visitors take action.']
  ];
  var orbitNodes = Array.prototype.slice.call(document.querySelectorAll('.orbit-node'));
  var orbitPanel = document.querySelector('.orbit-panel');
  function selectOrbit(index) {
    orbitNodes.forEach(function (node, i) {
      var selected = i === index;
      node.classList.toggle('is-selected', selected);
      node.setAttribute('aria-pressed', String(selected));
      node.setAttribute('aria-expanded', String(selected));
    });
    if (orbitPanel) orbitPanel.innerHTML = '<span class="orbit-panel__num">' + orbitDescriptions[index][0] + '</span><p>' + orbitDescriptions[index][1] + '</p>';
  }
  orbitNodes.forEach(function (node, index) {
    node.addEventListener('click', function () { selectOrbit(index); });
    node.addEventListener('keydown', function (e) {
      var next = index;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % orbitNodes.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index + orbitNodes.length - 1) % orbitNodes.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = orbitNodes.length - 1;
      else return;
      e.preventDefault(); selectOrbit(next); orbitNodes[next].focus();
    });
  });

  /* Interactive process timeline */
  var stepsEl = document.querySelector('.steps');
  var steps = Array.prototype.slice.call(document.querySelectorAll('.step'));
  var processArts = document.querySelectorAll('.process-art');
  function selectStep(index) {
    steps.forEach(function (step, i) {
      var active = i === index;
      step.classList.toggle('is-active', active);
      step.setAttribute('aria-selected', String(active));
      if (active) step.setAttribute('aria-current', 'step'); else step.removeAttribute('aria-current');
    });
    processArts.forEach(function (art, i) { art.classList.toggle('is-active', i === index); });
    if (stepsEl) stepsEl.style.setProperty('--progress', String(index / Math.max(1, steps.length - 1)));
  }
  steps.forEach(function (step, index) {
    step.addEventListener('click', function () { selectStep(index); });
    step.addEventListener('keydown', function (e) {
      var next = index;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % steps.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index + steps.length - 1) % steps.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = steps.length - 1;
      else return;
      e.preventDefault(); selectStep(next); steps[next].focus();
    });
  });
  if ('IntersectionObserver' in window) {
    var stepObserver = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (entry) { return entry.isIntersecting; });
      if (visible.length) {
        var closest = visible.reduce(function (a, b) {
          return Math.abs(a.boundingClientRect.top - window.innerHeight * .5) < Math.abs(b.boundingClientRect.top - window.innerHeight * .5) ? a : b;
        });
        selectStep(Number(closest.target.getAttribute('data-step')));
      }
    }, { threshold: [0.35, 0.6] });
    steps.forEach(function (step) { stepObserver.observe(step); });
  }

  /* Contact wiring */
  var subject = 'New project enquiry — CreatorOrbit';
  var body = "Hi CreatorOrbit, I'd like to talk about a project:";
  function encodeMailPart(value) {
    return encodeURIComponent(value).replace(/[!'()*]/g, function (character) {
      return '%' + character.charCodeAt(0).toString(16).toUpperCase();
    });
  }
  var mailto = 'mailto:' + CONTACT.email + '?subject=' + encodeMailPart(subject) + '&body=' + encodeMailPart(body);
  document.querySelectorAll('[data-contact]').forEach(function (link) {
    link.setAttribute('href', mailto);
  });
  document.querySelectorAll('[data-contact-email]').forEach(function (link) {
    link.setAttribute('href', mailto);
    link.textContent = CONTACT.email;
  });
  var instagramUrl = 'https://www.instagram.com/' + encodeURIComponent(CONTACT.instagram.replace(/^@/, '')) + '/';
  document.querySelectorAll('[data-instagram]').forEach(function (link) {
    link.setAttribute('href', instagramUrl);
    if (link.closest('.contact__details')) link.textContent = '@' + CONTACT.instagram.replace(/^@/, '');
  });
})();
