# Shared-pool administrative approval — offline trust boundary, NOT implemented

## Threat model
Browser, HTTP request body, request headers, localStorage, client draft, user-controlled SQL parameters and PostgreSQL custom GUCs are **untrusted**. A PostgreSQL pool login is a service identity, not an administrator. Do not use `session_user` as individual identity in this mode.

## Proposed separation
1. HTTPS gateway verifies an authenticated administrator session using the application's server-side identity provider, including revocation and role status. No browser-supplied role is trusted.
2. Gateway recomputes the authoritative cart/destination/origins/configuration fingerprint from server-controlled records. It creates a random operation nonce bound to actor, operation ID, context revision/fingerprint, action (approve/revoke), fee, expiry and audience.
3. Gateway writes a single-use authorization intent to a **server-owned** transactional table through a dedicated privileged path unavailable to browser SQL and unavailable to the general pool role. The intent is not an unverified client assertion. A shared pool worker may reference the opaque intent ID only.
4. Database transaction locks the intent and context in consistent order, verifies server-issued intent provenance, actor enabled role, action, expiry, nonce consumption and exact context, then atomically marks intent consumed and writes approval or revocation. Retry uses a stable operation ID and returns the prior result without consuming a new intent.
5. No direct approval or resolve SQL EXECUTE granted to generic shared-pool login until provenance verification is implemented and tested. Unknown, stale, revoked, duplicate-conflict, unauthorized or expired intents always return PENDIENTE.

## Important limitations
The proposed gateway and intent table are **not implemented**. A table row inserted by the same untrusted shared-pool role would NOT establish provenance. Signing a client-supplied actor ID without checking server session would also be insecure. A raw HMAC token in client-visible storage would create replay and disclosure risks. A pool SQL connection that can SET ROLE to an elevated owner defeats separation. Production needs explicit database role and credential isolation, no BYPASSRLS, immutable audit and real concurrent tests.

## Replay protection
Unique (actor, operation ID), unique nonce, transactional consumption, short expiry based on database time, audience/action binding, conflict detection on payload changes, and persistence across retries/reconnect. No external service or deployment in this task.

## Model distinction
Individual LOGIN: legacy `session_user` laboratory RPC may be tested only with distinct DB logins and no browser credentials. Shared pool: legacy RPC must be disabled; requires trusted gateway plus transactional intent mechanism. Both are PENDIENTE until end-to-end verified.
