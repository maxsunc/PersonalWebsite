export interface Experience {
  title: string;
  company: string;
  period: string;
  technologies: string;
  description: string[];
}

export const experiences: Experience[] = [
  {
    title: 'Incoming Software Engineering Intern',
    company: 'Rippling',
    period: 'January 2027 - April 2027',
    technologies: 'Data Cloud',
    description: [
      'Incoming software engineering intern on the Data Cloud team.'
    ],
  },
  {
    title: 'Software Engineer Intern',
    company: 'Shopify',
    period: 'May 2026 - August 2026',
    technologies: 'Ruby, TypeScript, React Native',
    description: [
      'Scaled Shopify’s mobile POS for in-person merchants by optimizing offline-to-online sync, reducing 95th percentile sync latency by about 35% (1.7s to 1.1s) and supporting about 20k daily checkouts.',
      'Built reliability and telemetry improvements for POS sessions in React Native/TypeScript, cutting crash rate by about 22% and increasing successful checkout sessions to about 99.3%.'
    ],
  },
  {
    title: 'Software Engineering Intern',
    company: 'BrainRidge Consulting',
    period: 'January 2026 - April 2026',
    technologies: 'TypeScript, Node.js, PostgreSQL, AWS, GitHub Actions',
    description: [
      'Designed and deployed a highly-scalable automated HTTP data ingestion pipeline (Node.js) for a RAG-based AI model, accelerating knowledge base expansion by 70% and eliminating 83% of manual administrative overhead.',
      'Spearheaded the development of a multi-query RAG-Fusion retrieval engine utilizing AWS Bedrock and advanced LLM prompt engineering, achieving an unprecedented 98% document recall for ambiguous user queries.',
      'Architected a hybrid search infrastructure combining BM25 and vector search with Reciprocal Rank Fusion within PostgreSQL, optimizing exact-match retrieval accuracy and plummeting zero-result rates by 62%.',
      'Pioneered a real-time, low-latency conversational AI voice system via WebSockets and AWS Nova, delivering sub-500ms median response times for natural banking interactions complete with voice barge-in capabilities.',
      'Transformed cloud infrastructure deployment by engineering a multi-environment CI/CD pipeline leveraging Terraform, GitHub Actions, and AWS, accelerating release velocity by 73% with rigorous production safety gates.'
    ],
  },
  {
    title: 'Software Developer Intern',
    company: 'Exo-Insights',
    period: 'May 2025 - August 2025',
    technologies: 'Unity, C#, Python, WebGL, REST/HTTP, Android',
    description: [
      'Built a custom WebGL performance profiler that broke a 2-month production bottleneck and became standard tooling across all WebGL projects, improving performance by 44% on average.',
      'Refactored the cross-platform (Android) file-loading architecture, cutting load times by 40%.',
      'Created file-upload and asset-management systems in Unity (C#) backed by a Python service layer for a digital twin VR/WebGL training platform used by the Canadian Nuclear Safety Commission.'
    ],
  }
];