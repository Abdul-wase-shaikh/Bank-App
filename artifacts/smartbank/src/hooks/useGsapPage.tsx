import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Site-wide GSAP animations:
 * - Fades/slides in elements marked [data-anim] on mount
 * - Reveals [data-reveal] on scroll
 * Re-runs on every route change.
 */
export const useGsapPage = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-anim]",
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.08,
          clearProps: "all",
        },
      );

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            clearProps: "all",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });
    });

    // Refresh after layout settles
    const t = setTimeout(() => ScrollTrigger.refresh(), 100);
    return () => {
      clearTimeout(t);
      ctx.revert();
    };
  }, [pathname]);
};
