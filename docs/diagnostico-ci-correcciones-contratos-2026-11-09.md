# Diagnóstico de CI y corrección de contratos RPC — 2026-11-09

## Verificaciones reales
- Se consultaron `fetch_commit_workflow_runs` y `get_commit_combined_status` para commit `412c936` y para `1cb6ed2`: ambas consultas devolvieron listas vacías.
- **Limitación:** el endpoint de runs disponible filtra ejecuciones asociadas a pull requests, por lo que no demuestra que no existan ejecuciones `push` de la rama. No se obtuvo ningún log ni resultado de `deno check`.
- El workflow existe en `.github/workflows/staging-auth-static-check.yml`, se limita a rama aislada y cambios en rutas especificadas; se añadieron aserciones de regresión de JSON de sesión, revocación y dirección. El archivo de workflow no se ha ejecutado de forma confirmada.
- No se dispuso de un runner Deno verificado para comprobar compilación. **TypeScript no aprobado aún**.

## Defectos concretos corregidos en el borrador SQL
1. `ed_cliente_sesion_privada` devolvía `cliente_numero` por `to_jsonb(c)`, pero la Edge Function exige `cliente.numero`. Ahora devuelve `numero` y las claves del perfil explícitas.
2. `ed_cliente_direccion_privada` buscaba `c->>'cliente_numero'`, clave que no existía en el contrato del perfil. Ahora utiliza `c->>'numero'`.
3. `logout` ahora devuelve `{cerrada:true}` al revocar, sin devolver perfil como si siguiera activa.
4. Se ampliaron límites de longitud de dirección y se normalizó separación de nombre por clase POSIX de espacios.
5. El workflow ahora exige estáticamente esas invariantes para evitar regresiones.

## Bloqueos aún vigentes
- La migración SQL sigue siendo **borrador NO EJECUTABLE**. Falta secuencia de clientes, extensiones bcrypt, revisión de grants de esquemas, consistencia de la propuesta de tablas, política de conservación histórica y pruebas transaccionales.
- El workflow usa `deno check` con dependencia remota `esm.sh`; esto no accede a Supabase ni contiene secretos, pero sí puede requerir red para descargar el módulo. Se debe verificar que Actions está habilitado y la rama/workflow son elegibles. Un PR **borrador** separado contra `main` permitiría disparar `pull_request` si se añade ese evento; requiere decisión del usuario. Alternativamente ejecutar `deno check` en un runner local autorizado.
- El código de staging todavía no está desplegado ni habilitado. No se ha modificado Supabase.

## Siguiente comprobación recomendada
Verificar desde la pestaña Actions si el workflow de la rama aparece y tiene un run `push`; si no, preparar activación vía PR draft y evento `pull_request`, sin fusionar, o un runner local Deno. Registrar log real antes de afirmar compilación exitosa.
