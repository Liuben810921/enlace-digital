# Aceptación OSRM offline y propuesta de validación vial de La Habana — 14/15-11-2026

## 1. Dictamen verificable
**ACEPTADO únicamente en rama aislada y con datos sintéticos.** GitHub Actions [#43659020470](https://github.com/Liuben810921/enlace-digital/actions/runs/43659020470), commit `4fc6c40ba9152e24400780833a1c36627c9673b8`, jobs:
- `132643942166` test **completed/success**: PASS específico `offline OSRM provenance, WGS84 coordinate order, version, TTL, fail-closed unavailable routes`, además de los contratos anteriores y PostgreSQL efímero.
- `132643942385` mobile-visual **completed/success**: Chromium 320, 375 y 430 px, flujos de proveedor, almacén efectivo, asociación, cuarentena, invalidación y recuperación.
- Artefacto `delivery-mobile-visual-320-375-430` ID `14139470808`, SHA256 `95fdb44dfd63401e4e330d835e63680a9a4dcfd78a8b54f621cbe2f396be31fc`.

**Alcance visual exacto:** el workflow captura el fixture móvil generado por `tests/build-delivery-mobile-visual-fixture.py`; no equivale a inspección manual del nuevo placeholder de mapa en `tests/fixtures/delivery-warehouse-mobile-demo.html`. El placeholder está en GitHub, pero no se declara comprobada una ruta visual real ni navegación en mapa.

## 2. Propuesta de ruta técnica, sin uso de servicios externos
**Candidato preferente: OSRM + datos OpenStreetMap**, porque el adaptador ya admite `coordinates: [[lng,lat],[lng,lat]]` y distancia en metros. La licencia ODbL de los datos OSM, atribución y eventuales obligaciones de uso/redistribución deberán revisarse al elegir distribución. OSRM como software es abierto, pero el alojamiento, transferencia, actualizaciones y soporte **no son automáticamente gratuitos**.

Alternativas:
- **OSRM autohospedado con extracto OSM de Cuba:** coste de licencia del motor normalmente nulo; alojamiento y mantenimiento potencialmente de pago. Control de privacidad y versión de mapa; confirmar extracto, cobertura vial y sentidos.
- **Valhalla autohospedado con OSM:** alternativa abierta con coste de infraestructura; exige adaptador y nuevas comprobaciones, no priorizar sin motivo.
- **API gestionada compatible o de terceros:** posible nivel gratuito sujeto a cuotas y condiciones; coste y disponibilidad en Cuba **no verificados**. No usar servidores públicos de demostración como dependencia comercial sin autorización expresa.

## 3. Muestra pública de validación propuesta (nombres, NO coordenadas verificadas)
Usar puntos públicos de referencia de La Habana y **elegir entradas viales accesibles**, no el centro geométrico del edificio:
- Parque Central (Centro Habana/Habana Vieja) — referencia céntrica.
- Plaza de la Revolución — conexiones urbanas y sentido inverso.
- Ciudad Deportiva (Cerro) — arterias principales.
- Parque Almendares (Plaza/Playa) — cruces y accesos cercanos al río.
- Universidad de La Habana (Vedado) — trama urbana y restricciones de giro.
- Castillo de los Tres Reyes del Morro (Habana del Este) — conexión por bahía/túnel; validar accesibilidad vial real.
- Parque Lenin (Arroyo Naranjo) — recorrido periférico.

Estos son **candidatos para selección posterior**, no almacenes, destinos verificados ni coordenadas; su ubicación, acceso vial, disponibilidad de ruta y sentidos no se han consultado ni validado. Preparar 8–12 trayectos entre subconjuntos de estos puntos, incluyendo sentido inverso, tramo corto, tramo periférico y caso sin ruta; comparar con una referencia independiente (p. ej. OsmAnd) y registrar fecha, versión de mapas, perfil automóvil, distancia, disponibilidad y discrepancias.

## 4. Privacidad, disponibilidad, seguridad y costos
- Usar exclusivamente puntos públicos ficticios, sin nombres de proveedores reales, clientes, teléfonos ni direcciones privadas.
- Geocodificación y consultas viales, si se autorizan, desde backend/laboratorio controlado, no directamente desde navegador de cliente; limitar volumen, registros y retención.
- No confiar en `trustedBackend` suministrado por cliente. Backend debe vincular ruta a origen efectivo, destino, versión de cartografía y tiempo; invalidar cotización al cambiar cesta, dirección, almacén o tarifa.
- Ante `NoRoute`, timeout, distancias inválidas, desactualización o incertidumbre: **Tarifa pendiente de confirmar**, sin cobro automático.
- Coste de licencias, API, hosting, actualización y tráfico: **sin cuantificar** porque no se han consultado proveedores ni ejecutado servicios. Preferencia por opción gratuita o sin costes recurrentes si es viable, pero no prometerlo.

## 5. Autorización específica que se solicitará
> Autorizo exclusivamente la consulta o descarga de cartografía pública de OpenStreetMap y la validación de 8–12 rutas viales con puntos públicos de referencia de La Habana en un laboratorio aislado, con OSRM u otro motor gratuito previamente identificado. No autorizo introducir datos reales de proveedores o clientes, utilizar servicios de pago, crear recursos de infraestructura de pago, acceder a Supabase/staging/producción, conectar checkout ni desplegar. Si el proveedor exige cuenta, API key, términos especiales o gasto, solicita autorización adicional antes de continuar.

**Siguiente acción técnica:** al recibir autorización, primero identificar fuente legal, cobertura y costes; luego verificar rutas en laboratorio y comparar distancias. Sin ella, el estado comercial sigue **NO-GO** para mapa vial real y cotización automática.
