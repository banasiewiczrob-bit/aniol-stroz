## Purpose
Provide compact, actionable guidance for AI coding agents working on this Expo + `expo-router` project.

## Big picture
- This is an Expo (React Native) app using file-based routing via `expo-router`. The `app/` directory contains pages and layouts (e.g. [app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx)).
- Entrypoint is `expo-router/entry` (see `package.json` `main`). UI is composed of small themed components (`components/themed-*.tsx`, `components/ui/`).

## Key files & patterns
- Routing: edit files under `app/`. Folder names and parentheses (e.g. `(tabs)`) represent route groupings used by `expo-router`.
- Layouts: add or change layout behavior in `app/_layout.tsx` or group layouts such as [app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx).
- Theming: prefer `use-theme-color.ts`, `components/themed-text.tsx`, and `components/themed-view.tsx` to ensure color-mode compatibility. See `hooks/use-color-scheme.ts` and `hooks/use-color-scheme.web.ts` for platform differences.
- Platform variants: components like `components/ui/icon-symbol.ios.tsx` and `components/ui/icon-symbol.tsx` show platform-specific implementations—follow that pattern for native platform differences.
- State & storage: AsyncStorage is used (`@react-native-async-storage/async-storage` in `package.json`), so persist small local data there.
- Scripts: use `npm start` / `npm run ios|android|web` to run. `npm run reset-project` runs `scripts/reset-project.js` to scaffold a fresh `app/`.

## Developer workflows (how to run & debug)
- Install: `npm install`.
- Start Metro / dev server: `npm start` (alias for `expo start`). Use the Expo Dev Tools to open simulators or web.
- Platform runs: `npm run ios`, `npm run android`, `npm run web`.
- Lint: `npm run lint` (uses Expo ESLint config).

## Conventions for making changes
- Keep UI changes inside `app/` and `components/` — avoid changing native or build config unless necessary.
- For navigation changes, add or rename files in `app/` rather than programmatic route registration.
- Reuse `themed-` components and `use-theme-color.ts` rather than hard-coded colors.
- When adding platform-specific code, follow the existing file suffix convention (`.ios.tsx`, `.web.ts`, etc.).

## Integration points & notable deps
- Routing: `expo-router` (file-based). See `app/` for route mapping.
- Native APIs: `expo-*` packages (haptics, splash, constants, image, etc.).
- Async storage: `@react-native-async-storage/async-storage` for persistence.
- Navigation primitives and gestures: `@react-navigation/*`, `react-native-gesture-handler`, `react-native-reanimated`.

## When editing files as an AI agent
- Make minimal, focused patches. Use the repository's existing naming and layout patterns.
- Tests are not present; validate changes by running `npm start` and opening the app in Expo Go or simulator.
- Prefer editing `components/` and `app/` files; avoid broad refactors without explicit user approval.

## Examples
- To add a new tab: create `app/(tabs)/newTab.tsx` and add a corresponding `Tabs.Screen` in [app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx).
- To add a themed text component, follow `components/themed-text.tsx` and call `use-theme-color.ts`.

## Questions for the maintainer
- Are there any CI checks or formatters not stored in `package.json` I should know about?
- Any code owners or files that must not be modified automatically?

-- End of instructions --
