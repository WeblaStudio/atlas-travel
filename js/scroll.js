/* ==========================================================
   ATLAS — Cinematic Scroll Engine
   GSAP + ScrollTrigger + Lenis (pinned versions)

   This file does not import, edit, or replace globe.js.
   It only orchestrates scroll storytelling around the globe.
   ========================================================== */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(pointer: fine)");
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const CDN = {
  gsap: "https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm",
  scrollTrigger: "https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger/+esm",
  lenis: "https://cdn.jsdelivr.net/npm/lenis@1.1.20/+esm"
};

/* Keep local photographs optional: gradient placeholders remain if a file is missing. */
function initialiseLocalImages() {
  $$ ("[data-local-image]").forEach((image) => {
    const container = image.closest(".image-placeholder");
    if (!container) return;

    const markLoaded = () => {
      image.classList.add("is-loaded");
      container.classList.remove("is-placeholder");
    };

    const keepPlaceholder = () => {
      image.classList.remove("is-loaded");
      container.classList.add("is-placeholder");
    };

    image.addEventListener("load", markLoaded, { once: true });
    image.addEventListener("error", keepPlaceholder, { once: true });

    if (image.complete && image.naturalWidth > 0) markLoaded();
    else if (image.complete && image.naturalWidth === 0) keepPlaceholder();
    else container.classList.add("is-placeholder");
  });
}

initialiseLocalImages();

/* A graceful no-CDN / reduced-motion mode still reveals the page content. */
function initialiseStaticFallback() {
  document.documentElement.classList.add("scroll-fallback");
  $$(".cinematic-reveal").forEach((element) => {
    element.classList.add("is-in");
    element.style.opacity = "1";
    element.style.transform = "none";
  });

  const backdrop = $("#sceneBackdrop");
  if (backdrop) backdrop.dataset.motion = "disabled";
}

if (reduceMotion.matches) {
  initialiseStaticFallback();
} else {
  bootCinematicScroll();
}

