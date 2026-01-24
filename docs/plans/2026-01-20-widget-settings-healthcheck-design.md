# Widget Settings + Health Check Design

Date: 2026-01-20

## Goal
Add a settings view inside the floating widget where users can enter and save their OpenRouter API key and Notion API key (plain-text display), then automatically run health checks after saving. The widget must toggle between chat and settings without losing chat state.

## UX Flow
- Widget header adds a settings button. Clicking it switches view from chat to settings.
- Settings view replaces the chat area and input area. A back button returns to chat and preserves messages/input.
- Two input fields:
  - OpenRouter API Key (plain text)
  - Notion API Key (plain text)
- A Save button writes both keys to local storage. Saving triggers health checks automatically.
- Health check results are shown per service (OpenRouter, Notion) with success/failure text.
- Health checks do not run on settings entry; only after Save.

## Storage & Data Model
- Use `browser.storage.local` with keys:
  - `openrouter_api_key`
  - `notion_api_key`
- Settings view loads existing stored values when entered.
- Local draft state tracks edited values and save status.

## Health Check Behavior
- Executed by background script via a `RUN_HEALTH_CHECK` message.
- OpenRouter: `GET https://openrouter.ai/api/v1/models` with `Authorization: Bearer <key>`.
- Notion: `GET https://api.notion.com/v1/users/me` with `Authorization: Bearer <key>` and `Notion-Version` header.
- Response summary returned to the widget as `{ openrouter: { ok, status, error }, notion: { ok, status, error } }`.

## UI Changes (FloatingWidget)
- Add `view: 'chat' | 'settings'` and settings draft state.
- Conditionally render chat UI vs settings form.
- Add a settings icon button in the header; show a back button in settings view.
- Add per-service status display under the Save button (loading, success, or error).

## Background Changes
- Add `RUN_HEALTH_CHECK` message handler to read keys and call both endpoints.
- Return structured results to content widget.
- Update `host_permissions` to include OpenRouter API domain.

## Error Handling
- Storage failures or request errors should show a brief failure status next to each service.
- No strict validation; empty keys are allowed but will likely fail health checks.

## Testing
- Open widget → Settings → Save keys → health check results appear.
- Refresh page → Settings shows persisted keys.
- Toggle Settings ↔ Chat preserves chat messages.
- Verify OpenRouter and Notion status reflect real success/failure.
