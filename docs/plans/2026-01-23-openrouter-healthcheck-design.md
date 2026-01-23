# OpenRouter Health Check Design

## Goal
Make OpenRouter health checks validate the API key by sending a minimal chat completion request and ensuring a real assistant response is returned.

## Scope
- Update OpenRouter health check to call `POST /chat/completions` with a fixed prompt and model.
- Keep Notion health check unchanged.
- Extend tests to cover the new OpenRouter response validation.

## Approach
- Send a minimal request:
  - `model: "z-ai/glm-4.5-air:free"`
  - `messages: [{ role: "user", content: "you must just say hi" }]`
  - `max_tokens: 5`, `temperature: 0`
- Treat the check as **Connected** only when:
  - HTTP status is 2xx, and
  - `choices[0].message.content` is a non-empty string.
- If JSON is missing/invalid or content is empty, mark as **Failed** with a clear error.

## Data Flow
`FloatingWidget` → `RUN_HEALTH_CHECK` message → background → `runHealthChecks` → OpenRouter chat completion → response parsing → UI status update.

## Error Handling
- Non-2xx: fail with status.
- Missing/invalid JSON: fail with explicit error.
- Empty assistant content: fail with explicit error.

## Testing
- Add a failing test for 2xx responses with empty content.
- Update the success test to include a minimal OpenRouter response body.
