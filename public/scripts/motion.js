(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (typeof gsap === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- HERO TITLE REVEAL ---------- */
  const hero = document.querySelector(".hero-title");
  if (hero) {
    requestAnimationFrame(() => hero.classList.add("is-in"));
  }

  /* ---------- SCROLL REVEALS ---------- */
  const targets = [
    ".statement-eyebrow",
    ".statement-text",
    ".section-head",
    ".filters",
    ".work-card",
    ".case-block",
    ".about-copy > *",
    ".about-side .side-block",
    ".service",
    ".contact-copy > *",
    ".contact-form"
  ];

  targets.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.classList.add("reveal-target");
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () => el.classList.add("is-in")
      });
    });
  });

  /* ---------- PROCESS: SWAP STICKY FRAME LABEL + SWATCH AS YOU SCROLL ----------
     Data-driven: each .case-block declares its own label + swatch via
       data-step-label and data-step-swatch attributes (set in Elementor).
     Add or remove blocks freely — this loop adapts.
  ----------------------------------------------------------------------------- */
  const procBlocks = document.querySelectorAll("#process-grid .case-block");
  const procLabel  = document.querySelector("#process-grid .case-frame-label");
  const procVisual = document.querySelector("#process-grid .case-visual");
  const setStep = (block) => {
    const label  = block.dataset.stepLabel;
    const swatch = block.dataset.stepSwatch;
    if (procLabel && label)   procLabel.textContent = label;
    if (procVisual && swatch) procVisual.dataset.swatch = swatch;
  };
  procBlocks.forEach((block) => {
    ScrollTrigger.create({
      trigger: block,
      start: "top 60%",
      end: "bottom 40%",
      onEnter:     () => setStep(block),
      onEnterBack: () => setStep(block)
    });
  });

  /* ---------- ACCENT SWEEP ON SECTION TITLES ---------- */
  document.querySelectorAll(".section-title .italic").forEach((el) => {
    gsap.fromTo(el,
      { color: "var(--ink-dim)" },
      {
        color: "var(--accent)",
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top 75%",
          end: "top 35%",
          scrub: true
        }
      }
    );
  });
})();
