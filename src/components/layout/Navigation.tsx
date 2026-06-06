'use client';

import { useEffect, useState } from 'react';

const sections = [
  { id: 'home', label: '~/home' },
  { id: 'about', label: '~/about' },
  { id: 'experience', label: '~/experience' },
  { id: 'projects', label: '~/projects' },
  { id: 'contact', label: '~/contact' },
];

export default function Navigation() {
  const [activeSection, setActiveSection] = useState('home');
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);

      const sectionElements = sections.map(s => ({
        id: s.id,
        element: document.getElementById(s.id),
      }));

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i];
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 2) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Desktop Navigation - Top Bar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 bg-[#0F172A]/90 backdrop-blur-sm border-b border-slate-800 transition-transform duration-300 hidden md:block ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        aria-label="Section navigation"
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="text-run-green font-bold terminal-prompt">
            maxsun.ca
          </div>
          <ul className="flex gap-6">
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => scrollToSection(section.id)}
                  className={`text-sm font-medium transition-colors hover:text-white ${
                    activeSection === section.id
                      ? 'text-white border-b border-run-green'
                      : 'text-slate-400'
                  }`}
                  aria-label={`Go to ${section.id}`}
                  aria-current={activeSection === section.id ? 'true' : undefined}
                >
                  {section.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile Navigation - Bottom bar */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0F172A]/95 backdrop-blur-sm border-t border-slate-800 transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <ul className="flex justify-around py-3 overflow-x-auto gap-4 px-4 hide-scrollbar">
          {sections.map((section) => (
            <li key={section.id} className="flex-shrink-0">
              <button
                onClick={() => scrollToSection(section.id)}
                className={`text-xs font-medium px-2 py-1 transition-colors ${
                  activeSection === section.id
                    ? 'text-white border-b border-run-green'
                    : 'text-slate-400'
                }`}
              >
                {section.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}