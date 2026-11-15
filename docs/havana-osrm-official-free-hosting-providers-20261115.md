# Evaluación documental de alojamiento gratuito para OSRM La Habana

Fecha: 2026-11-15. Base: `1a482f615c069f3600c32337f1b4900bab8724c6`. Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`.

## Alcance y evidencia
Se leyó el documento base `docs/havana-osrm-local-inventory-free-hosting-evaluation-20261115.md` en GitHub (blob `64b43dad11ed9ca717d997cf7a80d00140518564`). Se consultaron exclusivamente páginas oficiales públicas de cuatro proveedores. **No se creó ninguna cuenta ni servicio**. Las cifras son límites publicados, no recursos asignados ni pruebas de OSRM. El hardware y la carga real de La Habana siguen sin medirse. No se presume costo cero.

## Matriz comparativa — fuente primaria y clasificación
| Proveedor | RAM/CPU del nivel gratuito | Disco y persistencia | Tráfico, suspensión, facturación | Privacidad y condiciones por validar | Decisión documental |
|---|---|---|---|---|---|
| **Oracle Cloud Infrastructure Always Free, Ampere A1** | 1.500 OCPU-h/mes + 9.000 GB-h/mes, equivalente en cuenta Always Free a **2 OCPU + 12 GB RAM**; ARM, sujeto a capacidad en región de origen | **200 GB** totales de volúmenes boot+block en región de origen, incluidos volúmenes de arranque; 5 copias de volúmenes incluidas | Capacidad regional puede agotarse; instancias inactivas pueden recuperarse; excedentes o recursos fuera de región de origen pueden generar cobros en cuentas de pago; revisar transferencia saliente exacta antes de usar | Alta suele requerir teléfono y tarjeta; residencia de datos, retención, acceso, uso comercial, cifrado y condiciones aplicables a clientes cubanos pendientes | **VIABLE CONDICIONADA solo para piloto futuro**, no apta aún para operación |
| **Render Free web service** | **512 MB RAM**, CPU compartida inferior a 1 CPU (no se cuantifica fracción fija en la ficha consultada) | Sistema de archivos **efímero**; disco persistente no disponible en web Free | Se suspende tras **15 min** inactivo; reinicio ~1 min; **750 horas/mes** por workspace; exceso de transferencia puede facturarse si hay método de pago, o suspender servicios si no lo hay | Servicios Free no recomendados por proveedor para producción; revisar logs, región y tratamiento de direcciones | **DESCARTADA** para servicio persistente actual |
| **Koyeb Free Instance** | **512 MB RAM, 0,1 vCPU** | **2 GB SSD efímeros**, sin volúmenes persistentes en Free | Escala a cero tras **1 h** inactiva; una instancia gratuita por organización; FAQ dice que el servicio Free no genera cargos, pero otros servicios sí pueden hacerlo | Solo Frankfurt/Washington DC en ficha; revisar jurisdicción, privacidad, logs, uso comercial y límites de tráfico | **DESCARTADA** para servicio persistente actual |
| **Google Cloud Run free allowance** | No VM gratuita dedicada: en facturación por solicitud se publican **180.000 vCPU-s + 360.000 GiB-s y 2 millones solicitudes/mes** en nivel gratuito; instancia configurable hasta 32 GiB RAM, con facturación según uso | Sistema de archivos de contenedor en memoria y **no persistente**; almacenamiento externo añade dependencias/costos | Escala y factura por consumo; excedentes facturables; modalidad por instancia y almacenamiento externo requieren evaluación separada | Revisar IAM, TLS, residencia, logs, almacenamiento externo y condiciones de facturación; techo efectivo y costos no demostrados | **NO EVALUABLE** para arquitectura sin estado alternativa; **NO-GO** para OSRM persistente actual |

**Aclaración:** «descartada» significa que el nivel gratuito concreto no satisface el requisito de persistencia/disponibilidad actual; no que el proveedor carezca de planes de pago técnicamente válidos. «Viable condicionada» significa elegible para análisis futuro, no que OSRM haya sido instalado o medido.

## Fuentes oficiales consultadas
1. Oracle Always Free (recursos, almacenamiento, límites y disponibilidad): https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
2. Oracle Free Tier (tarjeta, región y cambio a cuenta de pago): https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm
3. Render Free (suspensión, persistencia, horas, transferencia y producción): https://render.com/docs/free
4. Render precios (512 MB RAM): https://render.com/pricing
5. Koyeb tipos de instancia: https://www.koyeb.com/docs/reference/instances
6. Koyeb almacenamiento efímero: https://www.koyeb.com/docs/reference/storage
7. Koyeb precios FAQ: https://www.koyeb.com/docs/faqs/pricing
8. Google Cloud Run precios: https://cloud.google.com/run/pricing
9. Google Cloud Run contrato de contenedores: https://docs.cloud.google.com/run/docs/container-contract
10. Google Cloud Run facturación: https://docs.cloud.google.com/run/docs/configuring/billing-settings

Fecha de consulta de fuentes públicas: 2026-11-15. Las condiciones pueden cambiar. No se han verificado cuentas, regiones concretas disponibles, términos particulares de jurisdicción o requisitos de residencia de datos.

## Puertas de NO-GO verificables
1. **Sin benchmark** del mismo PBF, perfil OSRM, versión, concurrencia y límites: NO-GO, incluso para Oracle.
2. **Sin persistencia de dataset** o recuperación confiable después de reinicios: NO-GO para el diseño actual.
3. **Sleep, reclaim o interrupciones** incompatibles con checkout: NO-GO operativo. En Oracle, comprobar específicamente recuperación de instancias inactivas y disponibilidad A1 antes de depender de ella.
4. **Facturación sin barrera rígida** o riesgo de uso de recursos fuera de cuotas gratuitas: NO-GO hasta aprobación financiera explícita. Alertas no sustituyen límites duros.
5. **Privacidad**: sin decisión de región, retención de logs, controles de acceso, cifrado y tratamiento de direcciones de clientes: NO-GO para datos reales.
6. **Legal**: sin revisar licencia ODbL, atribución, términos de uso comercial y restricciones geográficas aplicables: NO-GO.
7. **Tráfico**: sin estimación de egress y límites/condiciones del proveedor: NO-GO.
8. **Capacidad**: RAM/CPU/disco declarados no prueban aptitud; solo mediciones aisladas autorizadas permitirán evaluarla.

## Próximos pasos autorizables por separado
- Documentar inventario del equipo local sin acceder a él remotamente.
- Contrastar los límites de transferencia y términos de privacidad/jurisdicción de Oracle mediante documentación oficial, sin alta de cuenta.
- Comparar escenario local frente a Oracle con fórmulas de costos, sin fijar precios inexistentes.
- Pedir autorizaciones independientes antes de crear cuentas, descargar PBF, ejecutar OSRM, activar servicios o generar cualquier costo.

## Restricciones y estado
Se realizaron consultas a páginas oficiales públicas y escritura documental en GitHub en rama aislada. **No se crearon cuentas ni servicios, no se descargó cartografía, no se ejecutó OSRM, no se activaron manualmente GitHub Actions, no se accedió a Supabase/staging/producción y no se generaron costos.** No se verificó el estado de ejecución automática de workflows; este documento no afirma que GitHub no haya iniciado alguno como consecuencia de un commit. Estado operativo: **NO-GO**.
