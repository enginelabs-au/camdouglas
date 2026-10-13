import type { Membership, ShopItem } from "@/config/types";

const patreonMembership = "https://www.patreon.com/cw/campbelldouglas/membership";
const patreonShop = "https://www.patreon.com/cw/campbelldouglas/shop";

export const memberships: Membership[] = [
  {
    id: "studio-community",
    name: "The Studio Community",
    price: "Free",
    period: "",
    summary: "Free membership for written guidance and studio conversation.",
    includes: [
      "Written production guides",
      "Production tips",
      "Community discussions",
      "Studio updates",
    ],
    href: patreonMembership,
    cta: "Join for free",
  },
  {
    id: "studio-access",
    name: "Studio Access",
    price: "$12 AU",
    period: "/ month",
    summary: "Music Production Resources & Group Consultation",
    includes: [
      "One live group production consultation each month",
      "Studio learning archive and written guides",
      "Monthly producer resource pack",
      "Members-only production content and community",
    ],
    href: patreonMembership,
    cta: "Join",
  },
  {
    id: "producer",
    name: "Producer",
    price: "$29 AU",
    period: "/ month",
    summary: "Advanced Production Support & Group Consultation",
    includes: [
      "One live group production consultation each month",
      "Complete DAW projects and multitrack stems",
      "Advanced written production breakdowns",
      "Monthly creative challenges and feedback submissions",
    ],
    href: patreonMembership,
    cta: "Join",
    featured: true,
  },
  {
    id: "mentorship",
    name: "Mentorship",
    price: "$99 AU",
    period: "/ month",
    summary: "Personal Music Production Coaching",
    includes: [
      "One private online production consultation each month",
      "Individual review of one track, mix, or project during the consultation",
      "Personalised production development plan",
      "Priority production questions and guidance",
    ],
    href: patreonMembership,
    cta: "Join",
  },
];

export const shopItems: ShopItem[] = [
  {
    id: "foundations",
    name: "Music Production Foundations",
    price: "A$129",
    summary: "One group consultation, written production guides, project files and exercises.",
    href: patreonShop,
    featured: true,
  },
  {
    id: "mixing",
    name: "Mixing a Track From Start to Finish",
    price: "A$149",
    summary: "One group consultation, mixing workflow guide, multitrack files and reference materials.",
    href: patreonShop,
  },
  {
    id: "mastering",
    name: "Mastering a Track From Start to Finish",
    price: "A$149",
    summary: "One group consultation, mastering guides, practice audio, mastering templates and technical reference materials.",
    href: patreonShop,
  },
  {
    id: "sound-design",
    name: "Sound Design Masterclass",
    price: "A$129",
    summary: "One group consultation, synthesis guides, patches and sound design exercises.",
    href: patreonShop,
  },
  {
    id: "complete",
    name: "Complete Music Production",
    price: "A$249",
    summary: "One private consultation, comprehensive written production guide, project files, stems and templates.",
    href: patreonShop,
  },
  {
    id: "toolkit",
    name: "Producer Toolkit",
    price: "A$29",
    summary: "Downloadable samples, presets, production templates and MIDI files. No consultation.",
    href: patreonShop,
  },
  {
    id: "extra-group",
    name: "Extra Group Consult",
    price: "A$19",
    summary: "One additional group consultation for eligible paid members.",
    href: patreonShop,
    memberOnly: true,
  },
  {
    id: "extra-private",
    name: "Extra Private Consult",
    price: "A$79",
    summary: "One additional private consultation for eligible paid members.",
    href: patreonShop,
    memberOnly: true,
  },
];
