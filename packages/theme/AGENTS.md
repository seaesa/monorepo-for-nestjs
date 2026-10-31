# @repo/theme — design tokens for web and mobile

The **only** place colors, radius and font families are defined. Web (shadcn, `base-maia`) and mobile (React Native Reusables + Uniwind) both render from it, so a change here restyles both apps.

## Files

- `src/tokens.ts` — the source: `colors.light` / `colors.dark` (oklch, shadcn naming in camelCase), `radius` + `radiusScale`, `fonts`.
- `src/color.ts` — `oklchToRgb` (React Native / React Navigation can't parse oklch).
- `src/index.ts` — exports tokens and `rgbColors` (hex/rgba) for JS consumers.
- `scripts/build.mjs` — compiles `src` and generates:
  - `dist/web.css` → shadcn/Tailwind v4 format (`:root`, `.dark`, `@theme inline`), imported by `apps/web/app/globals.css`.
  - `dist/native.css` → Uniwind format (`@layer theme` + `@variant light/dark`, fonts), imported by `apps/mobile/src/global.css`.

## Rules

- Change tokens in `src/tokens.ts` only, then `pnpm --filter @repo/theme build` (turbo runs it before any `dev`/`build`). Never edit `dist/`.
- A token key becomes a Tailwind color on both platforms: `primaryForeground` → `bg-primary-foreground`. Adding a key = new utility everywhere; removing one breaks classes in both apps — search both before removing.
- Keep the shadcn token names (`background`, `card`, `muted`, `destructive`, `sidebar*`, `chart1..5`, …): shadcn and React Native Reusables components rely on them.
- Colors are oklch strings (`oklch(L C H)` or `oklch(L C H / 10%)`); `oklchToRgb` supports exactly that form.
- No React, DOM or React Native imports — this package is consumed by Node (build), Next.js and Metro.
- Restyling a _component_ (shape, padding) is not a token change: update `apps/web/components/ui/<x>.tsx` and `apps/mobile/src/components/ui/<x>.tsx` together.
