'use client';

import Image from 'next/image';
import { useInView } from '@/hooks/useInView';
import { projects, ProjectLink } from '@/data/projects';
import { Github, ExternalLink, Play, Trophy, Terminal } from 'lucide-react';

const iconMap = {
  steam: () => (
    <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15c0-1.1.9-2 2-2s2 .9 2 2v6.8c4.56-.93 8-4.96 8-9.8 0-5.52-4.48-10-10-10zm-1 15a1 1 0 110-2 1 1 0 010 2zm5-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  website: ExternalLink,
  github: Github,
  play: Play,
  devpost: ExternalLink,
  trophy: Trophy,
};

function ProjectLinkIcon({ link }: { link: ProjectLink }) {
  const Icon = iconMap[link.type];
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="p-3 border border-slate-700 bg-[#0F172A]/80 backdrop-blur-sm text-slate-300 hover:text-white hover:border-run-green transition-all duration-200 group/icon"
      aria-label={link.type}
    >
      <Icon className="w-5 h-5 group-hover/icon:scale-110 transition-transform" />
    </a>
  );
}

export default function Projects() {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.05 });

  return (
    <section id="projects" className="py-24 bg-[#0F172A]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-16">
          <Terminal className="w-8 h-8 text-run-green" />
          <h2 className="text-3xl md:text-4xl font-bold text-white font-mono tracking-tight">
            ls -la ./projects
          </h2>
        </div>

        <div
          ref={ref}
          className={`grid md:grid-cols-2 gap-6 md:gap-8 stagger-children ${
            isInView ? 'visible' : ''
          }`}
        >
          {projects.map((project, index) => (
            <article
              key={project.title}
              className="glass-card overflow-hidden group flex flex-col h-full"
              style={{
                transitionDelay: `${index * 100}ms`,
              }}
            >
              {/* Project Image */}
              <div className="relative h-48 md:h-56 overflow-hidden border-b border-slate-800 grayscale group-hover:grayscale-0 transition-all duration-500">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover"
                />
                {/* Overlay with links */}
                <div className="absolute inset-0 bg-[#0F172A]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                  {project.links.map((link, linkIndex) => (
                    <ProjectLinkIcon key={linkIndex} link={link} />
                  ))}
                </div>
              </div>

              {/* Project Content */}
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-semibold text-white mb-3 font-mono">
                  {project.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 font-sans flex-1">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs font-mono border border-slate-700 text-slate-400 bg-slate-900"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}