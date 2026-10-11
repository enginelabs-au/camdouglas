export type AboutTabId = "music" | "software";

export type AboutSection = {
  id: AboutTabId;
  tab: string;
  kicker: string;
  headline: string;
  lede: string;
  paragraphs: string[];
  skills: string[];
  stack?: string[];
  links: Array<{ label: string; href: string }>;
};

export const aboutTabs: AboutSection[] = [
  {
    id: "music",
    tab: "Music Production",
    kicker: "Studio",
    headline: "Music Production",
    lede: "Sydney-based music producer, trained audio engineer and DJ.",
    paragraphs: [
      "Cam Douglas works across mixing, mastering and music production, with a particular focus on house, drum and bass, and experimental electronic music. His experience includes Universal Music and professional recording facilities including Forbes Street Studios.",
      "He is Ableton-certified, and works in Ableton Live, Logic Pro, FL Studio and GarageBand. Independently he releases music as Parity State and founded Hit Sync Club, a digital-first independent record label and distribution company.",
      "Through The Studio on Patreon he teaches practical production: live consultations, written guides, project files and a community for producers who want professional knowledge without the industry gatekeeping.",
    ],
    skills: [
      "Gain staging",
      "Signal flow and routing",
      "Microphone technique",
      "Subtractive EQ",
      "Compression and limiting",
      "Sidechain dynamics",
      "Drum programming",
      "Sampling and resampling",
      "Synthesis",
      "Vocal editing",
      "Loudness and LUFS",
      "DJ mixing and phrasing",
    ],
    links: [
      { label: "Patreon", href: "https://www.patreon.com/cw/campbelldouglas" },
      { label: "SoundCloud", href: "https://soundcloud.com/paritystate" },
    ],
  },
  {
    id: "software",
    tab: "Software Engineering",
    kicker: "Studio",
    headline: "Software Engineering",
    lede: "Founder of Engine Labs, a one-operator AI build studio in Sydney.",
    paragraphs: [
      "Engine Labs designs and ships productised AI Engines for small businesses, agencies and founder-led teams across Australia. Each Engine has a published spec sheet, an AUD price band, and a real handover: repo, prompts, run-book and known limitations.",
      "Between November 2025 and August 2026 he built all eight Engines, one at a time, for MCG Property Shoalhaven, a sales and property management office of under ten people. The Lab writes up the pain point, what shipped, and the hours it retired.",
      "He also built the Engine Labs website and its Control Centre in under 24 hours, including a live scoping agent that recommends an Engine and drafts a statement of work.",
    ],
    skills: [
      "Full-stack TypeScript",
      "Agent orchestration",
      "Prompt design",
      "REST integrations",
      "OAuth",
      "Serverless functions",
      "CRM and inbox integrations",
      "Spec and run-book writing",
    ],
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "Node.js",
      "Tailwind CSS",
      "Vercel",
      "Vercel Blob",
      "Resend",
      "Git",
      "pnpm",
    ],
    links: [
      { label: "Engine Labs", href: "https://enginelabs.com.au" },
      { label: "The Lab", href: "https://enginelabs.com.au/lab" },
      { label: "Catalog", href: "https://enginelabs.com.au/engines" },
    ],
  },
];
