export interface Experience {
  title: string;
  company: string;
  logo: string;
  logoStyle: 'square' | 'bag' | 'wordmark';
  website: string;
  period: string;
  technologies: string;
  description: string;
}

export const experiences: Experience[] = [
  {
    title: 'Incoming Software Engineering Intern',
    company: 'Rippling',
    logo: '/images/companies/ripplinglogo.webp',
    logoStyle: 'square',
    website: 'https://www.rippling.com/',
    period: 'Jan — Apr 2027',
    technologies: 'Data Cloud',
    description: 'Incoming software engineering intern on the Data Cloud team.',
  },
  {
    title: 'Software Engineer Intern',
    company: 'Shopify',
    logo: '/images/companies/shopify.svg',
    logoStyle: 'bag',
    website: 'https://www.shopify.com/',
    period: 'May — Aug 2026',
    technologies: 'Ruby, TypeScript, React Native',
    description: 'Retail POS',
  },
  {
    title: 'Software Engineering Intern',
    company: 'BrainRidge Consulting',
    logo: '/images/companies/brainridge.jpeg',
    logoStyle: 'square',
    website: 'https://www.brainridgeconsulting.com/',
    period: 'Jan — Apr 2026',
    technologies: 'TypeScript, Node.js, PostgreSQL, AWS, GitHub Actions',
    description: 'Enterprise RAG retrieval system',
  },
  {
    title: 'Software Developer Intern',
    company: 'Exo-Insights',
    logo: '/images/companies/exo-insights.png',
    logoStyle: 'wordmark',
    website: 'https://www.exoinsights.com/',
    period: 'May — Aug 2025',
    technologies: 'Unity, C#, Python, WebGL, REST/HTTP, Android',
    description: 'Core Development',
  }
];
