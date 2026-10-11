export type DestinationId =
  | "home"
  | "production"
  | "engine-labs"
  | "about"
  | "contact"
  | "reviews";

export type ReviewProviderId = "github" | "linkedin";

export type Vec3 = [number, number, number];
export type Quat = [number, number, number, number];

export type CameraDestination = {
  id: DestinationId;
  label: string;
  description: string;
  position: Vec3;
  target: Vec3;
  fov: number;
};

export type SceneAsset = {
  id: string;
  title: string;
  url: string;
  format: "spz" | "ply" | "splat" | "ksplat" | "sog" | "rad" | "zip";
  paged: boolean;
  lod: boolean;
  quaternion: Quat;
  position: Vec3;
  scale: number;
  attribution: {
    title: string;
    credit: string;
    license: string;
    licenseUrl?: string;
    notes: string;
  };
};

export type SocialLink = {
  id: "patreon" | "linkedin" | "github" | "soundcloud" | "engine-labs" | "instagram";
  label: string;
  href: string;
};

export type EngineOffer = {
  id: string;
  name: string;
  category: string;
  tagline: string;
  replaces: string;
  price: string;
  href: string;
};

export type Membership = {
  id: string;
  name: string;
  price: string;
  period: string;
  summary: string;
  includes: string[];
  href: string;
  cta: string;
};

export type ShopItem = {
  id: string;
  name: string;
  price: string;
  summary: string;
  href: string;
  memberOnly?: boolean;
};

export type Review = {
  id: string;
  name: string;
  handle: string;
  quote: string;
  provider: ReviewProviderId;
  profileUrl: string;
  avatar?: string;
  rating: number;
  date?: string;
};
