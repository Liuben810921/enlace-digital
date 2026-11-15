# Auditoría adversarial del orquestador sintético — 2026-11-15

**Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`  
**Base:** `730c8885882f8146fbf0c56715c83eb37a482399`  
**Commit de código:** `d88867e2b98f83ba838845cb9c394a75d246964a`

## Defecto reproducido y corrección

La versión previa podía establecer `accepted_for_synthetic_review=true` aun cuando el corpus incluyera casos `in_coverage=false`. La auditoría de cobertura del comparador reportaba `outside_unverified`, pero el orquestador no lo consideraba en la decisión final. Por tanto, el resultado agregado podía interpretarse como aprobación de un conjunto que incluía rutas no evaluadas.

Se corrigió **solo** `synthetic_gate.py`: la aprobación sintética ahora requiere `outside_unverified == 0` además de integridad, cobertura y equivalencia satisfactorias. El campo `outside_unverified` se inicializa a `None` hasta disponer del resultado de comparación. Se mantienen las secciones independientes de diagnóstico; la aprobación comercial sigue permanentemente prohibida.

## Pruebas adversariales

Nuevo archivo `test_security_gate.py` con **12** pruebas: casos exteriores con rutas iguales y distintas, corpus completamente interior, bloqueo comercial, manipulación de corpus, fallo de esquema tras integridad válida, manifiesto de tipo incorrecto, JSON profundo, claves duplicadas, nombre de productor no autenticado, snapping inválido, sesgo positivo y ausencia de rutas elegibles.

Se ejecutaron en entorno local los **103 casos**: 43 del comparador, 8 adversariales previos, 24 de procedencia, 16 del orquestador y 12 de seguridad.

```sh
python -m unittest -q test_compare_graphs_v2 test_adversarial_v2 test_provenance_gate test_synthetic_gate test_security_gate
python -O -m unittest -q test_compare_graphs_v2 test_adversarial_v2 test_provenance_gate test_synthetic_gate test_security_gate
```

**Resultados observados: 103/103 OK en ambos modos**. No se ejecutaron workflows de GitHub Actions.

## Hashes exactos de los dos archivos publicados

| Archivo | SHA-1 Git blob local = GitHub | SHA-256 de copia local |
|---|---|---|
| `synthetic_gate.py` | `4800b13ae3c78e9f916fe1ff0b27592a7cafbb2a` | `bed8afd0616c7e576da80f5a9d4e9e2f806f9a6370332a86e9eacd03691b206b` |
| `test_security_gate.py` | `f6dd680837517f3eaf49384fb4470429f038644e` | `e59a9ac8bc84e18f0feb8af7ea7f8c46c282d11ce84e638e00def42baab3a6dd` |

Se compararon los identificadores SHA-1 Git blob calculados localmente con los publicados por GitHub en el commit de código; coincidieron. Los otros cinco archivos permanecen sin cambios respecto a la regresión anterior.

## Límites no resueltos

- `in_coverage` continúa siendo una declaración sintética, no una comprobación geográfica.
- Los hashes del manifiesto no autentican al productor; una etiqueta como `trusted-official` no establece confianza.
- El sistema no valida cartografía, rutas, conectividad ni snapping reales.
- No se ha probado resistencia a agotamiento de recursos en un entorno de producción.
- `accepted_for_synthetic_review` no autoriza cotizaciones; `commercial_approval=false` y `commercial_quote_enabled=false` siempre.

No se descargó cartografía, ejecutó OSRM, creó cuentas, activó manualmente Actions, generó costos ni accedió a Supabase, staging o producción.
