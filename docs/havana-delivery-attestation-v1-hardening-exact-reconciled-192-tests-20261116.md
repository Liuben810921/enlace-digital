# Reconciliación exacta de atestación v1 endurecida — 2026-11-16

**Base:** `756a9119e70c653687bfc8571f32d3ce330834e0`. **Rama:** `plan/havana-osrm-benchmark-offline-20261114`.

## Hallazgo y corrección

Se recuperó de GitHub el archivo `experiments/havana-osrm-portable/test_pg_attestation_v1_hardened.py` del commit base. El contenido remoto contiene **5596 caracteres Unicode** y, al codificarlo en UTF-8, **5601 bytes**. El original local tenía **5597 caracteres y 5602 bytes**.

La única diferencia reproducida mediante `diff -u` es la prueba `test_17_unpaired_surrogate`: el original local contiene el literal de fuente `'\\\\ud800'` (dos barras invertidas), mientras que el archivo publicado contiene `'\\ud800'` (una barra invertida). Tres caracteres Unicode multibyte explican por qué la diferencia entre caracteres y bytes es de cinco unidades; la diferencia entre archivos es **un byte**, no seis.

Se reconstruyó el archivo remoto exacto en `/mnt/data/ed_acceptance/test_pg_attestation_v1_remote_exact.py` y se copió a `test_pg_attestation_v1_hardened.py` para repetir las pruebas. No se modificó GitHub ni el validador.

## Cotejo de identidad

- Git blob remoto (GitHub): **`f08556085282492b11c35ec9bf6e5e02725d70e4`**.
- Git blob local (`git hash-object test_pg_attestation_v1_hardened.py`): **`f08556085282492b11c35ec9bf6e5e02725d70e4`**.
- SHA-256 local sobre los bytes remotos reconstruidos: **`b399e7bad576372adb20fd6fec6298cf65d6a0f042d42321d5062ce86019c1fc`**.
- Tamaño exacto del archivo reconstruido: **5601 bytes**.

El Git blob es una identificación del contenido con el encabezado de objeto Git; no debe confundirse con el SHA-256 directo del archivo.

## Batería integral ejecutada sobre la versión remota exacta

```sh
cd /mnt/data/ed_acceptance
python -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary test_pg_security_strict_adversarial_published test_pg_external_approval_contract test_pg_external_approval_failclosed test_pg_attestation_v1_published test_pg_attestation_v1_negative test_pg_attestation_v1_hardened
python -O -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary test_pg_security_strict_adversarial_published test_pg_external_approval_contract test_pg_external_approval_failclosed test_pg_attestation_v1_published test_pg_attestation_v1_negative test_pg_attestation_v1_hardened
git hash-object test_pg_attestation_v1_hardened.py
sha256sum test_pg_attestation_v1_hardened.py
```

**Resultados observados: 192/192 OK** con Python normal y **192/192 OK** con Python `-O`. No se reprodujo fallo en la versión publicada, por lo que no se requirió corregir el código remoto.

## Seguridad y restricciones

El contrato sintético permanece en `DENY_NO_EXTERNAL_TRUST`. Ni un `frozenset` local ni el reloj del proceso acreditan procedencia confiable; faltan verificador independiente, anclas externas, revocación autenticada, firmas reales y autorización separada.

Solo se recuperó código de GitHub, se reconstruyeron bytes y se ejecutaron pruebas Python offline. Sin PostgreSQL, GitHub Actions, OSRM, cambios de tienda o workflows, cartografía, costos, Supabase, staging, producción ni datos reales.
