# Auditoría: cambios de tarifa sin efecto tras redondeo — 13 noviembre 2026

## Alcance y hallazgo
HEAD inicial verificado idéntico al commit autorizado `c5eb409a071da46396bd53099118e4cfa0c48a6a`. En el laboratorio PostgreSQL desechable, `ed_rpc_lab.update_rate` aceptaba un cambio al mismo valor o una variación subcentésima que `numeric(12,2)` redondea al valor anterior. Aun sin modificación efectiva de tarifa, incrementaba la versión y generaba un registro de auditoría, invalidando cotizaciones por un cambio inexistente.

## Pruebas reproducibles y corrección
- `tests/postgres-delivery-rpc-rls-lab.py`: prueba con la tarifa actual y con tarifa actual + 0.004 (Decimal exacto). Ambas deben fallar con SQLSTATE 22023 y mantener tarifa, versión e historial.
- `tests/postgres-delivery-rpc-rls-lab.sql`: después de adquirir bloqueo de fila y validar la versión esperada, compara `p_new::numeric(12,2)` con la tarifa almacenada. Si coinciden, rechaza el cambio sin efectos.
- No se modifican RLS, privilegios, cálculo de cotizaciones, bloqueos, aislamiento ni valores válidos de tarifas distintas.

## Evidencia
- Regresión inicial: `5867bf310be460c4e1b2bc93fecd7ba18261cf03`.
- Ajuste de precisión Decimal: `2b759ad0d8e60415ed14a1f8488915659fab8f5b`.
- Corrección SQL: `5f2ad4ea8a2ac18d209a0faf866886294b614b20`.

**Estado: pendiente de GitHub Actions `completed/success`.** Exclusivamente rama aislada de GitHub y PostgreSQL desechable; sin acceso ni modificaciones a Supabase, staging, producción, clientes reales ni pedidos.
