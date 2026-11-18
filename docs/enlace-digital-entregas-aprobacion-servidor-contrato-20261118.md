# ENLACE DIGITAL — Cierre offline del diseño de aprobación manual, opción C
Fecha: 2026-11-18. Rama `plan/havana-osrm-benchmark-offline-20261114`. Base `013b9421dd12462c65085edbf2ba6234492061c1`, comparación GitHub: identical.

## Contrato publicado
`experiments/havana-delivery-quote/server-approval-contract.js` declara los requisitos mínimos obligatorios: identidad y rol del servidor, persistencia de aprobación, idempotencia por actor+operación, transacción atómica, revocación persistente, huella de cesta/destino/orígenes/revisión y caducidad con reloj de servidor. No es un sistema de autorización operativo.

## Prueba de concepto local
Se preparó y ejecutó un simulador en memoria `server-approval.js` y su batería `server-approval.test.js` en Node.js 22.16.0, sin red ni servicios. Resultado local:
```
PASS 21 server-side offline lab assertions
```
Hashes de los dos archivos **locales**, no publicados como código de ejecución:
- `server-approval.js`: `51f5a8539077987ffda462a26ccfc8385e292e62`
- `server-approval.test.js`: `e1405233760796ea2a132432ec65801bbc95374f`

Casos cubiertos: autorización ficticia por rol, reintento idempotente, conflicto de operación, aprobación existente y ausencia de aprobación, importe CUP y mensajería separada, rechazo de supervisor y actor deshabilitado, invalidación por cantidad/destino/almacenes/revisión, caducidad, revocación y bloqueo por cuarentena.

**Limitación importante:** las 21 pruebas se ejecutaron sobre archivos locales; el código del simulador y su test **no se publicaron en GitHub**. El único archivo nuevo de código publicado en esta intervención es `server-approval-contract.js`. No afirmar pruebas CI ni reproducibilidad directa de esas 21 aserciones desde la rama.

## Diseño necesario para servidor real (no ejecutado)
1. El servidor obtiene identidad y rol actual de sesión autenticada; ignora `actor`, `role` y `approval` aportados por el navegador.
2. Carga cesta, productos, tarifas, destino, almacenes y revisión desde fuente autorizada y calcula huella canónica. La huella de cliente no es autoridad.
3. En una única transacción, compara revisión y guarda aprobación con ID de operación único por actor; reintentos idénticos devuelven el mismo registro, payload distinto genera conflicto.
4. Registra estado, actor, tarifa CUP, huella, emisión, caducidad y revocación; audita sin secretos.
5. Revocación idempotente con control de permisos; consulta siempre estado persistido.
6. Antes de usarla, recalcula la huella y verifica actor habilitado, caducidad con reloj de servidor, no revocación y coherencia de cesta/destino/orígenes.
7. Si algo falla, responde `PENDIENTE`; mensajería siempre fuera del importe de productos.
8. **La aprobación de tarifa manual no demuestra distancia vial real**. No transformar un prototipo en cobro ni pedido real.

## Bloqueantes
- Persistencia transaccional y verificación real de permisos/RLS requieren autorización específica para staging.
- La fuente vial verificada y el checkout integrado requieren autorizaciones independientes.
- Antes de cerrar comercialmente, probar carreras reales entre aprobación, revocación y modificación de cesta/destino, y la recuperación tras reinicio de servidor.

No se modificaron `index.html`, checkout operativo, Supabase, staging, producción ni pedidos. Sin GitHub Actions, cartografía, despliegues ni costos.
