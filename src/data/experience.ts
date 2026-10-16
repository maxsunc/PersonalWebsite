export interface Experience {
  title: string;
  company: string;
  period: string;
  technologies: string;
  description: string;
}

export const experiences: Experience[] = [
  {
    title: 'Incoming Software Engineering Intern',
    company: 'Rippling',
    period: 'January 2027 - April 2027',
    technologies: 'Data Cloud',
    description: 'Incoming software engineering intern on the Data Cloud team.',
  },
  {
    title: 'Software Engineer Intern',
    company: 'Shopify',
    period: 'May 2026 - August 2026',
    technologies: 'Ruby, TypeScript, React Native',
    description: 'Retail POS',
  },
  {
    title: 'Software Engineering Intern',
    company: 'BrainRidge Consulting',
    period: 'January 2026 - April 2026',
    technologies: 'TypeScript, Node.js, PostgreSQL, AWS, GitHub Actions',
    description: 'Enterprise RAG retrieval system',
  },
  {
    title: 'Software Developer Intern',
    company: 'Exo-Insights',
    period: 'May 2025 - August 2025',
    technologies: 'Unity, C#, Python, WebGL, REST/HTTP, Android',
    description: 'Core Development',
  }
];
