# Auditoría de caracteres de control internos en claves de idempotencia — 13 noviembre 2026

## Hallazgo y alcance
`ed_rpc_lab.quote_preview` rechazaba claves vacías, de más de 80 caracteres y formadas únicamente por espacios de control, pero aceptaba saltos de línea, retornos de carro y tabulaciones *dentro* de una clave con caracteres visibles. La clave se almacena sin normalización en `ed_rpc_lab.quotes.operation_key`. Esto permite identificadores opacos con separadores de registros, dificultando exportación, inspección y correlación fiable de operaciones. Riesgo circunscrito al prototipo aislado.

## Regresión reproducible
`tests/postgres-delivery-rpc-rls-lab.py` añade claves `order\\nforged`, `order\\rforged` y `order\\tforged`; exige SQLSTATE `22023` y que no aumente el número de cotizaciones.

## Corrección mínima
`tests/postgres-delivery-rpc-rls-lab.sql`: añadir `p_key ~ '[[:cntrl:]]'` a la validación inicial de `quote_preview`. Se conservan la longitud 1–80, las comprobaciones de RLS, permisos, versiones y concurrencia.

## Evidencia
- Base `aa93a7e5d81048b1f5792ae0d5fada60c961b11a`, idéntica al inicio de la auditoría.
- Prueba de regresión `0b05c5900cce7f24a67b2f996b79e41b339552b8`.
- Corrección `a28687b012466b18fffc12ec51b1fce28b3e4e2a`.

**Estado: abierto hasta GitHub Actions `completed/success`.** Exclusivamente laboratorio PostgreSQL desechable en GitHub; sin acceso ni modificaciones a Supabase, staging, producción, clientes reales o pedidos.

## Cierre definitivo — GitHub Actions aprobada

Se verificó [GitHub Actions #43518505101](https://github.com/Liuben810921/enlace-digital/actions/runs/43518505101): estado `completed`, conclusión `success`, commit probado `a28687b012466b18fffc12ec51b1fce28b3e4e2a`. El trabajo `test` (ID `132206514732`) también finalizó `completed/success`.

La ejecución valida la batería reproducible que incluye rechazo de saltos de línea, retornos de carro y tabulaciones internos en las claves de idempotencia, sin insertar nuevas cotizaciones ante solicitudes inválidas.

**Dictamen: auditoría cerrada satisfactoriamente** para el laboratorio PostgreSQL desechable. Cierre documental únicamente: sin fusiones ni despliegues y sin acceso ni modificaciones a Supabase, staging, producción, clientes reales o pedidos.
