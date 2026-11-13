"use client";

import Image from "next/image";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import TelevisionModel from "@/components/TelevisionModel";
import TelevisionNoise from "@/components/TelevisionNoise";
import TelevisionStatic from "@/components/TelevisionStatic";
import { useTelevisionStartup } from "@/hooks/useTelevisionStartup";
import { experiences } from "@/data/experience";
import { personal } from "@/data/personal";

export default function TelevisionPortfolio() {
  const displayRef = useRef<HTMLDivElement>(null);
  const [modelReady, setModelReady] = useState(false);
  const [effectsPaused, setEffectsPaused] = useState(false);
  const onModelReady = useCallback(() => setModelReady(true), []);
  const tuning = useTelevisionStartup(modelReady);

  return (
    <div className={`tv-room ${!modelReady ? "is-loading" : ""} ${tuning ? "is-tuning" : "is-on"} ${effectsPaused ? "effects-paused" : ""}`}>
      <div className="television-stage">
        <TelevisionModel displayRef={displayRef} onReady={onModelReady} />
        <div ref={displayRef} className="tv-glass">
          <div className="tv-picture" inert={tuning}>
            <main className="broadcast-main" id="main">
              <section className="intro" aria-labelledby="name">
                <h1 id="name">Max Sun<span>.</span></h1>
                <p className="education">Computer Engineering<br /> <span>@ UWaterloo</span></p>
              </section>
              <section className="experience" aria-labelledby="experience-heading">
                <h2 id="experience-heading">Experience</h2>
                <div className="experience-list">
                  {experiences.map((experience, index) => (
                    <article className="experience-item" key={experience.company}>
                      <a
                        className={`company-logo logo-${experience.logoStyle}`}
                        href={experience.website} target="_blank" rel="noopener noreferrer"
                        aria-label={`${experience.company} website (opens in a new tab)`}
                      >
                        <Image src={experience.logo} alt="" width={48} height={48} sizes="48px" />
                      </a>
                      <div className="experience-copy">
                        <h3>
                          <a href={experience.website} target="_blank" rel="noopener noreferrer">
                            {experience.company}<ArrowUpRight aria-hidden="true" />
                            <span className="sr-only"> (opens in a new tab)</span>
                          </a>
                          {index === 0 && <span className="incoming-label">Incoming</span>}
                        </h3>
                        <p className="experience-role">{experience.title.replace("Incoming ", "")}</p>
                        <p className="experience-date">{experience.period}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </main>
            <footer className="broadcast-footer">
              <nav aria-label="Contact and résumé">
                <a href="/Max_Sun_Resume.pdf" target="_blank" rel="noopener noreferrer">Résumé<span className="sr-only"> (opens in a new tab)</span><ArrowUpRight aria-hidden="true" /></a>
                <a href={`mailto:${personal.email}`} aria-label={`Email ${personal.email}`}>Email<ArrowUpRight aria-hidden="true" /></a>
                <a href={personal.social.github} target="_blank" rel="noopener noreferrer">GitHub<span className="sr-only"> (opens in a new tab)</span><ArrowUpRight aria-hidden="true" /></a>
                <a href={personal.social.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn<span className="sr-only"> (opens in a new tab)</span><ArrowUpRight aria-hidden="true" /></a>
              </nav>
              <button type="button" className="effects-button" onClick={() => setEffectsPaused(!effectsPaused)} aria-pressed={effectsPaused} aria-label="Pause screen effects" title={effectsPaused ? "Resume screen effects" : "Pause screen effects"}>
                {effectsPaused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
              </button>
            </footer>
          </div>
          <div className="tv-surface" aria-hidden="true">
            <TelevisionNoise paused={effectsPaused || tuning} />
            <div className="tv-pixel-grid" />
            <div className="tv-tracking" />
            <div className="tv-scanbeam" />
          </div>
          <div className="tuning-overlay" aria-hidden="true">
            <TelevisionStatic active={tuning} />
          </div>
        </div>
      </div>
      <noscript><style>{`.is-loading .tv-picture{opacity:1}.is-loading .tuning-overlay{display:none}`}</style></noscript>
    </div>
  );
}
