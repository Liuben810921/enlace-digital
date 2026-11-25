# Revisión estática de la propuesta de cooldown
Este archivo describe verificaciones reproducibles sin conectar con Supabase.

## Invariantes
- La función conserva nombre, parámetros, valor de retorno, SECURITY DEFINER y search_path vacío.
- El filtro de cooldown conserva cliente, propósito y 10 minutos, pero **no** filtra por consumido_en.
- La invalidación de tokens pendientes conserva consumido_en IS NULL.
- La expiración de recuperación continúa en 20 minutos y la de verificación en 24 horas.
- No se cambia la tabla de tokens, ni se añaden permisos o funciones públicas.

## Revisión estática
Comparar `sql/propuestas/staging_cooldown_consumido.sql` con `pg_get_functiondef` documentado en la auditoría anterior: el único cambio funcional previsto es quitar `and consumido_en is null` de la condición de cooldown. El archivo no debe ejecutarse como parte de CI.

## Limitaciones
La prueba 11 del archivo `sql/staging_correo_integral_rollback.sql` debe ejecutarse únicamente por la vía autorizada para demostrar el cambio. También deben ejecutarse las otras 17 aserciones, comprobar permisos y revocación, y revisar concurrencia. No hay aprobación dinámica ni despliegue.
