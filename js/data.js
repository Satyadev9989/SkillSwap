/**
 * SkillSwap - Peer-to-Peer Skill Exchange Platform
 * Data Layer (js/data.js)
 * Clean, structured sample data for skills, categories, and peer profiles
 */

const SkillSwapData = {
  // Master Catalog of Available Skills for Onboarding, Search & Exchanges
  allSkills: [
    'Java',
    'Python',
    'JavaScript',
    'HTML & CSS',
    'C++',
    'UI/UX Design',
    'Figma',
    'Graphic Design',
    'Video Editing',
    'Photoshop',
    'Public Speaking',
    'Communication',
    'Excel',
    'Photography',
    'Content Writing',
    'Data Analysis',
    'Web Development'
  ],

  // Modular Category-to-Skills Mapping for Explore Filtering
  skillCategories: {
    'programming': {
      id: 'programming',
      name: 'Programming',
      skills: ['Java', 'Python', 'C++', 'JavaScript', 'Data Analysis']
    },
    'web-dev': {
      id: 'web-dev',
      name: 'Web Development',
      skills: ['HTML & CSS', 'JavaScript', 'Web Development']
    },
    'design': {
      id: 'design',
      name: 'Design',
      skills: ['UI/UX Design', 'Graphic Design', 'Photoshop', 'Figma']
    },
    'media': {
      id: 'media',
      name: 'Video & Media',
      skills: ['Video Editing', 'Photography', 'Content Creation']
    },
    'communication': {
      id: 'communication',
      name: 'Communication',
      skills: ['Public Speaking', 'Communication', 'Content Writing']
    },
    'productivity': {
      id: 'productivity',
      name: 'Productivity',
      skills: ['Excel']
    }
  },

  // Skill Proficiency Levels
  skillLevels: ['Beginner', 'Intermediate', 'Advanced'],

  // Skill Categories
  categories: [
    { id: 'all', name: 'All Skills' },
    { id: 'development', name: 'Web & Software' },
    { id: 'programming', name: 'Languages & Algorithms' },
    { id: 'design', name: 'UI/UX & Graphics' },
    { id: 'media', name: 'Video & Media' }
  ],

  // Popular Skills Catalog for Landing Page & Featured Directory
  popularSkills: [
    {
      id: 'web-dev',
      name: 'Web Development',
      category: 'development',
      icon: 'code',
      badge: 'High Demand',
      peersCount: 184,
      description: 'Master semantic HTML5, modern CSS3 layouts, Vanilla JavaScript, DOM architecture, and responsive SaaS frontends.',
      topics: ['HTML5 & CSS3', 'JavaScript ES6+', 'Responsive Grid', 'Clean Web APIs']
    },
    {
      id: 'java-prog',
      name: 'Java Programming',
      category: 'programming',
      icon: 'coffee',
      badge: 'Core Curriculum',
      peersCount: 142,
      description: 'Strengthen Object-Oriented Programming, Java collections, multithreading, and algorithmic problem-solving for campus interviews.',
      topics: ['OOP Principles', 'Collections Framework', 'Data Structures', 'Spring Boot']
    },
    {
      id: 'ui-ux',
      name: 'UI/UX Design',
      category: 'design',
      icon: 'palette',
      badge: 'Top Swapped',
      peersCount: 215,
      description: 'Create high-converting user interfaces, wireframes, design systems, and interactive prototypes using industry-standard Figma.',
      topics: ['Figma Mastery', 'Design Systems', 'User Research', 'Wireframing']
    },
    {
      id: 'video-editing',
      name: 'Video Editing',
      category: 'media',
      icon: 'film',
      badge: 'Creative',
      peersCount: 98,
      description: 'Produce engaging visual content, color grading, sound design, and kinetic typography in DaVinci Resolve or Premiere Pro.',
      topics: ['DaVinci Resolve', 'Premiere Pro', 'Audio Mixing', 'Motion Graphics']
    },
    {
      id: 'python-dev',
      name: 'Python Programming',
      category: 'programming',
      icon: 'terminal',
      badge: 'Trending',
      peersCount: 238,
      description: 'Write robust automation scripts, explore data analytics libraries (NumPy, Pandas), and build backend REST APIs with FastAPI.',
      topics: ['Scripting', 'Data Analysis', 'FastAPI & Flask', 'Automation']
    },
    {
      id: 'graphic-design',
      name: 'Graphic Design',
      category: 'design',
      icon: 'layout',
      badge: 'Creative',
      peersCount: 126,
      description: 'Craft memorable brand identities, vector illustrations, promotional assets, and typographic hierarchy for modern brands.',
      topics: ['Illustrator', 'Photoshop', 'Brand Identity', 'Vector Art']
    }
  ],

  // Platform Metrics
  metrics: {
    activeLearners: '1,200+',
    skillsExchanged: '85+',
    completedSwaps: '4,500+',
    peerSatisfaction: '99.4%'
  }
};

// Export to window and module export for vanilla script & test access
if (typeof window !== 'undefined') {
  window.SkillSwapData = SkillSwapData;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkillSwapData;
}
