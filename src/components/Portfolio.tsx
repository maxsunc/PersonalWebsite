"use client";

import Image from "next/image";
import LandingStory from "@/components/LandingStory";
import { ArrowUpRight, Asterisk, Plus } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { experiences } from "@/data/experience";
import { personal } from "@/data/personal";
import { projects, type ProjectLink } from "@/data/projects";

type View = "home" | "projects" | "experience" | "contact";
const views: View[] = ["home", "projects", "experience", "contact"];
const pages = [
  { view: "projects", label: "Projects" },
  { view: "experience", label: "Experience" },
  { view: "contact", label: "Contact" },
] as const;
const featuredProjects = [projects[0], projects[3], projects[4]];
const linkLabels: Record<ProjectLink["type"], string> = {
  steam: "View on Steam",
  website: "Visit website",
  github: "Source code",
  play: "Play the game",
  devpost: "View on Devpost",
  trophy: "View awards",
};

function RollingText({ children }: { children: string }) {
  return (
    <span className="rolling-text">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  );
}

function Headline({
  lines,
  accentLast = false,
}: {
  lines: string[];
  accentLast?: boolean;
}) {
  return (
    <h1 className="poster-title" tabIndex={-1}>
      {lines.map((line, index) => (
        <span className="line-mask" key={line}>
          <span
            className={
              accentLast && index === lines.length - 1 ? "ink-accent" : ""
            }
            style={{ animationDelay: `${index * 85}ms` }}
          >
            {line}
          </span>
        </span>
      ))}
    </h1>
  );
}

function ExternalLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-link ${className}`}
    >
      {children}
      <ArrowUpRight size={16} aria-hidden="true" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export default function Portfolio() {
  const [view, setView] = useState<View>("home");
  const [selectedProject, setSelectedProject] = useState(0);
  const mainRef = useRef<HTMLElement>(null);
  const hasNavigated = useRef(false);

  useEffect(() => {
    const syncView = () => {
      const currentHash = window.location.hash.slice(1);
      // Preserve links to the previous section names.
      const hash = (
        currentHash === "work"
          ? "projects"
          : currentHash === "about"
            ? "experience"
            : currentHash
      ) as View;
      if (views.includes(hash)) {
        hasNavigated.current = true;
        setView(hash);
      } else if (!hash) {
        setView("home");
      }
    };
    syncView();
    window.addEventListener("hashchange", syncView);
    return () => window.removeEventListener("hashchange", syncView);
  }, []);

  useEffect(() => {
    if (hasNavigated.current) {
      window.scrollTo({ top: 0, behavior: "instant" });
      mainRef.current?.querySelector("h1")?.focus({ preventScroll: true });
    }
  }, [view]);

  const navigate = (event: MouseEvent<HTMLAnchorElement>, nextView: View) => {
    // Keep native hash history and modified-click behavior, but update the stage
    // immediately instead of waiting for the browser's hashchange event.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    hasNavigated.current = true;
    setView(nextView);
  };

  const project = featuredProjects[selectedProject];

  return (
    <div className="portfolio-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {view !== "home" && (
        <header className="site-header">
          <a
            href="#home"
            onClick={(event) => navigate(event, "home")}
            className="wordmark"
            aria-label="Max Sun — home"
          >
            <Asterisk aria-hidden="true" strokeWidth={1.5} />
            <span>
              MAX SUN<span className="ink-accent">.</span>
            </span>
          </a>
          <nav className="main-nav" aria-label="Main navigation">
            {pages.map((page) => (
              <a
                key={page.view}
                href={`#${page.view}`}
                onClick={(event) => navigate(event, page.view)}
                className="nav-link"
                aria-current={view === page.view ? "page" : undefined}
              >
                <RollingText>{page.label}</RollingText>
                <span className="nav-dot" aria-hidden="true" />
              </a>
            ))}
          </nav>
          <a
            href="/Max_Sun_Resume.pdf"
            className="header-resume text-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Résumé <ArrowUpRight size={15} aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </header>
      )}

      <main id="main" ref={mainRef} tabIndex={-1} className="main-stage">
        <div className={`view view-${view}`} key={view}>
          {view === "home" && (
            <LandingStory
              links={pages.map((page) => ({
                href: `#${page.view}`,
                label: page.label,
                onClick: (event) => navigate(event, page.view),
              }))}
            />
          )}

          {view === "projects" && (
            <>
              <div className="work-composition">
                <div className="work-index">
                  <Headline lines={["PROJECTS."]} accentLast />
                  <div
                    className="project-selector"
                    role="group"
                    aria-label="Choose a project"
                  >
                    {featuredProjects.map((item, index) => (
                      <button
                        key={item.title}
                        type="button"
                        className={`project-choice ${selectedProject === index ? "is-selected" : ""}`}
                        onClick={() => setSelectedProject(index)}
                        aria-pressed={selectedProject === index}
                        aria-controls="project-preview"
                      >
                        <span className="index-number">0{index + 1}</span>
                        <span>{item.title}</span>
                        <ArrowUpRight
                          size={20}
                          strokeWidth={1.3}
                          aria-hidden="true"
                        />
                      </button>
                    ))}
                  </div>
                  <ExternalLink
                    href={personal.social.github}
                    className="archive-link"
                  >
                    More on GitHub
                  </ExternalLink>
                </div>
                <article
                  className="project-preview"
                  id="project-preview"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <div key={project.title} className="project-detail">
                    <div
                      className={`project-image project-image-${selectedProject}`}
                    >
                      <Image
                        src={project.image}
                        alt={`${project.title} project preview`}
                        fill
                        sizes="(max-width: 760px) 100vw, 52vw"
                        priority
                      />
                      <span className="image-index" aria-hidden="true">
                        0{selectedProject + 1} / 03
                      </span>
                    </div>
                    <div className="project-meta">
                      <span className="eyebrow">
                        {project.category === "game"
                          ? "GAME DEVELOPMENT"
                          : "HARDWARE / EXPERIMENT"}
                      </span>
                      <span className="project-tags">
                        {project.tags.slice(0, 2).join(" / ")}
                      </span>
                    </div>
                    <h2>{project.title}</h2>
                    <p className="project-description">{project.description}</p>
                    <div className="project-links">
                      {project.links.map((link) => (
                        <ExternalLink key={link.url} href={link.url}>
                          {linkLabels[link.type]}
                        </ExternalLink>
                      ))}
                    </div>
                  </div>
                </article>
              </div>
            </>
          )}

          {view === "experience" && (
            <>
              <div className="about-composition">
                <div className="about-statement">
                  <Headline lines={["EXPERIENCE."]} accentLast />
                  <p className="section-intro">
                    I’m Max Sun, a Computer Engineering student at the
                    University of Waterloo. I work on software, games, and
                    hardware projects.
                  </p>
                  <p className="section-intro">
                    My interests include game development, web technologies, and
                    3D modeling in Blender.
                  </p>
                  <ExternalLink href="/Max_Sun_Resume.pdf">Résumé</ExternalLink>
                </div>
                <div className="experience-panel">
                  <div className="panel-label">
                    <h2 className="eyebrow">Experience</h2>
                  </div>
                  {experiences.map((experience, index) => (
                    <details
                      className="experience-row"
                      key={experience.company}
                    >
                      <summary>
                        <span className="index-number">0{index + 1}</span>
                        <span className="experience-summary">
                          <span className="experience-company">
                            {experience.company}
                          </span>
                          <span className="experience-role">
                            {experience.title}
                          </span>
                          <span className="experience-period">
                            {experience.period}
                          </span>
                        </span>
                        <Plus size={18} strokeWidth={1.2} aria-hidden="true" />
                      </summary>
                      <div className="experience-body">
                        <p>{experience.description}</p>
                        <span>{experience.technologies}</span>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </>
          )}

          {view === "contact" && (
            <>
              <div className="contact-composition">
                <div>
                  <Headline lines={["SHOOT ME", "A MESSAGE."]} accentLast />
                </div>
                <div className="contact-sidebar">
                  <a
                    href={`mailto:${personal.email}`}
                    className="contact-email text-link"
                  >
                    {personal.email}
                    <ArrowUpRight size={22} aria-hidden="true" />
                  </a>
                  <div className="contact-socials">
                    <ExternalLink href={personal.social.github}>
                      GitHub
                    </ExternalLink>
                    <ExternalLink href={personal.social.linkedin}>
                      LinkedIn
                    </ExternalLink>
                    <ExternalLink href={personal.social.itchio}>
                      itch.io
                    </ExternalLink>
                    <ExternalLink href={personal.social.devpost}>
                      Devpost
                    </ExternalLink>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
