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

  const configurators = document.querySelectorAll("[data-configurator]");
  const puckCatalog = {
    pulse: {
      id: "pulse",
      label: "Pulse",
      chip: "PPG",
      type: "body",
      theme: "ppg",
      accent: "var(--ppg)",
      summary: "optical pulse",
    },
    stress: {
      id: "stress",
      label: "EDA",
      chip: "EDA",
      type: "body",
      theme: "eda",
      accent: "var(--eda)",
      summary: "skin conductance response",
    },
    temp: {
      id: "temp",
      label: "Temp",
      chip: "TEMP",
      type: "body",
      theme: "temp",
      accent: "var(--temp)",
      summary: "skin temperature trend",
    },
    motion: {
      id: "motion",
      label: "Motion",
      chip: "IMU",
      type: "body",
      theme: "imu",
      accent: "var(--imu)",
      summary: "movement context",
    },
    gas: {
      id: "gas",
      label: "Gas",
      chip: "GAS",
      type: "environment",
      theme: "env",
      accent: "var(--bioz)",
      summary: "environment context",
    },
  };
  const configLimits = { body: 2, environment: 1 };
  const configPresets = {
    research: ["pulse", "stress", "temp"],
    safety: ["pulse", "motion", "gas"],
    wellness: ["pulse", "stress", "motion"],
  };

  const sameSet = (a, b) => {
    if (a.length !== b.length) return false;
    return a.slice().sort().join("|") === b.slice().sort().join("|");
  };

  const formatPuckList = (pucks) => {
    if (pucks.length === 0) return "No modules";
    return pucks.map((puck) => puck.label).join(" + ");
  };

  configurators.forEach((configurator) => {
    const puckButtons = configurator.querySelectorAll("[data-config-puck]");
    const presetButtons = configurator.querySelectorAll("[data-config-preset]");
    const clearButton = configurator.querySelector("[data-config-clear]");
    const slots = configurator.querySelector("[data-config-slots]");
    const bodyCount = configurator.querySelector("[data-config-body-count]");
    const envCount = configurator.querySelector("[data-config-env-count]");
    const outputTitle = configurator.querySelector("[data-config-output-title]");
    const outputCopy = configurator.querySelector("[data-config-output-copy]");

    if (!slots) return;

    let selected = Array.from(puckButtons)
      .filter((button) => button.getAttribute("aria-pressed") === "true")
      .map((button) => button.dataset.configPuck)
      .filter((id) => puckCatalog[id]);

    const removePuck = (id) => {
      selected = selected.filter((entry) => entry !== id);
      renderConfig();
    };

    const addPuck = (id) => {
      const puck = puckCatalog[id];
      if (!puck) return;
      if (selected.includes(id)) {
        removePuck(id);
        return;
      }
      const sameType = selected.filter((entry) => puckCatalog[entry].type === puck.type);
      if (sameType.length >= configLimits[puck.type]) {
        selected = selected.filter((entry) => entry !== sameType[0]);
      }
      selected = selected.concat(id);
      renderConfig();
    };

    const createPuckSlot = (slotType, index, puck) => {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "puck-slot";
      if (slotType === "environment") slot.classList.add("environment-slot");

      const label = document.createElement("span");
      const chip = document.createElement("small");

      if (!puck) {
        slot.classList.add("is-empty");
        slot.disabled = true;
        label.textContent = "empty";
        chip.textContent = slotType === "body" ? "body " + index : "env";
      } else {
        slot.classList.add("active", puck.theme);
        if (puck.type === "environment") slot.classList.add("environment");
        slot.style.setProperty("--puck-accent", puck.accent);
        slot.dataset.configRemove = puck.id;
        slot.setAttribute("aria-label", "Remove " + puck.label + " puck");
        label.textContent = puck.label;
        chip.textContent = puck.chip;

        const pins = document.createElement("b");
        pins.className = "puck-pins";
        pins.setAttribute("aria-hidden", "true");
        const removeIcon = document.createElement("i");
        removeIcon.className = "puck-remove";
        removeIcon.setAttribute("aria-hidden", "true");
        slot.append(pins, removeIcon);
      }

      slot.append(label, chip);
      return slot;
    };

    function renderConfig() {
      const selectedPucks = selected.map((id) => puckCatalog[id]).filter(Boolean);
      const bodyPucks = selectedPucks.filter((puck) => puck.type === "body");
      const envPucks = selectedPucks.filter((puck) => puck.type === "environment");

      puckButtons.forEach((button) => {
        const isSelected = selected.includes(button.dataset.configPuck);
        button.classList.toggle("is-selected", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
      });

      const activePreset = Object.entries(configPresets).find(([, ids]) => sameSet(ids, selected));
      presetButtons.forEach((button) => {
        button.classList.toggle("is-active", Boolean(activePreset && button.dataset.configPreset === activePreset[0]));
      });

      slots.replaceChildren(
        createPuckSlot("body", 1, bodyPucks[0]),
        createPuckSlot("body", 2, bodyPucks[1]),
        createPuckSlot("environment", 1, envPucks[0])
      );

      if (bodyCount) bodyCount.textContent = bodyPucks.length + " / 2 body slots";
      if (envCount) envCount.textContent = envPucks.length + " / 1 environment slot";

      if (outputTitle) {
        outputTitle.textContent = selectedPucks.length ? "Configured pilot stack" : "Open base, no pucks";
      }
      if (outputCopy) {
        if (!selectedPucks.length) {
          outputCopy.textContent = "The base stays reusable. Add only the modules a pilot needs.";
        } else {
          outputCopy.textContent =
            formatPuckList(selectedPucks) +
            " selected: " +
            selectedPucks.map((puck) => puck.summary).join(", ") +
            ". The base stays fixed; the data path changes with the puck stack.";
        }
      }
    }

    puckButtons.forEach((button) => {
      button.addEventListener("click", () => addPuck(button.dataset.configPuck));
    });

    presetButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const preset = configPresets[button.dataset.configPreset];
        if (!preset) return;
        selected = preset.slice();
        renderConfig();
      });
    });

    if (clearButton) {
      clearButton.addEventListener("click", () => {
        selected = [];
        renderConfig();
      });
    }

    slots.addEventListener("click", (event) => {
      const removeButton = event.target.closest("[data-config-remove]");
      if (removeButton) removePuck(removeButton.dataset.configRemove);
    });

    renderConfig();
  });

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
