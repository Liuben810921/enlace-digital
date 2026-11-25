# Revisión de roles para reversión Edge — staging

Fecha 2026-11-09. Proyecto `xqahthghvozeigbojhyi`, PR #2. **Solo lectura; no se ejecutó despliegue ni eliminación.**

## Evidencia

- CI del commit `7717a54ed69c1b2743e6a8c9667a66a1445f6701`: run `42705988217`, `completed/success`.
- `list_organizations`: organización `Enlace Digital`, ID `sxzrpkvcoxqsbifombtt`.
- `get_organization`: plan `free`, tier `tier_free`.
- `get_project`: `enlace-digital-staging`, `ACTIVE_HEALTHY`, `us-east-1`, PostgreSQL 17.11.
- Las acciones Supabase disponibles no exponen un método para listar miembros/roles de organización ni comprobar autorización de eliminación de funciones Edge. El acceso de lectura al proyecto no demuestra el permiso de borrado.

## Una comprobación visual pendiente

En Supabase Dashboard de la organización `Enlace Digital`, abrir la sección de **Organization Settings → Team / Members** (el nombre puede variar). Revisar el rol del usuario responsable, sin cambiarlo. Enviar una captura que muestre únicamente el rol y el nombre de la organización, ocultando correos, identificadores personales y datos sensibles. Si la opción no aparece, enviar captura del menú de configuración abierto.

## Límite de la evidencia

El rol de propietario/administrador puede respaldar una expectativa de permiso de gestión, pero no demuestra por sí solo que la eliminación funcione en una función concreta. El comando `supabase functions delete enlace-cliente-auth-staging --project-ref xqahthghvozeigbojhyi` está documentado, pero su ejecución es destructiva y requiere autorización separada. No crear una función para probarlo.

**Conclusión:** permisos de reversión aún no verificados. No autorizar despliegue hasta completar comprobación visual y plan operativo de reversión.
