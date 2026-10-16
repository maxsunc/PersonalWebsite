import Navigation from '@/components/layout/Navigation';
import Hero from '@/components/sections/Hero';
import GitHub from '@/components/sections/GitHub';
import Experience from '@/components/sections/Experience';
import Contact from '@/components/sections/Contact';

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <GitHub />
        <Experience />
        <Contact />
      </main>
    </>
  );
}
