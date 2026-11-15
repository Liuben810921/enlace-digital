# Revisión previa de CI cartográfico: no activar

Archivo: `.github/workflows/havana-manifest-offline-preparation.yml`.

## Estado y controles
- `on: {}`: sin triggers de push, PR, schedule o dispatch. `if: ${{ false }}`: defensa adicional para no ejecutar el job.
- Runner estándar `ubuntu-24.04`, sin servicios, contenedores, paquetes, actions/checkout, cachés, upload-artifact, secretos ni permisos de escritura.
- Los tres flags de habilitación siguen en falso. El único paso es un bloqueo explícito con `exit 1`; no se ejecutará mientras el job esté deshabilitado.
- La creación del archivo **no inicia este workflow**, pero no constituye evidencia de que otros workflows ajenos no se activen por eventos de push. En la rama actual, los cinco YAML revisados limitan sus pushes a otras ramas o a main, según lectura del 14 de noviembre; podrían existir cambios futuros.
- No se han ejecutado pruebas CI ni servicios. No se ha descargado cartografía ni utilizado Supabase.

## Límite técnico importante
Un runner GitHub-hosted empieza sin los archivos del repositorio. Para correr `node tests/havana-offline-cartography-manifest-isolated.test.cjs` se necesita adquirir los archivos, normalmente mediante `actions/checkout`, que hace operaciones de red. Por ello no se puede afirmar **red cero desde el inicio del job** y al mismo tiempo ejecutar pruebas del código del repositorio en un runner nuevo sin un mecanismo de suministro de código previamente autorizado.

## Costos y autorización pendiente
- GitHub documenta que runners estándar son gratuitos para repositorios públicos, sujeto a condiciones de producto; no se ha verificado facturación particular de la cuenta ni ausencia absoluta de gastos en el entorno futuro.
- Un workflow que no se ejecuta no consume minutos de runner por sí mismo. La creación de un commit no certifica costo cero global.
- Antes de activar: aprobar separadamente el suministro de código (checkout restringido o paquete previamente auditado), pin de acciones por SHA, runner estándar, permisos mínimos, sin instalación ni servicios, límites de tiempo, y revisión de billing. Si se exige red literalmente cero durante toda la ejecución, mantener CI GitHub-hosted bloqueado y usar pruebas locales con archivos ya presentes.
- Activación exige otra autorización expresa. No habilitar por defecto ni disparar CI en este paso.
