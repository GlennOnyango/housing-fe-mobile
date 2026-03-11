# Housing FE Mobile

Expo Router + TypeScript mobile app aligned to the current Housing backend endpoints.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure env values (optional overrides):

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_APP_SCHEME`
- `EXPO_PUBLIC_SENTRY_DSN`

Defaults are also defined in `app.json > expo.extra`.

3. Run app:

```bash
npm run start
```

## OpenAPI Type Generation

This project expects backend OpenAPI generation via the backend script:

```bash
npm run api:types
```

Defaults:
- Command: `npm --prefix ../housing run openapi:generate`
- Output: `src/api/generated` via `OPENAPI_OUTPUT`

Override generator command with:

- `BACKEND_OPENAPI_GENERATOR="<your command>"`

## Quality Checks

```bash
npm run typecheck
npm run test
```

## Implemented Flow Coverage

- FE-0: session/token split, axios refresh rotation with single-flight retry, problem-details handling, cooldown tracking.
- FE-1: owner/tenant auth screens and provisional role probing fallback.
- FE-2: owner property/unit/amenity workflows + ticket triage + invoice generation/link.
- FE-3: deep-link onboarding flow (claim, profile, signature upload, sign lease).
- FE-4: tenant dashboard, invoices, notices, ticket creation, provider directory with tel/WhatsApp links.
- FE-5: invoice admin plus notice-based in-app feed baseline.
- FE-6: optional app lock (biometric/PIN fallback), sensitive-screen capture protection, PII masking patterns, session settings with blocked endpoints shown.
