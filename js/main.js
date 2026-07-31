/* ============================================================
   OpenPulse interactions
   ============================================================ */
(function () {
  'use strict';

  window.__openpulseBooted = true;   // tells the <head> guard the script ran

  /* ---------- copy, per language ----------
     The German page is a separate document at /de/. Everything the script
     writes into the page is looked up here off <html lang>, so the two stay
     in step without duplicating the logic.                                */
  var STRINGS = {
    en: {
      slots:      { body1: 'Body 1', body2: 'Body 2', env: 'Environment' },
      empty:      'empty',
      coreEmpty:  '',
      loadedCount: function (n) { return n + ' of 3 loaded'; },
      load:       'Load into core',
      loaded:     'Loaded',
      required:   'This one we need.',
      badEmail:   'That address looks incomplete.',
      sending:    'Sending\u2026',
      submit:     'Start the conversation',
      thanks:     'Thanks, that\u2019s with us. We read every message and reply in person.',
      almost:     'Almost there.',
      failed:     'That didn\u2019t send.',
      mailLead:   ' Your message is ready in your mail app. If nothing opened, write to ',
      mailTail:   ' and everything above comes with you.',
      mailSubject: function (name) { return 'OpenPulse enquiry from ' + name; },
      fromSite:   'the website',
      fName: 'Name', fEmail: 'Email', fCase: 'Use case',
      fMeasure: 'What we want to measure:', fNotes: 'Anything else:',
      fConfig: 'Configuration: ', notSet: 'not set'
    },
    de: {
      slots:      { body1: 'K\u00f6rper 1', body2: 'K\u00f6rper 2', env: 'Umgebung' },
      empty:      'leer',
      coreEmpty:  '',
      loadedCount: function (n) { return n + ' von 3 geladen'; },
      load:       'In den Core laden',
      loaded:     'Geladen',
      required:   'Das brauchen wir noch.',
      badEmail:   'Diese Adresse sieht unvollst\u00e4ndig aus.',
      sending:    'Wird gesendet\u2026',
      submit:     'Gespr\u00e4ch beginnen',
      thanks:     'Danke, Ihre Nachricht ist bei uns. Wir lesen jede und antworten pers\u00f6nlich.',
      almost:     'Fast geschafft.',
      failed:     'Das konnte nicht gesendet werden.',
      mailLead:   ' Ihre Nachricht liegt in Ihrem E-Mail-Programm bereit. Falls sich nichts ge\u00f6ffnet hat, schreiben Sie an ',
      mailTail:   ', dann kommt alles von oben mit.',
      mailSubject: function (name) { return 'OpenPulse Anfrage von ' + name; },
      fromSite:   'der Website',
      fName: 'Name', fEmail: 'E-Mail', fCase: 'Anwendungsfall',
      fMeasure: 'Was gemessen werden soll:', fNotes: 'Sonstiges:',
      fConfig: 'Konfiguration: ', notSet: 'nicht gesetzt'
    }
  };
  var L = STRINGS[(document.documentElement.lang || 'en').slice(0, 2)] || STRINGS.en;

  /* Where the contact form posts. Drop in a Formspree / Basin / own endpoint
     URL and the form will POST to it. Left empty, the form hands the message
     to the visitor's mail client instead, so nothing is ever discarded. */
  var ENDPOINT = 'https://formspree.io/f/xnjeyvzr';
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

  var SLOT_NAMES = L.slots;
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
      li.querySelector('span').textContent = val || L.empty;
    });

    var count = Object.keys(loaded).length;
    slotStatus.textContent = count === 0 ? L.coreEmpty : L.loadedCount(count);
    slotStatus.classList.toggle('is-on', count > 0);

    if (configField) {
      configField.value = ['body1', 'body2', 'env'].map(function (k) {
        return SLOT_NAMES[k] + ': ' + (loaded[k] || L.empty);
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

      txt.textContent = isOn ? L.loaded : L.load;
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
      fieldError(input, L.required);
      return false;
    }
    if (input.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      fieldError(input, L.badEmail);
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
      btn.textContent = L.submit;
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
        L.fName + ': ' + (get('f-name') || ''),
        L.fEmail + ': ' + (get('f-email') || ''),
        L.fCase + ': ' + (get('f-case') || ''),
        '',
        L.fMeasure,
        get('f-measure') || '',
        '',
        L.fNotes,
        get('f-notes') || '',
        '',
        L.fConfig + ((configField && configField.value) || L.notSet)
      ].join('\n');

      var href = 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent(L.mailSubject(get('f-name') || L.fromSite)) +
        '&body=' + encodeURIComponent(body);

      success.hidden = false;
      success.innerHTML = '';
      success.appendChild(document.createTextNode(lead + L.mailLead));
      var a = document.createElement('a');
      a.href = 'mailto:' + CONTACT_EMAIL;
      a.textContent = CONTACT_EMAIL;
      success.appendChild(a);
      success.appendChild(document.createTextNode(L.mailTail));

      btn.disabled = false;
      btn.textContent = L.submit;
      window.location.href = href;
    };

    if (!ENDPOINT) { fallback(L.almost); return; }

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

  /* ---------- scroll-scrubbed clips ----------
     Frames are painted into a <canvas> rather than shown through the <video>.
     A video element repaints on its own schedule and iOS Safari defers that
     during momentum scroll, so a scrubbed video stalls and then jumps. A
     canvas keeps whatever was last drawn and repaints like any other element,
     so the worst case is the animation trailing the finger.

     The video stays in the DOM behind the canvas, transparent, purely as the
     decoder: iOS will not decode a detached or display:none element. The
     still underneath is hidden only once a real frame has been painted, so
     any failure leaves the poster image in place.                          */

  function scrubClip(host, src, progressOf) {
    if (!host) return;

    var FPS = 24;
    var video = document.createElement('video');
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    video.className = 'clip-source';
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
    video.src = src;

    canvas.className = 'clip-canvas';
    canvas.setAttribute('aria-hidden', 'true');

    /* Attach immediately. iOS starts fetching only once the element is in the
       document, and gating this on loadeddata is how the hero failed before. */
    host.appendChild(video);

    var duration = 0, lastFrame = 0, seeking = false, wanted = 0, shown = -1, painted = false;

    function paint() {
      if (!canvas.width) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      if (!painted) { painted = true; host.classList.add('has-canvas'); }
    }

    function step() {
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
    }

    video.addEventListener('seeked', function () { seeking = false; paint(); step(); });
    video.addEventListener('error', function () { seeking = false; });

    var ticking = false;
    function onScrollTick() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        wanted = Math.max(0, Math.min(1, progressOf(host))) * duration;
        step();
      });
    }

    function ready() {
      if (duration) return;
      if (!video.videoWidth || !video.duration) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      duration = video.duration;
      lastFrame = Math.round(duration * FPS) - 1;
      host.appendChild(canvas);
      paint();
      onScrollTick();
      window.addEventListener('scroll', onScrollTick, { passive: true });
      window.addEventListener('resize', onScrollTick, { passive: true });
    }

    video.addEventListener('loadeddata', ready);
    video.addEventListener('canplay', ready);
    video.addEventListener('loadedmetadata', function () {
      /* Nudge iOS into buffering. A muted inline play() is permitted; pausing
         immediately leaves the first frame decoded and ready to seek from. */
      var pr = video.play();
      if (pr && pr.then) pr.then(function () { video.pause(); ready(); }).catch(ready);
      else ready();
    });

    /* Low Power Mode blocks even muted autoplay, so take the first gesture. */
    window.addEventListener('touchstart', function nudge() {
      if (duration) return;
      var pr = video.play();
      if (pr && pr.then) pr.then(function () { video.pause(); ready(); }).catch(function () {});
    }, { passive: true, once: true });

    video.load();
  }

  var conn = navigator.connection;
  var saveData = Boolean(conn && conn.saveData);

  if (!reduceMotion && !saveData) {
    /* Hero sits at the top: drive it off absolute scroll through the section. */
    scrubClip(
      document.getElementById('heroMedia'),
      'assets/video/hero-rotate.mp4',
      function (host) {
        var hero = host.closest('.hero');
        return window.scrollY / (hero.offsetHeight * 0.85);
      }
    );

    /* The exploded view is mid-page, so it runs on its own travel through the
       viewport: 0 as it enters from below, 1 as it leaves past the top. */
    scrubClip(
      document.getElementById('explodedMedia'),
      'assets/video/exploded-drift.mp4',
      function (host) {
        var r = host.getBoundingClientRect();
        return (window.innerHeight - r.top) / (window.innerHeight + r.height);
      }
    );
  }

  /* ---------- footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
