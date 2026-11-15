# OSRM portable — pruebas offline y alojamiento gratuito (2026-11-15)

Base: `520c46cff821bb0f375a7dbeda27783ef85fc169`; rama aislada `plan/havana-osrm-benchmark-offline-20261114`.

## Decisión arquitectónica
**El servidor del amigo NO es dependencia del proyecto.** El mismo artefacto puede ser evaluado en cualquier host Linux que soporte Compose, permisos y límites. Los archivos se encuentran en `experiments/havana-osrm-portable/{compose.yaml,validate.py,test_validate.py}`. No se ha desplegado ni instalado.

El Compose fija un proyecto propio, usuario 65532, rootfs read-only, `cap_drop: ALL`, no-new-privileges, CPU 2, RAM 2g, PIDs 128, volumen de datos read-only y publicación en loopback. La imagen debe aportarse mediante digest real verificado; la ruta de datos debe configurarse fuera de la plantilla. Los límites son **valores de laboratorio no medidos**. La validación exacta de texto impide cambios sin revisión, pero no es un parser YAML ni verifica que Compose aplique los límites. Para correrlo se necesita validar además `docker compose config` y observar cgroups, red y cuotas del host; eso NO se hizo.

## Evidencia de pruebas locales
Se creó el contenido local y se ejecutó:
- `python -m unittest -v`: **3 tests OK**.
- `python -O -m unittest -v`: **3 tests OK**.
- `python validate.py compose.yaml`: **PASS**, SHA-256 del texto `6d5564e98edf29b09774de524c86d5cd1f9b28324403060dd25b115f7a1590c1`.

La suite cubre 20 mutaciones de plantilla (puerto público IPv4/IPv6, root/privileged, cap, mounts, host networking, recursos, env_file, labels, restart y nombre de proyecto), 6 rutas host negativas y 3 digest inválidos. **No son 29 tests independientes**: son 3 métodos unittest con subtests. La validación de parámetros verifica *formato* de digest, no existencia, autenticidad o firma; la ruta puede ser un symlink, por lo que el administrador debe verificar `realpath`, ownership y cuota antes de instalar. No se ha ejecutado Docker, OSRM, cartografía ni pruebas integradas.

## Proveedores gratuitos: revisión adicional
- **VPSFree.io**: la portada oficial muestra instancia gratis de **192 MB/3 GB**, con renovación manual cada 10 días, aunque otra página promociona 2 GB/40 GB. Descartado por insuficiencia e inestabilidad de inventario: https://vpsfree.io/ .
- **AlaVPS**: anuncia 1–8 GB y 128 GB, pero su propio precio indica **«$0 / promotional period»** y duración típica de **1–3 meses**. Descartado como permanente: https://alavps.com/ .
- **1Free.eu**: ofrece pruebas gratuitas pero el servidor expira, luego requiere pago; descartado: https://www.1free.eu/en/vps .
- **Google Cloud Free**: cuota permanente e2-micro, pero exige cuenta de facturación y factura excesos en cuenta de pago. No cumple requisito de al menos 4 GB y ausencia de riesgo de cargos: https://docs.cloud.google.com/free/docs/free-cloud-features .
- **Oracle**: recursos más amplios pero prohibición contractual aplicable a empresa cubana en política oficial; descartado: https://www.oracle.com/corporate/security-practices/corporate/governance/global-trade-compliance/ .
- No se verificó en ninguno un permiso contractual explícito para ENLACE DIGITAL como empresa cubana. No hay VPS externo aprobado con costo mensual cero. La ausencia de candidato en esta muestra no prueba inexistencia absoluta.

## NO-GO y siguiente paso
1. No instalar sin autorización específica, confirmación contractual y alojamiento real.
2. No sustituir digest de imagen por un valor arbitrario; verificar imagen oficial y SHA-256.
3. Verificar dataset OSM y licencia; preparar grafo MLD fuera del servidor objetivo si procede, con benchmark RAM/disco.
4. No exponer OSRM directamente; usar API autenticada con límites y sin PII.
5. Aceptación A01–A15 del documento anterior **pendiente**, especialmente rutas reales, tarifas, concurrencia, fallos y UI móvil.
6. `commercialQuoteEnabled=false` sigue siendo requisito. **Mensajerías no está cerrada.**

## Restricciones
Solo archivos en rama aislada y pruebas Python offline. No se crearon cuentas, servidores ni servicios; no se descargó cartografía, no se ejecutó OSRM, no se activaron manualmente GitHub Actions, no se generaron costos y no se accedió a Supabase, staging o producción. Los commits pueden disparar workflows automáticos preexistentes; no se ha verificado su estado.
