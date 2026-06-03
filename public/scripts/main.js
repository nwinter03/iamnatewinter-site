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
     Intro video plays on every load, then fades out into the hero. */
  document.body.classList.add("is-loading");
  const loader = document.querySelector(".page-loader");
  const dismissLoader = () => {
    loader?.classList.add("is-done");
    document.body.classList.remove("is-loading");
  };
  if (loader) {
    const introVid = loader.querySelector(".loader-video");
    if (introVid && !reduceMotion) {
      let dismissed = false;
      const done = () => { if (!dismissed) { dismissed = true; dismissLoader(); } };
      introVid.addEventListener("ended", done);
      // Autoplay (muted is required for browsers to allow it on first load)
      introVid.play().catch(() => done());
      // Fallbacks: stalled load or 'ended' never fires
      setTimeout(done, 4500);
    } else {
      // Reduced motion or no video: reveal the site immediately
      setTimeout(dismissLoader, 300);
    }
  } else {
    document.body.classList.remove("is-loading");
  }

  /* ---------- MOBILE MENU ---------- */
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  if (menuToggle && mobileMenu) {
    const setMenu = (open) => {
      mobileMenu.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
      menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      mobileMenu.setAttribute("aria-hidden", open ? "false" : "true");
    };
    menuToggle.addEventListener("click", () =>
      setMenu(!mobileMenu.classList.contains("is-open"))
    );
    mobileMenu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => setMenu(false))
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) setMenu(false);
    });
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

    const interactive = "a, button, .filter, .service, input, select, textarea";
    document.querySelectorAll(interactive).forEach((el) => {
      if (el.classList.contains("work-card")) return; // work cards get the icon cursor below
      el.addEventListener("pointerenter", () => ring.classList.add("is-active"));
      el.addEventListener("pointerleave", () => ring.classList.remove("is-active"));
    });

    // Work cards: the cursor itself becomes a contextual icon (play / 360 / zoom)
    const CUE_SVG = {
      play: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
      spin: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="21 5 21 10 16 10"/><path d="M19.4 14a8 8 0 1 1-1.85-8.3L21 7.5"/></svg>',
      zoom: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>',
    };
    const cueEl = ring.querySelector(".cursor-cue");
    document.querySelectorAll(".work-card").forEach((card) => {
      const type = card.hasAttribute("data-video") ? "play"
                 : card.hasAttribute("data-spin-prefix") ? "spin"
                 : "zoom";
      card.addEventListener("pointerenter", () => {
        if (cueEl) cueEl.innerHTML = CUE_SVG[type];
        ring.classList.add("has-cue");
        dot.style.opacity = "0";
      });
      card.addEventListener("pointerleave", () => {
        ring.classList.remove("has-cue");
        if (cueEl) cueEl.innerHTML = "";
        dot.style.opacity = "";
      });
    });
  }

  /* ---------- WORK FILTERS + PAGINATION ---------- */
  const filters = document.querySelectorAll(".filter");
  const cards = document.querySelectorAll(".work-card");
  const pagination = document.querySelector(".work-pagination");
  const workSection = document.getElementById("work");
  const PAGE = 20;                 // "All" view paginates at this; individual filters show all
  let currentFilter = "all";
  let currentPage = 1;

  const cardMatches = (card, f) => {
    const cats = (card.dataset.cat || "").split(/\s+/);
    return f === "all" || cats.includes(f);
  };
  const matchingCards = () => [...cards].filter((c) => cardMatches(c, currentFilter));

  const renderPagination = (totalPages) => {
    if (!pagination) return;
    if (totalPages <= 1) { pagination.innerHTML = ""; pagination.classList.add("is-hidden"); return; }
    pagination.classList.remove("is-hidden");
    const pad = (n) => String(n).padStart(2, "0");
    pagination.innerHTML = `
      <button class="page-step" data-page="prev" ${currentPage === 1 ? "disabled" : ""} aria-label="Previous page">Prev</button>
      <span class="page-counter" aria-label="Page ${currentPage} of ${totalPages}">
        <span class="page-current">${pad(currentPage)}</span><span class="page-sep">/</span><span class="page-total">${pad(totalPages)}</span>
      </span>
      <button class="page-step" data-page="next" ${currentPage === totalPages ? "disabled" : ""} aria-label="Next page">Next</button>
    `;
  };

  const renderGrid = (animate) => {
    const matching = matchingCards();
    // Paginate only the "All" view; individual category filters show everything.
    const pageSize = currentFilter === "all" ? PAGE : Math.max(matching.length, 1);
    const totalPages = Math.max(1, Math.ceil(matching.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    cards.forEach((card) => card.classList.add("is-hidden"));
    matching.forEach((card, i) => {
      if (i >= start && i < end) {
        card.classList.remove("is-hidden");
        card.classList.add("is-in");        // defeat scroll-reveal opacity:0
        if (animate) {
          card.classList.remove("filter-in");
          void card.offsetWidth;
          card.classList.add("filter-in");
        }
      }
    });
    renderPagination(totalPages);
  };

  const scrollToWorkTop = () => {
    if (!workSection) return;
    const top = workSection.getBoundingClientRect().top + window.scrollY - 70;
    if (lenis) lenis.scrollTo(top, { duration: 0.8 });
    else window.scrollTo({ top, behavior: "smooth" });
  };

  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter;
      currentPage = 1;
      filters.forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      renderGrid(true);
    });
  });

  if (pagination) {
    pagination.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-page]");
      if (!btn || btn.disabled) return;
      const totalPages = Math.max(1, Math.ceil(matchingCards().length / PAGE));
      const val = btn.dataset.page;
      if (val === "prev") currentPage = Math.max(1, currentPage - 1);
      else if (val === "next") currentPage = Math.min(totalPages, currentPage + 1);
      else currentPage = parseInt(val, 10);
      renderGrid(true);
      scrollToWorkTop();
    });
  }

  // Initial render: page 1
  renderGrid(false);

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

  /* ---------- MISSING-POSTER FALLBACK ----------
     Some video cards have no poster image on the server (the swatch shows
     instead). Detect the failed image and show the video's own frame. */
  document.querySelectorAll(".work-card[data-video]").forEach((card) => {
    const img = card.querySelector(".work-thumb img");
    const video = card.querySelector(".work-video");
    if (!img || !video) return;
    const useVideoFrame = () => {
      if (video.dataset.posterFallback) return;
      video.dataset.posterFallback = "1";
      video.preload = "metadata";
      video.muted = true;
      if (!video.getAttribute("src")) video.src = card.dataset.video;
      card.dataset.videoLoaded = "1";
      video.classList.add("as-poster");
      // seek a touch in to skip a possible black opening frame
      video.addEventListener("loadeddata", () => {
        try { video.currentTime = Math.min(0.8, (video.duration || 3) * 0.12); } catch (e) {}
      }, { once: true });
    };
    if (img.complete && img.naturalWidth === 0) useVideoFrame();
    else img.addEventListener("error", useVideoFrame);
  });

  /* ---------- ABOUT PORTRAIT — STOP-MOTION SAMPLER ----------
     Draw the (same-origin) video to a canvas at a low frame rate so smooth
     footage reads as choppy stop-motion. Video stays as the frame source. */
  (function () {
    const wrap = document.querySelector(".about-portrait");
    if (!wrap || reduceMotion) return;
    const video  = wrap.querySelector(".about-src");
    const canvas = wrap.querySelector(".about-stopmo");
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    const FPS = 12;                              // gentle stepped look, close to smooth
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let nextAt = 0, running = false;

    function resize() {
      const r = canvas.getBoundingClientRect();
      canvas.width  = Math.max(1, Math.round(r.width  * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      draw();
    }
    function draw() {
      const cw = canvas.width, ch = canvas.height;
      const vw = video.videoWidth, vh = video.videoHeight;
      if (!vw || !vh) return;
      const s  = Math.max(cw / vw, ch / vh);            // cover-fit, no weave
      const dw = vw * s, dh = vh * s;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(video, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    }
    function loop(t) {
      if (!running) return;
      if (t >= nextAt) {
        draw();
        nextAt = t + (1000 / FPS);                       // steady cadence (no jitter)
      }
      requestAnimationFrame(loop);
    }
    function run()  { if (!running) { running = true; requestAnimationFrame(loop); } }
    function stop() { running = false; }
    function start() {
      resize();
      wrap.classList.add("stopmo-live");
      run();
    }

    video.play().catch(() => {});
    if (video.readyState >= 2) start();
    else video.addEventListener("loadeddata", start, { once: true });
    window.addEventListener("resize", resize);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { video.play().catch(() => {}); run(); }
          else { stop(); video.pause(); }
        });
      }, { threshold: 0.05 }).observe(wrap);
    }
  })();

  /* ---------- HERO CTA — SMOOTH SCROLL TO SECTION ---------- */
  document.querySelectorAll('.hero-cta a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.0 });
      else target.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------- FOOTER "?" — SMOOTH BACK TO TOP ---------- */
  document.querySelectorAll('.qmark, .brand[href="#top"]').forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      if (lenis) lenis.scrollTo(0, { duration: 1.1 });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

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
    `/uploads/${folder}/${prefix}${String(n).padStart(5, "0")}.jpg`;

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
      }, 250); // ~4fps auto-rotate, slow & cinematic
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
          video.muted = true;            // iOS only allows muted inline autoplay
          card.classList.add("is-playing");
          const play = () => video.play().catch(() => {});
          play();
          // preload="none" means that first play() can fire before any data exists;
          // retry once the clip can actually play (this is the key bit for iOS Safari).
          video.addEventListener("canplay", play, { once: true });
        } else {
          card.classList.remove("is-playing");
          video.pause();
        }
      });
    }, { threshold: [0, 0.6, 0.9] });
    motionCards.forEach((c) => scrollObserver.observe(c));
  }

  /* ---------- GRID 360° AUTO-SPIN (packaging cards) ----------
     Packaging cards slowly rotate through their 360° frames — on hover
     (desktop) and when scrolled into view (mobile), like the videos. */
  const FRAME_MS = 280; // slow, ambient rotation
  const makeGridSpinner = (card) => {
    const img = card.querySelector(".work-thumb img");
    const folder = card.dataset.spinFolder;
    const prefix = card.dataset.spinPrefix;
    const count = parseInt(card.dataset.spinCount, 10) || 12;
    if (!img || !prefix) return null;
    const firstSrc = img.src;
    let frames = null, idx = 0, timer = null;

    const preload = () => {
      if (frames) return Promise.resolve();
      frames = [];
      const ps = [];
      for (let i = 1; i <= count; i++) {
        const im = new Image();
        im.src = spinUrl(folder, prefix, i);
        frames.push(im);
        ps.push(new Promise((r) => { im.complete ? r() : (im.onload = r, im.onerror = r); }));
      }
      return Promise.all(ps);
    };
    return {
      start() {
        preload().then(() => {
          if (timer) return;
          timer = setInterval(() => {
            idx = (idx + 1) % count;
            img.src = frames[idx].src;
          }, FRAME_MS);
        });
      },
      stop() {
        if (timer) { clearInterval(timer); timer = null; }
        idx = 0;
        img.src = firstSrc; // settle back to the first frame
      },
    };
  };

  const spinGridCards = document.querySelectorAll(".work-card[data-spin-prefix]");
  if (!isTouch) {
    spinGridCards.forEach((card) => {
      const sp = makeGridSpinner(card);
      if (!sp) return;
      card.addEventListener("pointerenter", () => sp.start());
      card.addEventListener("pointerleave", () => sp.stop());
    });
  } else if ("IntersectionObserver" in window) {
    const spinObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const card = entry.target;
        if (!card.__gridSpinner) card.__gridSpinner = makeGridSpinner(card);
        if (!card.__gridSpinner) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) card.__gridSpinner.start();
        else card.__gridSpinner.stop();
      });
    }, { threshold: [0, 0.6] });
    spinGridCards.forEach((c) => spinObs.observe(c));
  }
})();
