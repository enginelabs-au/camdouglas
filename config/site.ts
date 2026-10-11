import type { SocialLink } from "@/config/types";

export const site = {
  name: "Cam Douglas",
  title: "Cam Douglas",
  brandWord: "CAM",
  statement: "Music, technology and the spaces in between.",
  description:
    "Music producer, audio engineer, DJ and founder working across sound, software and creative technology.",
  windowLine: "Drag to look around the galaxy.",
  location: "Sydney, Australia",
  email: "cam@enginelabs.com.au",
  url: "https://camdouglas.com",
};

export const socialLinks: SocialLink[] = [
  { id: "patreon", label: "Patreon", href: "https://www.patreon.com/cw/campbelldouglas" },
  { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/camjdouglas/" },
  { id: "soundcloud", label: "SoundCloud", href: "https://soundcloud.com/paritystate" },
  { id: "engine-labs", label: "Engine Labs", href: "https://enginelabs.com.au" },
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/camsquam/" },
];

export const about = {
  headline: "About",
  lede: "Sydney-based music producer, trained audio engineer, DJ and entrepreneur.",
  paragraphs: [
    "Cam Douglas works across mixing, mastering and music production, with a particular focus on house, drum and bass, and experimental electronic music. His experience includes Universal Music and professional recording facilities including Forbes Street Studios.",
    "He is Ableton-certified, and works with Ableton Live, Logic Pro, FL Studio and GarageBand. Independently he releases music as Parity State and founded Hit Sync Club, a digital-first independent record label and distribution company.",
    "He also founded Engine Labs, an AI automation and consultancy agency. His professional interests sit between audio engineering, independent artistry, technology, operational systems and creative experimentation.",
  ],
};

export const engineLabs = {
  headline: "Engine Labs",
  lede: "An agentic company, building agentic companies.",
  summary:
    "Engine Labs is a one-operator AI build studio in Sydney. Eight productised Engines — each with a published spec sheet, a starting price in AUD, and a real handover.",
  siteHref: "https://enginelabs.com.au",
  catalogHref: "https://enginelabs.com.au/engines",
};

export const productionCopy = {
  headline: "Music Production",
  lede: "Practical music production education through live consultations, professional resources and hands-on guidance.",
};

export const contactCopy = {
  headline: "Contact",
  lede: "For music production, Engine Labs, or a direct note.",
};
