'use client';

import { useInView } from '@/hooks/useInView';
import { personal } from '@/data/personal';
import { Mail, Github, Linkedin, Code, Gamepad2, Terminal } from 'lucide-react';

const socialLinks = [
  { icon: Github, href: personal.social.github, label: 'GitHub' },
  { icon: Linkedin, href: personal.social.linkedin, label: 'LinkedIn' },
  { icon: Code, href: personal.social.devpost, label: 'Devpost' },
  { icon: Gamepad2, href: personal.social.itchio, label: 'itch.io' },
];

export default function Contact() {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section id="contact" className="py-24 bg-[#1E293B]">
      <div className="max-w-4xl mx-auto px-6">
        <div
          ref={ref}
          className={`transition-all duration-700 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="flex items-center gap-4 mb-8">
            <Terminal className="w-8 h-8 text-run-green" />
            <h2 className="text-3xl md:text-4xl font-bold text-white font-mono tracking-tight">
              ping contact
            </h2>
          </div>

          <div className="border-l-2 border-slate-700 pl-6 space-y-8 font-mono mt-12">
            <p className="text-lg text-slate-300">
              <span className="text-slate-500">// I'm always open to discussing new projects,</span><br/>
              <span className="text-slate-500">// creative ideas, or opportunities.</span>
            </p>

            <div className="space-y-4 text-lg">
              <div className="flex items-center gap-3">
                <span className="text-run-green">const</span> <span className="text-white">email</span> = 
                <a
                  href={`mailto:${personal.email}`}
                  className="text-slate-300 hover:text-white transition-colors duration-200 underline decoration-slate-700 hover:decoration-run-green ml-2"
                >
                  '{personal.email}'
                </a>;
              </div>

              <div className="flex items-start gap-3 flex-wrap">
                <span className="text-run-green">const</span> <span className="text-white">socials</span> = [
                <div className="flex flex-wrap gap-4 items-center ml-2">
                  {socialLinks.map((link, index) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200"
                      aria-label={link.label}
                    >
                      <link.icon className="w-5 h-5" />
                      <span className="text-sm">'{link.label.toLowerCase()}'</span>
                      {index < socialLinks.length - 1 && <span className="text-white">,</span>}
                    </a>
                  ))}
                </div>
                ];
              </div>
            </div>
          </div>

          {/* Footer text */}
          <div className="mt-24 pt-8 border-t border-slate-800 text-sm text-slate-500 font-mono flex items-center justify-between">
            <p>
              &copy; {new Date().getFullYear()} {personal.name}
            </p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-run-green animate-pulse"></span>
              System Online
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}