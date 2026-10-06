# Design system — "Слова"

Goal: vibrant, playful, premium language-learning app (think Duolingo energy × Linear polish). Must feel like a **native mobile app** on phones (installed as PWA) and look rich on desktop. Not grey, not flat, not washed-out — in both themes.

Foundation is already implemented — **use it, do not redefine it**:
- `frontend/tailwind.config.js`, `frontend/src/index.css`, `frontend/src/theme/palette.ts`, `frontend/index.html`, `frontend/public/manifest.webmanifest`.

## Tokens (work in both themes automatically — prefer these over `dark:` pairs)

| Purpose | Class |
|---|---|
| App background | `bg-app` (body already has `.app-bg` with colourful ambient glows) |
| Card surface / raised | `bg-surface`, secondary fill `bg-surface-2` |
| Borders | `border-line` |
| Text | `text-ink` (primary), `text-ink-2` (secondary), `text-ink-3` (muted) |
| Brand | `brand-50…900` (violet, 500 = #7c4dff) |
| Brand gradient | `.bg-brand-gradient`, gradient text `.text-gradient` |
| Fonts | body `font-sans` (Plus Jakarta Sans); headings `font-display` (Bricolage Grotesque) — h1/h2/h3 get it automatically |
| Shadows | `shadow-soft`, `shadow-lift`, `shadow-glow` |
| Radius | cards `rounded-3xl`, controls `rounded-2xl`, pills `rounded-full` |
| Animations | `animate-pop-in`, `animate-shake`, `animate-float`; framer-motion for page/list transitions |

Semantic colours: success `emerald-500`, error `rose-500`, warning `amber-400`, streak/fire `orange-500`.

## Components (CSS classes in index.css)

- `.card` — surface + border + soft shadow. `.card-interactive` — adds hover lift / press.
- `.glass` — translucent blurred surface (top bars, bottom tab bar, sheets).
- Buttons: `.btn` + one of `.btn-primary` `.btn-success` `.btn-danger` `.btn-secondary` `.btn-ghost`; size `.btn-lg`. They are **3D pressable** (bottom shadow, press moves down). `.btn-icon` for 44px icon buttons.
- `.input` / `.select` — large 2px-border fields with brand focus ring.
- `.chip` + colour classes for small badges.
- `.progress-track` + `.progress-fill` (set `style={{width}}`).
- `.pt-safe` / `.pb-safe` — iOS safe-area padding.

## Colour per block / language (`src/theme/palette.ts`)

- `blockTone(order)` → `{ gradient, soft, text, ring }` (Tailwind class strings). Use `bg-gradient-to-br ${tone.gradient}` for block icons/headers.
- `blockEmoji(title)` → emoji icon for the block.
- `languageTone(code)` → es = orange/rose, en = sky/indigo.

## Mobile-app rules (< 640px)

- Bottom tab bar (glass, `pb-safe`), compact top app bar (`pt-safe`). No desktop navbar on phones.
- **Lesson/trainer screens are full-screen**: no tab bar / nav; own header with ✕ close + progress bar; primary action is a **sticky bottom button** (full width, `pb-safe`). Answer feedback slides up as a **bottom sheet** (green/red) like Duolingo.
- Touch targets ≥ 44px, no hover-only affordances, `active:` press states everywhere.
- Haptics: `navigator.vibrate?.(…)` on correct (10ms) / wrong ([30,40,30]) — guard for support.
- Page transitions: subtle fade/slide (framer-motion), lists stagger in.
- Never horizontal scroll at 360px.

## Desktop (≥ 640px)

- Floating glass top navbar; content `max-w-5xl` (dashboards may use `max-w-6xl`). Rich layouts: hero cards with gradients, 2–3 column grids.

## Tone

- Ukrainian UI text, friendly and encouraging ("Чудово!", "Майже!", "🔥 3 дні поспіль"). Emoji are welcome as accents, not clutter.
- Empty states: illustration-like emoji in a gradient blob + one clear CTA.
- Skeletons for loading (`animate-pulse bg-surface-2 rounded-2xl`), not spinners on whole pages.
