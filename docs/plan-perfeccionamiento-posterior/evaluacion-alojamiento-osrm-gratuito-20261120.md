# Evaluación de alojamiento OSRM sin costo — 2026-11-20

Repositorio ENLACE DIGITAL, rama `plan/havana-osrm-benchmark-offline-20261114`. Base `dc8727590404adbf64d04c390e358affcd2b4c56`, comparación inicial `identical`. Investigación pública y documental exclusivamente; no se aprovisionó, instaló, ejecutó ni desplegó ningún servicio.

## Premisa

El usuario ya aportó `cuba-261114.osm.pbf` y fue verificado previamente; no repetir descarga. No se ha confirmado que el binario esté físicamente disponible en este entorno actual. **El bloqueo es el procesamiento y alojamiento OSRM**, no la adquisición de cartografía.

## Opciones con referencias oficiales

| Opción | Límites documentados | Juicio técnico |
|---|---|---|
| Oracle Cloud Always Free, Ampere A1 | 2 OCPU, 12 GB RAM en total, 1500 OCPU-h/mes, 9000 GB-h/mes, 200 GB de volumen en bloque total; volumen de arranque mínimo 47 GB; home region; disponibilidad sujeta a capacidad | Candidata principal para pruebas, no garantizada. ARM64 exige binarios/imagen compatibles. Puede recuperar VM inactiva. |
| Oracle Cloud Always Free, E2 Micro | 1 GB RAM por instancia, hasta dos, 1/8 OCPU cada una | No recomendada para preprocesar OSRM. |
| Google Cloud Free Tier | Una e2-micro en regiones US concretas; 30 GB de disco estándar y 1 GB de salida/mes | Muy limitada para extracción/partición de OSRM; RAM insuficiente probable, requiere benchmark. |
| Render Free | 512 MB RAM; se suspende tras 15 min de inactividad; filesystem efímero y sin disco persistente gratis; límites de horas/ancho de banda | Descartada para operación continua con grafo OSRM. |
| Cloudflare Workers Free | 128 MB RAM, 10 ms CPU por petición | No apta para motor OSRM nativo; podría servir como proxy ligero en otro proyecto, no reemplaza servidor. |

Fuentes consultadas:
- https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
- https://www.oracle.com/cloud/free/
- https://docs.cloud.google.com/free/docs/free-cloud-features
- https://render.com/docs/free
- https://render.com/pricing
- https://developers.cloudflare.com/workers/platform/limits/
- https://www.infoq.com/news/2026/07/oracle-cloud-free-tier-limits/

**Advertencia 2026:** referencias antiguas a 4 OCPU y 24 GB para Oracle Always Free A1 están desactualizadas; actualmente 2 OCPU y 12 GB. El tamaño final de grafo, memoria pico, CPU y latencia para Cuba **no se han medido**.

## Solución candidata, condicionada

Proponer una sola VM Oracle A1 Always Free (2 OCPU ARM64, hasta 12 GB RAM) con almacenamiento dentro de la cuota Always Free. Verificar disponibilidad regional, elegibilidad de cuenta, límites de almacenamiento, condiciones de red, transferencia y ausencia de cargos **antes de aprovisionar**. La oferta exige registro y método de pago admitido; no garantizar elegibilidad ni ausencia absoluta de cargos sin configuración y verificación de facturación. Nunca convertir a Pay As You Go por defecto.

Para procesar: validar arquitectura ARM64, versión de OSRM y perfil de conducción, memoria pico y espacio en disco durante `osrm-extract`, `osrm-partition`, `osrm-customize`; preferir MLD para rutas. Medir antes de asumir que 12 GB bastan. Mantener acceso a API OSRM privado o restringido, TLS y límites de peticiones; no publicar servicio sin autorización.

## Criterios de aceptación futuros

1. Confirmar cuenta/región elegibles, capacidad A1 realmente disponible y configuración de gasto sin riesgo.
2. Confirmar archivo PBF verificado disponible en entorno de pruebas, sin subir binario a GitHub.
3. Medir memoria máxima, disco, duración y salida de los tres pasos OSRM en un entorno autorizado.
4. Validar rutas de La Habana (unidireccionales, bahía, puentes, zonas sin conexión) y respuesta NoRoute.
5. Comparar distancia y latencia con umbrales definidos; mantener `ROAD_DATASET_NOT_TRUSTED` hasta pruebas y registro confiable.
6. Evaluar continuidad del servicio y riesgo de recuperación de VM inactiva. No usar OSRM público de demostración para pedidos reales.

## Bloqueantes y permisos

**Bloqueantes:** disponibilidad regional Oracle, elegibilidad y facturación, memoria pico real de OSRM, espacio temporal, disponibilidad actual del PBF en el entorno donde se procesará, fiabilidad y controles de seguridad. **Pendiente:** persistencia compartida insegura y atomicidad entre pestañas.

**Próxima autorización sugerida:** exclusivamente comprobaciones de solo lectura de elegibilidad/capacidad de Oracle y recursos del entorno, sin crear cuenta, introducir tarjeta, aprovisionar VM, instalar software, ejecutar OSRM, transferir archivos ni generar costos. Si no existe cuenta Oracle conectada, requerirá verificación manual del usuario.

No se usaron GitHub Actions, Supabase, staging, producción, pedidos reales, instalaciones, descargas ni despliegues.