async function bootCinematicScroll() {
  let gsap;
  let ScrollTrigger;
  let Lenis;

  try {
    const [gsapModule, triggerModule, lenisModule] = await Promise.all([
      import(CDN.gsap),
      import(CDN.scrollTrigger),
      import(CDN.lenis)
    ]);

    gsap = gsapModule.gsap || gsapModule.default?.gsap || gsapModule.default;
    ScrollTrigger = triggerModule.ScrollTrigger || triggerModule.default;
    Lenis = lenisModule.default || lenisModule.Lenis;

    if (!gsap || !ScrollTrigger || !Lenis) {
      throw new Error("GSAP, ScrollTrigger, or Lenis export could not be resolved.");
    }
  } catch (error) {
    console.warn("ATLAS: cinematic scroll libraries could not be loaded.", error);
    initialiseStaticFallback();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetWarn: false });

  /* Lenis: one animation clock shared with GSAP for steady scroll timing. */
  let lenis = null;
  try {
    lenis = new Lenis({
      duration: 1.18,
      smoothWheel: true,
      wheelMultiplier: 0.92,
      touchMultiplier: 1.05,
      infinite: false,
      gestureOrientation: "vertical",
      autoRaf: false
    });

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  } catch (error) {
    console.warn("ATLAS: Lenis could not be started; native scrolling will remain available.", error);
    lenis = null;
  }

  /* Make ordinary anchor links work with Lenis and respect reduced-motion changes. */
  if (lenis) {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        if (!href || href === "#") return;

        const target = $(href);
        if (!target) return;

        event.preventDefault();
        lenis.scrollTo(target, {
          offset: -10,
          duration: 1.1
        });
      });
    });
  }

  /* --------------------------------------------------------
     01. Background crossfade between story chapters
     -------------------------------------------------------- */
  const backdrop = $("#sceneBackdrop");
  const backdropLayers = backdrop
    ? $$ ("[data-backdrop-layer]", backdrop)
    : [];

  const themes = {
    hero: "radial-gradient(ellipse at 72% 32%, rgba(42,100,80,.56), transparent 42%), linear-gradient(125deg,#07131a 0%,#0b2428 56%,#182d2b 100%)",
    world: "radial-gradient(ellipse at 52% 44%, rgba(29,93,88,.42), transparent 43%), linear-gradient(145deg,#061116 0%,#0b252a 53%,#101f27 100%)",
    destinations: "radial-gradient(ellipse at 77% 28%, rgba(163,107,70,.24), transparent 36%), linear-gradient(120deg,#101f25 0%,#152d31 47%,#1e302e 100%)",
    experiences: "radial-gradient(ellipse at 15% 25%, rgba(38,100,77,.38), transparent 40%), linear-gradient(145deg,#061a1b,#102b2c 62%,#09191f)",
    route: "radial-gradient(ellipse at 58% 38%, rgba(71,69,99,.29), transparent 43%), linear-gradient(145deg,#101923,#111f2a 56%,#0a181d)",
    stats: "radial-gradient(ellipse at 50% 50%, rgba(166,121,76,.12), transparent 47%), linear-gradient(180deg,#040d12,#09161a 52%,#050d12)",
    gallery: "radial-gradient(ellipse at 70% 24%, rgba(42,105,101,.31), transparent 38%), linear-gradient(145deg,#07171e,#0c272a 60%,#122326)",
    voices: "radial-gradient(ellipse at 22% 31%, rgba(50,82,105,.28), transparent 42%), linear-gradient(145deg,#07131c,#0d2029 54%,#101c22)",
    booking: "radial-gradient(ellipse at 72% 46%, rgba(33,91,68,.3), transparent 42%), linear-gradient(130deg,#061512,#102a29 56%,#0b1c21)",
    footer: "radial-gradient(ellipse at 72% 35%, rgba(158,113,66,.13), transparent 37%), linear-gradient(145deg,#03090d,#071116 57%,#040b0f)"
  };

  let activeLayerIndex = 0;
  let crossfadeTween = null;

  function crossfadeTo(themeName) {
    if (!backdrop || backdropLayers.length < 2) return;

    const gradient = themes[themeName] || themes.world;
    const nextIndex = activeLayerIndex === 0 ? 1 : 0;
    const outgoing = backdropLayers[activeLayerIndex];
    const incoming = backdropLayers[nextIndex];

    if (crossfadeTween) crossfadeTween.kill();

    incoming.style.background = gradient;
    gsap.set(incoming, { opacity: 0, scale: 1.035 });
    incoming.classList.add("is-active");

    crossfadeTween = gsap.to(incoming, {
      opacity: 1,
      scale: 1,
      duration: 1.35,
      ease: "power3.out",
      overwrite: true,
      onComplete: () => {
        gsap.set(outgoing, { opacity: 0 });
        outgoing.classList.remove("is-active");
        activeLayerIndex = nextIndex;
      }
    });
  }

  if (backdropLayers[0]) {
    backdropLayers[0].style.background = themes.hero;
    gsap.set(backdropLayers[0], { opacity: 1 });
  }

  const cinematicSections = $$ ("[data-cinematic-scene]");
  cinematicSections.forEach((section) => {
    const themeName = section.dataset.theme || section.dataset.cinematicScene || "world";

    ScrollTrigger.create({
      trigger: section,
      start: "top 68%",
      onEnter: () => crossfadeTo(themeName),
      onEnterBack: () => crossfadeTo(themeName)
    });
  });

  /* --------------------------------------------------------
     02. Hero: layered parallax + cinematic exit
     -------------------------------------------------------- */
  const hero = $("#top");
  if (hero) {
    const heroContent = $(".hero__content", hero);
    const moon = $(".hero__moon", hero);
    const farRidge = $(".hero__ridge--far", hero);
    const nearRidge = $(".hero__ridge--near", hero);

    gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * 0.62)}`,
        pin: true,
        pinSpacing: true,
        scrub: 0.85,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    })
      .to(heroContent, { yPercent: -18, opacity: 0.12, ease: "none" }, 0)
      .to(moon, { yPercent: 34, scale: 1.22, opacity: 0.52, ease: "none" }, 0)
      .to(farRidge, { xPercent: -6, yPercent: 8, ease: "none" }, 0)
      .to(nearRidge, { xPercent: 5, yPercent: 17, ease: "none" }, 0);
  }

  /* --------------------------------------------------------
     03. Soft reveal for each section and its content
     -------------------------------------------------------- */
  const revealTargets = $$ (
    ".cinematic-reveal, .experience-card, .route-station, .stat-item, .voice-card, .booking-form"
  );

  revealTargets.forEach((element, index) => {
    gsap.fromTo(element,
      { y: 28, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.85,
        ease: "power3.out",
        delay: (index % 5) * 0.055,
        scrollTrigger: {
          trigger: element,
          start: "top 88%",
          once: true
        }
      }
    );
  });

  /* Clip-path reveal for media frames; the actual images remain local. */
  $$(".gallery-tile, .experience-card__art").forEach((media, index) => {
    gsap.fromTo(media,
      { clipPath: "inset(8% 4% 8% 4% round 2px)", opacity: 0.35 },
      {
        clipPath: "inset(0% 0% 0% 0% round 2px)",
        opacity: 1,
        duration: 1,
        ease: "expo.out",
        delay: (index % 3) * 0.08,
        scrollTrigger: { trigger: media, start: "top 89%", once: true }
      }
    );
  });

  /* --------------------------------------------------------
     04. Horizontal destination reel pinned on desktop
     Mobile keeps native swipe + scroll snap.
     -------------------------------------------------------- */
  const destinationSection = $("#destinations");
  const destinationViewport = $("#destinationViewport");
  const destinationTrack = $("#destinationTrack");
  let horizontalTween = null;

  const mm = gsap.matchMedia();

  mm.add("(min-width: 651px) and (prefers-reduced-motion: no-preference)", () => {
    if (!destinationSection || !destinationViewport || !destinationTrack) return undefined;

    const getDistance = () => Math.max(
      0,
      destinationTrack.scrollWidth - destinationViewport.clientWidth
    );

    horizontalTween = gsap.fromTo(
  destinationTrack,
  {
    x: 0
  },
  {
    // مقدار منفی یعنی حرکت فیزیکی نوار به سمت چپ
    x: () => getDistance(),
    ease: "none",
    immediateRender: true,
    scrollTrigger: {
      trigger: destinationSection,
      start: "top top",
      end: () =>
        `+=${Math.max(
          getDistance(),
          window.innerHeight * 0.6
        )}`,
      pin: destinationViewport,
      scrub: 0.8,
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  }
);

    // Horizontal image parallax uses containerAnimation to track each card.
    $$("[data-parallax-panel]", destinationTrack).forEach((panel) => {
      const image = $(".destination-panel__image", panel);
      if (!image) return;

      gsap.fromTo(image,
        { xPercent: -5, scale: 1.06 },
        {
          xPercent: 5,
          scale: 1.1,
          ease: "none",
          scrollTrigger: {
            trigger: panel,
            containerAnimation: horizontalTween,
            start: "left right",
            end: "right left",
            scrub: true
          }
        }
      );
    });

    return () => {
      horizontalTween = null;
    };
  });

  /* --------------------------------------------------------
     05. Gentle parallax on still image placeholders
     -------------------------------------------------------- */
  if (finePointer.matches) {
    $$(".gallery-tile, .experience-card").forEach((element) => {
      element.addEventListener("pointermove", (event) => {
        if (reduceMotion.matches) return;
        const rect = element.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        gsap.to(element, {
          rotateY: px * 2.2,
          rotateX: -py * 2,
          transformPerspective: 900,
          duration: 0.45,
          ease: "power2.out",
          overwrite: true
        });
      });

      element.addEventListener("pointerleave", () => {
        gsap.to(element, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.55,
          ease: "power3.out",
          overwrite: true
        });
      });
    });
  }

  /* Keep scroll-dependent geometry correct after fonts/images resize. */
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
  window.addEventListener("resize", () => ScrollTrigger.refresh(), { passive: true });

  // Finish any pending progress animation only after scroll systems initialise.
  document.documentElement.classList.add("atlas-scroll-ready");
}
