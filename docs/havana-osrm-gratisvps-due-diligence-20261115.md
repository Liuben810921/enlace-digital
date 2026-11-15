# Auditoría de GratisVPS para OSRM — 2026-11-15

**Rama aislada:** plan/havana-osrm-benchmark-offline-20261114. **Base conocida:** a873e48846e3e4ec26422dedfdc39506d7aebcd6.

## Dictamen
**NO-GO para mensajerías comerciales de ENLACE DIGITAL**. La página publicitaria anuncia VPS gratuito de 2 vCPU, 2 GB RAM, KVM, NVMe, SSH root y Docker, pero no publica capacidad exacta de disco ni demuestra aprovisionamiento, continuidad o elegibilidad para una empresa cubana. Los términos oficiales clasifican el servicio como beta/as-is, permiten suspensión o cancelación sin aviso y no incluyen backups ni garantía de disponibilidad. No se crearon cuentas ni se probaron servidores.

## Evidencias primarias
1. Oferta https://gratisvps.net/ : $0/mes, 2 vCPU, 2 GB RAM, NVMe sin tamaño, puerto compartido 100 Mbps, IPv4 compartida, IPv6 dedicada, Docker/SSH root, regiones EE.UU., Alemania y Singapur; sin tarjeta, sin backups en Free. La portada indica sin vencimiento fijo pero no garantía de continuidad.
2. Términos https://gratisvps.net/terms.html (modificados 2026-04-24): beta para pruebas/desarrollo; facultad de modificar/suspender/terminar sin aviso ni responsabilidad; sin alta disponibilidad, backups o garantía de seguridad/continuidad. Ley Seychelles; limitación de responsabilidad declarada $0. No sustituye análisis legal.
3. Avisos https://gratisvps.net/manage/announcements/3 : prohíben VPN/proxy durante registro; correo real y verificación obligatoria. El propio aviso habla de «free trial», inconsistente con «no expiring trial» de la portada.
4. No se encontró permiso contractual explícito para beneficiario cubano ni capacidad exacta del disco gratuito.

## Evidencias secundarias (no son pruebas concluyentes)
- Trustpilot https://www.trustpilot.com/review/gratisvps.net : 1.8/5, 18 reseñas consultadas; 94% una estrella. Denuncias de activación fallida, redirecciones y soporte insuficiente; muestra autoseleccionada.
- Reddit https://www.reddit.com/r/VPS/comments/1p8lujh/looking_for_some_insight_as_far_as_gratisvps_goes/ : testimonios de servidor anunciado sin IP y ausencia de respuesta. Alegaciones de fraude no verificadas; no afirmar fraude como hecho.
- https://geekchamp.com/gratisvps-review-is-its-free-vps-reliable-or-safe-to-use/ : revisión independiente advierte contradicciones en duración, recursos y entrega.

## Matriz
| Control | Estado |
|---|---|
| Precio mensual anunciado cero | Declarado, no comprobado |
| 2 GB RAM y Docker | Declarado, no probado |
| Disco >=20 GB | NO VERIFICADO |
| OSRM real La Habana | NO PROBADO |
| VPS efectivamente entregable | NO VERIFICADO |
| Alta disponibilidad/retención | NO-GO: términos excluyen garantías |
| Empresa cubana y uso comercial | NO VERIFICADO |
| Backups | NO INCLUIDOS |
| Seguridad y privacidad | No auditadas |
| Aceptación A01–A15 mensajerías | PENDIENTE |

## Decisión y siguiente trabajo
No registrar ni entregar datos de la empresa; no introducir credenciales, clientes, mapas ni pagos. Mantener la arquitectura OSRM portable y preparar benchmark de grafo de La Habana en entorno offline autorizado. Buscar proveedor gratuito que documente explícitamente disco, retención, uso comercial y elegibilidad cubana; no asumir que la ausencia de prohibición equivale a permiso. Mantener commercialQuoteEnabled=false.

## Alcance de la auditoría
Solo investigación pública y escritura documental en GitHub. Sin creación de cuentas, contratación, servidores, descarga de cartografía, ejecución OSRM, activación manual de GitHub Actions ni acceso a Supabase/staging/producción. No se ha comprobado si un commit desencadena workflows automáticos.
