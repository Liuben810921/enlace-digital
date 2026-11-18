# ENLACE DIGITAL — verificación de colisiones y fallos offline (2026-11-18)

Base `35029246681b3c311789006022f863c130a2c8a7`, rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Comparación GitHub: `identical` al inicio.

## Blobs recuperados y verificación
GitHub fetch confirmó:
- `unified-guarded.faults.test.mjs`: `d83865b94ea929e3201ac2a75a2bb67439c582ae`
- `unified-guarded.collision.test.mjs`: `a94cb296785bbf2d3ac32c1be7abcfd379a8618d`
- `unified-guarded.mjs`: `e67b366bdc12a10361445789174b3044a6fa36ab`

Se ejecutaron en Node v22.16.0 las copias locales de `/mnt/data/ed-guarded-exact`:
```
PASS 12 guarded crash and identity assertions
PASS 3 global-collision assertions; 24 processes, one reservation
```
El coordinador local **sí coincide** con su blob GitHub (`e67b...`). Sin embargo, los hashes locales de las pruebas fueron:
- `faults.test.mjs`: `972599ccb34cfb27d037104b00f2013f1406b297`
- `collision.test.mjs`: `a09e05fc39c622e24ff6d699f963ff0820ca5723`

**No coinciden con los blobs de las pruebas publicadas.** Por tanto, los 15 resultados son pruebas locales reproducidas, **no ejecución exacta de esos dos archivos GitHub**. Se evita certificar falsamente la equivalencia. El contenido exacto de ambos sí se recuperó por conector, pero la descarga directa al contenedor sigue sin estar verificada.

## Cobertura y limitaciones
- Se verificó carrera de 24 procesos sobre un ID global: una reserva, resto conflicto o ya registrado.
- Se verificó salida voluntaria de proceso durante transacciones sin COMMIT, reapertura y conservación de invariantes básicas; NO constituye prueba de SIGKILL real ni de inyección física de fallo antes/después de COMMIT.
- **No se ejecutó en esta fase una batería adicional de SIGKILL ni auditoría exhaustiva de invariantes.** Debe realizarse antes de declarar ese alcance completado.
- No se reprodujeron defectos confirmados en el código protegido, por lo que no se modificó.
- Identidad sintética aportada por llamador no implica autenticación real; rutas antiguas siguen accesibles en el prototipo, y la cuota compartida no está impuesta universalmente.
- SQLite `node:sqlite` en Node 22 es experimental; documentación: https://nodejs.org/api/sqlite.html

## Restricciones respetadas
Sin GitHub Actions, cuentas, claves, servicios, despliegues, Supabase, staging, producción, clientes ni pedidos. Exclusivamente código y pruebas ficticias en rama aislada.

## Próxima ejecución
Recrear las dos pruebas con hash Git exacto y ejecutarlas; implementar test SIGKILL con sincronización de fases antes/después de COMMIT y auditoría `used + reserved` contra filas por estado en cada reapertura. No afirmar resultados antes de ejecutarlos.
