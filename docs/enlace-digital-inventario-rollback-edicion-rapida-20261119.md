# ENLACE DIGITAL — Recuperación de edición rápida tras fallo de guardado
Fecha: 2026-11-19. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Base autorizada `679e0c733ecd5e908d125fd85242571ec61c5807`, HEAD inicial idéntico (sin commits posteriores).

## Defecto reproducido
`changeProduct` mutaba `p.qty` o `p.price` antes de llamar `save()`. Si `save()` fallaba (ejemplo: almacenamiento lleno), la excepción dejaba el valor nuevo en memoria sin confirmar. Prueba de reproducción: cantidad inicial 5, intento de 9, `save()` lanza error; cantidad quedaba 9.

## Corrección
Se conserva el valor anterior del campo; si `save()` falla, se restaura, se informa y no se refresca la interfaz como si hubiera tenido éxito. Se conservan las validaciones de cantidades enteras no negativas y precios finitos no negativos.

## Pruebas focalizadas
`index.html` blob `f6b39a4ac9fdee3b6397225d291433d40b3e7b49`.
- Fallo simulado al guardar cantidad 9: cantidad vuelve a 5, sin refresco — **PASS**.
- Fallo simulado al guardar precio 40: precio vuelve a 25, sin refresco — **PASS**.
- Guardado válido de cantidad 9: cantidad actualizada — **PASS**.
- Cantidad fraccionaria 1.5: rechazada sin guardar — **PASS**.
- Cantidad vacía: valor pendiente `null` — **PASS**.
- Sintaxis JavaScript inline completo — **PASS**.

Son pruebas de función aislada con datos ficticios, no de navegador ni integración. La batería integral se reserva para antes de activar, con autorización. Las rutas viales sin verificar siguen `PENDIENTE`. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
