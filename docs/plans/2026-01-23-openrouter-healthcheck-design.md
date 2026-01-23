# OpenRouter Health Check Design

## Goal
Make OpenRouter health checks validate the API key by calling a model endpoint with a 5s timeout and only treating HTTP 200 as Connected.

## Scope
- Update OpenRouter health check to call `POST /chat/completions` with a fixed prompt and model.
- Add a 5s timeout; non-200 or timeout means Failed.
- Keep Notion health check unchanged.
- Extend tests to cover the new OpenRouter response validation.

## Approach
- Send `POST https://openrouter.ai/api/v1/chat/completions` with:
  - `model: "z-ai/glm-4.5-air:free"`
  - `messages: [{ role: "user", content: "you must just say hi" }]`
  - `max_tokens: 5`, `temperature: 0`
- Use a 5-second timeout; if the request times out, mark as **Failed**.
- Treat the check as **Connected** only when HTTP status is 200.

## Data Flow
`FloatingWidget` → `RUN_HEALTH_CHECK` message → background → `runHealthChecks` → OpenRouter chat completion → response parsing → UI status update.

## Error Handling
- Non-2xx: fail with status.
- Missing/invalid JSON: fail with explicit error.
- Empty assistant content: fail with explicit error.

## Testing
- Add a failing test for 2xx responses with empty content.
- Update the success test to include a minimal OpenRouter response body.
