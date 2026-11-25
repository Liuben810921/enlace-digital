# Auditoría de sesión, revocación y propietario — PR #2

Fecha 2026-11-09. Solo GitHub; no se realizaron escrituras en Supabase.

## Evidencia verificable

- Commit inicial `a12a0d770b4525f2f9c220977f88b85facaa5a30`: CI run `42708359908`, success.
- Controlador `7e7e0fb8703955eff68bbeae50425512f63a6d0b`: `session` y `profile` validan `numero` entero seguro y positivo antes de devolver datos o consultar tablas; `logout` exige `cerrada===true` antes de devolver `closed:true`.
- Tests `5cc0e86837bf6ef9ca82e0b8380fc0774d6c3aed`: CI `42709233459` falló, 36 tests pasaron y uno antiguo falló porque el mock de logout devolvía un perfil en lugar de `{cerrada:true}`.
- Ajuste de fixture `09d7509926344117aa9b8259fb99a63434963647`: CI run `42709499820`, success.

## Límites

Los mocks no comprueban la revocación persistida en PostgreSQL, políticas RLS reales, concurrencia o integridad de datos. Permisos para eliminar una futura Edge Function siguen pendientes solo para despliegue/reversión; no impiden desarrollo offline. No hubo despliegue, modificación de secretos, roles, producción, pedidos reales, correos, productos, departamentos o administradores.
