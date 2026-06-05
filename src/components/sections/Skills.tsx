'use client';

import Image from 'next/image';
import { useInView } from '@/hooks/useInView';
import { skills } from '@/data/skills';
import { Terminal } from 'lucide-react';

export default function Skills() {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section id="skills" className="py-24 bg-[#1E293B]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-16">
          <Terminal className="w-8 h-8 text-run-green" />
          <h2 className="text-3xl md:text-4xl font-bold text-white font-mono tracking-tight">
            skills.json
          </h2>
        </div>

        <div
          ref={ref}
          className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 stagger-children ${
            isInView ? 'visible' : ''
          }`}
        >
          {skills.map((skill, index) => (
            <div
              key={skill.name}
              className="glass-card p-4 md:p-6 text-center group"
              style={{
                transitionDelay: `${index * 50}ms`,
              }}
            >
              <div className="h-10 md:h-12 flex items-center justify-center mb-3 grayscale group-hover:grayscale-0 transition-all duration-300">
                <Image
                  src={skill.icon}
                  alt={skill.name}
                  width={40}
                  height={40}
                  className="object-contain w-8 h-8 md:w-10 md:h-10"
                />
              </div>
              <span className="text-xs font-mono text-slate-300 group-hover:text-white transition-colors duration-300">
                {skill.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}