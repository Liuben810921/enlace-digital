# Ensayos offline de límites de memoria y tiempo — 2026-11-15

**Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`  
**Base:** `5ecc0770c0d9c585f45f6a4f96f0058c0e75ed9f`  
**Commit de prueba:** `11e8139b833b3f846f8359cd10a274a42c037e70`

## Implementación

Se añadió `experiments/havana-osrm-portable/test_process_limits.py`. Cinco pruebas utilizan procesos Python hijos con `subprocess.run`, timeout del proceso padre y límite `resource.RLIMIT_AS` de **512 MiB** en el hijo (Linux). El código de la aplicación y el orquestador no se modificaron.

Casos:
1. Corpus sintético válido bajo límite de memoria; aprobación solo para revisión sintética.
2. JSON anidado 500 niveles; rechazo controlado.
3. Entradas de tamaño combinado superior a 4 MB; rechazo.
4. Intento acotado de asignar 768 MiB bajo límite de 512 MiB; `MemoryError` esperado en el proceso hijo.
5. Proceso hijo que duerme 3 segundos; timeout de 0,15 segundos del padre y terminación del hijo.

## Incidencias reproducidas durante el diseño

La primera configuración de 128 MiB, con importación de `unittest` después de aplicar el límite, produjo `MemoryError` al importar bibliotecas y una terminación anormal (señal 11) en una entrada anidada. Una segunda prueba a 128 MiB, importando previamente los módulos, aún mostró fallo por memoria y terminación anormal. Se corrigió **el ensayo**, no el orquestador: importación previa al límite, 512 MiB de espacio de direcciones y anidamiento acotado a 500 niveles. No se atribuye la señal 11 a un fallo del código de negocio ni se considera una garantía de aislamiento universal.

## Regresión observada

Entorno local Python 3.13.5, Linux; directorio con copias exactas del código previamente publicado.

```sh
python -m unittest discover -q
python -O -m unittest discover -q
```

- Python normal: **120 pruebas, OK**.
- Python `-O`: **120 pruebas, OK**.
- 115 pruebas anteriores + 5 de procesos aislados.

## Hashes de la prueba nueva

- SHA-1 Git blob calculado localmente y coincidente con GitHub: `8ef2a6aa15ddf96de5ec23fe118e32b2f83df369`.
- SHA-256 de la copia local exacta: `dbbcf0298c965bcc28091190d60787e413849ecd18b9fa78363370c22ad5e9ba`.

## Alcance y advertencias

`RLIMIT_AS` restringe el espacio virtual de direcciones del hijo, no equivale a un límite de memoria residente ni es portátil a todos los sistemas operativos. El timeout se aplica desde el padre; los ensayos no demuestran una cota universal de CPU, memoria ni latencia para todas las entradas. El caso de 768 MiB comprueba el mecanismo de límite, no el uso normal del validador. La profundidad de JSON no fue sometida a un estrés sin límite para evitar daños al entorno.

No hay cartografía real, OSRM, despliegue, cuentas, servicios activados ni acceso a Supabase, staging o producción. No se dispararon manualmente GitHub Actions ni se incurrió en costos. **`commercial_quote_enabled=false` y `commercial_approval=false`** permanecen obligatorios.
