# Auditoría de caracteres de control en claves de idempotencia — 13 noviembre 2026

## Alcance y hallazgo
Tras el cierre de claves compuestas solo por espacios ASCII, `quote_preview` seguía comprobando `btrim(p_key)=''`. En PostgreSQL, `btrim(text)` elimina espacios normales pero no tabulaciones, saltos de línea y otros caracteres de control ASCII. Por inspección del código, una clave formada únicamente por esos caracteres no satisfacía la condición de rechazo. Se añadió una prueba reproducible de rechazo de tabulaciones y saltos de línea en la rama aislada.

## Corrección
La condición de entrada usa `btrim(p_key, ' ' || chr(9) || chr(10) || chr(11) || chr(12) || chr(13))=''` y conserva el error `invalid_request` SQLSTATE `22023`. No se altera la semántica de claves con caracteres significativos ni los controles de RLS, roles, bloqueo, tarifa o cotización.

## Regresión
`tests/postgres-delivery-rpc-rls-lab.py` comprueba claves formadas únicamente por espacio, tabulador, salto de línea, retorno de carro, tabulador vertical y salto de página, incluidas combinaciones. Para cada entrada se exige `InvalidParameterValue` y se comprueba que el recuento de cotizaciones no aumente.

## Commits y CI
- [e6ad673](https://github.com/Liuben810921/enlace-digital/commit/e6ad673ceabb61f1c70be08146d8cff9b02890b8): prueba de reproducción.
- [2772c22](https://github.com/Liuben810921/enlace-digital/commit/2772c22e61a4cfecf5f5716d89f230a92df20256): corrección SQL.
- [196f085](https://github.com/Liuben810921/enlace-digital/commit/196f085fe0063cff54bfa24112b7037232750902): regresión completa.
- [GitHub Actions #43515110527](https://github.com/Liuben810921/enlace-digital/actions/runs/43515110527): ejecución del commit SQL corregido, `in_progress` en la primera consulta.
- La ejecución que incorpore el commit `196f085` deberá validarse antes del cierre definitivo.

**Estado:** pendiente de CI sobre la regresión completa y la corrección. No implica validación ni despliegue en entornos reales.

**Restricciones:** solo GitHub y PostgreSQL desechable; sin acceso ni modificación de Supabase, staging, producción, clientes reales ni pedidos.
