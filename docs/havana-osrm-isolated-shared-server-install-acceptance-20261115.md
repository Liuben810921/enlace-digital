# OSRM aislado y reversible para servidor Linux compartido — diseño y aceptación offline

Fecha: 2026-11-15. Base: `1a99c39719e25f25a3d72af8acc75b50c48f59eb`. Rama: `plan/havana-osrm-benchmark-offline-20261114`.

## Estado y alcance
**DISEÑO / NO INSTALADO.** No se conoce el hardware, la política del proveedor del amigo, ni existe dataset cartográfico o benchmark OSRM en este entorno. Este documento es un procedimiento para revisión del administrador; no concede acceso a ChatGPT ni a ENLACE DIGITAL a otros servicios. No se accedió al servidor. Mantener `commercialQuoteEnabled=false`.

## Puertas P0 previas
- Consentimiento escrito del propietario y permiso del proveedor subyacente para servicio de una empresa cubana.
- Inventario sin secretos: sistema/arquitectura, Docker Engine/Compose, CPU/RAM **libres**, espacio libre, filesystem, permisos, red, IPv4/IPv6, respaldos y recursos de otros servicios.
- El propietario controla la instalación. No entregar contraseña root, llave SSH general, socket Docker, tokens o archivos privados a ChatGPT.
- Contenedor no equivale a aislamiento perfecto: kernel compartido. Si el requisito es separación de seguridad fuerte, usar VM dedicada con hipervisor y cuotas del host, o no instalar.

## Diseño de seguridad
1. El administrador crea un filesystem o volumen independiente `/srv/enlace-osrm` **con cuota de bytes e inodos impuesta por host** (ej. LV de 20 GiB solo para laboratorio, **tamaño ilustrativo, no dimensionamiento OSRM**); no confiar en `storage_opt` sin verificar soporte del driver. Disco y backups de otros servicios no se montan.
2. Contenedor rootless cuando sea compatible, ejecutado como UID/GID no privilegiado, sin `privileged`, sin `network_mode: host`, sin `pid: host`, sin `ipc: host`, sin `docker.sock`, sin dispositivos y sin capacidades Linux; `no-new-privileges`; rootfs `read_only`.
3. Bind mount **solo** `/srv/enlace-osrm/data:/data:ro`, sin carpetas ajenas. Datos OSRM preparados y verificados previamente por el administrador. `tmpfs` limitado y no ejecutable. Sin `docker exec` ni shell dentro de otros contenedores.
4. Limitar `cpus: '2.0'`, `mem_limit: 2g`, `memswap_limit: 2g`, `pids_limit: 128` como **ejemplo inicial**, sujeto a aprobación del propietario y a pruebas de memoria. OOM mata el proceso; no asegura ausencia absoluta de presión de I/O, CPU o red. Para evitar interferencia fuerte usar VM y límites de IOPS/bandwidth de disco.
5. Red: publicar `127.0.0.1:5000:5000` solo en loopback del host; proxy/API autenticada y rate limited del administrador, con HTTPS y logs sin direcciones/coords personales. **No abrir puerto 5000 al público**. Verificar firewall, Docker port publishing y exposición IPv6.
6. Imagen oficial OSRM **fijada por digest SHA-256 verificado** por el administrador; no usar `latest` ni confiar en etiquetas mutables. Comprobar licencia, procedencia y CVEs. No hay digest validado en esta fase.
7. Preprocesamiento `osrm-extract` y `osrm-partition/customize` **fuera del servidor compartido** o en entorno aislado separado; pueden consumir mucho más RAM/CPU/disco que `osrm-routed`. No iniciar preprocessing en host de terceros sin aprobación explícita.
8. Copias cifradas de datos propios, retención limitada, registro de auditoría y política de eliminación. El propietario mantiene control del firewall, proxy, monitoreo y apagado.
9. No acceder a Supabase ni copiar clientes, direcciones o pedidos reales. Para aceptación usar únicamente rutas y coordenadas ficticias. Validar atribución ODbL cuando se obtenga OSM.

## Plantilla Compose para revisión — NO EJECUTAR hasta autorización
El administrador debe sustituir `sha256:REEMPLAZAR_DIGEST_VERIFICADO` por un digest real comprobado. El fichero debe estar **fuera** de cualquier ruta que ejecute CI o despliegue automático. No incluye adquisición de mapas.

```yaml
name: enlace-osrm-lab
services:
  osrm:
    image: ghcr.io/project-osrm/osrm-backend@sha256:REEMPLAZAR_DIGEST_VERIFICADO
    command: ["osrm-routed", "--algorithm", "mld", "/data/havana.osrm"]
    user: "65532:65532"
    read_only: true
    privileged: false
    cap_drop: ["ALL"]
    security_opt: ["no-new-privileges:true"]
    cpus: "2.0"
    mem_limit: 2g
    memswap_limit: 2g
    pids_limit: 128
    tmpfs:
      - /tmp:rw,noexec,nosuid,nodev,size=64m,uid=65532,gid=65532
    volumes:
      - /srv/enlace-osrm/data:/data:ro
    ports:
      - "127.0.0.1:5000:5000"
    restart: "no"
    init: true
```

