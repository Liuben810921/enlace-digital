# Authentication and execution boundary (offline, not tested)
## Individual PostgreSQL logins
Each administrator gets a separately authenticated database LOGIN; `session_user` maps to `actor_grants`. API membership grants EXECUTE only. This works as an identity model only if no login credentials reach browsers, role inheritance and impersonation are constrained, and DBA privileges are excluded. Not proven in a running database.

## Shared connection pool
`session_user` is the same pool login for every request. It **cannot** identify the administrator. Therefore existing RPCs must remain disabled for real users. A future trusted gateway must validate user sessions server-side and pass a verifiable, transaction-scoped authorization assertion through a controlled database boundary. Never accept a mutable custom GUC, a client actor_id, or a browser-provided role as proof. The gateway design, token binding, replay protection and audit remain blocked and are NOT implemented.

## Fail-closed
Until a tested identity boundary and trusted cart/destination/origin snapshot exist, all mixed-special delivery quotations stay PENDIENTE, never payable. No checkout changes.
