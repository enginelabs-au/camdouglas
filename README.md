# Cam Douglas

A personal site whose primary visual experience is a full-page ASCII galaxy animation, with a glass HTML overlay for writing and navigation.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Drag the galaxy to look around. Scroll to zoom. No webcam is used.

The original animation source is saved at `public/ascii-galaxy.html`. The live implementation is `lib/asciiGalaxy.ts`, mounted by `components/spatial/AsciiGalaxy.tsx`.

```bash
npm run build
npm start
```

## Interaction

- Primary navigation: Home (mark), Production, Engine Labs, About, Contact
- Each section holds a composed view of the galaxy
- Drag to orbit, wheel to zoom, `Explore` to hold the current view, `Reset` to return home
- `1`–`5` jump to destinations; `H` home; `E` explore; `R` or `Escape` reset
- Each section has its own URL (`/music`, `/software`, `/about`, `/reviews`, `/contact`). Old hash links such as `/#reviews` redirect to them
- Reduced motion pauses the galaxy
- Unsupported canvas falls back to a still image and the written site

Content copy, memberships, shop items, footer links and reviews live in `config/site.ts`, `config/production.ts` and `config/engines.ts`.
