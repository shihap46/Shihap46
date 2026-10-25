import {
  Boxes,
  BrainCircuit,
  Code,
  PenTool,
  Terminal,
  Wrench,
  type LucideIcon,
} from "lucide-react";

// Single source for personal details — edit here and every page updates
export const profile = {
  name: "Shihap",
  fullName: "Shihapdeen S.",
  role: "AI & Data Science Developer",
  subRole: "Software Development • AI Applications • Data Analytics",
  email: "shihaps561@gmail.com",
  phone: "7845765418",
  phoneFormatted: "+91 7845765418",
  location: "Coimbatore, Tamil Nadu, India",
  github: "https://github.com/shihap46/Shihap46",
  githubUsername: "shihap46/Shihap46",
  linkedin: "https://linkedin.com/",
  available: "available now for work",
  // Drop the PDF at public/resume.pdf — the download buttons switch on automatically
  resume: "/resume.pdf",
};

export const academic = {
  degree: "B.Tech in Artificial Intelligence & Data Science",
  short: "B.Tech AI & DS",
  college: "Mohamed Sathak Engineering College",
  status: "II Year, currently pursuing",
  start: 2024,
  end: 2028,
};

export const summary =
  "Second-year B.Tech Artificial Intelligence and Data Science student seeking a software development internship. Knowledge of C, C++, Python, Java, HTML and CSS, with completed internships in AI-driven software development and machine learning. Interested in building practical web applications and applying AI to real-world problems.";

export const about = {
  greeting: "Hi, I'm Shihapdeen.",
  line: "Second-year B.Tech AI & Data Science student seeking a software development internship. Building practical web applications and applying AI to real-world problems.",
  // The large intro paragraph in the About bento
  intro:
    "Second-year B.Tech Artificial Intelligence and Data Science student at Mohamed Sathak Engineering College seeking a software development internship. Knowledge of C, C++, Python, Java, HTML and CSS, with completed internships in AI-driven software development and machine learning. Interested in building practical web applications and applying AI to real-world problems.",
};

export interface Internship {
  role: string;
  company: string;
  period: string;
  location?: string;
  type: string;
  bullets: string[];
}

export const internships: Internship[] = [
  {
    role: "AI Driven Software Development",
    company: "Pantech Solutions India Pvt. Ltd.",
    period: "1-30 May 2026",
    type: "Internship",
    bullets: [
      "Worked on AI-driven software development and architectural concepts.",
      "Integrated machine learning models into functional software prototypes.",
      "Strengthened hands-on problem solving in real-world engineering workflows.",
    ],
  },
  {
    role: "AI and Machine Learning",
    company: "Skillsync Pro Pvt. Ltd., Nagercoil",
    period: "Duration: 1 week",
    location: "Nagercoil",
    type: "Internship",
    bullets: [
      "Completed intensive training in artificial intelligence and machine learning fundamentals.",
      "Explored data analysis, feature engineering, and model training methodologies.",
      "Collaborated on practical ML tasks and pipeline development.",
    ],
  },
];

export const projectConceptsResume = [
  {
    title: "Emergency Blood Donor Network",
    bullets: [
      "Outlined a platform to connect hospitals with nearby blood donors during urgent requests.",
      "Planned matching by blood group, donor eligibility, availability and distance, with notifications and verification features.",
    ],
  },
  {
    title: "SolarScope Rooftop Solar Potential Analyzer",
    bullets: [
      "Proposed analysis of roof conditions and shading to assess rooftop suitability and estimate solar potential.",
      "Explored payback estimates to help households evaluate solar installations.",
    ],
  },
  {
    title: "Smart Energy Waste Detection and Saving Platform",
    bullets: [
      "Explored an AI-assisted platform to identify potential energy waste in homes and small businesses and provide practical energy-saving insights.",
    ],
  },
];

export const areasOfInterest = [
  "Software Development",
  "Full-Stack Web Development",
  "AI Applications",
  "Machine Learning",
  "Data Analytics",
];

export const languages = ["Tamil", "English"];

