"use client";

import Image from "next/image";
import { ArrowUpRight, Pause, Play, RotateCcw } from "lucide-react";
import TelevisionCabinet from "@/components/TelevisionCabinet";
import TelevisionNoise from "@/components/TelevisionNoise";
import { useCallback, useEffect, useRef, useState } from "react";
import { experiences } from "@/data/experience";
import { personal } from "@/data/personal";

const TUNING_DURATION = 1600;

/** Low-resolution broadcast snow. Only runs while the TV is tuning. */
function Static({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !context) return;
    const pixels = context.createImageData(canvas.width, canvas.height);
    let frame = 0;
    let previous = -Infinity;
    const draw = (time: number) => {
      if (time - previous >= 1000 / 18 && !document.hidden) {
        previous = time;
        for (let row = 0; row < canvas.height; row++) {
          const band = Math.sin(row * 0.08 + time * 0.008) * 24;
          for (let column = 0; column < canvas.width; column++) {
            const offset = (row * canvas.width + column) * 4;
            const tone = Math.random() * 175 + band;
            pixels.data[offset] = tone;
            pixels.data[offset + 1] = tone + 4;
            pixels.data[offset + 2] = tone;
            pixels.data[offset + 3] = 255;
          }
        }
        context.putImageData(pixels, 0, 0);
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  return <canvas ref={canvasRef} width={320} height={200} aria-hidden="true" />;
}

export default function TelevisionPortfolio() {
  const [tuning, setTuning] = useState(false);
  const [effectsPaused, setEffectsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replayRef = useRef<HTMLButtonElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);

  const finishTuning = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    // Do not leave keyboard focus inside an invisible overlay.
    if (document.activeElement === skipRef.current) replayRef.current?.focus();
    setTuning(false);
  }, []);

  const tune = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setTuning(true);
    timerRef.current = setTimeout(finishTuning, TUNING_DURATION);
  }, [finishTuning]);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    tune();
    const onMotionChange = () => {
      if (motion.matches) finishTuning();
    };
    motion.addEventListener("change", onMotionChange);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      motion.removeEventListener("change", onMotionChange);
    };
  }, [finishTuning, tune]);

  return (
    <div className={`tv-room ${tuning ? "is-tuning" : "is-on"} ${effectsPaused ? "effects-paused" : ""}`}>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="television">
      <TelevisionCabinet />
      <div className="tv-glass">
        <div className="tv-picture">
          <main className="broadcast-main" id="main" tabIndex={-1}>
            <section className="intro" aria-labelledby="name">
              <h1 id="name">MAX<br /> SUN<span>.</span></h1>
              <div className="education">
                <span className="education-mark" aria-hidden="true">↳</span>
                <p>Computer Engineering<br /><span>@ University of Waterloo</span></p>
              </div>
              <a className="resume-link" href="/Max_Sun_Resume.pdf" target="_blank" rel="noopener noreferrer">
                View résumé <ArrowUpRight size={16} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span>
              </a>
            </section>

            <section className="experience" aria-labelledby="experience-heading">
              <div className="section-heading">
                <h2 id="experience-heading">Experience</h2>
              </div>
              <div className="experience-list">
                {experiences.map((experience, index) => (
                  <article className="experience-item" key={experience.company}>
                    <span className="experience-index" aria-hidden="true">0{index + 1}</span>
                    <a className={`company-logo logo-${experience.logoStyle}`} href={experience.website} target="_blank" rel="noopener noreferrer" aria-label={`${experience.company} website (opens in a new tab)`}>
                      <Image src={experience.logo} alt="" width={58} height={58} sizes="58px" />
                    </a>
                    <div className="experience-copy">
                      <div className="company-line">
                        <h3><a href={experience.website} target="_blank" rel="noopener noreferrer">{experience.company}<ArrowUpRight size={14} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a></h3>
                        {index === 0 && <span className="incoming-label">INCOMING</span>}
                      </div>
                      <p className="experience-role">{experience.title.replace("Incoming ", "")}</p>
                      <p className="experience-team">{experience.description}</p>
                      <p className="experience-date">{experience.period}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </main>

          <footer className="broadcast-footer">
            <a className="email-link" href={`mailto:${personal.email}`}>{personal.email} <ArrowUpRight size={14} aria-hidden="true" /></a>
            <nav aria-label="Social links">
              <a href={personal.social.github} target="_blank" rel="noopener noreferrer">GitHub<span className="sr-only"> (opens in a new tab)</span> <ArrowUpRight size={12} aria-hidden="true" /></a>
              <a href={personal.social.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn<span className="sr-only"> (opens in a new tab)</span> <ArrowUpRight size={12} aria-hidden="true" /></a>
            </nav>
            <div className="screen-controls">
              <button type="button" className="effects-button" onClick={() => setEffectsPaused(!effectsPaused)} aria-pressed={effectsPaused} aria-label="Pause screen effects">
                {effectsPaused ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}
                {effectsPaused ? "Resume" : "Pause"} effects
              </button>
              <button ref={replayRef} type="button" className="retune-button" onClick={tune} aria-label="Replay TV static intro"><RotateCcw size={13} aria-hidden="true" /> Retune</button>
            </div>
          </footer>
        </div>

        <div className="tv-surface" aria-hidden="true">
          <TelevisionNoise paused={effectsPaused} />
          <div className="tv-pixel-grid" />
          <div className="tv-tracking" />
          <div className="tv-scanbeam" />
        </div>
        <div className="tuning-overlay" aria-hidden={!tuning}>
          <Static active={tuning} />
          <div className="tuning-osd" aria-hidden="true"><span>AV 1</span><span>CH 01</span></div>
          <div className="tuning-message" aria-hidden="true"><span>MS</span><p>TUNING IN<span className="tuning-dots">...</span></p></div>
          <button ref={skipRef} type="button" onClick={finishTuning} tabIndex={tuning ? 0 : -1}>Skip intro ↗</button>
        </div>
      </div>
      <div className="tv-bezel" aria-hidden="true"><span>MAXSUN</span><span className="power-led" /></div>
      </div>
    </div>
  );
}
