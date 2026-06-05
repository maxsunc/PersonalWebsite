export interface ProjectLink {
  type: 'steam' | 'website' | 'github' | 'play' | 'devpost' | 'trophy';
  url: string;
}

export interface Project {
  title: string;
  description: string;
  image: string;
  tags: string[];
  links: ProjectLink[];
  category: 'game' | 'web' | 'hardware' | 'vr';
}

export const projects: Project[] = [
  {
    title: 'Tower of Wizard',
    description:
      'Spellslinging action rogue-like to be released on Steam. Tower of Wizard is a survival rogue-lite where you ascend a cursed tower filled with monstrous foes and fallen wizards. Collect powerful relics, craft broken builds, and uncover the mystery that waits at the top floor.',
    image: '/images/towlogo.jpg',
    tags: ['Unity', 'C#', 'Steam Release'],
    links: [
      { type: 'steam', url: 'https://store.steampowered.com/app/3930570/Tower_of_Wizard/' },
      { type: 'website', url: 'https://towerofwizard.com/' },
    ],
    category: 'game',
  },
  {
    title: 'Attack on Titan ODM Gear Simulator',
    description:
      'A full 3D recreation of the ODM gear from Attack On Titan using physics and Unity\'s Game Engine!',
    image: '/images/logo.png',
    tags: ['Unity', 'C#', '3D Physics'],
    links: [
      { type: 'play', url: 'https://ratweeb.itch.io/odm-gear' },
      { type: 'github', url: 'https://github.com/maxsunc' },
    ],
    category: 'game',
  },
  {
    title: 'Shadows Labyrinth',
    description:
      'A sneaky rogue-like game with procedural generation. 6th place overall in ScoreSpace Game Jam #25!',
    image: '/images/Shadows.png',
    tags: ['Unity', 'Procedural', 'Award Winner'],
    links: [
      { type: 'play', url: 'https://ratweeb.itch.io/shadows-labyrinth' },
    ],
    category: 'game',
  },
  {
    title: 'Boxhead AR',
    description:
      'Handcrafted augmented reality cardboard headset with real-time object tracking.',
    image: '/images/boxhead.jpg',
    tags: ['AR', 'Hardware', 'Computer Vision'],
    links: [
      { type: 'devpost', url: 'https://devpost.com/software/boxhead' },
      { type: 'github', url: 'https://github.com/PetarIsakovic/BoxHead' },
    ],
    category: 'hardware',
  },
  {
    title: '3D Bloons Tower Defense',
    description:
      'A 3D recreation of Bloons TD6 in Java with custom OpenGL game engine.',
    image: '/images/bloons.png',
    tags: ['Java', 'OpenGL', '3D'],
    links: [
      { type: 'github', url: 'https://github.com/maxsunc/BTD3D' },
    ],
    category: 'game',
  },
  {
    title: 'VR ODM Gear Simulator',
    description:
      'VR recreation of Attack on Titan ODM gear with custom Arduino controller. Hack The North 2023.',
    image: '/images/vr.jpg',
    tags: ['VR', 'Arduino', 'Hackathon'],
    links: [
      { type: 'devpost', url: 'https://devpost.com/software/vr-omni-directional-movement-gear' },
    ],
    category: 'vr',
  },
  {
    title: 'GooseHacks Website',
    description:
      'Official website for GooseHacks hackathon with real-time updates and interactive features.',
    image: '/images/gooseHacks.png',
    tags: ['HTML/CSS', 'JavaScript', 'Event'],
    links: [
      { type: 'website', url: 'https://goosehacks.ca' },
      { type: 'trophy', url: 'https://goosehacks-2023.devpost.com/' },
    ],
    category: 'web',
  },
];
