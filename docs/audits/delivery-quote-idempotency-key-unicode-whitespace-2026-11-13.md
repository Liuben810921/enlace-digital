# Auditoría de claves de idempotencia compuestas solo por espacios Unicode — 13 noviembre 2026

## Riesgo identificado
`ed_rpc_lab.quote_preview` rechaza claves de idempotencia vacías o compuestas solo por espacios ASCII, controles POSIX o separadores U+2028/U+2029. Sin embargo, `btrim` no elimina U+00A0, U+202F ni U+3000; una clave formada solo por estos caracteres superaba la validación y podía persistirse como identificador de operación sin contenido visible.

## Prueba y corrección
- Regresión reproducible en `tests/postgres-delivery-rpc-rls-lab.py`: tres claves exclusivamente Unicode deben provocar SQLSTATE 22023 y no crear cotizaciones.
- Corrección limitada en `tests/postgres-delivery-rpc-rls-lab.sql`: `translate` convierte esos tres caracteres a espacios ASCII exclusivamente durante la comprobación de contenido significativo; se preserva el identificador original para claves válidas.
- No se alteran la longitud máxima de clave, el hash de payload, los bloqueos, RLS, privilegios, las versiones ni la semántica de reintentos.

## Evidencia
- HEAD inicial autorizado `12ff09d6b1050fc79fb09e862117d0db0c327ec7` verificado idéntico a la rama.
- Regresión `75d852c046894cea7dd652e6c8c8de2248c7ddda`.
- Corrección `7f865fddae560083186098b9cfe3445db3e3494a`.

**Estado: cerrada satisfactoriamente tras GitHub Actions `completed/success`.** Exclusivamente rama aislada y PostgreSQL desechable; sin acceso ni modificaciones a Supabase, staging, producción, clientes reales ni pedidos.

## Cierre definitivo — GitHub Actions aprobada

Verificada [GitHub Actions #43520099328](https://github.com/Liuben810921/enlace-digital/actions/runs/43520099328): estado `completed`, conclusión `success`, commit probado `7f865fddae560083186098b9cfe3445db3e3494a`. El trabajo `test` (ID `132211909696`) también terminó `completed/success`.

La ejecución aprobó las pruebas reproducibles de rechazo de claves de idempotencia formadas exclusivamente por espacios Unicode U+00A0, U+202F y U+3000, sin crear cotizaciones persistentes ante solicitudes inválidas.

**Dictamen: auditoría cerrada satisfactoriamente** en el laboratorio PostgreSQL desechable. Actualización exclusivamente documental; sin cambios en SQL ni pruebas durante el cierre, sin fusiones ni despliegues y sin acceso ni modificaciones a Supabase, staging, producción, clientes reales o pedidos.
