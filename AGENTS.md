# Repository Guidelines

## Project Structure & Module Organization
This is a WXT-based browser extension with React and Tailwind.
- `entrypoints/`: extension entrypoints (background, content scripts, popup). Use `~/` alias for imports from here.
- `components/`: React UI components, including `components/ui` and chat-related UI.
- `lib/`: shared logic and utilities (`@/lib/*` alias).
- `public/`: static assets packaged with the extension (icons, etc.).
- `assets/`: repo-only design assets.
- Config: `wxt.config.ts`, `tailwind.config.cjs`, `postcss.config.cjs`, `tsconfig.json`.

## Build, Test, and Development Commands
Use the package scripts (Bun lockfile present; `npm run …` or `bun run …` are both fine).
- `dev`: run the extension in development mode (Chrome).
- `dev:firefox`: run development mode targeting Firefox.
- `build` / `build:firefox`: production build for Chrome/Firefox.
- `zip` / `zip:firefox`: package a distributable zip.
- `compile`: TypeScript typecheck only (`tsc --noEmit`).

## Coding Style & Naming Conventions
- Language: TypeScript + React (`.ts`/`.tsx`), Tailwind for styling.
- Indentation: 2 spaces; keep semicolons and single quotes as in existing files.
- Components: PascalCase filenames and exports (e.g., `FloatingWidget.tsx`).
- Hooks/utilities: camelCase; hooks must start with `use`.
- Imports: prefer aliases (`@/components/*`, `@/lib/*`, `~/*`) over deep relative paths.

## Testing Guidelines
No automated test runner is configured. Use:
- `npm run compile` for type safety.
- Manual verification: load the extension and validate background, content, and popup flows in Chrome/Firefox.

## Commit & Pull Request Guidelines
Commit history uses Conventional Commit-style prefixes (e.g., `feat:`, `refactor:`, `chore:`, `style:`). Keep messages short and scoped.
For PRs, include:
- A brief summary and testing notes (`compile` + manual checks).
- Screenshots/GIFs for UI changes (popup/widget/content).

## Configuration & Security Notes
Avoid committing secrets (API keys). Store sensitive values via extension storage or environment-specific configuration during development.
