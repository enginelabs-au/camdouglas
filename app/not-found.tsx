import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: { absolute: `Page not found | ${site.name}` },
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="not-found">
      <h1>Lost in the galaxy</h1>
      <p>That page does not exist.</p>
      <Link href="/" className="offer-cta">
        Back to {site.name}
      </Link>
    </main>
  );
}
