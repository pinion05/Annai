# Repo-wide Refactor Design

Date: 2026-01-24

## Goal
Refactor the entire codebase without changing behavior by removing unused code, consolidating duplicates, and clarifying module boundaries. Focus on safe cleanup: eliminate dead code, reduce repetition, and keep entrypoints thin.

## Scope
- All directories: `entrypoints/`, `components/`, `lib/`, `public/`, `assets/`, and config files.
- No new features; behavior must remain equivalent.
- Import paths use relative paths only (no alias usage).

## Approach
1. **Inventory**: Enumerate exports, entrypoints, message handlers, and shared utilities. Map where each is referenced.
2. **Classification**:
   - **Unused**: no static references and low likelihood of runtime-only access.
   - **Duplicate**: same or near-identical logic across files.
   - **Risky**: string-keyed or runtime-only access (message types, storage keys, tailwind classes).
3. **Refactor**:
   - Remove unused items first (lowest risk).
   - Consolidate duplicates into shared utilities/components.
   - Simplify entrypoints to composition-only layers.
4. **Path cleanup**: Normalize relative import paths and, where needed, adjust folder structure to avoid deeply nested paths.

## Module Boundaries
- `entrypoints/`: wiring and composition only.
- `lib/`: shared logic, helpers, message handlers, storage/API utilities.
- `components/` + `components/ui`: reusable UI primitives and feature components.

## Duplicate Consolidation
- Identify repeated logic (API helpers, storage wrappers, message handlers) and consolidate into `lib/` utilities.
- Identify repeated UI patterns and move to `components/ui` or merge into a single component with variants.
- Minimize churn by keeping component props stable where possible.

## Unused Code Removal
- Remove code with zero references after repo-wide search.
- For string-based usage (message types, storage keys), verify through search before deletion.
- Prefer removal over deprecation; keep behavior consistent.

## Error Handling
- Preserve existing behavior; only consolidate repetitive try/catch or logging patterns into helpers.
- Avoid changing user-facing error messages unless duplicates are merged.

## Verification
- Run `npm run compile` after significant changes.
- Spot-check extension entrypoints (background, content, popup) when large deletions occur.

## Notes/Artifacts
- Track removed/merged items in a short checklist to aid review and prevent accidental reintroduction.