**Advertencias:** la ruta de imagen es ilustrativa y no fue validada; el UID puede requerir permisos de lectura de datos; `osrm-routed` requiere todos los archivos `.osrm*` del grafo y compatibilidad MLD; `memswap_limit` requiere compatibilidad del host. Si cualquier opción no se aplica, **NO-GO**. La cuota de disco y de I/O se impone fuera de Compose, en host/VM. No instalar Docker en el servidor compartido si aún no existe sin evaluación del administrador.

## Verificación en servidor — SOLO ADMINISTRADOR Y CON AUTORIZACIÓN FUTURA
1. Medir carga base durante una ventana acordada, comprobar memoria libre, I/O, espacio, cuotas e inodos. Guardar evidencia sin secretos.
2. Validar manifiesto: `docker compose config` **sin levantar**; inspeccionar mounts, puertos, UID, límites, digest, redes y ausencia de acceso a Docker socket.
3. Comprobar cuotas reales de filesystem/VM y permisos de `/srv/enlace-osrm`. Verificar que un UID sin privilegios no puede leer directorios privados ni escapar de su volumen.
4. Iniciar solo después de aprobar imagen, dataset y mantenimiento; comprobar `docker inspect`, `docker stats`, `ss -ltn`, reglas firewall IPv4/IPv6 y pruebas negativas desde red externa.
5. Ejecutar carga de consulta sintética y vigilar CPU, RAM, I/O, espacio y salud de los servicios ajenos; si hay degradación, detener y revertir.
6. Comprobar 401/403 para peticiones sin autenticación en proxy; nunca publicar OSRM directo. Probar límites de velocidad, timeouts, payloads inválidos, rutas inexistentes y logs sin PII.

## Pruebas de aceptación de mensajerías
| ID | Prueba | Criterio de aprobación |
|---|---|---|
| A01 | Elegibilidad y permiso | Confirmación del titular y condiciones del proveedor |
| A02 | Aislamiento de datos | No mounts fuera de `/srv/enlace-osrm`, UID no privilegiado, sin socket Docker |
| A03 | Recursos | Cuotas reales de CPU/RAM/disco/inodos/I/O; carga no degrada otros servicios |
| A04 | Red y privacidad | Solo loopback, proxy autenticado, HTTPS, rate limits, sin PII en logs |
| A05 | OSRM | Grafo legalmente obtenido, digest, checksum y arranque verificables |
| A06 | Ruta real | Distancia vial consistente con casos de referencia documentados |
| A07 | No-route | Error seguro y sin tarifa inventada cuando no existe ruta |
| A08 | Tarifas | Mínimo 3 km, ejemplo 200 CUP/km, mínimo 600 CUP; excepciones grandes y almacén más lejano conforme reglas aprobadas |
| A09 | Concurrencia | Versionado de cesta/dirección/ruta/almacén; cotización obsoleta invalidada |
| A10 | Fallo de red | Timeout, error controlado, sin pedido ni tarifa falsa |
| A11 | Seguridad | Sin secretos, aislamiento, no acceso entre usuarios; rate limiting |
| A12 | Rollback | Detener OSRM y retirar solo recursos propios, sin tocar otros servicios |
| A13 | Repetibilidad | Recreación desde artefactos versionados y backups con hashes |
| A14 | UI móvil | Distancia y tarifa comprensibles, estados de carga y error, accesibilidad |
| A15 | Operación | Monitoreo, backups, restauración y reinicio comprobados |

**Estado A01–A15: PENDIENTES de ejecución integrada**. Las pruebas unitarias offline de este documento no los satisfacen.

## Reversión estrictamente acotada
- Antes: snapshot/backup **solo del entorno OSRM** y lista de recursos propios.
- El administrador ejecuta `docker compose -p enlace-osrm-lab down` sobre **ese proyecto exclusivamente**, sin `--volumes`, `--remove-orphans` ni comandos `docker system prune`.
- Confirmar ausencia del contenedor y del listener 127.0.0.1:5000; verificar salud de servicios ajenos.
- Mantener `/srv/enlace-osrm/data` para investigación; su eliminación exige autorización específica y comprobación de ruta exacta. No borrar volúmenes ni redes compartidos.
- Revertir reglas de proxy/firewall **solo si fueron creadas para este servicio** y se identifican de forma inequívoca. No cambiar configuración global sin revisión.

## Pruebas offline ejecutadas (Python 3 stdlib)
Se ejecutaron 4 pruebas `unittest` de propiedades de una **configuración representativa en memoria**:
- `test_no_host_mount`: la ruta representativa de volumen pertenece al prefijo propio — PASS.
- `test_limits`: CPU/RAM/PIDs, read-only y no-new-privileges declarados — PASS.
- `test_no_public_port`: publicación representativa comienza en loopback — PASS.
- `test_rollback_scope`: rutas representativas de rollback restringidas al prefijo propio — PASS.

**Resultado: 4/4 PASS**. Limitación explícita: las pruebas no analizan automáticamente la plantilla YAML ni ejercitan Docker, Linux, filesystem, firewall, OSRM o infraestructura; no son prueba de aislamiento efectivo. No se ejecutó `docker compose config` ni se arrancó contenedor.

## Restricciones respetadas
Solo documentación en GitHub y tests offline locales con datos sintéticos. Sin acceso a servidores, cuentas, Supabase, staging o producción; sin descargas de mapas, servicios, pagos, despliegues ni activación manual de GitHub Actions. Un commit podría activar workflows automáticos preexistentes, que no se han comprobado.
