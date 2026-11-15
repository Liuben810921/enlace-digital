# Auditoría autónoma de workflow y propuesta de protección — 2026-11-15

**Repositorio:** Liuben810921/enlace-digital  
**Rama de documentación:** plan/havana-osrm-benchmark-offline-20261114  
**Commit base:** 4efec5dada32b0389d4d8b5aabfad4f91e7c5947  
**Alcance:** lectura de archivos de GitHub y evidencias visuales facilitadas por el propietario; ninguna configuración ni workflow modificado.

## Configuración administrativa confirmada por capturas

- Actions permissions: **Allow all actions and reusable workflows** seleccionado.
- Require actions to be pinned to a full-length commit SHA: **desmarcado**.
- Workflow permissions: **Read repository contents and packages permissions** seleccionado como valor predeterminado.
- Allow GitHub Actions to create and approve pull requests: **desmarcado**.
- Settings → Branches: sin reglas clásicas listadas.
- Settings → Rulesets: «You haven't created any rulesets».
- La ausencia de reglas locales no descarta restricciones heredadas o controles de otros niveles; el repositorio pertenece a una cuenta de usuario y la captura muestra las reglas de repositorio disponibles.

## Workflow inspeccionado por contenido real

Archivo `.github/workflows/verify-storefront.yml`, Git blob **bc9bafc9247fb0387f17aae9221e12d6743990a7**, recuperado en **main** y en el commit base de la rama aislada: contenido coincidente (11 073 caracteres).

| Control | Observación |
|---|---|
| Triggers | `push` a `main` con filtros de rutas y `pull_request` con filtros de rutas; el PR no tiene filtro de rama explícito |
| Jobs | `syntax` y `gmail_diagnostic` |
| Runner | `ubuntu-latest` (etiqueta móvil) |
| Acciones externas | `actions/checkout@v4` y `actions/setup-node@v4`; sin SHA completos |
| Permisos declarados en YAML | No hay bloque `permissions:` explícito; aplica configuración predeterminada del repositorio salvo otros factores |
| Concurrencia | No se declara `concurrency` |
| Tiempo | `gmail_diagnostic` declara `timeout-minutes: 2`; `syntax` no declara límite propio |
| Comprobaciones locales | Sintaxis JavaScript embebido, salvaguardas de checkout y pruebas simuladas `tests/customer-order-flow.cjs` |
| Servicios externos | `syntax` hace tres solicitudes HTTP POST a una Edge Function de Supabase; **no es offline** |
| Secretos | `gmail_diagnostic` referencia `secrets.SUPABASE_SERVICE_ROLE_KEY`; no se ha consultado su valor ni su disponibilidad |
| Diagnóstico Gmail | Solo en push; si la clave está presente, hace llamadas a función externa para estado, conectividad y pruebas secas; **no ejecutado** |
| Escritura | No se observó paso GitHub de escritura en el workflow leído, pero la lectura no prueba ausencia de efectos de servicios remotos |

**Riesgo prioritario:** el workflow existente NO debe utilizarse como puerta de pruebas offline aisladas ni reejecutarse para esta auditoría, porque contiene llamadas externas a Supabase. No se realizaron esas llamadas.

## Alcance y limitación de inventario

El conector disponible permite recuperar archivos concretos y commits, pero no ofrece una operación de listado de directorio/árbol en esta sesión. Se identificó `verify-storefront.yml` mediante un commit histórico y se inspeccionó su contenido actual en dos referencias. **No se certifica que sea el único workflow existente**. Antes de aplicar una política global de SHA, se necesita inventario exhaustivo de `.github/workflows/` y sus acciones; imponerla sin ello podría interrumpir otros workflows. No se adivinaron nombres de archivos ni se afirmó una auditoría exhaustiva.

## Propuesta de protección de ramas (NO APLICADA)

**`main`:** crear, después de revisión de compatibilidad y autorización, un ruleset específico de rama que impida eliminación y force-push; exija PR antes de merge, al menos una aprobación de revisor independiente cuando haya colaboradores, y verificación de checks *estables* realmente disponibles. No activar checks requeridos sin identificar nombres exactos, estados actuales y disponibilidad de runners, para evitar bloqueos. Revisar explícitamente excepciones/bypass de propietario, administrador y automatizaciones. En un repositorio público personal, verificar antes si el plan permite aplicar las reglas elegidas.

**`plan/havana-osrm-benchmark-offline-20261114`:** considerar protección contra borrado y force-push; evitar exigir aprobación externa o checks no existentes que impidan continuar los commits documentales. Mantener separación de `main` y no convertir esta rama en destino de despliegues.

**Actions:** conservar permisos predeterminados de solo lectura y deshabilitada la creación/aprobación de PR por Actions; para futuros workflows sintéticos declarar `permissions: contents: read` y evitar secretos y red. Evaluar una política de acciones permitidas o SHA completo **solo después** de inventariar todos los workflows, fijar las referencias y verificar la compatibilidad. El workflow existente usa etiquetas móviles y necesita adaptación previa.

## Orden recomendado para autorización futura

1. Inventariar todos los YAML bajo `.github/workflows/` por un mecanismo de lectura autorizado.
2. Clasificar jobs con acceso a red, secretos, producción/staging y efectos laterales.
3. Diseñar ajustes de protección sin imponer checks inexistentes; comprobar disponibilidad de rulesets en el plan.
4. Presentar al propietario una única propuesta de cambios con reversión y autorización independiente.
5. Solo entonces, en una fase posterior autorizada, modificar configuraciones. **Esta auditoría no concede autorización de cambios.**

## Resultado

Sin cambios de configuración, sin nuevos workflows, sin ejecuciones de Actions, sin costos generados, sin consultas a Supabase, staging ni producción. No se descargó cartografía ni se ejecutó OSRM. Los resultados de 120 pruebas offline de etapas previas no se repitieron en esta fase de lectura.

**Bloqueante:** inventario completo de workflows no disponible con las operaciones de listado expuestas por el conector actual. La auditoría del archivo recuperado es real, pero parcial.
