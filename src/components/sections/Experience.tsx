'use client';

import { useInView } from '@/hooks/useInView';
import { experiences } from '@/data/experience';
import { Terminal } from 'lucide-react';

export default function Experience() {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section id="experience" className="py-24 bg-[#0F172A]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-16">
          <Terminal className="w-8 h-8 text-run-green" />
          <h2 className="text-3xl md:text-4xl font-bold text-white font-mono tracking-tight">
            experience.log
          </h2>
        </div>

        <div
          ref={ref}
          className={`space-y-8 stagger-children ${isInView ? 'visible' : ''}`}
        >
          {experiences.map((experience, index) => (
            <article
              key={index}
              className="glass-card p-6 md:p-8"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white font-mono">
                    {experience.title}
                  </h3>
                  <div className="mt-2 text-sm font-mono flex flex-wrap gap-x-3 gap-y-1">
                    <span className="text-run-green">@ {experience.company}</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-400">{experience.technologies}</span>
                  </div>
                </div>
                <span className="text-sm text-slate-400 font-mono self-start border border-slate-700 px-3 py-1 bg-slate-800/50 whitespace-nowrap">
                  {experience.period}
                </span>
              </div>

              <ul className="text-slate-300 leading-relaxed font-sans space-y-3">
                {experience.description.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-run-green font-mono mt-1">&gt;</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}