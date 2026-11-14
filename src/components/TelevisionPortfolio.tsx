"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useCallback, useRef, useState, type CSSProperties } from "react";
import TelevisionModel from "@/components/TelevisionModel";
import FnafChannel from "@/components/FnafChannel";
import TelevisionNoise from "@/components/TelevisionNoise";
import TelevisionStatic from "@/components/TelevisionStatic";
import { useTelevisionStartup } from "@/hooks/useTelevisionStartup";
import { useTelevisionPower, TV_POWER_OFF_DURATION, TV_POWER_ON_DURATION } from "@/hooks/useTelevisionPower";
import { clampTVVolume, TV_CHANNELS } from "@/lib/television";
import { useTelevisionChannels } from "@/hooks/useTelevisionChannels";
import { useTelevisionChannelSound } from "@/hooks/useTelevisionChannelSound";
import { useAntennaInterference } from "@/hooks/useAntennaInterference";
import { experiences } from "@/data/experience";
import { personal } from "@/data/personal";

export default function TelevisionPortfolio() {
  const displayRef = useRef<HTMLDivElement>(null);
  const [modelReady, setModelReady] = useState(false);
  const [frontView, setFrontView] = useState(false);
  const [volume, setVolume] = useState(50);
  const onModelReady = useCallback(() => setModelReady(true), []);
  const toggleView = useCallback(() => setFrontView((current) => !current), []);
  const changeVolume = useCallback((value: number) => setVolume(clampTVVolume(value)), []);
  const tuning = useTelevisionStartup(modelReady);
  const { phase, powered, transitioning, togglePower } = useTelevisionPower();
  const channelsEnabled = modelReady && !tuning && phase === "on";
  const { channel, switching, changeChannel } = useTelevisionChannels(channelsEnabled);
  const changeChannelWithSound = useTelevisionChannelSound(channelsEnabled, volume, changeChannel);
  const retuning = tuning || switching || phase === "turning-on";
  const screenPaused = retuning || phase !== "on";
  const { strength, disturb } = useAntennaInterference(screenPaused);

  return (
    <div className={`tv-room ${!modelReady ? "is-loading" : ""} ${retuning ? "is-tuning" : "is-on"} ${frontView ? "is-front-view" : ""}`}
      data-power={phase} data-channel={TV_CHANNELS[channel].id} style={{ "--power-duration": `${phase === "turning-off" ? TV_POWER_OFF_DURATION : TV_POWER_ON_DURATION}ms` } as CSSProperties}>
      <div className="television-stage" id="television-stage">
        <TelevisionModel displayRef={displayRef} onReady={onModelReady} onInterference={disturb} frontView={frontView}
          volume={volume} powered={powered} powerBusy={transitioning} controlsDisabled={!modelReady || tuning}
          onToggleView={toggleView} onTogglePower={togglePower} onVolumeChange={changeVolume} onChannelChange={changeChannelWithSound} />
        <div ref={displayRef} className="tv-glass">
          <div className="tv-broadcast" aria-hidden={retuning || phase !== "on"}>
            <div className="tv-picture" inert={retuning || phase !== "on"}>
              <main className={`broadcast-main ${channel === 1 ? "about-channel" : channel === 2 ? "game-channel" : ""}`} id="main">
                {channel === 0 && <>
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
                </>}
                {channel === 1 && <section className="about-content" aria-labelledby="about-heading">
                  <Image className="about-photo" src="/images/television/profile.webp" alt="Max Sun" width={480} height={480} sizes="(max-width: 680px) 110px, 240px" />
                  <div className="about-copy">
                    <h1 id="about-heading">Hi, I’m Max<span>.</span></h1>
                    <p>I’m a Computer Engineering student at UWaterloo. I like good food, making games, and watching anime.</p>
                  </div>
                </section>}
                <FnafChannel volume={volume} active={channel === 2 && !screenPaused} />
              </main>
              {channel !== 2 && <footer className="broadcast-footer">
                <nav aria-label="Contact and résumé">
                  <a href="/Max_Sun_Resume.pdf" target="_blank" rel="noopener noreferrer">Résumé<span className="sr-only"> (opens in a new tab)</span><ArrowUpRight aria-hidden="true" /></a>
                  <a href={`mailto:${personal.email}`} aria-label={`Email ${personal.email}`}>Email<ArrowUpRight aria-hidden="true" /></a>
                  <a href={personal.social.github} target="_blank" rel="noopener noreferrer">GitHub<span className="sr-only"> (opens in a new tab)</span><ArrowUpRight aria-hidden="true" /></a>
                  <a href={personal.social.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn<span className="sr-only"> (opens in a new tab)</span><ArrowUpRight aria-hidden="true" /></a>
                </nav>
              </footer>}
            </div>
            <div className="tv-surface" aria-hidden="true">
              <TelevisionNoise paused={screenPaused} />
              <div className="tv-pixel-grid" />
              <div className="tv-tracking" />
              <div className="tv-scanbeam" />
            </div>
            <div className="tuning-overlay" aria-hidden="true">
              <TelevisionStatic active={retuning && powered} />
            </div>
            <div className={`interference-overlay ${strength > 0 && !screenPaused ? "is-disturbed" : ""}`} style={{ "--interference": strength } as CSSProperties} aria-hidden="true">
              <TelevisionStatic active={strength > 0 && !screenPaused} />
            </div>
            <div className="crt-flash" aria-hidden="true" />
          </div>
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{modelReady && !retuning && phase === "on" ? `Channel ${channel + 1}: ${TV_CHANNELS[channel].label}` : ""}</p>
      <noscript><style>{`.is-loading .television-stage{opacity:1;pointer-events:auto}.is-loading .tv-picture{opacity:1}.is-loading .tuning-overlay{display:none}`}</style></noscript>
    </div>
  );
}
