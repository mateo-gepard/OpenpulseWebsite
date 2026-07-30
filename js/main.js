/* ============================================================
   OpenPulse interactions
   ============================================================ */
(function () {
  'use strict';

  /* Where the contact form posts. Drop in a Formspree / Basin / own
     endpoint URL and the form will POST to it; left empty, the form
     validates and confirms locally without sending anything. */
  var ENDPOINT = '';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- header: border once you leave the top ---------- */
  var header = document.getElementById('siteHeader');
  var onScroll = function () {
    header.classList.toggle('is-stuck', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- menu ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var menu = document.getElementById('menu');

  function menuOpen() {
    return menuBtn.getAttribute('aria-expanded') === 'true';
  }
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
  }
  menuBtn.addEventListener('click', function () {
    setMenu(!menuOpen());
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  /* click anywhere outside the panel or the button closes it */
  document.addEventListener('click', function (e) {
    if (!menuOpen()) return;
    if (menu.contains(e.target) || menuBtn.contains(e.target)) return;
    setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuOpen()) {
      setMenu(false);
      menuBtn.focus();
    }
  });

  /* ---------- configurator ----------
     Each puck has one home slot. Loading a puck fills the matching
     indicator in the header and the readout above the contact form,
     so the message you send carries the configuration you built.   */

  var SLOT_NAMES = { body1: 'Body 1', body2: 'Body 2', env: 'Environment' };
  var loaded = {};

  var panels = Array.prototype.slice.call(document.querySelectorAll('[data-puck]'));
  var slotEls = Array.prototype.slice.call(document.querySelectorAll('.slot'));
  var slotStatus = document.getElementById('slotStatus');
  var configField = document.getElementById('f-config');

  function render() {
    slotEls.forEach(function (el) {
      var key = el.dataset.slot;
      var on = Boolean(loaded[key]);
      el.classList.toggle('is-filled', on);
      var name = el.querySelector('.slot-name');
      if (name) name.textContent = on ? loaded[key] : SLOT_NAMES[key];
    });

    document.querySelectorAll('[data-readout]').forEach(function (li) {
      var key = li.dataset.readout;
      var val = loaded[key];
      li.classList.toggle('is-set', Boolean(val));
      li.querySelector('span').textContent = val || 'empty';
    });

    var count = Object.keys(loaded).length;
    slotStatus.textContent = count === 0 ? '' : count + ' of 3 loaded';
    slotStatus.classList.toggle('is-on', count > 0);

    if (configField) {
      configField.value = ['body1', 'body2', 'env'].map(function (k) {
        return SLOT_NAMES[k] + ': ' + (loaded[k] || 'empty');
      }).join(' | ');
    }
  }

  panels.forEach(function (panel) {
    var btn = panel.querySelector('[data-load]');
    var txt = panel.querySelector('.puck-btn-txt');
    var slot = panel.dataset.slot;
    var label = panel.dataset.label;

    btn.addEventListener('click', function () {
      var isOn = panel.classList.toggle('is-loaded');
      if (isOn) loaded[slot] = label;
      else delete loaded[slot];

      txt.textContent = isOn ? 'Loaded' : 'Load into core';
      btn.setAttribute('aria-pressed', String(isOn));
      render();
    });

    btn.setAttribute('aria-pressed', 'false');
  });

  render();

  /* ---------- scroll reveal ---------- */
  var revealables = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.06 });

    revealables.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 90 + 'ms';
      io.observe(el);
    });
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById('contactForm');
  var success = document.getElementById('formSuccess');

  function fieldError(input, message) {
    var field = input.closest('.field');
    var slot = field.querySelector('[data-err]');
    field.classList.toggle('is-invalid', Boolean(message));
    if (slot) slot.textContent = message || '';
  }

  function validate(input) {
    var v = input.value.trim();
    if (input.required && !v) {
      fieldError(input, 'This one we need.');
      return false;
    }
    if (input.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      fieldError(input, 'That address looks incomplete.');
      return false;
    }
    fieldError(input, '');
    return true;
  }

  form.querySelectorAll('input, textarea').forEach(function (input) {
    input.addEventListener('blur', function () {
      if (input.value.trim()) validate(input);
    });
    input.addEventListener('input', function () {
      if (input.closest('.field').classList.contains('is-invalid')) validate(input);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var inputs = Array.prototype.slice.call(form.querySelectorAll('input[required], textarea[required]'));
    var ok = inputs.map(validate).every(Boolean);

    if (!ok) {
      var first = form.querySelector('.is-invalid input, .is-invalid textarea');
      if (first) first.focus();
      return;
    }

    var btn = form.querySelector('button[type="submit"]');
    var confirm = function () {
      form.reset();
      success.hidden = false;
      success.textContent = 'Thanks, that’s with us. We read every message and reply in person.';
      btn.disabled = false;
      btn.textContent = 'Start the conversation';
    };

    if (!ENDPOINT) { confirm(); return; }

    btn.disabled = true;
    btn.textContent = 'Sending…';

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form)
    })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        confirm();
      })
      .catch(function () {
        success.hidden = false;
        success.textContent = 'That didn’t send. Email us directly at hello@openpulse.dev and we’ll pick it up.';
        btn.disabled = false;
        btn.textContent = 'Start the conversation';
      });
  });

  /* ---------- hero: rotation clip ----------
     Pointer devices scrub the rotation against hero scroll position. Touch
     devices play it through once when it comes into view instead: iOS Safari
     throttles seeks during momentum scroll, which makes scrubbing stall and
     then jump, and a clean one-shot reads far better than that.
     Either way the still stays in the markup and is only replaced once the
     clip is actually usable, so a failed or slow load degrades to the image. */

  var heroMedia = document.getElementById('heroMedia');
  var coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  var conn = navigator.connection;
  var saveData = Boolean(conn && conn.saveData);

  if (heroMedia && !reduceMotion && !saveData && coarse) {
    var clip = document.createElement('video');
    clip.className = 'hero-video';
    clip.src = 'assets/video/hero-rotate.mp4';
    clip.poster = 'assets/img/hero-still.webp';
    clip.muted = true;
    clip.defaultMuted = true;
    clip.playsInline = true;
    clip.setAttribute('muted', '');
    clip.setAttribute('playsinline', '');
    clip.preload = 'auto';
    clip.setAttribute('aria-hidden', 'true');
    clip.setAttribute('tabindex', '-1');

    clip.addEventListener('loadeddata', function () {
      heroMedia.classList.add('has-video');
      heroMedia.appendChild(clip);

      var play = function () {
        var p = clip.play();
        if (p && p.catch) p.catch(function () {});   // blocked: poster stands in
      };

      if (!('IntersectionObserver' in window)) { play(); return; }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.disconnect();
          play();
        });
      }, { threshold: 0.35 });
      io.observe(heroMedia);
    }, { once: true });

    clip.load();
  }

  if (heroMedia && !reduceMotion && !saveData && !coarse) {
    var video = document.createElement('video');
    video.className = 'hero-video';
    video.src = 'assets/video/hero-rotate.mp4';
    video.poster = 'assets/img/hero-still.webp';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('aria-hidden', 'true');
    video.setAttribute('tabindex', '-1');

    var FPS = 24;
    var duration = 0;
    var seeking = false;
    var wanted = 0;
    var shown = -1;

    var step = function () {
      if (!duration || seeking) return;
      var last = Math.round(duration * FPS) - 1;
      var frame = Math.max(0, Math.min(last, Math.round(wanted * FPS)));
      if (frame === shown) return;
      var t = frame / FPS;
      shown = frame;
      /* Assigning the time it is already on fires no `seeked`, which would
         latch `seeking` on forever. Only flag a seek we know will happen. */
      if (Math.abs(video.currentTime - t) < 0.001) return;
      seeking = true;
      video.currentTime = t;
    };

    var done = function () {
      seeking = false;
      step();                       // catch up if scroll moved mid-seek
    };
    video.addEventListener('seeked', done);
    video.addEventListener('error', done);

    var ticking = false;
    var onHeroScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var hero = heroMedia.closest('.hero');
        var span = hero.offsetHeight * 0.85;
        var p = Math.max(0, Math.min(1, window.scrollY / span));
        wanted = p * duration;
        step();
      });
    };

    video.addEventListener('loadeddata', function () {
      duration = video.duration || 42 / FPS;
      heroMedia.classList.add('has-video');
      heroMedia.appendChild(video);
      onHeroScroll();
      window.addEventListener('scroll', onHeroScroll, { passive: true });
      window.addEventListener('resize', onHeroScroll, { passive: true });
    }, { once: true });

    video.addEventListener('error', function () {
      heroMedia.classList.remove('has-video');
    });

    video.load();
  }

  /* ---------- footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
