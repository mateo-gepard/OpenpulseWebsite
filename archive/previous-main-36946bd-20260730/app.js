(function () {
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("[data-nav]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const modal = document.querySelector("[data-contact]");
  const contactForm = document.querySelector("[data-contact-form]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let lastFocusedElement = null;

  const activeMap = {
    home: "/",
    hardware: "/hardware.html",
    cases: "/use-cases.html",
    software: "/software.html",
    team: "/team.html",
    competitions: "/competitions.html",
  };

  const closeNavigation = () => {
    if (!nav || !navToggle) return;
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");
    document.body.classList.remove("nav-open");
  };

  if (nav && activeMap[document.body.dataset.page]) {
    nav.querySelectorAll("a").forEach((link) => {
      if (link.getAttribute("href") === activeMap[document.body.dataset.page]) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  if (header) {
    const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 10);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  if (nav && navToggle) {
    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
      document.body.classList.toggle("nav-open", isOpen);
    });

    nav.querySelectorAll("a, button").forEach((item) => {
      item.addEventListener("click", closeNavigation);
    });
  }

  const openContact = () => {
    if (!modal) return;
    lastFocusedElement = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    const firstField = modal.querySelector("input, textarea, select, button");
    if (firstField) firstField.focus();
  };

  const closeContact = () => {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  };

  document.querySelectorAll("[data-open-contact]").forEach((button) => {
    button.addEventListener("click", openContact);
  });

  document.querySelectorAll("[data-close-contact]").forEach((button) => {
    button.addEventListener("click", closeContact);
  });

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeContact();
    });
  }

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeContact();
    closeNavigation();
  });

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(contactForm);
      const lines = [
        "Name: " + (data.get("name") || ""),
        "Company: " + (data.get("company") || ""),
        "Approximate device count: " + (data.get("deviceCount") || ""),
        "",
        "Measurement requirement:",
        data.get("measurement") || "",
        "",
        "Desired integration:",
        data.get("integration") || "",
      ];
      const subject = encodeURIComponent("OpenPulse company measurement inquiry");
      const body = encodeURIComponent(lines.join("\n"));
      window.location.href = "mailto:hello@openpulse.dev?subject=" + subject + "&body=" + body;

      let status = contactForm.querySelector(".form-status");
      if (!status) {
        status = document.createElement("p");
        status.className = "form-status";
        status.setAttribute("role", "status");
        contactForm.appendChild(status);
      }
      status.textContent = "Your email app is opening with these details.";
    });
  }

  const moduleCatalog = {
    ppg: { label: "PPG", type: "body", status: "working" },
    temperature: { label: "Temperature", type: "body", status: "planned" },
    environment: { label: "Environment", type: "environment", status: "planned" },
  };

  document.querySelectorAll("[data-configurator]").forEach((configurator) => {
    const options = Array.from(configurator.querySelectorAll("[data-module]"));
    const slots = configurator.querySelector("[data-config-slots]");
    const outputBadge = configurator.querySelector("[data-config-badge]");
    const outputTitle = configurator.querySelector("[data-config-title]");
    const outputCopy = configurator.querySelector("[data-config-copy]");
    let selected = options
      .filter((option) => option.getAttribute("aria-pressed") === "true")
      .map((option) => option.dataset.module);

    const render = () => {
      options.forEach((option) => {
        const isSelected = selected.includes(option.dataset.module);
        option.classList.toggle("is-selected", isSelected);
        option.setAttribute("aria-pressed", String(isSelected));
      });

      const selectedModules = selected.map((id) => moduleCatalog[id]).filter(Boolean);
      const bodyModules = selectedModules.filter((module) => module.type === "body");
      const environmentModules = selectedModules.filter((module) => module.type === "environment");

      if (slots) {
        slots.replaceChildren();
        const puckSlots = [bodyModules[0], bodyModules[1], environmentModules[0]];
        puckSlots.forEach((module, index) => {
          const puck = document.createElement("div");
          puck.className = "config-puck";
          if (module) {
            puck.classList.add(module.status);
            const label = document.createElement("strong");
            label.textContent = module.label;
            puck.appendChild(label);
          } else {
            puck.classList.add("empty");
            const label = document.createElement("strong");
            label.textContent = index === 2 ? "ENV" : "BODY";
            puck.appendChild(label);
          }
          slots.appendChild(puck);
        });
      }

      const hasUnfinishedModule = selectedModules.some((module) => module.status !== "working");
      const labels = selectedModules.map((module) => module.label);

      if (outputBadge) {
        outputBadge.className = "status-pill " + (hasUnfinishedModule ? "development" : "working");
        outputBadge.textContent = hasUnfinishedModule ? "Contains planned modules" : "Working today";
      }

      if (outputTitle) {
        outputTitle.textContent = hasUnfinishedModule ? "Example configuration" : "Current prototype configuration";
      }

      if (outputCopy) {
        if (!labels.length) {
          outputCopy.textContent = "Select a sensor puck to explore a configuration.";
        } else if (hasUnfinishedModule) {
          outputCopy.textContent =
            labels.join(" + ") +
            ". This illustrates a potential configuration and is not a currently available product.";
        } else {
          outputCopy.textContent =
            "PPG only. This matches the sensor puck that is fully developed and working today.";
        }
      }
    };

    options.forEach((option) => {
      option.addEventListener("click", () => {
        const id = option.dataset.module;
        const module = moduleCatalog[id];
        if (!module) return;

        if (selected.includes(id)) {
          selected = selected.filter((entry) => entry !== id);
        } else {
          if (module.type === "environment") {
            selected = selected.filter((entry) => moduleCatalog[entry].type !== "environment");
          } else {
            const selectedBody = selected.filter((entry) => moduleCatalog[entry].type === "body");
            if (selectedBody.length >= 2) {
              selected = selected.filter((entry) => entry !== selectedBody[0]);
            }
          }
          selected.push(id);
        }
        render();
      });
    });

    render();
  });

  const revealTargets = document.querySelectorAll(
    ".section-heading, .section-topline, .problem-quote, .problem-item, .process-step, .module-card, .configurator, .photo-panel, .evidence-card, .spec-row, .interface-node, .status-row, .capability-card, .use-card, .software-node, .integration-card, .founder-card, .award-card, .timeline-row"
  );

  revealTargets.forEach((target, index) => {
    target.classList.add("reveal-item");
    target.style.transitionDelay = reducedMotion ? "0ms" : Math.min((index % 4) * 55, 165) + "ms";
  });

  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
    );

    revealTargets.forEach((target) => observer.observe(target));
  }
})();
