"use client";

import AsciiPortrait from "@/components/AsciiPortrait";
import { ArrowDown } from "lucide-react";
import { useEffect, useRef, type MouseEvent } from "react";

type LandingLink = {
  href: string;
  label: string;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export default function LandingStory({ links }: { links: LandingLink[] }) {
  const storyRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const arrowRef = useRef<HTMLButtonElement>(null);
  const focusAfterScroll = useRef(false);

  useEffect(() => {
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let frame = 0;

    const update = () => {
      frame = 0;
      const story = storyRef.current;
      const stage = stageRef.current;
      if (!story || !stage) return;

      const range = Math.max(1, story.offsetHeight - window.innerHeight);
      const scrollProgress = Math.max(
        0,
        Math.min(1, -story.getBoundingClientRect().top / range),
      );
      // Smooth acceleration and a settled ending, without intercepting scrolling.
      const progress = motionPreference.matches
        ? 1
        : scrollProgress * scrollProgress * (3 - 2 * scrollProgress);
      stage.style.setProperty("--reveal", String(progress));
      stage.classList.toggle("is-revealed", progress >= 0.6);
      stage.classList.toggle("is-scrolling", progress > 0.3);

      // Hidden links must not receive keyboard focus before they are revealed.
      if (navRef.current) {
        navRef.current.inert = progress < 0.6;
        navRef.current.setAttribute("aria-hidden", String(progress < 0.6));
      }
      if (arrowRef.current) {
        arrowRef.current.inert = progress > 0.3;
        arrowRef.current.setAttribute("aria-hidden", String(progress > 0.3));
      }
      if (focusAfterScroll.current && progress >= 0.98) {
        focusAfterScroll.current = false;
        navRef.current?.querySelector("a")?.focus({ preventScroll: true });
      }
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motionPreference.addEventListener("change", schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motionPreference.removeEventListener("change", schedule);
    };
  }, []);

  const revealLinks = () => {
    const story = storyRef.current;
    if (!story) return;
    focusAfterScroll.current = true;
    const top = window.scrollY + story.getBoundingClientRect().top;
    window.scrollTo({
      top: top + Math.max(0, story.offsetHeight - window.innerHeight),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };

  return (
    <section ref={storyRef} className="landing-story" aria-label="Introduction">
      <div ref={stageRef} className="landing-stage">
        <div className="landing-atmosphere" aria-hidden="true" />
        <div className="landing-visual">
          <h1
            className="landing-question"
            aria-label="Have you seen this man?"
            tabIndex={-1}
          >
            <span aria-hidden="true">Have you seen</span>
            <span aria-hidden="true">
              this <em>man?</em>
            </span>
          </h1>
          <div className="landing-portrait">
            <AsciiPortrait />
          </div>
        </div>
        <nav
          ref={navRef}
          className="landing-nav"
          aria-label="Explore"
          aria-hidden="true"
          inert
        >
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={link.onClick}>
              <span className="rolling-text">
                <span>{link.label}</span>
                <span aria-hidden="true">{link.label}</span>
              </span>
            </a>
          ))}
        </nav>
        <button
          ref={arrowRef}
          className="landing-scroll"
          type="button"
          onClick={revealLinks}
          aria-label="Scroll to projects, experience, and contact"
        >
          <ArrowDown size={30} strokeWidth={1.6} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
