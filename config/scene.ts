import type { GalaxyView } from "@/lib/asciiGalaxy";
import type { CameraDestination } from "@/config/types";

export const sceneCredit = "An ASCII galaxy. Drag to look around.";

export const fallbackImage = {
  src: "/fallbacks/studio.svg",
  alt: "A still from the studio environment, used when the live scene is unavailable.",
};

export const cameraDestinations: Record<CameraDestination["id"], CameraDestination> = {
  home: {
    id: "home",
    label: "Home",
    description: "A wide view of the galaxy.",
    position: [0, 0, 0],
    target: [0, 0, 0],
    fov: 38,
  },
  production: {
    id: "production",
    label: "Music",
    description: "Closer into the spiral.",
    position: [0, 0, 0],
    target: [0, 0, 0],
    fov: 34,
  },
  "engine-labs": {
    id: "engine-labs",
    label: "Software",
    description: "A tilted, quieter angle.",
    position: [0, 0, 0],
    target: [0, 0, 0],
    fov: 36,
  },
  about: {
    id: "about",
    label: "About",
    description: "A higher, more face-on view.",
    position: [0, 0, 0],
    target: [0, 0, 0],
    fov: 32,
  },
  contact: {
    id: "contact",
    label: "Contact",
    description: "A receded view of the whole disk.",
    position: [0, 0, 0],
    target: [0, 0, 0],
    fov: 40,
  },
  reviews: {
    id: "reviews",
    label: "Reviews",
    description: "A still composition for reading.",
    position: [0, 0, 0],
    target: [0, 0, 0],
    fov: 34,
  },
};

export const galaxyViews: Record<CameraDestination["id"], GalaxyView> = {
  home: { yaw: 0.35, pitch: 1.1, zoom: 1 },
  production: { yaw: 1.25, pitch: 0.52, zoom: 1.38 },
  "engine-labs": { yaw: -0.85, pitch: 1.12, zoom: 0.88 },
  about: { yaw: 2.05, pitch: 0.38, zoom: 1.18 },
  contact: { yaw: 0.12, pitch: 1.28, zoom: 0.72 },
  reviews: { yaw: 1.62, pitch: 0.9, zoom: 1.22 },
};

export const primaryNav: Array<CameraDestination["id"]> = [
  "home",
  "production",
  "engine-labs",
  "about",
  "reviews",
  "contact",
];
