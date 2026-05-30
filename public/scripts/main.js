(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;

  /* ---------- LENIS SMOOTH SCROLL ----------
     Buttery momentum-based scroll. Native scroll on touch (mobile). */
  let lenis = null;
  if (typeof Lenis !== "undefined" && !reduceMotion) {
    lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 0.95,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  /* ---------- PAGE LOADER ----------
     Logo signature draws on, then fades out into the hero. */
  document.body.classList.add("is-loading");
  const loader = document.querySelector(".page-loader");
  const dismissLoader = () => {
    loader?.classList.add("is-done");
    document.body.classList.remove("is-loading");
  };
  if (loader) {
    // Match the loader-draw animation length (1.7s = 0.2s delay + 1.5s anim) + small hold
    setTimeout(dismissLoader, 2100);
  } else {
    document.body.classList.remove("is-loading");
  }

  /* ---------- CUSTOM CURSOR ---------- */
  if (!isTouch) {
    const ring = document.querySelector(".cursor");
    const dot  = document.querySelector(".cursor-dot");
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    window.addEventListener("pointermove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });

    const tick = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    };
    tick();

    const interactive = "a, button, .work-card, .filter, .service, input, select, textarea";
    document.querySelectorAll(interactive).forEach((el) => {
      el.addEventListener("pointerenter", () => ring.classList.add("is-active"));
      el.addEventListener("pointerleave", () => ring.classList.remove("is-active"));
    });
  }

  /* ---------- WORK FILTERS ---------- */
  const filters = document.querySelectorAll(".filter");
  const cards = document.querySelectorAll(".work-card");
  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      filters.forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      cards.forEach((card) => {
        const cats = (card.dataset.cat || "").split(/\s+/);
        const match = f === "all" || cats.includes(f);
        card.classList.toggle("is-hidden", !match);
        // Restart the fade-up animation on matching cards, and force them
        // visible even if they never scrolled into view (overrides reveal-target).
        card.classList.remove("filter-in");
        if (match) {
          card.classList.add("is-in");        // defeat scroll-reveal opacity:0
          void card.offsetWidth;               // reflow so the animation re-fires
          card.classList.add("filter-in");
        }
      });
    });
  });

  /* ---------- MAGNETIC HOVER ON BUTTONS ---------- */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll(".btn, .nav-cta, .scroll-cue").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.18;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transform = "";
      });
    });
  }

  /* ---------- NAV BACKGROUND ON SCROLL ---------- */
  const header = document.querySelector(".site-header");
  const onScroll = () => {
    header.style.background = window.scrollY > 40
      ? "rgba(11, 11, 12, 0.85)"
      : "rgba(11, 11, 12, 0.55)";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- HERO REEL SOUND TOGGLE ---------- */
  const reelVideo = document.querySelector(".reel-video");
  const soundBtn  = document.querySelector(".reel-sound");
  if (reelVideo && soundBtn) {
    const reelFrame = reelVideo.closest(".reel-frame");
    const soundText = soundBtn.querySelector(".sound-text");
    soundBtn.addEventListener("click", () => {
      reelVideo.muted = !reelVideo.muted;
      reelFrame.classList.toggle("is-audible", !reelVideo.muted);
      if (soundText) soundText.textContent = reelVideo.muted ? "Muted" : "Sound on";
      if (!reelVideo.muted) reelVideo.play().catch(() => {});
    });
  }

  /* ---------- WORK CARD HOVER VIDEO ---------- */
  if (!isTouch) {
    document.querySelectorAll(".work-card[data-video]").forEach((card) => {
      const video = card.querySelector(".work-video");
      const url   = card.dataset.video;
      if (!video || !url) return;
      let loaded = false;
      card.addEventListener("pointerenter", () => {
        if (!loaded) { video.src = url; loaded = true; }
        card.classList.add("is-playing");
        video.play().catch(() => {});
      });
      card.addEventListener("pointerleave", () => {
        card.classList.remove("is-playing");
        video.pause();
        video.currentTime = 0;
      });
    });
  }

  /* ---------- REDUCED MOTION SAFETY ---------- */
  if (reduceMotion) {
    document.querySelectorAll("video[autoplay]").forEach((v) => {
      v.autoplay = false;
      v.pause();
    });
  }

  /* ---------- LIGHTBOX ---------- */
  const lightbox = document.querySelector(".lightbox");
  if (lightbox) {
    const stage    = lightbox.querySelector(".lightbox-stage");
    const titleEl  = lightbox.querySelector(".lightbox-title");
    const catEl    = lightbox.querySelector(".lightbox-cat");
    const closeBtn = lightbox.querySelector(".lightbox-close");
    const prevBtn  = lightbox.querySelector(".lightbox-prev");
    const nextBtn  = lightbox.querySelector(".lightbox-next");
    let currentIndex = -1;

    const visibleCards = () => Array.from(document.querySelectorAll(".work-card"))
      .filter((c) => !c.classList.contains("is-hidden"));

    let activeSpinner = null;
    const renderCard = (card) => {
      if (!card) return;
      // Tear down any previous spinner
      if (activeSpinner) { activeSpinner.destroy(); activeSpinner = null; }
      stage.innerHTML = "";
      const videoUrl = card.dataset.video;
      const spinPrefix = card.dataset.spinPrefix;
      const img = card.querySelector(".work-thumb img");
      const titleText = card.querySelector(".work-meta h3")?.textContent || "";
      const catText   = card.querySelector(".work-meta .work-cat")?.textContent || "";

      if (spinPrefix && window.__SpinViewer) {
        // 360° spinner takes priority over image/video
        const wrap = document.createElement("div");
        wrap.className = "spin-viewer";
        stage.appendChild(wrap);
        activeSpinner = new window.__SpinViewer(wrap, {
          folder: card.dataset.spinFolder,
          prefix: spinPrefix,
          count: parseInt(card.dataset.spinCount) || 12,
        });
      } else if (videoUrl) {
        const v = document.createElement("video");
        v.src = videoUrl;
        v.autoplay = true;
        v.loop = true;
        v.muted = false;
        v.controls = true;
        v.playsInline = true;
        if (img) v.poster = img.src;
        stage.appendChild(v);
        v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
      } else if (img) {
        const i = document.createElement("img");
        i.src = img.src;
        i.alt = img.alt || "";
        stage.appendChild(i);
      }

      titleEl.textContent = titleText;
      catEl.textContent   = catText;
    };

    const open = (card) => {
      const cards = visibleCards();
      currentIndex = cards.indexOf(card);
      if (currentIndex < 0) return;
      renderCard(card);
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("lightbox-open");
    };

    const close = () => {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("lightbox-open");
      // pause video / stop iframe / tear down spinner before clearing
      const v = stage.querySelector("video");
      if (v) v.pause();
      const f = stage.querySelector("iframe");
      if (f) f.src = "";  // stop Vimeo playback + sound immediately
      if (activeSpinner) { activeSpinner.destroy(); activeSpinner = null; }
      setTimeout(() => { stage.innerHTML = ""; }, 400);
    };

    // Open the full demo reel (Vimeo) with sound — used by hero + PiP
    const openVimeo = (id) => {
      if (activeSpinner) { activeSpinner.destroy(); activeSpinner = null; }
      stage.innerHTML = "";
      const wrap = document.createElement("div");
      wrap.className = "lightbox-vimeo";
      wrap.innerHTML = `<iframe src="https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&portrait=0&dnt=1" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
      stage.appendChild(wrap);
      titleEl.textContent = "Demo Reel";
      catEl.textContent = "Nate Winter — Selected Work";
      currentIndex = -1;
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("lightbox-open");
    };
    window.__openReel = openVimeo;

    // Hero reel button → open full reel with sound
    const reelTrigger = document.querySelector(".reel-trigger");
    if (reelTrigger) {
      reelTrigger.addEventListener("click", () => {
        const id = reelTrigger.dataset.vimeo;
        if (id) openVimeo(id);
      });
    }

    const navigate = (dir) => {
      const cards = visibleCards();
      if (!cards.length) return;
      currentIndex = (currentIndex + dir + cards.length) % cards.length;
      renderCard(cards[currentIndex]);
    };

    document.querySelectorAll(".work-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        e.preventDefault();
        open(card);
      });
    });

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", () => navigate(-1));
    nextBtn.addEventListener("click", () => navigate(1));
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) close();
    });
    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
    });

    /* Touch: swipe left/right to navigate */
    let touchStartX = 0;
    let touchStartY = 0;
    lightbox.addEventListener("touchstart", (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    lightbox.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      // Only treat as swipe if horizontal motion dominates and exceeds threshold
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        navigate(dx < 0 ? 1 : -1);
      }
    }, { passive: true });
  }

  /* ---------- 360° SPIN VIEWER ----------
     Canvas-based product rotator. Auto-spins, drag/swipe to control,
     resumes auto-spin after idle. Lazy-preloads all frames. */
  const spinUrl = (folder, prefix, n) =>
    `https://iamnatewinter.com/wp-content/uploads/${folder}/${prefix}${String(n).padStart(5, "0")}.jpg`;

  class SpinViewer {
    constructor(mountEl, { folder, prefix, count }) {
      this.frames = new Array(count);
      this.count  = count;
      this.idx    = 0;
      this.dragging = false;
      this.startX = 0;
      this.startIdx = 0;
      this.auto = true;
      this.idleTimer = null;
      this.autoTimer = null;
      this.loaded = false;

      mountEl.innerHTML = `<canvas></canvas><span class="spin-hint">Drag to rotate</span>`;
      this.root = mountEl;
      this.canvas = mountEl.querySelector("canvas");
      this.ctx = this.canvas.getContext("2d");

      // Preload all frames
      const promises = [];
      for (let i = 0; i < count; i++) {
        const img = new Image();
        img.src = spinUrl(folder, prefix, i + 1); // 1-indexed
        this.frames[i] = img;
        promises.push(new Promise((r) => {
          if (img.complete) r();
          else { img.onload = r; img.onerror = r; }
        }));
      }
      Promise.all(promises).then(() => {
        this.loaded = true;
        this.resize();
        this.draw();
        if (!reduceMotion) this.startAutoSpin();
      });

      this.bindEvents();
      window.addEventListener("resize", () => this.resize());
    }

    resize() {
      const dpr = window.devicePixelRatio || 1;
      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight;
      this.canvas.width  = w * dpr;
      this.canvas.height = h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    draw() {
      if (!this.loaded) return;
      const frame = this.frames[((this.idx % this.count) + this.count) % this.count];
      if (!frame || !frame.complete || !frame.naturalWidth) return;
      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight;
      this.ctx.clearRect(0, 0, w, h);
      // Fit frame to canvas preserving aspect ratio
      const scale = Math.min(w / frame.naturalWidth, h / frame.naturalHeight);
      const dw = frame.naturalWidth * scale;
      const dh = frame.naturalHeight * scale;
      this.ctx.drawImage(frame, (w - dw) / 2, (h - dh) / 2, dw, dh);
    }

    startAutoSpin() {
      this.stopAutoSpin();
      this.autoTimer = setInterval(() => {
        if (!this.auto) return;
        this.idx = (this.idx + 1) % this.count;
        this.draw();
      }, 140); // ~7fps auto-rotate, slow & cinematic
    }

    stopAutoSpin() {
      if (this.autoTimer) { clearInterval(this.autoTimer); this.autoTimer = null; }
    }

    bindEvents() {
      const canvas = this.canvas;
      canvas.addEventListener("pointerdown", (e) => {
        this.dragging = true;
        this.auto = false;
        this.startX = e.clientX;
        this.startIdx = this.idx;
        this.root.classList.add("is-dragging");
        canvas.setPointerCapture(e.pointerId);
        clearTimeout(this.idleTimer);
      });
      canvas.addEventListener("pointermove", (e) => {
        if (!this.dragging) return;
        const dx = e.clientX - this.startX;
        const sensitivity = canvas.clientWidth / this.count;
        const delta = Math.round(dx / sensitivity);
        this.idx = ((this.startIdx + delta) % this.count + this.count) % this.count;
        this.draw();
      });
      const endDrag = (e) => {
        if (!this.dragging) return;
        this.dragging = false;
        this.root.classList.remove("is-dragging");
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
        // Resume auto-spin after 2.5s idle
        this.idleTimer = setTimeout(() => { this.auto = true; }, 2500);
      };
      canvas.addEventListener("pointerup", endDrag);
      canvas.addEventListener("pointercancel", endDrag);
    }

    destroy() {
      this.stopAutoSpin();
      clearTimeout(this.idleTimer);
    }
  }
  // Expose so lightbox can spawn one
  window.__SpinViewer = SpinViewer;

  /* ---------- PICTURE-IN-PICTURE REEL ----------
     When the hero leaves the viewport, the hero reel reappears as a small
     floating thumbnail bottom-right. Click expands back to top. */
  const pip = document.querySelector(".pip-reel");
  const pipClose = pip?.querySelector(".pip-close");
  const pipMount = pip?.querySelector(".pip-mount");
  const heroSection = document.querySelector(".hero");
  if (pip && pipMount && heroSection) {
    const vimeoId = pip.dataset.vimeo;
    let dismissed = false, injected = false;
    const obs = new IntersectionObserver((entries) => {
      if (dismissed) return;
      entries.forEach((entry) => {
        const past = !entry.isIntersecting;
        pip.classList.toggle("is-visible", past);
        if (past && !injected && !reduceMotion && vimeoId) {
          pipMount.innerHTML = `<iframe src="https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&loop=1&muted=1&dnt=1" allow="autoplay" loading="lazy"></iframe>`;
          injected = true;
        }
      });
    }, { threshold: 0 });
    obs.observe(heroSection);

    pip.addEventListener("click", (e) => {
      if (e.target === pipClose || pipClose?.contains(e.target)) return;
      if (window.__openReel && vimeoId) window.__openReel(vimeoId);
    });
    pipClose?.addEventListener("click", (e) => {
      e.stopPropagation();
      dismissed = true;
      pip.classList.add("is-dismissed");
      pipMount.innerHTML = "";
    });
  }

  /* ---------- SCROLL-DRIVEN PRODUCT REVEAL ----------
     Canvas pinned via CSS sticky. As the section scrolls past, scrub
     through the spin sequence frame-by-frame. */
  const revealSections = document.querySelectorAll(".scroll-reveal");
  revealSections.forEach((section) => {
    const canvas = section.querySelector("canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const folder = section.dataset.spinFolder;
    const prefix = section.dataset.spinPrefix;
    const count  = parseInt(section.dataset.spinCount) || 12;
    const frames = [];

    for (let i = 0; i < count; i++) {
      const img = new Image();
      img.src = spinUrl(folder, prefix, i + 1);
      frames.push(img);
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawFrame = (idx) => {
      const i = Math.max(0, Math.min(count - 1, Math.round(idx)));
      const frame = frames[i];
      if (!frame || !frame.complete || !frame.naturalWidth) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const scale = Math.min(w / frame.naturalWidth, h / frame.naturalHeight);
      const dw = frame.naturalWidth * scale;
      const dh = frame.naturalHeight * scale;
      ctx.drawImage(frame, (w - dw) / 2, (h - dh) / 2, dw, dh);
    };

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const scrollable = section.offsetHeight - window.innerHeight;
      const progress = Math.max(0, Math.min(1, -rect.top / scrollable));
      drawFrame(progress * (count - 1));
    };

    Promise.all(frames.map((img) => new Promise((r) => {
      if (img.complete) r();
      else { img.onload = r; img.onerror = r; }
    }))).then(() => {
      resize();
      drawFrame(0);
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", () => { resize(); onScroll(); });
    });
  });

  /* ---------- MOBILE: SCROLL-TRIGGERED VIDEO PLAY ----------
     On touch devices there's no hover, so motion cards play when they
     scroll into view (and pause when they scroll away). Lazy-loads the
     video source on first intersection. */
  if (isTouch && "IntersectionObserver" in window) {
    const motionCards = document.querySelectorAll(".work-card[data-video]");
    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const card = entry.target;
        const video = card.querySelector(".work-video");
        if (!video) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          if (!card.dataset.videoLoaded) {
            video.src = card.dataset.video;
            card.dataset.videoLoaded = "1";
          }
          card.classList.add("is-playing");
          video.play().catch(() => {});
        } else {
          card.classList.remove("is-playing");
          video.pause();
        }
      });
    }, { threshold: [0, 0.6, 0.9] });
    motionCards.forEach((c) => scrollObserver.observe(c));
  }
})();
