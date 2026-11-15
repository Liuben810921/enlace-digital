# Auditoría adversarial OSRM v2 — 2026-11-15

**Base:** `725c14a13970ffb58448cc10b076b6955c19d1a8`  
**Rama:** `plan/havana-osrm-benchmark-offline-20261114`  
**Código y pruebas:** `14f9903892a9b36d6352b86ec79899aee1eb8fb3`

## Defectos comprobados y correcciones

1. **Desbordamiento numérico:** el código original aceptaba cada distancia finita, pero `math.fsum` podía generar `OverflowError` al sumar distancias sintéticas extremas. Se captura y transforma en `ValueError('numeric overflow')` para rechazo controlado (fail closed). También se comprueba que cada diferencia sea finita.
2. **Invisibilidad de casos fuera de cobertura:** la v2 ignoraba las discrepancias de estado de rutas exteriores. Se añadieron `outside_unverified` y `outside_status_disagreements` a `coverage_audit`. Estos casos **no** invalidan automáticamente equivalencia interior; permanecen explícitamente sin verificar. No se ha implementado validación geométrica de cobertura.
3. **Snapping:** se mantiene la validación separada de origen/destino y se agrega regresión con ambos extremos inválidos.
4. **Sesgo mixto:** regresión de variación positiva neta con aumentos y disminuciones. No se afirma inferencia estadística.

## Pruebas locales reproducibles

```sh
cd experiments/havana-osrm-portable
python -m unittest -q test_adversarial_v2
python -O -m unittest -q test_adversarial_v2
```

**8/8 OK normal y 8/8 OK con -O**, en copias locales que coinciden por SHA-1 Git blob con las publicadas. Las **43 pruebas históricas no fueron reejecutadas en esta sesión**; su resultado anterior pertenece al commit base. No afirmar 51/51 ni CI verde.

| Archivo | Bytes | SHA-1 Git blob local = GitHub | SHA-256 local |
|---|---:|---|---|
| `compare_graphs_v2.py` | 3695 | `a90dc87d622901ee22b6a6116d50ce5ae8a4e35f` | `5af9c6749340787b8c6f2cb8dd990052852dfbec30af7e110ae341af52fb17e8` |
| `test_adversarial_v2.py` | 1962 | `a0236a9af63c10745f61be18a1ed27b00ee3ac9b` | `3e2f32bbb9d087d8842f77ed8341fc43e7ab650ab330bcdf51a571a8226a7f9f` |

## Riesgos pendientes

- `in_coverage` es una declaración del productor, no un cálculo geométrico.
- El snapping declarado no se verifica con coordenadas originales/ajustadas.
- Los casos fuera de cobertura se reportan pero no se certifican.
- Umbrales 100 m/2 % no están aprobados para uso comercial.
- Los límites numéricos extremos se rechazan, no se consideran rutas realistas.
- Debe reejecutarse la batería histórica de 43 pruebas sobre la versión corregida antes de declarar regresión completa cerrada.

**Sin cartografía, OSRM, cuentas, activación manual de GitHub Actions, costos, Supabase, staging ni producción.** `commercialQuoteEnabled=false`.
