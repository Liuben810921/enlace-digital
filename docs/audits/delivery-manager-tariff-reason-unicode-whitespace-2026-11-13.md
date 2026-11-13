# Auditoría de motivos de tarifa compuestos solo por espacios Unicode — 13 noviembre 2026

## Hallazgo
La RPC sintética `ed_rpc_lab.update_rate` exige una justificación significativa de 3 a 160 caracteres. Su `btrim` original eliminaba espacios ASCII y controles habituales, pero no los espacios Unicode U+00A0 (no separable), U+202F (no separable estrecho) y U+3000 (ideográfico). Por tanto, motivos de tres de esos caracteres superaban la validación sin aportar contenido significativo al historial de tarifas.

## Regresión y corrección limitada
- Pruebas reproducibles en `tests/postgres-delivery-rpc-rls-lab.py`: los tres casos deben producir SQLSTATE 22023, sin cambios en tarifa, versión o auditoría.
- SQL en `tests/postgres-delivery-rpc-rls-lab.sql`: `translate` convierte únicamente esos tres espacios Unicode a espacios ASCII **para evaluar** la longitud significativa; el texto original no se normaliza ni se reescribe para almacenamiento.
- Se conservan el límite de longitud bruta, las comprobaciones de caracteres de control y separadores, RLS, permisos y sincronización.

## Evidencias
- HEAD inicial autorizado `3ce999511c77eebd5e9a725febc4d2bc849af2b2` (comparación idéntica).
- Prueba `0deb05e9062410d6300564e9e3a79deee1c960fe`.
- Corrección `5b89e26b3f9270cb425fa9ba457db2bd7e0e33ea`.

**Estado: cerrada satisfactoriamente tras GitHub Actions `completed/success`.** Alcance exclusivo: rama GitHub aislada y laboratorio PostgreSQL desechable; sin acceso ni modificaciones a Supabase, staging, producción, clientes reales o pedidos.

## Cierre definitivo — GitHub Actions aprobada

Verificada [GitHub Actions #43519376932](https://github.com/Liuben810921/enlace-digital/actions/runs/43519376932): `completed/success` sobre el commit `5b89e26b3f9270cb425fa9ba457db2bd7e0e33ea`. El trabajo `test` (ID `132209483925`) finalizó `completed/success`.

Las pruebas reproducibles de los espacios Unicode U+00A0, U+202F y U+3000 están aprobadas, incluida la comprobación de que una solicitud inválida no altera tarifa, versión ni historial de auditoría.

**Dictamen: auditoría cerrada satisfactoriamente.** Exclusivamente laboratorio PostgreSQL desechable y cierre documental en la rama aislada de GitHub; sin modificación de SQL ni pruebas en este cierre, sin fusiones ni despliegues y sin acceso ni modificaciones a Supabase, staging, producción, clientes reales o pedidos.
