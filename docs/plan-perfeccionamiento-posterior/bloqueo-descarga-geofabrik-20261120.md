# Intento autorizado de descarga Geofabrik — 2026-11-20

Base `c5696adcf0ea9eda85a1cd2da3413164f577f777`; comparación inicial `identical`, sin commits posteriores.

## Operación realizada

Entorno aislado de trabajo, sin GitHub Actions ni despliegues. Verificación de capacidad con `df -h /mnt/data`: volumen overlay 32G, disponible 30G (valor puntual, no reserva). `curl` disponible. Intento de consulta de cabeceras HTTP sin descarga de contenido:

```
curl -sSIL --max-time 12 https://download.geofabrik.de/central-america/cuba-latest.osm.pbf
```

Resultado: `curl: (6) Could not resolve host: download.geofabrik.de`.

## Evidencia y estado

- No se pudo conectar al servidor: resolución DNS no disponible en el entorno.
- No se descargó ningún archivo PBF.
- Tamaño exacto: NO VERIFICADO.
- SHA-256: NO CALCULADO (no existe archivo local).
- Fecha del archivo y procedencia criptográfica: NO VERIFICADAS.
- No se instalaron ni ejecutaron herramientas OSRM, ni se utilizaron GitHub Actions, Supabase, staging, producción, servicios de pago, pedidos reales o despliegues.

## Próximo paso

Reintentar desde un entorno aislado con acceso DNS/HTTPS permitido y autorizado, o recibir un archivo PBF de origen comprobable para calcular SHA-256 localmente. No atribuir a este intento el tamaño aproximado indicado en la ficha pública como tamaño verificado. No se recomienda añadir el PBF binario al repositorio GitHub.

**BLOQUEANTE:** conectividad DNS del entorno. La cotización real sigue `PENDIENTE`; también la persistencia compartida segura y atomicidad entre pestañas.
