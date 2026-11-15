# Auditoría documental de Oracle Cloud Always Free para ENLACE DIGITAL — NO-GO por elegibilidad

Fecha: 2026-11-15. Base: `7ab1427a8416ce659c7194653b2df08dd8d0e0e6`. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Alcance: fuentes públicas oficiales, sin cuentas ni recursos.

## Hallazgo prioritario y corrección de clasificación
**NO-GO / DESCARTADA bajo política publicada.** La política oficial Oracle Global Trade Compliance prohíbe exportación, reexportación, transferencia y acceso (incluido acceso cloud) a cualquier **empresa o nacional de Cuba**, además de prohibir transferencias indirectas. Para ENLACE DIGITAL, empresa cubana que operaría el sistema en Cuba, esto es un bloqueo de elegibilidad previo a cualquier consideración de cuotas, capacidad o costo. No se debe registrar una cuenta mediante terceros o socios extranjeros como vía de elusión. Cualquier excepción requeriría confirmación jurídica y autorización escrita válida de Oracle y autoridades competentes, sin presumir que esté disponible.

Fuente oficial: https://www.oracle.com/corporate/security-practices/corporate/governance/global-trade-compliance/ ; versión española https://www.oracle.com/latam/corporate/security-practices/corporate/governance/global-trade-compliance/ .

**Corrige la conclusión provisional anterior** de `docs/havana-osrm-official-free-hosting-providers-20261115.md`, que calificaba Oracle «viable condicionada». Esta nueva auditoría prevalece para el caso ENLACE DIGITAL. No se alteró el informe histórico.

## Matriz de hallazgos oficiales
| Tema | Condición documentada | Consecuencia para OSRM |
|---|---|---|
| **Restricciones Cuba** | Oracle prohíbe sus servicios cloud a empresas/nacionales cubanos y acceso/transferencia directa o indirecta | **BLOQUEANTE definitivo para el plan actual**; no abrir cuenta ni desplegar |
| Transferencia saliente | Página pública Oracle Cloud Regions menciona **10 TB outbound/mes** incluidos en Free Tier; verificar servicio, condiciones de red y cambios antes de estimar costos | Referencia teórica, **no habilita uso** |
| Compute ARM | Página técnica Always Free: 1.500 OCPU-h + 9.000 GB-h/mes, equivalente a 2 OCPU y 12 GB RAM para tenancy Always Free | Recurso publicado, **no benchmark OSRM ni disponibilidad garantizada** |
| Almacenamiento | Página Free Tier: hasta 200 GB en 2 volúmenes de bloque, con 5 backups según producto | Boot y block comparten cuota; sin dimensionamiento OSRM |
| Inactividad VM | Oracle puede recuperar instancias Always Free inactivas; durante 7 días CPU p95 <20 %, red <20 % y RAM <20 % (esta última para A1) | No hay garantía de continuidad 24/7 |
| Cuenta inactiva | FAQ: cuentas sin actividad durante 30 días o más pueden considerarse abandonadas; otra página habla de 60 días para cuentas activas. **Documentación con umbrales diferentes** | No asumir SLA ni continuidad; confirmar condiciones contractuales si alguna vez aplicase |
| Región de origen | Compute Always Free solo en home region; se elige al alta y no se cambia después; capacidad A1 puede agotarse | Riesgo de imposibilidad de aprovisionar y residencia |
| Registro | Datos reales, correo, teléfono, dirección y tarjeta admitida; retención temporal de autorización; una cuenta por persona | No registrar ni proporcionar datos de socios para sortear restricciones |
| Prueba y cobros | Trial $300/30 días; Always Free puede continuar sin actualizar; Pay As You Go factura exceso. Recursos de prueba no gratuitos pueden eliminarse al expirar | No usar prueba promocional como promesa de servicio gratis |
| Prevención de cobros | Budgets son **soft limits**, con alertas evaluadas cada 24 horas; compartment quotas restringen cantidades, pero no equivalen a garantía universal de $0 | **NO-GO** si existe ruta a cargos sin tope duro y aprobación |
| Privacidad | DPA y documentos de residencia exigen revisar región, acceso del proveedor, logs, retención, subprocesadores y protección de datos | No cargar direcciones reales ni datos de clientes; la elegibilidad bloquea antes |
| Soporte | Solo Always Free no tiene Oracle Support; comunidad y foros | Riesgo de continuidad y respuesta a incidentes |

## Fuentes oficiales contrastadas
1. Prohibiciones geográficas y nacionales: https://www.oracle.com/corporate/security-practices/corporate/governance/global-trade-compliance/
2. Always Free Compute, inactividad, cuotas, storage: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
3. Transferencia 10 TB y volúmenes: https://www.oracle.com/cloud/public-cloud-regions/
4. Requisitos de registro: https://docs.oracle.com/en-us/iaas/Content/GSG/Tasks/signingup_topic-Sign_Up_for_Free_Oracle_Cloud_Promotion.htm
5. FAQ, tarjeta, abandono, disponibilidad y soporte: https://www.oracle.com/cloud/free/faq/
6. Home region, trial y transición: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm
7. Inactividad de cuenta y expiración: https://docs.oracle.com/en-us/iaas/Content/GSG/Tasks/signingup_topic-What_Happens_When_the_Promotion_Expires.htm
8. Presupuestos no bloqueantes: https://docs.oracle.com/en-us/iaas/Content/Billing/Concepts/budgetsoverview.htm
9. Privacidad y tratamiento de datos: https://www.oracle.com/contracts/docs/cloud-dpa-2625278.pdf
10. Transparencia regional: https://www.oracle.com/it/a/ocom/docs/corporate/oci-gdpr-updated.pdf

## Dictamen y acciones seguras
1. **DESCARTAR Oracle Cloud** para ENLACE DIGITAL bajo la política oficial vigente. No intentar registrar cuentas de terceros ni alterar identidad, ubicación o beneficiario para sortear restricciones.
2. Priorizar **hardware local existente**, siempre sujeto a inventario, costos reales, fiabilidad y derechos de uso de software/datos; tampoco se presume aprobado.
3. Para otros proveedores, incluir **elegibilidad de empresas cubanas, nacionalidad, destino del servicio y sanciones/exportación como filtro P0**, **antes** de comparar RAM, disco y precios.
4. Mantener el mapa real, OSRM operativo y cotización comercial en NO-GO. La auditoría no demuestra que exista proveedor alternativo elegible o gratuito.
5. Si se pretende reconsiderar Oracle, obtener primero una determinación jurídica aplicable y confirmación escrita expresa de Oracle; no inferir excepciones.

## Restricciones respetadas
Solo consultas de páginas públicas y escritura de documento en rama aislada. No se crearon cuentas ni servicios, no se descargó cartografía, no se ejecutó OSRM, no se despacharon GitHub Actions, no se accedió a Supabase/staging/producción y no se contrataron ni generaron costos. No se verificó si un commit activó automáticamente workflows; no se afirma su inexistencia.
