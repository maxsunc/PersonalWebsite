export interface Experience {
  title: string;
  company: string;
  period: string;
  description: string;
}

export const experiences: Experience[] = [
  {
    title: 'Software Engineer Intern',
    company: 'Exo-Insights',
    period: 'May 2025 - August 2025',
    description:
      'Delivered digital twin solutions to the Canadian Nuclear Safety Commission using Unity C# for VR and WebGL, developing custom file upload systems and WebGL profilers that improved performance across multiple projects.',
  },
  {
    title: 'Co-Founder and Organizer',
    company: 'GooseHacks',
    period: 'May 2023 - Sept 2023',
    description:
      'Spearheaded development of the official event website and secured $5k+ in sponsorships from companies including Unity, Postman, and 1Password, managing relationships with 8+ sponsors while coordinating the hackathon for 200+ participants.',
  },
];
