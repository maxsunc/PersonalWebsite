'use client';

import { Github, Linkedin, Code, Gamepad2, ChevronDown, Terminal } from 'lucide-react';
import { personal } from '@/data/personal';

const socialLinks = [
  { icon: Github, href: personal.social.github, label: 'GitHub' },
  { icon: Linkedin, href: personal.social.linkedin, label: 'LinkedIn' },
  { icon: Code, href: personal.social.devpost, label: 'Devpost' },
  { icon: Gamepad2, href: personal.social.itchio, label: 'itch.io' },
];

export default function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center bg-[#0F172A]"
    >
      {/* Content */}
      <div className="w-full max-w-4xl mx-auto px-6 py-24 z-10">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 text-run-green mb-4">
            <Terminal className="w-5 h-5" />
            <span className="font-mono text-sm opacity-80">guest@maxsun.ca:~$ ./whoami.sh</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
            {personal.name}
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 font-mono">
            <span className="text-run-green">&gt;</span> {personal.title}
          </p>

          <p className="text-base md:text-lg text-slate-300 max-w-2xl font-sans mt-4 border-l-2 border-slate-700 pl-4 py-2 bg-slate-800/30">
            {personal.description}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={() => scrollToSection('projects')}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Terminal className="w-4 h-4" />
              cd ./projects
            </button>
            <button
              onClick={() => scrollToSection('experience')}
              className="btn-secondary"
            >
              cat experience.md
            </button>
          </div>

          {/* Social Links */}
          <div className="flex gap-4 mt-8 border-t border-slate-800 pt-8">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors duration-200"
                aria-label={link.label}
              >
                <link.icon className="w-6 h-6" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={() => scrollToSection('about')}
        className="absolute bottom-8 left-6 text-slate-500 hover:text-white transition-colors cursor-pointer flex items-center gap-2 font-mono text-sm"
        aria-label="Scroll to About section"
      >
        <span>scroll down</span>
        <ChevronDown className="w-4 h-4 animate-bounce" />
      </button>
    </section>
  );
}