// The three service cards under the About intro
export const services = [
  {
    title: "AI & Data Analytics",
    body: "Machine learning and AI fundamentals in Python — exploring data, engineering features, and training models to solve real-world problems.",
  },
  {
    title: "Software & Web Development",
    body: "Practical software development across C, C++, Python, Java, HTML, CSS, React and Next.js with clean architecture and modern motion.",
  },
  {
    title: "Data & Visual Design",
    body: "Clear information hierarchy, charts that make numbers readable, plus visual branding pieces that make projects look finished.",
  },
];

// Big animated skill words (About → Skills)
export const skillRows: { label: string; words: string[] }[] = [
  { label: "Languages", words: ["C", "C++", "Python", "Java"] },
  { label: "Web", words: ["HTML", "CSS", "JavaScript", "React"] },
  { label: "AI & Data", words: ["AI Fundamentals", "Machine Learning", "Data Analysis"] },
  { label: "Workflow", words: ["Git", "GitHub", "Word", "PowerPoint"] },
];

export const education = {
  intro: "Currently pursuing B.Tech in Artificial Intelligence & Data Science at Mohamed Sathak Engineering College (II Year).",
  milestones: [
    { year: 2024, title: "Started B.Tech", note: "Artificial Intelligence & Data Science at MSEC" },
    { year: 2025, title: "Skillsync Pro Internship", note: "AI & Machine Learning Internship" },
    { year: 2026, title: "Pantech Solutions Internship", note: "AI Driven Software Development (1-30 May 2026)" },
    { year: 2027, title: "Advanced Projects", note: "Deeper into software architecture & AI systems" },
    { year: 2028, title: "Graduation", note: "B.Tech in Artificial Intelligence & Data Science" },
  ],
};

// How I Work — six steps placed along the scroll-drawn path (x/y in a 1000×2000 box)
export const processSteps = [
  { n: "01", title: "I understand the problem", body: "who it's for, what data exists and what a good result looks like", note: "questions first", x: 610, y: 150 },
  { n: "02", title: "I explore the data", body: "clean it, analyse it and visualise it before choosing any model", note: "the data decides", x: 90, y: 470 },
  { n: "03", title: "I design the experience", body: "layout, typography and motion that make the result easy to read", note: "every choice has a reason", x: 610, y: 800 },
  { n: "04", title: "I build & train", body: "models in Python, interfaces in React and Next.js with smooth GSAP motion", note: "clean code, always", x: 90, y: 1130 },
  { n: "05", title: "I test & refine", body: "accuracy, performance and accessibility on every screen size", note: "until it feels right", x: 610, y: 1460 },
  { n: "06", title: "I ship & learn", body: "deploy, document and keep improving with every project", note: "never finished learning", x: 90, y: 1780 },
];

// The winding line the steps sit on (same 1000×2000 box)
export const processPath =
  "M 500 0 C 500 90, 880 90, 880 230 S 150 330, 150 520 S 860 640, 860 860 S 140 980, 140 1180 S 870 1300, 870 1520 S 130 1640, 130 1840 S 500 1960, 500 2000";

export const projectTypes = ["AI / ML model", "Web app", "3D experience", "Branding & design", "Something else"];

export interface NavLink {
  n: string;
  label: string;
  href: string;
}

// Top-right menu — every item opens its own page through the column transition
export const navLinks: NavLink[] = [
  { n: "01", label: "Home", href: "/" },
  { n: "02", label: "About", href: "/about" },
  { n: "03", label: "Work", href: "/work" },
  { n: "04", label: "Resume", href: "/resume" },
  { n: "05", label: "Contact", href: "/contact" },
];

export interface SkillGroup {
  id: string;
  title: string;
  headline: string;
  summary: string;
  items: string[];
  color: string;
  icon: LucideIcon;
}

