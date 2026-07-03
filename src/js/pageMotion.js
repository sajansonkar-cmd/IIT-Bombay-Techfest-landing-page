export function initPageMotion() {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!gsap) {
    return;
  }

  if (ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  gsap.from(".site-header", {
    y: -30,
    opacity: 0,
    duration: 0.9,
    ease: "power3.out"
  });

  gsap.from(".hero-copy > *", {
    y: 34,
    opacity: 0,
    duration: 1.1,
    stagger: 0.12,
    ease: "power3.out",
    delay: 0.18
  });

  gsap.from(".signal-card", {
    y: 28,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    delay: 0.5
  });

  if (prefersReducedMotion) {
    return;
  }

  gsap.to(".pulse-dot", {
    scale: 1.75,
    opacity: 0.32,
    duration: 1.1,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });

  gsap.utils
    .toArray(
      ".scroll-reveal, .glass-card, .timeline-item, .scanner-shell, .scanner-result, .site-footer"
    )
    .forEach((element) => {
      const animation = {
        y: 36,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      };

      if (ScrollTrigger) {
        animation.scrollTrigger = {
          trigger: element,
          start: "top 82%"
        };
      }

      gsap.from(element, animation);
    });
}
