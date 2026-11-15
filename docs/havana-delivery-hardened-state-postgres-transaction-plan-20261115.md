# Estado sintético encapsulado y plan de transacciones PostgreSQL — 2026-11-15

**Base:** ec76c72d337a4eb9aca2ab4831327a9d34339cdb  
**Rama:** plan/havana-osrm-benchmark-offline-20261114  
**Restricción:** no se ejecutaron workflows, PostgreSQL, OSRM, descargas ni servicios externos.

## Archivos nuevos verificados

- `experiments/havana-osrm-portable/warehouse_state_hardened.py`: blob Git `d9518df13a1aa3b7626c28cc43be07fa3517d49b`, SHA-256 local `ec538595954093a099021bd863b31cc2b1d8c221b040e0523a0966d0ca7d2cbf`.
- `experiments/havana-osrm-portable/test_warehouse_state_hardened.py`: blob Git `a461d402b77456559442f1dde7c4d4d61d1858d5`, SHA-256 local `2b0422ddd5750f869057b0c2d5a8c01d3907c80973cd0b4219065318f782b6f5`.

Los blobs Git de ambos archivos se cotejaron con `git hash-object` sobre los archivos locales exactos: **2/2 coinciden**.

## Cambios sintéticos

El módulo nuevo `HardenedState` no reemplaza al `State` histórico. Usa `__slots__`, campos privados por convención de Python, copia profunda al recibir y devolver estado, validación de tipos y límites en `change`, comparación de versiones y comparación de datos en `evaluate`. Protege frente a modificaciones accidentales mediante las propiedades públicas; **no constituye aislamiento frente a código Python malicioso con introspección**, ni asegura atomicidad multiproceso.

Se preservan la selección por almacenes participantes, tarifa basada en el almacén más lejano y mínimo de 3 km mediante delegación a `warehouse_assignment_v2.allocate` en el diseño publicado. El nuevo módulo mantiene prohibición de aprobación comercial.

## Pruebas locales realmente ejecutadas

```sh
python -m unittest -q test_warehouse_state_hardened
python -O -m unittest -q test_warehouse_state_hardened
```

**15/15 correctas en modo normal y 15/15 en modo -O.** Cubren copia defensiva del estado inicial, propiedades, snapshots, alteraciones de datos y versiones, validación de cambios, invalidación de cuatro dimensiones, dos escritores con snapshot idéntico, recotización y no habilitación comercial.

**Limitación relevante:** estas ejecuciones usaron implementaciones locales simplificadas de `delivery_quote` y `warehouse_assignment_v2` como dependencias, no los bytes originales del repositorio. Por ello **no se ha verificado la integración exacta** del nuevo módulo con las dependencias reales, ni se ha repetido la regresión histórica de 35 casos. El siguiente paso obligatorio es repetir las 15 + 35 pruebas con el contenido exacto recuperado del commit y verificar todos los hashes.

## Diseño de ensayo transaccional desechable (NO ejecutado)

1. PostgreSQL efímero sin red externa ni credenciales empresariales; esquema sintético independiente, usuario técnico sin BYPASSRLS y permisos mínimos.
2. Tablas de versiones por cesta, dirección, rutas y almacenes, stock sintético y cotizaciones con vector de versiones inmutable; claves foráneas, checks y RLS efectiva.
3. Dos conexiones reales con barrera sincronizada: T1 lee snapshot; T2 cambia una dimensión y confirma; T1 intenta insertar/confirmar cotización y **debe fallar o quedar inválida**. Repetir para las cuatro dimensiones.
4. Pruebas de bloqueo y serialización: `SELECT ... FOR UPDATE` o actualizaciones condicionales de versión; probar READ COMMITTED y SERIALIZABLE; conflictos `40001`, deadlocks `40P01`, reintentos acotados, rollback y commit de resultado desconocido.
5. Simular cambios simultáneos de inventario y ruta; impedir aprobación de una tarifa calculada con stock o trayecto anterior. Verificar aislamiento entre gestores, política RLS y ausencia de acceso cruzado.
6. Toda cotización de ensayo tendrá `commercial_quote_enabled=false` y `commercial_approval=false`; usar nombres y direcciones inventados, sin datos reales.
7. Criterios de salida: cero cotizaciones vigentes con vector obsoleto, cero pérdidas de actualizaciones, cero saltos RLS, reproducibilidad de trazas y limpieza total del entorno efímero.
8. No ejecutar ni aprovisionar PostgreSQL, contenedores o Actions sin autorización independiente y evaluación de recursos/costos.

## Riesgos residuales

- El módulo nuevo todavía no ha superado regresión de integración con las dependencias exactas.
- No existe garantía transaccional real ni reservas de inventario.
- El estado encapsulado no equivale a control de acceso de servidor.
- No hay rutas reales, cartografía ni cobertura verificada.

**Estado:** archivos experimentales y documentación únicamente; sin modificación de código operativo, workflows, Supabase, staging, producción ni costos.
