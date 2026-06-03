(function () {
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("[data-nav]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const page = document.body.dataset.page;
  const modal = document.querySelector("[data-contact]");
  const contactForm = document.querySelector("[data-contact-form]");
  const openContactButtons = document.querySelectorAll("[data-open-contact]");
  const closeContactButtons = document.querySelectorAll("[data-close-contact]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const activeMap = {
    landing: "index.html",
    hardware: "hardware.html",
    cases: "use-cases.html",
    team: "team.html",
    competitions: "competitions.html",
  };

  if (nav && activeMap[page]) {
    nav.querySelectorAll("a").forEach((link) => {
      if (link.getAttribute("href") === activeMap[page]) {
        link.classList.add("is-active");
      }
    });
  }

  const setHeaderState = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

  if (navToggle && nav) {
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("nav-open", isOpen);
    });
    nav.querySelectorAll("a, button").forEach((item) => {
      item.addEventListener("click", () => {
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-open");
      });
    });
  }

  const openContact = (segment) => {
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    const select = modal.querySelector("select[name='segment']");
    if (segment && select) {
      const option = Array.from(select.options).find((entry) => entry.textContent === segment);
      if (option) select.value = option.value;
    }
    const firstInput = modal.querySelector("input, textarea, select");
    if (firstInput) firstInput.focus();
  };

  const closeContact = () => {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  };

  openContactButtons.forEach((button) => {
    button.addEventListener("click", () => openContact(button.dataset.segment));
  });

  closeContactButtons.forEach((button) => button.addEventListener("click", closeContact));

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeContact();
    });
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeContact();
      if (nav) nav.classList.remove("is-open");
      if (navToggle) navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    }
  });

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(contactForm);
      const lines = [
        "Name: " + (data.get("name") || ""),
        "Organization: " + (data.get("organization") || ""),
        "Segment: " + (data.get("segment") || ""),
        "",
        "Measurement need:",
        data.get("message") || "",
      ];
      const subject = encodeURIComponent("OpenPulse pilot inquiry");
      const body = encodeURIComponent(lines.join("\n"));
      window.location.href = "mailto:hello@openpulse.dev?subject=" + subject + "&body=" + body;
      let status = contactForm.querySelector(".form-status");
      if (!status) {
        status = document.createElement("p");
        status.className = "form-status";
        contactForm.appendChild(status);
      }
      status.textContent = "Opening your email client with the pilot brief.";
    });
  }

  const revealTargets = document.querySelectorAll(
    ".section-copy, .centered-heading, .section-topline, .loop-step, .pillar-card, .segment-card, .sensor-card, .case-detail, .case-spotlight, .opportunity-row, .founder-card, .competition-card, .timeline-item, .trust-grid div, .metric-card, .build-board, .image-collage, .device-map, .pipeline-step, .config-board"
  );

  revealTargets.forEach((target, index) => {
    target.classList.add("reveal-item");
    target.style.transitionDelay = reducedMotion ? "0ms" : Math.min((index % 5) * 45, 180) + "ms";
  });

  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );

    revealTargets.forEach((target) => revealObserver.observe(target));
  }

  const sequences = document.querySelectorAll("[data-sequence]");

  const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

  sequences.forEach((img) => {
    const count = Number(img.dataset.sequenceCount || 1);
    const path = img.dataset.sequencePath;
    if (!path || !count || reducedMotion) return;

    const loaded = new Set();
    const frameUrl = (index) => path + String(index).padStart(4, "0") + ".webp";

    const preload = () => {
      for (let i = 1; i <= count; i += 18) {
        if (loaded.has(i)) continue;
        const probe = new Image();
        probe.src = frameUrl(i);
        loaded.add(i);
      }
    };

    const update = () => {
      const rect = img.getBoundingClientRect();
      const start = window.innerHeight;
      const end = -rect.height;
      const progress = clamp((start - rect.top) / (start - end), 0, 1);
      const frame = clamp(Math.round(progress * (count - 1)) + 1, 1, count);
      const src = frameUrl(frame);
      if (img.getAttribute("src") !== src) {
        img.setAttribute("src", src);
      }
    };

    preload();
    update();
    window.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
    window.addEventListener("resize", () => requestAnimationFrame(update));
  });

  const filterButtons = document.querySelectorAll("[data-filter]");
  const filterCards = document.querySelectorAll("[data-case-card]");
  const caseDetails = document.querySelectorAll("[data-case-detail]");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      filterButtons.forEach((entry) => entry.classList.toggle("is-active", entry === button));
      filterCards.forEach((card) => {
        const show = filter === "all" || card.dataset.caseCard === filter;
        card.hidden = !show;
      });
      caseDetails.forEach((detail) => {
        const show = filter === "all" || detail.dataset.caseDetail === filter;
        detail.hidden = !show;
      });
    });
  });
})();
