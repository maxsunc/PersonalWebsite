export interface Experience {
  title: string;
  company: string;
  period: string;
  technologies: string;
  description: string[];
}

export const experiences: Experience[] = [
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
    technologies: 'Android Studio, Java/Kotlin',
    description: [
      'Engineered a robust Android SDK (Java/Kotlin) to ingest and process high-frequency (25Hz) gaze-tracking telemetry from smart glasses, with 99.9% data upload reliability via RESTful APIs across 30+ edge devices.',
      'Developed high-performance Android UI components for real-time biometric visualization (heart-rate and gaze tracking), optimizing internal QA testing lifecycles and reducing debugging overhead by 30%.',
      'Streamlined sensor-to-cloud data ingestion by integrating custom Bluetooth SDKs and REST APIs into the core pipeline, significantly accelerating data availability by cutting latency by 40%.'
    ],
  }
];