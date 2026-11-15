# VPS gratuitos para OSRM: registro personal y uso comercial — 2026-11-15

Rama: `plan/havana-osrm-benchmark-offline-20261114`. Base `e831736c65160cfb98395eb36985fb822eda86c6`.

## Criterios actualizados
Admitir registro a título personal sin certificación empresarial cubana. No exigir al proveedor documentación empresarial si sus términos no la requieren. No falsear país, residencia, titularidad, uso ni utilizar VPN para eludir restricciones. Distinguir uso comercial permitido, ausencia de prohibición expresa y autorización contractual/territorial confirmada. Una oferta no es un servicio entregado.

## Resultados de revisión pública (fuentes del proveedor)
| Proveedor | Oferta publicada | Registro personal | Comercial | Permanencia | Cuba | Decisión |
|---|---|---|---|---|---|---|
| Verta Cloud | Linux 2 vCPU, 4 GB RAM, 50 GB HDD, 100 Mbit/s, sin tarjeta | No se pudo confirmar procedimiento | No confirmado | No confirmado | No confirmado | **Priorizar investigación, NO-GO operativo** |
| VPSFree.io | 1 vCPU compartido, 192 MB RAM, 3 GB NVMe, 10 días renovables | Correo y contraseña, sin KYC ni tarjeta | AUP no contiene prohibición comercial general; sí prohíbe reventa y abuso | Renovación obligatoria, sin SLA ni backups | Excluye algunos países sin listarlos y prohíbe eludir restricciones | **NO-GO recursos/continuidad** |
| FreeVPS.org | 1 núcleo compartido, 1 GB RAM (hasta 2 GB), 20 GB disco (hasta 40 GB) | Cuenta comunitaria previa con 3 meses, 50 publicaciones y 25 agradecimientos | Prohíbe reventa/redistribución comercial de instancias; uso de una aplicación comercial no aclarado | Sin SLA ni garantía de término fijo | No confirmado; depende de AUP de patrocinadores | **NO-GO operativo** |
| Fondation Simafri | 2 vCPU, 4 GB RAM, 50 GB, proyecto open-source activo | Solicita mantenedor y repositorio | Oferta comercial excluida | Mientras proyecto activo, condiciones | No confirmado | **NO-GO comercial** |
| Oracle Always Free | Recursos gratuitos permanentes según cuotas | Cuenta individual, tarjeta válida y datos reales | Cloud para empresas/startups en general | Instancias ociosas y capacidad sujetos a reglas | Restricciones de cumplimiento comercial no resueltas para entidad cubana | **NO-GO hasta autorización** |

### Fuentes oficiales
- Verta: https://portal.vertacloud.biz/index.php?rp=%2Fstore%2Ffree-vps
- VPSFree.io: https://vpsfree.io/ ; https://vpsfree.io/terms ; https://vpsfree.io/acceptable-use
- FreeVPS.org: https://www.freevps.org/
- Simafri: https://www.simafri.com/uk/free-vps-for-open-source-projects/
- Oracle: https://www.oracle.com/cloud/free/faq/ ; https://www.oracle.com/corporate/security-practices/corporate/governance/global-trade-compliance/

## Observaciones de fiabilidad
VPSFree.io publica términos con marcadores sin completar (`[LEGAL ENTITY NAME]`, `[X days]`, `[16/18]`), lo que reduce confianza en la precisión contractual. FreeVPS.org depende de donaciones y no ofrece SLA. Verta anuncia prestaciones atractivas pero no se recuperaron condiciones de continuidad y elegibilidad; no atribuirle un permiso comercial no comprobado.

## Puertas para aprobar Verta
1. Términos/AUP accesibles y fechados: uso comercial de una API de rutas, restricciones de Cuba y residencia, prohibiciones de reventa.
2. Confirmar duración sin pago, renovación, suspensión, backups, almacenamiento persistente, acceso root/Docker y límites de CPU/red.
3. Confirmar registro personal permitido sin tarjeta ni documentación de empresa; verificar titular y jurisdicción.
4. Solo con autorización posterior, aprovisionamiento real y pruebas de RAM, CPU, disco, conectividad y OSRM con cartografía autorizada.

**No hay proveedor aprobado.** `commercialQuoteEnabled=false`. No se crearon cuentas, descargó cartografía, ejecutó OSRM, activó manualmente GitHub Actions, generaron costos ni se accedió a Supabase/staging/producción. El estado de workflows automáticos no se comprobó.
