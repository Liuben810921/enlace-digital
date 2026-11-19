# Verificación focalizada de Web Locks e inventario — 2026-11-19

Base: 7d78ac478e5afb05bb464f7aca8575184038d669. Rama: plan/havana-osrm-benchmark-offline-20261114; comparación inicial identical (0 commits posteriores).

## Ejecución real

Archivo de pruebas del repositorio `tests/inventory-web-locks-synthetic.test.cjs`, copiado fielmente al entorno aislado y ejecutado con Node.js v22.16.0:

`node inventory-web-locks-synthetic.test.cjs` → **6/6 PASS**.

1. Clientes cooperativos: serialización y rechazo del segundo snapshot obsoleto: PASS.
2. Escritor que ignora el bloqueo: sobrescritura ajena y falso éxito: PASS de reproducción del riesgo, **no** corrección.
3. Fallback sin Web Locks: conflicto previo detectado, fee ajeno conservado: PASS.
4. Fallback sin Web Locks: cambio intercalado sobrescrito: PASS de reproducción del riesgo.
5. Payload de lote con campos no inventario presentes en el estado actual: fees y categories preservados: PASS.
6. Conflicto detectable: estado ajeno conservado y reconciliación requerida: PASS.

`node --check` también finalizó correctamente.

## Chromium local

Chromium headless y Playwright Python disponibles. Intentos de navegación a `file:///...`, `http://localhost:8765/...`, `http://ed.test/...` y `data:` bloqueados por el entorno (`net::ERR_BLOCKED_BY_ADMINISTRATOR`). En `about:blank`, Chromium informó `isSecureContext=false`, `location.origin=null`, `navigator.locks` ausente. **Esto no prueba incompatibilidad de Chromium con Web Locks**: el origen opaco/no seguro no permite una prueba válida de la API. Queda PENDIENTE ejecutar con origen seguro permitido. No se usó servidor, red ni servicios externos.

## Hallazgos y decisión

- El test de mutex en Node simula exclusión cooperativa, **no** invoca la Web Locks API nativa.
- Web Locks solo puede coordinar escritores que usan el mismo nombre de bloqueo y contexto/origen aplicable. Escritores no cooperativos pueden sobrescribir incluso durante el bloqueo.
- El código `edQueueInventory` persiste `{...state,products:target}`; conserva campos ajenos presentes en `state` al finalizar. Si otro contexto cambia `fees` o `categories` después de la comparación, la escritura completa puede perder esos cambios. No hay CAS atómico en `localStorage`.
- Conflictos detectados: mantener datos externos, evitar reintentos ciegos de operaciones remotas y reconciliar manualmente. Conflictos ya sobrescritos: recuperación automática no demostrable.
- No se modifica código operativo. El defecto de carrera está reproducido, pero la alternativa Web Locks aún no tiene validación nativa en un origen seguro ni cobertura de todos los escritores; implementar solo un bloqueo parcial no resolvería el defecto de fondo.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos. Sin batería integral.
