# Auditoría adversarial avanzada del manifiesto semántico — 2026-11-15

Base: `10ce4dbbc5f2e4f04ea3a94c753c8147d68f7602`. Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`.

## Evidencia local reproducible

Archivo nuevo **local**: `/mnt/data/ed_acceptance/test_pg_security_manifest_adversarial.py`. No se publicó este validador en GitHub en esta etapa; por tanto, su blob no se declara verificado remotamente.

- Git blob **local**: `92637e01c8f77553190fd5b7d948ddbdec607784`
- SHA-256 **local**: `19e69d5048f895813009d9e6ea7c59237af0d238318319214d33d5ff953bfd22`

Comandos ejecutados en `/mnt/data/ed_acceptance`:

```sh
python -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial
python -O -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial
git hash-object test_pg_security_manifest_adversarial.py
sha256sum test_pg_security_manifest_adversarial.py
```

**Resultado observado: 87/87 OK en Python normal y 87/87 OK en -O**; 69 pruebas existentes y 18 nuevas. Ningún defecto del propio archivo de pruebas se reprodujo. El nuevo archivo permanece local, de modo que el cierre de integridad remoto de ese archivo **sigue pendiente**.

## Defectos y vacíos reproducidos en el contrato previo

1. **Rehash coordinado:** modificar un ataque o bloqueante y recalcular su entrada SHA-256 hace que `violations(doc, manifest)` devuelva lista vacía. Esto es un límite de confianza: el manifiesto no es una firma ni una aprobación independiente.
2. **Claves JSON duplicadas:** `json.loads` estándar acepta silenciosamente la última aparición de una clave. El nuevo test aporta un parser `object_pairs_hook` que las rechaza. No se cambió el validador anterior.
3. **Campos adicionales:** `fingerprint(case)` omite campos extra; `violations` tampoco rechaza claves adicionales del manifiesto. Debe exigirse esquema cerrado para el documento y el manifiesto.
4. **Unicode:** las variantes NFC/NFD visualmente equivalentes generan hashes distintos; caracteres confusables latinos/cirílicos también. La codificación `\\u00e9` y su equivalente Unicode se interpretan igual tras parseo. Definir política explícita de normalización antes de modificar canonicalización.
5. **Trazabilidad de aprobaciones:** el manifiesto no contiene firma verificable, identidad de revisor, referencia de aprobación ni control externo de la versión autorizada. Hashes locales no prueban aprobación.

## Cobertura de las 18 pruebas nuevas

Baseline; rehash coordinado de ataque y bloqueante; rechazo de duplicados JSON en caso, manifiesto y raíz; campo extra de caso y de manifiesto; NFC/NFD; confusables; escapes Unicode; independencia del orden de claves y dependencia del orden de campos semánticos; NaN; ausencia de aprobación y firma; verificación del hash original.

Las pruebas que documentan vulnerabilidades de diseño **pasan cuando reproducen la limitación**; no deben interpretarse como una corrección de seguridad.

## Criterios propuestos para el siguiente cambio offline

- Parser estricto que rechace claves duplicadas y constantes JSON no estándar.
- Esquemas cerrados de caso y manifiesto, con errores tipados.
- Política versionada de canonicalización y normalización Unicode.
- Ancla de confianza independiente del par matriz/manifiesto; aprobación con evidencia verificable, sin inventar firmas ni aprobadores.
- Pruebas negativas que exijan rechazo del rehash coordinado bajo un ancla de confianza válida.

## Límites operativos

No se ejecutaron PostgreSQL, GitHub Actions ni OSRM; no hubo cartografía, costos, modificaciones de tienda/workflows ni acceso a Supabase, staging, producción o datos reales.
