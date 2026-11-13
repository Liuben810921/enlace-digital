# Auditoría del laboratorio OsmAnd — 13 noviembre 2026

## Alcance
Rama aislada `audit/delivery-map-readonly-20261113`. Solo interfaz de laboratorio local, importación/exportación JSON, validaciones y pruebas sintéticas. No se hicieron llamadas a motores externos, ni cambios a Supabase, producción o pedidos reales.

## Hallazgos y correcciones
1. **Persistencia local sin manejo de errores:** las operaciones `localStorage.setItem` podían fallar por cuota o permisos. Se centralizó el guardado con validación y manejo de excepciones. Ante fallo no se confirma el guardado ni se modifica la matriz anterior.
2. **Lectura de almacenamiento corrupto o demasiado grande:** la lectura ahora limita a 50 000 caracteres y devuelve matriz vacía ante datos corruptos, inválidos o acceso bloqueado.
3. **Importaciones malformadas:** se exige arreglo JSON de máximo 100 filas, identificadores únicos, distancias numéricas dentro de rango, estado permitido y únicamente los campos admitidos. Los reportes JSON no se aceptan como matrices.
4. **Protección de datos:** se rechazan caracteres de marcado/control, patrones simples de teléfonos y algunos formatos de direcciones en etiquetas. **Limitación:** esto no garantiza anonimización; los administradores no deben introducir nombres, teléfonos ni direcciones reales de clientes.
5. **Exportación:** la matriz se genera exclusivamente desde los datos validados y el reporte lleva bandera `synthetic: true`. Se verificó el roundtrip de exportación/importación de matriz y la negativa a importar reportes.

## Pruebas reproducibles
`node tests/delivery-route-lab-ui.test.cjs` y batería completa de `.github/workflows/isolated-delivery-quote.yml`. Casos: 12 fixtures, estadísticas, JSON inválido, límites numéricos, 101 filas, campos inesperados, etiquetas potencialmente sensibles, fallo de lectura/escritura de almacenamiento, integridad de exportación.

## Riesgos residuales
- El almacenamiento local no es un repositorio seguro de datos personales ni un sistema multiusuario. Uso exclusivamente sintético.
- El laboratorio no dispone de conexión a motor vial ni garantiza exactitud de rutas en La Habana.
- La validación de cadenas no reemplaza una política de no introducir datos de clientes. No se implementó detección exhaustiva de información personal.
- Las pruebas automatizadas verifican lógica en Node/VM, no una sesión visual en dispositivos móviles.

## Resultado
CI de commit `8ca8cf4d`: https://github.com/Liuben810921/enlace-digital/actions/runs/43493257679 — success.
