# ENLACE DIGITAL — Aprobación manual de tarifas especiales mixtas (opción C)
Fecha: 2026-11-18. Rama `plan/havana-osrm-benchmark-offline-20261114`. Base `5c484c3e11d8f1fb5342a9c8430e7e102d3c8a34`, comparación inicial GitHub: identical.

## Decisión autorizada
El propietario aprobó la **opción C**: las cestas mixtas con tarifas especiales requieren cotización manual confirmada por administrador. No se debe inferir ni sumar tarifas especiales automáticamente.

## Implementación offline
- `experiments/havana-delivery-quote/manual-approval.js`, Git SHA `1a0a9ffcee00c267fd5cd6c74891a12eafdc269d`.
- `experiments/havana-delivery-quote/manual-approval.test.js`, Git SHA `2427f56bd0578bb4f63b40554d6eac9e9f96afee`.

Ambos SHA Git coinciden con `git hash-object` de los archivos locales ejecutados y con `fetch_file` del repositorio.

Funciones: `snapshot` valida cesta, configuración, asociaciones y reglas, normaliza productos y cantidades, crea una huella SHA-256 de revisión, destino, productos y almacenes asociados; `requestManualQuote` devuelve `PENDIENTE / MANUAL_APPROVAL_REQUIRED` y solicitud sintética; `approveManualQuote` permite preparar un borrador solo con roles Principal o General; `resolveManualQuote` valida huella, revisión, rol, fecha y cuarentena, y devuelve exclusivamente `APROBACION_MANUAL_SIMULADA`, nunca tarifa real confirmada.

## Pruebas nuevas ejecutadas
Node.js `v22.16.0`:
```sh
node /mnt/data/ed_filter/manual-approval.test.js
# PASS 23 offline manual-approval assertions
```
Exit 0. Cobertura: solicitud obligatoria, huella SHA-256, borrador autorizado, resolución ficticia, importe 1100 CUP de ejemplo, importe de productos intacto, mensajería directa, marca de simulación, falta de aprobación, cambios de cantidad, destino y revisión, cuarentena, caducidad a 15 minutos y fecha futura, rechazo de Supervisor/Gestor, aceptación de General, importe negativo, cesta que no requiere aprobación, asociación inválida, regla ausente y normalización del orden de productos.

## Límites de seguridad y cierre
La función `approveManualQuote` **no autentica identidades ni comprueba roles contra servidor**; recibe un actor ficticio. La huella SHA-256 no es una firma ni impide falsificar un borrador. El plazo de 15 minutos es **una protección experimental**, no una política comercial de vigencia aprobada. El prototipo no comprueba procedencia de rutas reales ni reserva tarifas. No está integrado con checkout, persistencia multiusuario ni pedidos. Para activación empresarial se requieren permisos reales en servidor, registro de aprobaciones con operación idempotente, firma/verificación o consulta autorizada, control de revisiones y pruebas finales.

No se modificó `index.html`, `quote.js`, checkout operativo, Supabase, staging, producción ni pedidos reales. No se ejecutaron GitHub Actions, cartografía, despliegues ni costos.
