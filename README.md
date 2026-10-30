# local-first Studio 1030

Studio 1030 is a small, local-first daily focus studio for people who want a calmer way to shape a workday. It is deliberately not a task manager: the interface helps you place a few meaningful focus blocks, protect capacity, catch loose thoughts, and export a useful end-of-day record.

The app ships with a realistic sample day so its value is visible the moment it opens. No sign-in, database, telemetry, or paid service is required.

## What it does

- Turns a day into a visual focus map with timeboxed, color-coded blocks.
- Calculates planned time, completed time, capacity, and a calm daily signal.
- Includes an accessible countdown focus timer with a global `Space` shortcut.
- Captures loose thoughts in a parking lot so they do not interrupt focused work.
- Stores all changes in browser `localStorage`; a storage warning appears if persistence is unavailable.
- Offers a command palette (`⌘/Ctrl + K`), quick new-block shortcut (`N`), dark mode, and a Markdown wrap-up export.
- Provides useful empty, loading, and storage-error states rather than treating them as edge cases.

## Stack

- React 19 + Vite 7
- Plain CSS with responsive layouts and no component library
- Browser `localStorage` for local-first persistence
- Node's built-in test runner for domain logic

There is no backend. Core functionality works offline after the app is loaded and does not depend on an API key. `.env.example` is present only as a safe placeholder for a future optional assistant endpoint.

## Run locally

Prerequisite: Node.js 20+.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Other useful commands:

```bash
npm test
npm run build
npm run preview
```

## Architecture

```text
src/
  App.jsx              screen composition, dialogs, timer, keyboard actions
  styles.css           visual system and responsive behavior
  lib/studio.js        sample data, persistence key, focus calculations, export builder
  lib/studio.test.js   pure-domain tests
```

`App.jsx` owns the small amount of UI state and writes the workspace snapshot to `localStorage` after hydration. The calculation and Markdown-export functions stay in `lib/studio.js`, which makes their behavior easy to test independently of the browser.

## Interaction notes

| Action | How |
| --- | --- |
| Add a focus block | `N`, “New focus block,” or “Add block” |
| Start/pause the timer | `Space` when not typing in a field |
| Open actions | `⌘/Ctrl + K` |
| Capture a thought | Type in the Parking lot, or use Command menu |
| Complete a block/note | Select its circular check control |
| Export daily record | “Export wrap-up” downloads Markdown |

The app avoids remote fonts and remote data calls, so the visual system gracefully uses the operating system's available fonts.

## Screenshot / portfolio representation

For a representative desktop shot, use a 1440px-wide browser with the page at the top. The strongest frame includes the “Design a day with edges” header, daily signal cards, focus map, and timer. For a second image, show the “Add a focus block” modal or command palette, then capture a 390px-wide mobile viewport to show the bottom navigation and stacked cards.

Suggested alt text: “Studio 1030 daily focus workspace showing timeboxed work blocks, a completion ring, a focus timer, and a parking lot for loose thoughts.”

## Deployment notes

This is a static Vite application. Run `npm run build` and deploy the generated `dist/` directory to any static host (for example, Cloudflare Pages, Netlify, Vercel static hosting, or GitHub Pages). No environment variables are needed. Because data remains in each browser’s `localStorage`, deployments do not need a database or server configuration.

## Validation

The test suite covers focus-minute calculations, bounded session creation, and Markdown wrap-up generation. `npm run build` verifies the production Vite bundle.
