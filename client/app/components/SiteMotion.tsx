"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function SiteMotion({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const heroVideo = document.querySelector<HTMLVideoElement>("[data-hero-video]");

    if (heroVideo) {
      heroVideo.playbackRate = 0.72;
      heroVideo.play().catch(() => undefined);
    }

    if (reduceMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from("[data-hero-kicker]", { y: 18, autoAlpha: 0, duration: 0.8 })
        .from("[data-hero-title] span", { yPercent: 110, duration: 1.25, stagger: 0.11 }, "-=0.25")
        .from("[data-hero-copy]", { y: 26, autoAlpha: 0, duration: 0.85 }, "-=0.45")
        .from("[data-hero-action]", { y: 16, autoAlpha: 0, duration: 0.55, stagger: 0.08 }, "-=0.35")
        .from("[data-hero-meter]", { scaleX: 0, transformOrigin: "left center", duration: 1.15 }, "-=0.3");

      gsap.to("[data-hero-video]", {
        scale: 1.08,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-hero]",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to("[data-film-track]", {
        xPercent: -50,
        duration: 28,
        ease: "none",
        repeat: -1,
      });

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.fromTo(
          element,
          { y: 46, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 82%",
            },
          },
        );
      });
    });

    return () => context.revert();
  }, []);

  return <>{children}</>;
}
