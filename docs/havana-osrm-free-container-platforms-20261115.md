# Auditoría de plataformas gratuitas de contenedores para OSRM — 2026-11-15

Base: `29b005ae5b63dbd78b41af6811861a4c5e23d956`. Rama: `plan/havana-osrm-benchmark-offline-20261114`.

## Criterios
Registro personal sin certificación de empresa cubana; permiso comercial; elegibilidad territorial; servicio persistente; almacenamiento para grafo OSRM; recursos y cuotas suficientes; sin costos ni tarjetas obligatorios; política de suspensión y exportación. **No se ha medido aún el grafo vial de La Habana**; por tanto no se puede declarar una cifra mínima de RAM/disco demostrada. Proveedor no aprobado si alguno de los criterios esenciales no está verificado.

## Hallazgos documentales oficiales
| Plataforma | Oferta publicada | Persistencia/suspensión | Comercial/Cuba | Dictamen |
|---|---|---|---|---|
| Koyeb Free Instance | 512 MB RAM, 0,1 vCPU, 2 GB SSD, una instancia | Sin volúmenes persistentes; escala a cero tras 1 hora inactiva; la documentación desaconseja producción | Sin confirmación de elegibilidad Cuba ni autorización comercial específica en lo consultado | NO-GO por persistencia y producción |
| Render Free Web Service | 750 horas de instancia por mes, disco efímero | Suspensión tras 15 minutos sin tráfico, pérdida de cambios al reinicio, discos persistentes solo pagos; PostgreSQL gratis expira en 30 días | Sin confirmación Cuba | NO-GO |
| Hostless Free | 0,5 vCPU, 1 GB RAM y 512 MB almacenamiento compartido; Dockerfile, sin tarjeta y sin sleep según proveedor | Anuncia funcionamiento permanente, pero límite de almacenamiento compartido y cargos por uso excedente; no hay benchmark OSRM ni prueba de aprovisionamiento | Sin términos de elegibilidad cubana/comercial confirmados | INVESTIGAR, NO-GO operativo |
| Northflank | La página oficial actual muestra 1 vCPU/2 GB por USD 24/mes y disco persistente tarifado | No se pudo confirmar una oferta permanente sin costo suficiente para OSRM | Sin confirmación Cuba | NO-GO sin nueva evidencia |
| SnapDeploy | Comparativa externa cita 512 MB RAM, 0,25 vCPU y 100 horas/mes | No es servicio permanente 24/7; suspensión | No confirmados | NO-GO por horas/recursos |

### Fuentes
- Koyeb: https://www.koyeb.com/docs/reference/instances
- Render: https://render.com/docs/free (también accesible en https://render-www.onrender.com/docs/free )
- Hostless: https://web.hostless.cloud/
- Northflank: https://northflank.com/pricing
- SnapDeploy (comparativa, **no fuente primaria**): https://somdip.dev/free-container-hosting

## Precisión técnica
Que un contenedor permita Dockerfile no garantiza que pueda preprocesar un PBF ni mantener un grafo MLD. Si el grafo se empaqueta dentro de una imagen, el almacenamiento efímero podría ser tolerable en un entorno experimental, pero no se ha comprobado tamaño de imagen, tiempos de arranque, RAM, límites de despliegue, recuperación ni disponibilidad; no es motivo para aprobar Render/Koyeb. Diferenciar persistencia de archivos de servicio siempre activo. El cotizador debe fallar cerrado cuando no hay distancia vial fiable.

## Resultado
No se encontró una plataforma gratuita permanente, con capacidad OSRM y permiso contractual para operación comercial cubana, **comprobada**. Hostless es el único candidato nuevo para diligencia adicional; su oferta no es un servicio provisionado ni una prueba de capacidad. Verta Cloud mantiene bloqueantes de credibilidad y términos. `commercialQuoteEnabled=false`.

No se crearon cuentas, contactó a proveedores, descargó cartografía, ejecutó OSRM, activó manualmente GitHub Actions, generaron costos ni accedió a Supabase, staging o producción. Un commit puede activar workflows preexistentes, no comprobados.
