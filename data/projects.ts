import type { ProjectModalData } from "../context/GameContext";

export type ProjectShape = "icosahedron" | "torusKnot" | "octahedron" | "dodecahedron" | "torus" | "sun";

export interface BuildStep {
  step: string;
  detail: string;
}

export interface CaseStudy {
  problem: string;
  solution: string;
  /** The pipeline diagram shown on the case study page */
  flow: string[];
  build: BuildStep[];
  stack: { group: string; items: string[] }[];
  features: string[];
  contribution: string[];
  result: string;
  /** Drop a file in /public and set it here to show a real screenshot or clip */
  /** scene: a live 3D scene; image is its fallback when WebGL is unavailable */
  media?: { scene?: "blood" | "solar"; image?: string; video?: string; caption?: string };
}

export interface Project extends ProjectModalData {
  slug: string;
  n: string;
  year?: string;
  featured?: boolean;
  tagline: string;
  shape: ProjectShape;
  accent: string;
  demo?: string;
  study: CaseStudy;
}

// Shared by the Projects pages, the home preview and the 3D rover docking stations (matched by slug)
export const projects: Project[] = [
  {
    slug: "blood-donor-network",
    n: "01",
    year: "2026",
    featured: true,
    title: "EMERGENCY BLOOD DONOR NETWORK",
    tagline: "Match an emergency request to a donor who can actually get there.",
    category: "AI & FULL STACK · BUILT 2026",
    tag: "REAL-TIME / GEOSPATIAL / HEALTHCARE",
    desc: "A platform designed to connect hospitals and patients with nearby blood donors during urgent requests — matching on blood group, donor eligibility, availability, and distance with live notifications and verification.",
    tech: ["Next.js", "TypeScript", "Node.js", "PostgreSQL", "Socket.io"],
    shape: "octahedron",
    color: "#ff3b5c",
    accent: "text-[#ff3b5c]",
    href: "https://github.com/shihap46/Shihap46",
    metrics: "REAL-TIME MATCHING · BUILT 2026",
    study: {
      problem:
        "In an emergency, hospitals and families lose time calling around for a matching blood donor. Contact lists go stale, most people called turn out to be ineligible, and nobody knows who is close enough to actually arrive in time.",
      solution:
        "A real-time network that takes an emergency request and ranks nearby donors by blood compatibility, eligibility, distance and availability — then notifies the best matches first and tracks their responses live.",
      flow: [
        "Emergency Request",
        "Eligibility Filtering",
        "Blood Compatibility",
        "Distance",
        "Availability",
        "AI Ranking",
        "Donor Notification",
      ],
      build: [
        {
          step: "Request intake",
          detail: "A hospital or requester submits blood group, units needed and an urgency level.",
        },
        {
          step: "Eligibility filter",
          detail:
            "Donors are filtered on last-donation date and donation-interval rules, so only people who are actually allowed to donate are considered.",
        },
        {
          step: "Compatibility matching",
          detail: "ABO/Rh compatibility rules decide which donor groups can serve the request.",
        },
        {
          step: "Distance & availability",
          detail:
            "The remaining donors are scored on travel distance and on whether they are currently marked available.",
        },
        {
          step: "Ranking",
          detail:
            "The scores combine into one ranked shortlist, so the donor most likely to arrive in time is contacted first.",
        },
        {
          step: "Live notification",
          detail:
            "Socket.io pushes the request to shortlisted donors and updates the request status in real time as people accept or decline.",
        },
      ],
      stack: [
        { group: "Frontend", items: ["Next.js", "TypeScript"] },
        { group: "Backend", items: ["Node.js", "Socket.io"] },
        { group: "Data", items: ["PostgreSQL"] },
      ],
      features: [
        "Emergency request with blood group, units and urgency",
        "ABO/Rh compatibility matching",
        "Donation-interval eligibility rules",
        "Distance-based donor shortlist",
        "Real-time notification and response tracking",
        "Live request status for the requester",
      ],
      contribution: [
        "Designed the eligibility, compatibility and ranking logic",
        "Built the real-time request and notification flow",
        "Modelled donors, requests and donation history in PostgreSQL",
        "Built the front-end and the request dashboard",
      ],
      result:
        "Turns a chain of phone calls into a single ranked, real-time shortlist. This is the project I use to show how I take an urgent real-world problem and reduce it to a clear, working system.",
      media: { scene: "blood", image: "/case-blood-donor.svg", caption: "Interactive 3D concept — the hospital broadcasts a request and links out to matched donors. Drag to orbit." },
    },
  },
  {
    slug: "rooftop-solar-ai",
    n: "02",
    year: "2026",
    title: "SOLARSCOPE ROOFTOP SOLAR ANALYZER",
    tagline: "Point it at a roof, get a solar answer.",
    category: "AI / COMPUTER VISION",
    tag: "COMPUTER VISION / CLEAN ENERGY / DEEP LEARNING",
    desc: "Proposed analysis of roof conditions and shading to assess rooftop suitability, estimate solar potential, and explore payback estimates to help households evaluate solar installations.",
    tech: ["Python", "OpenCV", "TensorFlow", "FastAPI", "React"],
    shape: "sun",
    color: "#fbbf24",
    accent: "text-amber-300",
    href: "https://github.com/shihap46/Shihap46",
    metrics: "COMPUTER VISION · SOLAR ESTIMATION",
    study: {
      problem:
        "Before installing solar, a household has to guess how much of their roof is actually usable. A proper site survey is slow and expensive, so most people never find out whether their roof is worth it.",
      solution:
        "A web app that takes a rooftop image, detects the usable roof area, accounts for shading and obstructions, and estimates how much solar energy that roof could generate along with payback calculations.",
      flow: ["Roof Image", "AI Detection", "Solar Analysis", "Estimated Generation"],
      build: [
        {
          step: "Image input",
          detail:
            "A rooftop or satellite image is uploaded in the browser and sent to the Python service as a single request.",
        },
        {
          step: "Roof detection",
          detail:
            "OpenCV pre-processing and a segmentation model separate the roof surface from its surroundings and measure the usable area.",
        },
        {
          step: "Shading & obstructions",
          detail: "Chimneys, water tanks and shadowed regions are detected and subtracted from the usable area.",
        },
        {
          step: "Solar analysis",
          detail:
            "The remaining area is converted into an energy estimate using panel efficiency and irradiance assumptions.",
        },
        {
          step: "Serving the model",
          detail: "FastAPI wraps the pipeline as a REST endpoint and the React front-end renders the result.",
        },
      ],
      stack: [
        { group: "AI & Vision", items: ["Python", "OpenCV", "TensorFlow"] },
        { group: "Backend", items: ["FastAPI"] },
        { group: "Frontend", items: ["React"] },
      ],
      features: [
        "Upload a roof image from any device",
        "Automatic usable-area detection",
        "Shading and obstruction handling",
        "Energy generation estimate for that roof",
        "Payback estimations for households",
        "A result view a non-technical homeowner can read",
      ],
      contribution: [
        "Built the computer-vision pipeline end to end",
        "Designed the usable-area to energy estimation logic",
        "Wrote the FastAPI service and connected it to the React front-end",
        "Designed the result screen",
      ],
      result:
        "A working prototype that turns one rooftop photo into a solar estimate in a single pass, replacing a manual survey step with an automated one.",
      media: { scene: "solar", image: "/case-rooftop-solar.svg", caption: "Interactive 3D concept — sunrise to sunset: sunlight hits the panels, energy charges the battery. Drag to orbit." },
    },
  },
  {
    slug: "smart-energy-waste",
    n: "03",
    year: "2026",
    title: "SMART ENERGY WASTE DETECTION & SAVING PLATFORM",
    tagline: "AI-assisted platform to identify potential energy waste and deliver practical savings.",
    category: "AI & DATA ANALYTICS · 2026",
    tag: "ENERGY EFFICIENCY / SMART MONITORING / PREDICTIVE AI",
    desc: "Explored an AI-assisted platform to identify potential energy waste in homes and small businesses and provide practical energy-saving insights.",
    tech: ["Python", "Machine Learning", "Data Analysis", "FastAPI", "React"],
    shape: "dodecahedron",
    color: "#34d399",
    accent: "text-emerald-300",
    href: "https://github.com/shihap46/Shihap46",
    metrics: "ENERGY WASTE DETECTION · PRACTICAL INSIGHTS",
    study: {
      problem:
        "Households and small businesses unknowingly lose substantial electricity to idle appliances, inefficient schedules, and malfunctioning equipment, resulting in inflated utility bills without clear visibility into where the waste occurs.",
      solution:
        "An AI-assisted platform that tracks energy draw signatures, flags anomalies and phantom loads, and delivers personalized, easy-to-follow recommendations that reduce waste and lower electricity costs.",
      flow: [
        "Consumption Telemetry",
        "Baseline Modeling",
        "Anomaly Detection",
        "Waste Categorization",
        "Payback Insights",
        "User Action Plan",
      ],
      build: [
        {
          step: "Telemetry intake",
          detail: "Smart meter and appliance load time-series data are aggregated and normalized in real time.",
        },
        {
          step: "Baseline modeling",
          detail:
            "Machine learning algorithms establish typical usage patterns across day/night cycles, seasons, and working days.",
        },
        {
          step: "Anomaly & leak detection",
          detail: "Continuous idle loads, phantom draws, and unexpected peak spikes are identified and scored.",
        },
        {
          step: "Impact & cost estimation",
          detail:
            "Identified waste is translated into direct monthly monetary cost and carbon footprint equivalents.",
        },
        {
          step: "Actionable recommendations",
          detail: "The user is given prioritized steps to eliminate waste without degrading comfort or productivity.",
        },
      ],
      stack: [
        { group: "AI & Analytics", items: ["Python", "Machine Learning", "Data Analysis", "Scikit-learn"] },
        { group: "Backend", items: ["FastAPI", "Python"] },
        { group: "Frontend", items: ["React", "Next.js", "Tailwind CSS"] },
      ],
      features: [
        "Time-series energy load visualization",
        "Automated idle / standby power waste detection",
        "Appliance usage scheduling optimization",
        "Projected cost savings and payback analysis",
        "Intuitive dashboard tailored for non-technical users",
      ],
      contribution: [
        "Researched and outlined the core AI energy waste detection algorithms",
        "Designed the pattern recognition and baseline modeling logic",
        "Formulated the saving insights and payback estimation workflows",
        "Prototyped the dashboard and alert system interface",
      ],
      result:
        "Transforms abstract kilowatt-hour metrics into clear, actionable steps that pinpoint waste and empower households and small businesses to cut bills.",
      media: { image: "/case-energy-waste.svg", caption: "Smart Energy Platform — load telemetry, AI waste classification, and projected savings." },
    },
  },
  {
    slug: "career-guidance",
    n: "04",
    year: "2026",
    title: "CAREER GUIDANCE PLATFORM",
    tagline: "From what a student knows to what they should learn next.",
    category: "WEB / AI TOOLS",
    tag: "AI ROADMAPS / EDUCATION TECH / UX",
    desc: "A platform that analyses a student's skill profile against real job profiles, then generates career paths, skill gaps, a learning roadmap and interview preparation.",
    tech: ["Python", "FastAPI", "Next.js", "NLP", "Tailwind CSS"],
    shape: "icosahedron",
    color: "#a78bfa",
    accent: "text-purple-300",
    href: "https://github.com/shihap46/Shihap46",
    metrics: "SKILL GAP TO ROADMAP",
    study: {
      problem:
        "Engineering students are told to build skills without being told which ones. They cannot see how their current skills line up against a real job, or what to learn in what order.",
      solution:
        "A platform where a student enters their skills, has their profile analysed against real career paths, sees exactly which skills are missing, and gets a learning roadmap plus interview preparation for the path they pick.",
      flow: [
        "Student enters skills",
        "AI analyzes profile",
        "Career paths",
        "Skill gaps",
        "Learning roadmap",
        "Interview preparation",
      ],
      build: [
        { step: "Skill intake", detail: "The student enters their current skills, subjects and interests." },
        {
          step: "Profile analysis",
          detail:
            "Entered skills are normalised with NLP and compared against the skill sets that real job profiles ask for.",
        },
        {
          step: "Path matching",
          detail: "Career paths are ranked by how well the existing profile already fits them.",
        },
        {
          step: "Gap analysis",
          detail: "For each path, the missing skills are listed as the gap that has to be closed.",
        },
        {
          step: "Roadmap",
          detail:
            "The gap is ordered into a learning sequence, so the student knows what to study first, second and third.",
        },
        {
          step: "Interview prep",
          detail: "Each path comes with role-specific interview questions and a readiness checklist.",
        },
      ],
      stack: [
        { group: "AI & NLP", items: ["Python", "NLP"] },
        { group: "Backend", items: ["FastAPI"] },
        { group: "Frontend", items: ["Next.js", "Tailwind CSS"] },
      ],
      features: [
        "Skill and interest intake",
        "Profile matched against real job profiles",
        "Ranked career paths",
        "Explicit skill-gap list per path",
        "Ordered learning roadmap",
        "Role-specific interview preparation",
      ],
      contribution: [
        "Designed the profile to career-path matching approach",
        "Built the gap analysis and roadmap generation",
        "Wrote the FastAPI service behind the analysis",
        "Built the student-facing interface",
      ],
      result:
        "A student goes from not knowing what to learn to an ordered roadmap for one specific role, with the interview preparation attached to it.",
      media: { image: "/case-career-guidance.svg", caption: "Concept diagram — from a skill profile to matched paths, gaps and a roadmap." },
    },
  },
];

export const featuredProject = projects.find((p) => p.featured) ?? projects[0];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
