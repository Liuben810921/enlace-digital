# Auditoría de caracteres de control internos en motivos de tarifa — 13 noviembre 2026

## Hallazgo
La validación de `ed_rpc_lab.update_rate` rechazaba motivos formados únicamente por espacios de control y motivos de más de 160 caracteres, pero permitía caracteres de control *dentro* de un texto válido, por ejemplo `valid\\nforged event`. Como `ed_rpc_lab.audit.reason` almacena el texto original, estos caracteres pueden producir registros multilínea engañosos en exportaciones y herramientas de revisión de auditoría.

## Reproducción
La regresión en `tests/postgres-delivery-rpc-rls-lab.py` envía motivos con salto de línea, retorno de carro y tabulación internos, esperando `InvalidParameterValue` (SQLSTATE `22023`) y comprobando que versión, tarifa y número de eventos no cambien.

## Corrección
En `tests/postgres-delivery-rpc-rls-lab.sql` se añade el rechazo de `p_reason ~ '[[:cntrl:]]'`, preservando el mínimo de tres caracteres significativos, el límite real de 160 caracteres, permisos, RLS y las reglas de concurrencia. No se modifican datos ni código operativo.

## Evidencias
- Base autorizada `469dc2a0db77fabd1f6523822ed4ae314b466f48`, comparada idéntica con la rama al iniciar.
- Prueba: `6a9c1a67ee8a464ba883ecc30c27a71645820135`.
- Corrección SQL: `4d1b31e2e1dc4f437c179e335c2bed792af919e6`.

**Estado: pendiente de GitHub Actions `completed/success`**. Solo laboratorio PostgreSQL desechable en GitHub; no se accedió ni modificó Supabase, staging, producción, clientes reales o pedidos.

## Cierre definitivo — GitHub Actions aprobada

Se verificó [GitHub Actions #43518323615](https://github.com/Liuben810921/enlace-digital/actions/runs/43518323615): estado `completed`, conclusión `success`, commit probado `4d1b31e2e1dc4f437c179e335c2bed792af919e6`. El trabajo `test` (ID `132205903443`) también finalizó `completed/success`.

La ejecución valida la batería reproducible que incluye rechazo de saltos de línea, retornos de carro y tabulaciones internos en el motivo de tarifa, con preservación del estado ante solicitudes inválidas.

**Dictamen: auditoría cerrada satisfactoriamente** para el laboratorio PostgreSQL desechable. Cierre documental únicamente: sin fusiones ni despliegues y sin acceso ni modificaciones a Supabase, staging, producción, clientes reales o pedidos.
