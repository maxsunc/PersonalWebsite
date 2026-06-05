'use client';

import { useInView } from '@/hooks/useInView';
import { about } from '@/data/personal';
import { Terminal } from 'lucide-react';

export default function About() {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section id="about" className="py-24 bg-[#1E293B]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-16">
          <Terminal className="w-8 h-8 text-run-green" />
          <h2 className="text-3xl md:text-4xl font-bold text-white font-mono tracking-tight">
            about_me
          </h2>
        </div>

        <div
          ref={ref}
          className={`space-y-6 transition-all duration-500 font-sans border-l border-slate-700 pl-6 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {about.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="text-lg text-slate-300 leading-relaxed"
              style={{
                transitionDelay: `${index * 100}ms`,
              }}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}