export const skillGroups: SkillGroup[] = [
  {
    id: "core",
    title: "Programming",
    headline: "C · C++ · Python · Java",
    summary: "Strong foundations in procedural and object-oriented programming, data structures, and algorithms.",
    items: ["C", "C++", "Python", "Java", "SQL"],
    color: "#ededed",
    icon: Terminal,
  },
  {
    id: "ai",
    title: "AI & Data",
    headline: "AI Fundamentals · Machine Learning · Data Analysis",
    summary:
      "Fundamentals of artificial intelligence, machine learning algorithms, and data analysis pipelines.",
    items: ["AI Fundamentals", "Machine Learning", "Data Analysis", "Python", "OpenCV", "TensorFlow", "Scikit-learn"],
    color: "#a78bfa",
    icon: BrainCircuit,
  },
  {
    id: "dev",
    title: "Web Tech",
    headline: "HTML · CSS · React · Next.js",
    summary: "Responsive web technologies, semantic markup, custom CSS styling, and interactive web applications.",
    items: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js"],
    color: "#d4d4d4",
    icon: Code,
  },
  {
    id: "threed",
    title: "3D & Motion",
    headline: "Three.js · WebGL · GSAP",
    summary: "Real-time 3D experiences on the web — scenes, shaders, scroll-driven camera work and motion timelines.",
    items: ["Three.js", "React Three Fiber", "Drei", "GSAP", "ScrollTrigger"],
    color: "#bdbdbd",
    icon: Boxes,
  },
  {
    id: "tools",
    title: "Tools & Skills",
    headline: "Git · GitHub · Word · PowerPoint",
    summary: "Version control, collaborative code repositories, technical documentation, and professional presentations.",
    items: ["Git", "GitHub", "Microsoft Word", "Microsoft PowerPoint", "VS Code"],
    color: "#9a9a9a",
    icon: Wrench,
  },
];

export const skillCount = new Set(skillGroups.flatMap((g) => g.items)).size;

// ─── Creative Lab — design work, kept separate from the AI identity ───
export interface CreativeWork {
  id: string;
  title: string;
  line: string;
  tags: string[];
  color: string;
  accent: string;
  /** Drop a file in /public and set it here to replace the generated artwork */
  image?: string;
}

export const creativeLab: CreativeWork[] = [
  {
    id: "logo",
    title: "Logo",
    line: "Marks that stay simple, scalable and memorable.",
    tags: ["Marks", "Wordmarks", "Grids"],
    color: "#ededed",
    accent: "#a78bfa",
  },
  {
    id: "branding",
    title: "Branding",
    line: "Colour, type and rules that keep an identity consistent.",
    tags: ["Palette", "Type scale", "Guidelines"],
    color: "#a78bfa",
    accent: "#d4d4d4",
  },
  {
    id: "poster",
    title: "Poster",
    line: "Bold visuals built to be read across a room.",
    tags: ["Layout", "Contrast", "Hierarchy"],
    color: "#ededed",
    accent: "#a78bfa",
  },
  {
    id: "brochure",
    title: "Brochure",
    line: "Folded stories that explain a product in order.",
    tags: ["Multi-page", "Flow", "Print-ready"],
    color: "#bdbdbd",
    accent: "#a78bfa",
  },
  {
    id: "print",
    title: "Print Design",
    line: "Layouts prepared properly for real paper and ink.",
    tags: ["CMYK", "Bleed", "Typesetting"],
    color: "#d4d4d4",
    accent: "#a78bfa",
  },
];

export const creativeGroup = {
  id: "creative",
  title: "Creative Lab",
  icon: PenTool as LucideIcon,
  color: "#a78bfa",
  summary: "Visual design I can bring into any project — identity, print and campaign work.",
};

// How the skills connect, from raw data to a finished, branded product
export const pipeline = [
  { step: "DATA", tools: ["Python", "SQL"], note: "Collect & clean" },
  { step: "MODEL", tools: ["XGBoost", "LightGBM", "PyTorch", "TensorFlow", "Keras"], note: "Train & evaluate" },
  { step: "SERVE", tools: ["FastAPI", "Flask"], note: "Model → API" },
  { step: "DEMO", tools: ["Streamlit"], note: "Quick AI demo" },
  { step: "SHIP", tools: ["Next.js", "React", "Three.js"], note: "Full web product" },
  { step: "BRAND", tools: ["Logo", "Branding", "Poster"], note: "Launch visuals" },
];

// Nodes shown on the rotating 3D skill sphere, coloured by group
export const constellationSkills: { label: string; color: string }[] = skillGroups.flatMap((g) =>
  g.items.slice(0, 5).map((label) => ({ label, color: g.color }))
);
