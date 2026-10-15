"use client";

import { useEffect, useRef } from "react";

const GLYPHS = ".,:;+=*oO#%@$";

// Text that resolves out of galaxy glyphs. The real text is always in the page (for crawlers,
// screen readers and reduced motion); only the visible copy is animated, once, after mount.
export function Decode({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const steps = 16;
    let frame = 0;
    let last = 0;
    let raf = 0;

    const tick = (now: number) => {
      if (now - last > 34) {
        last = now;
        frame += 1;
        const revealed = Math.floor((frame / steps) * text.length);
        let next = "";
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          next += i < revealed || ch === " " || ch === "·" ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        el.textContent = next;
      }
      if (frame < steps) raf = requestAnimationFrame(tick);
      else el.textContent = text;
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      el.textContent = text;
    };
  }, [text]);

  return (
    <>
      <span className="sr-only">{text}</span>
      <span ref={ref} aria-hidden="true">
        {text}
      </span>
    </>
  );
}
