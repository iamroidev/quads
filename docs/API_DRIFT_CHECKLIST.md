# API / Type Drift Checklist

Use this checklist whenever you change **server types**, **shared types**, or **API endpoint shapes** to ensure web and mobile clients do not silently break.

---

## 1. Before Changing a Server Model or Controller Response

- [ ] Identify every field added, renamed, or removed from the response body
- [ ] Search for usages of the changed field in `web/src/` and `mobile/src/`
- [ ] Search for usages in `shared/types/`

## 2. Shared Types (`shared/types/`)

`shared/types/` is the **single source of truth** for types consumed by both clients. Follow these rules:

- [ ] Any type change **must** be applied to `shared/types/` first
- [ ] Web types in `web/src/types/` that duplicate a shared type must be kept in sync with `shared/types/` or removed in favour of re-exporting the shared version
- [ ] Mobile types in `mobile/src/types/` that duplicate a shared type must be kept in sync or removed
- [ ] Run `npm run build --workspace=server` and `npm run build:web` after every shared-type change to catch TypeScript errors early

## 3. Adding a New Endpoint

- [ ] Endpoint follows the `ApiResponse<T>` envelope:
  ```ts
  { success: boolean; message: string; data?: T }
  ```
- [ ] Paginated endpoints include the standard `PaginationInfo` object:
  ```ts
  { page: number; limit: number; total: number; pages: number }
  ```
- [ ] New route is registered in `server/src/routes/index.ts`
- [ ] Authentication / role middleware is applied where appropriate
- [ ] Corresponding web service method is added in `web/src/services/`
- [ ] Corresponding mobile service method is added in `mobile/src/services/`

## 4. Removing or Renaming an Endpoint

- [ ] Search all callers in `web/src/services/` and `mobile/src/services/`
- [ ] Update or remove stale service methods
- [ ] Update integration tests in `server/src/__tests__/`
- [ ] Add a redirect/deprecation notice in the routes file if the old path may be hit by cached clients

## 5. Environment Variables

- [ ] New server env var added to `server/src/config/env.ts` with a safe default
- [ ] New web env var prefixed with `VITE_` and documented in `web/.env.example`
- [ ] New mobile env var prefixed with `EXPO_PUBLIC_` and documented in `mobile/.env.example`
- [ ] `PRODUCTION_SETUP.md` updated if the variable must be set for production
- [ ] Variable never contains a real credential in any checked-in file

## 6. CORS

- [ ] New frontend origin added to `CORS_EXTRA_ORIGINS` in the relevant `.env` file (do **not** hard-code in `app.ts`)
- [ ] Verify `OPTIONS` preflight succeeds from the new origin before deploying

## 7. Contract Tests

- [ ] `server/src/__tests__/contract.test.ts` passes after any response shape change
- [ ] If a new response shape is introduced, add a test case in `contract.test.ts`

---

**Owner**: Backend tech lead  
**Review cadence**: Required PR check for every server-side change
