# ENLACE DIGITAL — Auditoría de frontera de ejecución offline (2026-11-18)

**Base:** `dd9a154271052db0dd677d64baf67e77d5e0c11e`; **rama:** `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial GitHub: `identical`.

## Evidencia de código consultado
Se recuperaron los archivos exactos mediante conector GitHub, con SHA de blob:
- `single-entry.mjs`: `3c924e1d1d4355505e389d2596490dade1a62cc8`
- `unified-guarded.mjs`: `e67b366bdc12a10361445789174b3044a6fa36ab`
- `idempotency-ledger.mjs`: `593e7390e25499f2ad08628b7ad4cb5f3a57e8f2`
- `idempotency-norm-v2.mjs`: `38499d106fe0f4ef447f1e9659f67bd22e9de6cb`

## Hallazgos confirmados por inspección
1. **Bypass posible:** `Ledger` y `LedgerV2` exportan constructores públicos que abren sus propias bases/tablas (`quotas`, `quota_v2`) sin consultar `global_ops` ni `shared_credits`. `GuardedQuota` también es importable directamente. La fachada `createSingleEntry` no puede imponer cuota obligatoria a código que no la invoque.
2. **Identidad no confiable:** `issueSyntheticPrincipal(principal)` emite un token para cualquier nombre `test-*` válido que el propio llamador elija. El token se guarda en memoria y no equivale a un principal autenticado por una autoridad externa.
3. **Acceso SQLite:** `GuardedQuota` expone `.db` y `.quota`, permitiendo que código con acceso al objeto modifique directamente sus tablas. Congelar la fachada no congela ni aísla la instancia interna si los módulos pueden importarse por otros caminos.
4. **Privilegios de archivo:** SQLite no implementa separación por usuario de aplicación dentro del mismo archivo. El aislamiento requiere privilegios de sistema operativo: proceso propietario de base con escritura; llamadores sin lectura/escritura al archivo y sin acceso a los módulos internos.
5. **Recuperación:** `global_ops` distingue `RESERVED`, `CONSUMED`, `UNKNOWN_CONSUMED`. El prototipo no prueba identidad de proveedor ni resolución externa de un resultado desconocido.

## Arquitectura propuesta (no implementada)
- **Broker SQLite único:** proceso independiente, dueño exclusivo del archivo SQLite; ningún otro proceso recibe su ruta ni descriptor. El broker importa `GuardedQuota` y aplica la cuota global.
- **IPC local restringido:** socket Unix con permisos de directorio y socket mínimos; verificación de identidad del proceso cliente mediante mecanismo del sistema operativo. La mera posesión de un token emitido por el propio llamador no concede identidad.
- **Protocolo cerrado:** `start`, `finish`, `stats` con validación de esquema, límites de tamaño, IDs globales, cuota, idempotencia y estado `PENDIENTE` ante cualquier error.
- **Privilegios:** proceso broker con permisos exclusivos sobre archivo y directorio; clientes ejecutados bajo usuarios del sistema distintos y sin permisos de escritura ni importación de módulos internos. Aislamiento de proceso por sí solo **no** evita bypass si ambos comparten usuario y acceso a la base.
- **Legacy y NORM-v2:** adaptadores de protocolo en el cliente, no constructores de sus Ledger originales. Eliminar rutas directas de la aplicación solo después de auditoría completa de importaciones y migración controlada.
- **Recuperación:** comprobar invariantes `used/reserved` contra filas por estado al iniciar; fallar cerrado si no coinciden; no liberar reservas inciertas sin conciliación explícita.

## Matriz de pruebas necesaria antes de declarar aislamiento
1. Dos procesos cliente sin acceso al archivo SQLite, uno `legacy` y otro `NORM-v2`, compitiendo por cuota global.
2. Intentos de importación directa de Ledger, apertura de SQLite y acceso al socket sin autorización: todos rechazados por la frontera de privilegios.
3. Identidad derivada del proceso/autoridad de prueba, no del nombre arbitrario enviado por cliente.
4. `SIGKILL` del broker antes y después de COMMIT, recuperación, reintento y auditoría de invariantes.
5. Bloqueo, corrupción sintética, cambio de día y fallo cerrado.
6. Prueba de entorno: usuarios distintos y permisos del socket/directorio. Si el contenedor no permite crear usuarios, registrar bloqueo y no certificar separación real.

## Estado de ejecución y alcance
**Esta fase es una auditoría verificable de código y diseño; no se ejecutaron nuevas pruebas Node.js ni se publicó un broker funcional.** No se afirma implementación, aislamiento efectivo ni resultados de pruebas no realizadas. Los tests Node.js de fases anteriores no prueban el modelo de privilegios aquí propuesto.

No se utilizaron GitHub Actions, cuentas, claves, servicios, despliegues, Supabase, staging, producción, clientes ni pedidos.
