# Security model

| Area | Control |
|---|---|
| Passwords | bcrypt with 12 rounds. Login compares against a dummy hash when the email is unknown, so timing doesn't reveal which emails exist. Hashes are never returned by any endpoint. |
| Sessions | HS256 JWT in an `httpOnly`, `SameSite=Lax` cookie (`Secure` in production) that lasts 7 days. The token carries `tokenVersion`; bumping it on logout-all, password change, role change or suspension revokes every session at once. |
| CSRF | SameSite=Lax cookie. Mutating requests must be JSON (cross-site forms can't send that without a preflight), and the `Origin` header is checked against an allow-list. |
| Authorisation | Role tiers: STUDENT < AUTHOR < ADMIN < SUPER_ADMIN, enforced in middleware on every admin route. Every student resource is queried with its `userId`, and "not yours" returns 404 to prevent IDOR. |
| Validation | zod on every body and query, with explicit limits on lengths and array sizes. |
| Injection | Prisma uses parameterised queries. The few raw SQL queries use tagged templates, which are also parameterised. |
| XSS | React escapes output, and Markdown is rendered without raw HTML. Helmet sets security headers on the API; Next sets nosniff, frame-deny and a referrer policy. |
| Rate limiting | Redis-backed and shared across instances: global, auth, code-run and AI limits. |
| Secrets | Only in environment variables. The API refuses to start in production with the development JWT secret. |
| Hidden tests | Inputs and expected values of hidden tests never leave the server. Results are reported with a random per-run nonce, so printing fake results doesn't count. |
| Audit | Every admin write goes into the append-only `AdminAuditLog` (actor, action, before, after). |
| Privacy (DPDP Act 2023) | Minimal data is collected. Users can export all their data and delete their account. |
| Assessment integrity | Tab switches, blur, clipboard and fullscreen exits are logged and turned into an integrity score, with a configurable policy: log, flag or auto-submit. A browser can't detect a second device, so the product verifies understanding instead: explain-your-code, randomised pools and hidden tests. |

## Known limitations

- The `process` sandbox driver is for local development only and is **not** isolation (see `code-sandbox.md`).
- Google sign-in uses ID-token verification. Add your production origin under "Authorized JavaScript origins".
- Password reset by email is not implemented yet. There is no email provider configured.
