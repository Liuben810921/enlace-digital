# Persistencia de asociaciones y cotizaciones — 2026-11-19

Base `27423faa46df58adffbab2c240ad6b54f59fb9ad`. Corrección `de1b800b6a33d9b7531dc81161675b75f908f5d0`.

## Defecto reproducido
Se ejecutó la función real `edProductOriginsSave(7,['b'],'propio')` con dos almacenes ficticios activos, asociación previa `{'7':['a']}`, y `localStorage.setItem` silenciosamente inoperante. Antes: resultado `true`, asociación persistida aún `a`, una invalidación de cotización. Falsa confirmación.

## Corrección
Después de guardar asociaciones se comprueba lectura exacta del JSON escrito. Ante discrepancia se entra al manejo de errores existente, con restauración y cuarentena si no es posible confirmar el estado previo.

## Pruebas posteriores (2/2 PASS)
- Escritura silenciosa fallida: `false`, asociación `a` conservada, cero invalidaciones, sin cuarentena porque se confirmó el estado previo.
- Escritura correcta: `true`, asociación `b` persistida, una invalidación, sin cuarentena.

## PENDIENTE
Confirmaciones parciales entre inventario, alias privados y asociaciones; reinicio real, concurrencia entre pestañas/dispositivos, persistencia remota y batería integral. No se atribuyen resultados de integración a estas pruebas con dependencias simuladas. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
