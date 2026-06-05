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
          className={`space-y-6 stagger-children ${isInView ? 'visible' : ''}`}
        >
          {experiences.map((experience, index) => (
            <article
              key={index}
              className="glass-card p-6 md:p-8"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white font-mono">
                    {experience.title}
                  </h3>
                  <p className="text-run-green font-mono text-sm mt-1">
                    @ {experience.company}
                  </p>
                </div>
                <span className="text-sm text-slate-400 font-mono self-start border border-slate-700 px-3 py-1 bg-slate-800/50">
                  {experience.period}
                </span>
              </div>

              <p className="text-slate-300 leading-relaxed font-sans mt-4">
                {experience.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}