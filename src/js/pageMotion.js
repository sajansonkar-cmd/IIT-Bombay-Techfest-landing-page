function createLenisScroller(ScrollTrigger) {
  const Lenis = window.Lenis;

  if (!Lenis) {
    return null;
  }

  const lenis = new Lenis({
    duration: 1.15,
    lerp: 0.08,
    smoothWheel: true,
    smoothTouch: false,
    wheelMultiplier: 1
  });

  let frameId = 0;

  const raf = (time) => {
    lenis.raf(time);
    frameId = window.requestAnimationFrame(raf);
  };

  lenis.on("scroll", () => {
    if (ScrollTrigger) {
      ScrollTrigger.update();
    }
  });

  frameId = window.requestAnimationFrame(raf);

  const handleAnchorClick = (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const anchor = event.target.closest("a[href^='#']");

    if (!anchor) {
      return;
    }

    const href = anchor.getAttribute("href");

    if (!href || href === "#") {
      return;
    }

    const target = document.querySelector(href);

    if (!target) {
      return;
    }

    event.preventDefault();

    const header = document.querySelector(".site-header");
    const offset = target.id === "home" ? 0 : header ? header.getBoundingClientRect().height + 18 : 88;

    lenis.scrollTo(target, {
      offset: -offset
    });
  };

  document.addEventListener("click", handleAnchorClick);

  return () => {
    window.cancelAnimationFrame(frameId);
    document.removeEventListener("click", handleAnchorClick);
    lenis.destroy();
  };
}

function animateIntro(gsap) {
  const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

  intro.from(".site-header", {
    y: -24,
    opacity: 0,
    duration: 0.8
  });

   intro.from(
    ".hero-copy .eyebrow",
    {
      y: 18,
      opacity: 0,
      duration: 0.55
    },
    "-=0.2"
  );

  intro.from(
    ".hero-copy h1",
    {
      y: 34,
      opacity: 0,
      duration: 0.9
    },
    "-=0.1"
  );

  intro.from(
    ".hero-lede",
    {
      y: 22,
      opacity: 0,
      duration: 0.7
    },
    "-=0.45"
  );

  intro.from(
    ".hero-status .status-chip",
    {
      y: 14,
      opacity: 0,
      duration: 0.45,
      stagger: 0.08
    },
    "-=0.35"
  );

  intro.from(
    ".hero-actions .button",
    {
      y: 18,
      opacity: 0,
      duration: 0.7,
      stagger: 0.09
    },
    "-=0.35"
  );

  intro.from(
    ".signal-card",
    {
      x: 24,
      y: 18,
      opacity: 0,
      duration: 0.9
    },
    "-=0.8"
  );
}

function animateSection(gsap, ScrollTrigger, section) {
  const heading = section.querySelector(".section-heading");
  const cards = section.querySelectorAll(".glass-card, .timeline-item, .scanner-panel, .scanner-result");

  const timeline = gsap.timeline({
    scrollTrigger: ScrollTrigger
      ? {
          trigger: section,
          start: "top 78%",
          once: true
        }
      : undefined,
    defaults: { ease: "power3.out" }
  });

  if (heading) {
    timeline.from(heading, {
      y: 24,
      opacity: 0,
      duration: 0.7
    });
  }

  if (cards.length) {
    timeline.from(
      cards,
      {
        y: 28,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08
      },
      heading ? "-=0.35" : 0
    );
  }
}

export function initPageMotion() {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!gsap) {
    return;
  }

  if (ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({
      ignoreMobileResize: true
    });
  }

  if (!prefersReducedMotion) {
    animateIntro(gsap);
    gsap.to(".pulse-dot", {
      scale: 1.7,
      opacity: 0.34,
      duration: 1.1,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.utils.toArray(".content-section").forEach((section) => {
      animateSection(gsap, ScrollTrigger, section);
    });

    const footer = document.querySelector(".site-footer");

    if (footer) {
      gsap.from(footer, {
        scrollTrigger: ScrollTrigger
          ? {
              trigger: footer,
              start: "top 86%",
              once: true
            }
          : undefined,
        y: 24,
        opacity: 0,
        duration: 0.75,
        ease: "power3.out"
      });
    }
  }

  const destroyLenis = prefersReducedMotion ? null : createLenisScroller(ScrollTrigger);

  if (destroyLenis) {
    window.addEventListener(
      "beforeunload",
      () => {
        destroyLenis();
      },
      { once: true }
    );
  }

  if (ScrollTrigger) {
    if (document.readyState === "complete") {
      ScrollTrigger.refresh();
    } else {
      window.addEventListener("load", () => {
        ScrollTrigger.refresh();
      });
    }
  }
}
