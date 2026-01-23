# OpenRouter Health Check Design

## Goal
Make OpenRouter health checks validate the API key by fetching key metadata and ensuring a valid key response is returned.

## Scope
- Update OpenRouter health check to call `GET /key` with the configured API key.
- Keep Notion health check unchanged.
- Extend tests to cover the new OpenRouter response validation.

## Approach
- Send `GET https://openrouter.ai/api/v1/key` with `Authorization: Bearer <key>`.
- Treat the check as **Connected** only when:
  - HTTP status is 2xx, and
  - the JSON response includes a non-empty `data` object.
- If JSON is missing/invalid or key info is missing, mark as **Failed** with a clear error.

## Data Flow
`FloatingWidget` → `RUN_HEALTH_CHECK` message → background → `runHealthChecks` → OpenRouter chat completion → response parsing → UI status update.

## Error Handling
- Non-2xx: fail with status.
- Missing/invalid JSON: fail with explicit error.
- Empty assistant content: fail with explicit error.

## Testing
- Add a failing test for 2xx responses with empty content.
- Update the success test to include a minimal OpenRouter response body.
