import type { SocialLink } from "@/config/types";

// Google Calendar appointment schedule (every day, 6am to 12am Sydney time).
const bookingHref = "https://calendar.app.google/8AmkANGSGYHhrXPUA";

export const site = {
  name: "Cam Douglas",
  title: "Cam Douglas",
  brandWord: "CAM",
  statement: "Music, technology and the spaces in between.",
  tagline: "Tinkerer, Solopreneur, and Creative Technologist who makes stuff that occasionally works.",
  // Search results and link previews use this plainer line, not the tagline.
  description:
    "Music producer, audio engineer, DJ and founder working across sound, software and creative technology.",
  musicLabels: ["Music producer", "Audio engineer", "DJ"],
  softwareLabels: ["Founder", "Software engineer"],
  windowLine: "Drag to look around the galaxy.",
  location: "Sydney, Australia",
  email: "cam@enginelabs.com.au",
  url: "https://camdouglas.com",
};

export const socialLinks: SocialLink[] = [
  { id: "patreon", label: "Patreon", href: "https://www.patreon.com/cw/campbelldouglas" },
  { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/camjdouglas/" },
  { id: "github", label: "GitHub", href: "https://github.com/cam-douglas" },
  { id: "soundcloud", label: "SoundCloud", href: "https://soundcloud.com/paritystate" },
  { id: "engine-labs", label: "Engine Labs", href: "https://enginelabs.com.au" },
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/camsquam/" },
];

export const engineLabs = {
  headline: "Engine Labs",
  lede: "An agentic company, building agentic companies.",
  summary:
    "Engine Labs is a one-operator AI build studio in Sydney. Eight productised Engines, each with a published spec sheet, a starting price in AUD, and a real handover.",
  siteHref: "https://enginelabs.com.au",
  catalogHref: "https://enginelabs.com.au/engines",
  audience: "For small businesses that want routine sales, ops and support work handled without a new hire or a long agency project.",
  firstStep: {
    before: "First step:",
    label: "book a meeting",
    after: "then we work out which Engine fits.",
    href: bookingHref,
  },
};

export const productionCopy = {
  headline: "Music Production",
  lede: "Practical music production education through live consultations, professional resources and hands-on guidance.",
  audience: "For producers who want professional knowledge without the industry gatekeeping.",
  firstStep: {
    before: "First step:",
    label: "join The Studio Community for free",
    after: "then pick an offer below.",
    href: "https://www.patreon.com/cw/campbelldouglas/membership",
  },
};

export const contactCopy = {
  headline: "Contact",
  lede: "For music production, software engineering, or a direct note.",
  booking: {
    label: "Book a meeting",
    hours: "Every day, 6am to 12am Sydney time.",
    href: bookingHref,
  },
};
