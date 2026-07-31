/* ============================================================
   OpenPulse interactions
   ============================================================ */
(function () {
  'use strict';

  window.__openpulseBooted = true;   // tells the <head> guard the script ran

  /* Where the contact form posts. Drop in a Formspree / Basin / own endpoint
     URL and the form will POST to it. Left empty, the form hands the message
     to the visitor's mail client instead, so nothing is ever discarded. */
  var ENDPOINT = '';
  var CONTACT_EMAIL = 'contact@openpulse.eu';

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

    var fallback = function (lead) {
      /* Never silently swallow a message. Hand it to the visitor's mail
         client with everything they typed, and print the address as well so
         it is recoverable if no mail client opens. The form is NOT reset
         here, so nothing they wrote is lost either way. */
      var get = function (id) {
        var el = document.getElementById(id);
        return el && el.value.trim();
      };
      var body = [
        'Name: ' + (get('f-name') || ''),
        'Email: ' + (get('f-email') || ''),
        'Use case: ' + (get('f-case') || ''),
        '',
        'What we want to measure:',
        get('f-measure') || '',
        '',
        'Anything else:',
        get('f-notes') || '',
        '',
        'Configuration: ' + ((configField && configField.value) || 'not set')
      ].join('\n');

      var href = 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent('OpenPulse enquiry from ' + (get('f-name') || 'the website')) +
        '&body=' + encodeURIComponent(body);

      success.hidden = false;
      success.innerHTML = '';
      success.appendChild(document.createTextNode(lead + ' Your message is ready in your mail app. If nothing opened, write to '));
      var a = document.createElement('a');
      a.href = 'mailto:' + CONTACT_EMAIL;
      a.textContent = CONTACT_EMAIL;
      success.appendChild(a);
      success.appendChild(document.createTextNode(' and everything above comes with you.'));

      btn.disabled = false;
      btn.textContent = 'Start the conversation';
      window.location.href = href;
    };

    if (!ENDPOINT) { fallback('Almost there.'); return; }

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
        fallback('That didn’t send.');
      });
  });

  /* ---------- hero: scroll-scrubbed rotation ----------
     The band turns from three-quarter to face-on as you scroll the hero, on
     every device.

     Frames are painted into a <canvas> rather than showing the <video>
     directly. A video element repaints on its own schedule, and iOS Safari
     defers that during momentum scroll, so a scrubbed video stalls and then
     jumps. A canvas holds whatever was last drawn into it and repaints like
     any other element, so the worst case is the animation lagging the finger
     briefly rather than freezing or blanking.

     The video still does the decoding, and stays in the DOM (transparent,
     behind the canvas) because iOS will not decode a detached or display:none
     element. The still underneath is only hidden once a real frame has been
     painted, so any failure leaves the poster image in place.             */

  var heroMedia = document.getElementById('heroMedia');
  var conn = navigator.connection;
  var saveData = Boolean(conn && conn.saveData);

  if (heroMedia && !reduceMotion && !saveData) {
    var FPS = 24;
    var video = document.createElement('video');
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    video.className = 'hero-source';
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    /* iOS only honours these as attributes, set before the source */
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.preload = 'auto';
    video.setAttribute('aria-hidden', 'true');
    video.setAttribute('tabindex', '-1');
    video.src = 'assets/video/hero-rotate.mp4';

    canvas.className = 'hero-canvas';
    canvas.setAttribute('aria-hidden', 'true');

    /* In the DOM immediately: iOS starts fetching only once attached, and
       waiting on loadeddata first is how this failed before. */
    heroMedia.appendChild(video);

    var duration = 0;
    var lastFrame = 0;
    var seeking = false;
    var wanted = 0;
    var shown = -1;
    var painted = false;

    var paint = function () {
      if (!canvas.width) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      if (!painted) {
        painted = true;
        heroMedia.classList.add('has-canvas');   // now safe to hide the still
      }
    };

    var step = function () {
      if (!duration || seeking) return;
      var frame = Math.max(0, Math.min(lastFrame, Math.round(wanted * FPS)));
      if (frame === shown) return;
      var t = frame / FPS;
      shown = frame;
      /* Assigning the time it already holds fires no `seeked`, which would
         latch `seeking` on forever. Only flag a seek that will really happen. */
      if (Math.abs(video.currentTime - t) < 0.001) { paint(); return; }
      seeking = true;
      video.currentTime = t;
    };

    var settled = function () {
      seeking = false;
      paint();
      step();                        // catch up if scroll moved mid-seek
    };
    video.addEventListener('seeked', settled);
    video.addEventListener('error', function () { seeking = false; });

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

    var ready = function () {
      if (duration) return;                       // already set up
      if (!video.videoWidth || !video.duration) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      duration = video.duration;
      lastFrame = Math.round(duration * FPS) - 1;
      heroMedia.appendChild(canvas);
      paint();
      onHeroScroll();
      window.addEventListener('scroll', onHeroScroll, { passive: true });
      window.addEventListener('resize', onHeroScroll, { passive: true });
    };

    video.addEventListener('loadeddata', ready);
    video.addEventListener('canplay', ready);
    video.addEventListener('loadedmetadata', function () {
      /* Nudge iOS into actually buffering. A muted inline play() is allowed;
         pausing straight away leaves the first frame decoded and ready. */
      var pr = video.play();
      if (pr && pr.then) {
        pr.then(function () { video.pause(); ready(); })
          .catch(function () { ready(); });
      } else {
        ready();
      }
    });

    /* Low Power Mode blocks even muted autoplay, so use the first gesture. */
    var nudge = function () {
      if (duration) return;
      var pr = video.play();
      if (pr && pr.then) pr.then(function () { video.pause(); ready(); }).catch(function () {});
    };
    window.addEventListener('touchstart', nudge, { passive: true, once: true });

    video.load();
  }

  /* ---------- footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
