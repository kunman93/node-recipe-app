# Project Guidelines

## Technology Stack

- Node.js with Express
- SQLite via better-sqlite3
- EJS templates for server-rendered HTML
- xUnit-style tests with Jest

## Code Style

- Use async/await for asynchronous operations; avoid Promise `.then()` chains for new code. Callback-based APIs required by libraries/frameworks (e.g., Express route handlers) are fine.
- Follow the existing error handling approach already used in the app (for example, shared middleware or utility functions)
- All new routes must be added to `src/routes.js` following the existing pattern
- Use tabs for indentation to match the existing code style

## Testing

- Every new route must have a corresponding test in `__tests__/`
- Use supertest for HTTP integration tests

## Security

- Never log user-provided input directly
- Validate all request parameters before database access
