import { homeDescription, pageMetadata, socialDescription, socialTitle } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/",
  description: homeDescription,
  social: { title: socialTitle, description: socialDescription },
});

export default function Page() {
  // The shared layout renders the galaxy and the panel for this route.
  return null;
}
