# ARCHIVO MAESTRO DE CONTINUIDAD — ENLACE DIGITAL Y DIRECCIÓN EJECUTIVA
**Versión:** 1.0 · **Actualización:** 2026-11-20 · **Responsable de decisiones:** fundador y CEO.

> **INSTRUCCIÓN DE REANUDACIÓN:** Al abrir un chat nuevo, consultar este archivo, el último estado/commit de la rama activa y los registros de decisiones antes de proponer investigaciones o trabajos. El documento es una síntesis de decisiones, NO sustituye la comprobación del estado real ni concede nuevas autorizaciones. Si una orden reciente contradice este documento, prevalece la orden más reciente del usuario.

## 1. Visión y alcance empresarial
- ENLACE DIGITAL, empresa tecnológica cubana, con ventas digitales activas y constitución legal en fase final (estado histórico; volver a comprobar antes de afirmar que sigue igual).
- Misión: soluciones tecnológicas y productos útiles, con honestidad, confianza, atención humana, servicio posventa y relaciones duraderas.
- Lema aprobado: **«Todo comienza con una conexión»**.
- Objetivos: fortalecer ventas digitales; abrir tienda física primero en La Habana y expandir a otras provincias; diversificar a desarrollo de software, sitios web y soluciones empresariales; construir procesos replicables, rentabilidad y crecimiento sostenible.
- El sitio web es la prioridad operativa inmediata, **no el único proyecto**. Otras líneas: estrategia y planificación 12/36/60 meses, ventas, marketing, catálogo y márgenes, compras/proveedores, inventario, logística, atención al cliente, finanzas, expansión física, servicios tecnológicos, organización ejecutiva y desarrollo personal/económico del fundador. No se han fijado aquí metas financieras personales numéricas.
- Cuba: diseñar para restricciones reales de conectividad, pagos, logística, regulación y proveedores; evitar dependencia de SMS.

## 2. Protocolo de colaboración y ejecución
1. **Autonomía dentro de la autorización vigente**: ejecutar, verificar y documentar; no detenerse tras describir un problema si existe un siguiente paso permitido. Solicitar autorización solo cuando haga falta ampliar permisos, decisión empresarial o confirmación visual.
2. **Continuidad real entre chats**: recuperar decisiones y comprobar la rama, commits posteriores, código y evidencias; no repetir auditorías, investigaciones, descargas o pruebas ya concluidas sin motivo. No confundir «planeado» con «ejecutado», ni «simulado» con «real».
3. **Entregar resultados verificables**: archivos, commits, pruebas realmente ejecutadas, resultados y bloqueantes. Corregir defectos reproducidos; pruebas focalizadas para cambios nuevos. La batería integral requiere autorización previa.
4. **Seguridad proporcional y velocidad**: priorizar funciones esenciales de lanzamiento; posponer refinamientos no críticos en plan de perfeccionamiento posterior. No dejar tareas funcionales incompletas sin señalarlas.
5. **Controles de cambios**: rama aislada; preservar commits posteriores. Nunca acceder o modificar Supabase, staging, producción, datos de clientes, pedidos reales, secretos, servicios externos, GitHub Actions, despliegues, instalaciones o generar costos salvo autorización específica aplicable. No asumir que una autorización anterior sigue vigente para una nueva operación.
6. **Comunicación**: español claro, informes breves, distinguir HECHO/PENDIENTE/BLOQUEADO, proponer siguiente acción concreta y botón de continuar cuando sea útil. Evitar solicitar decisiones ya tomadas.
7. **Gobernanza**: usuario mantiene decisión ejecutiva; asistente propone mejoras basadas en datos y riesgos, sin activar servicios por iniciativa propia.

## 3. Web: decisiones funcionales aprobadas
- Tienda móvil primero, responsive escritorio; staging aislado, pedidos reales desactivados hasta aprobación.
- Catálogo por departamentos; cuadrícula, búsqueda multi-palabra, regreso a posición de scroll; imágenes sin recorte, características y descripción completa.
- Precios en USD; entrega en CUP por municipio/barrio de La Habana, fuera del total de productos; métodos previstos efectivo CUP, efectivo USD y Zelle exterior verificado; conversión CUP referenciada a ElToque +10 CUP configurable (verificar tasa antes de uso real).
- Registro para comprar: teléfono + contraseña de al menos 8 caracteres, sin SMS; correo opcional recomendado, recuperación de correo no activa hasta configuración aprobada; sesión persistente.
- Clientes residentes en Cuba con dirección habitual; residentes en el exterior sin obligación de dirección cubana al registrarse. Compra «Yo mismo» o «Otra persona», múltiples destinatarios y direcciones guardadas, copia histórica inmutable del destinatario por pedido; provincia/municipio dependientes.
- Productos «Propio» con stock y «Proveedor» sin cantidad; agotados ocultos; carrito respeta stock; gestión de colores/variantes, condición, imágenes y edición móvil.
- Roles: Principal (fundador), Administrador general (socio), Supervisor (solo lectura), gestor comercial con comisiones en fase futura.
- Administración de proveedores, almacenes, destinos y dependencias de productos prioritaria antes de funciones secundarias.
- Identidad aprobada: logotipo blanco/turquesa sobre azul oscuro, circuitos; lema anterior; anuncios realistas, precisos y con datos comerciales verificables.
- SMTP transaccional/Brevo pospuesto hasta disponer de dominio y autorización; no activar correos reales por cuenta propia.

## 4. Entregas La Habana — decisión consolidada
- Alcance inicial La Habana; almacenes/puntos de salida y proveedores asociados al producto; solo considerar orígenes compatibles y activos.
- Si varios almacenes elegibles, **cobrar según el origen más lejano**; mínimo facturable 3 km; ejemplo operativo 200 CUP/km y mínimo 600 CUP; productos voluminosos pueden llevar tarifa especial.
- La distancia debe ser **vial real**, no línea recta ni valores inventados. Si no hay datos verificados, mostrar **PENDIENTE** y no cotizar ni activar pedidos reales.
- **Proveedor principal de distancias elegido: Geoapify**. Referencia de plan gratuito acordada: **3.000 créditos/día; ruta sencilla suele consumir 1 crédito**, no necesariamente 3.000 pedidos/día por múltiples orígenes/reintentos. Verificar condiciones vigentes antes de activar.
- **OSRM autoalojado es alternativa futura**, no requisito de lanzamiento. No volver a investigar hosting Oracle/OSRM como ruta principal salvo decisión explícita.
- Mapa `cuba-261114.osm.pbf` ya aportado por el usuario y verificado históricamente; evidencia commit `0100a4a628da9a2f39ea122fc3cc6fd96e6a4982`, SHA-256 `0381a456adde5d9fa9c8bedf3971d40612375ecfa1ca8679c99a205f785970e4`. No repetir descarga. La presencia física en el entorno actual no está garantizada.
- Geoapify: proteger clave fuera de HTML público, límite de cuotas, manejo de errores, procedencia de rutas y geocodificación fiable. No llamar API real sin permiso.
- Persistencia compartida localStorage insegura y atomicidad entre pestañas siguen **PENDIENTES**.

## 5. Estado técnico al 20 de noviembre de 2026
- Repositorio: `Liuben810921/enlace-digital`.
- Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`.
- Base verificada al crear este documento: `34d1e44c805a245c61e521f824194e5d1b7b255d`. **El commit que incorpore este documento será posterior; comprobar HEAD en cada sesión.**
- `experiments/havana-delivery-quote/quote.js`: cotizador sintético con orígenes por producto, regla de origen más lejano y frontera fail-closed de distancias verificadas.
- `experiments/havana-delivery-quote/geoapify-offline.js`: adaptador Geoapify offline sin red ni claves; conserva resultados no verificados como PENDIENTE; commit `851eab72259d0a656b7cdbf733058beddc1b5dad`.
- `docs/plan-perfeccionamiento-posterior/geoapify-integracion-offline-20261120.md`: diseño y 10 casos focalizados **preparados, NO ejecutados** al cierre del turno anterior.
- `index.html`: vista previa de entregas pendiente, sin tarifas viales reales; falta conectar el adaptador sin promover datos no autenticados.
- **Próxima tarea técnica**: ejecutar pruebas sintéticas focalizadas del adaptador y conectar únicamente la indicación PENDIENTE en la vista previa, sin API real, claves, GitHub Actions, Supabase, staging, producción, pedidos reales, despliegues ni costos; respetar autorizaciones de cada turno.

## 6. Marketing y operaciones comerciales
- Productos: laptops, móviles, sistemas solares/estaciones de energía, componentes, electrodomésticos, audio, consolas, tablets, accesorios, ropa y otras categorías aprobadas; catálogo dinámico, no congelar categorías en piezas corporativas.
- Anuncios: precisión de modelos/fotos, precio y prestaciones; formatos aptos para WhatsApp/Facebook; contacto y encabezados breves cuando se soliciten. Anuncio JBL previamente publicado. No asumir precios históricos como vigentes.
- Prioridades empresariales por desarrollar: indicadores de conversión, márgenes por producto, rotación, capital inmovilizado, compras, gestión de proveedores, crecimiento de tiendas físicas, contratación y servicios de software. Requieren plan y datos reales antes de prometer cifras.
- Trabajo personal del fundador: desarrollo ejecutivo, productividad y objetivos económicos con honestidad; pendiente definir metas cuantificadas y cronograma cuando el usuario quiera priorizarlos.

## 7. Protocolo de nueva conversación
Mensaje recomendado:
> «Retoma ENLACE DIGITAL y mi planificación ejecutiva. Lee el Archivo Maestro de Continuidad en `docs/ARCHIVO_MAESTRO_CONTINUIDAD.md` de la rama `plan/havana-osrm-benchmark-offline-20261114`, comprueba HEAD y los cambios posteriores, y continúa la última tarea autorizada. No repitas decisiones ni auditorías cerradas. Si hay discrepancias, pregúntame únicamente por la decisión indispensable».

**Mantenimiento:** actualizar este documento cuando se tome una decisión estratégica, cambie una prioridad, se cierre un bloqueo o se cambie una restricción importante. Conservar historial de decisiones con fecha y motivación; no convertirlo en transcripción. Para proyectos ajenos al sitio, mantener secciones separadas en futuras revisiones. **Nunca guardar contraseñas, tokens, secretos ni datos personales de clientes aquí.**

## 8. Control de calidad de memoria
- **Confirmado por el usuario:** autonomía limitada por permisos; prioridades de lanzamiento; Geoapify principal; OSRM futuro; mapa ya aportado; prohibición de activar servicios y costos sin autorización.
- **Histórico sujeto a reconfirmación:** estado legal, configuración de servicios, planes comerciales y cuotas de terceros, precios, correo/dominio.
- **No afirmar:** que pruebas no ejecutadas estén superadas, que Geoapify esté conectado en producción, que existan distancias reales verificadas, que haya 3.000 entregas garantizadas, ni que este archivo se cargue automáticamente en todos los chats.


## 9. Checkpoint Work — 24 de noviembre de 2026

- **Rama activa:** `fix/delivery-batch-deactivation-order-20261120`.
- **HEAD de referencia al cierre:** `9dfeaa744db03544ccf1b97166d3fce0447caed2`. Verificar HEAD antes de editar y conservar cualquier commit posterior.
- **Fase checkout — consistencia de fuentes, completada:** restaurada la constante faltante `ED_PRODUCT_ORIGINS_KEY='ed_product_origins_demo_v1'`; el checkout toma una sola instantánea coherente de inventario, asociaciones, almacenes, proveedores y destinos; fija esa instantánea a la vista previa y vuelve a verificarla al confirmar; impide confirmar si detecta datos locales/remotos mezclados o cambios durante la revisión. El puente de staging expone si la sesión está conectada para evitar combinar asociaciones remotas con inventario local.
- **Comprobaciones:** compilación de los cinco scripts inline de `index.html` y ambos scripts externos del puente; seis casos focalizados de fuentes coherentes, inventario desfasado, guardados pendientes, sesión staging, esquema inválido y cambio durante lectura. Resultado: PASS. Sin GitHub Actions.
- **Geoapify staging:** `supabase/functions/ed-staging-geoapify-route/index.ts` permanece fail-closed: variables de habilitación/red desactivadas, identidad del operador y reserva atómica no conectadas, sin llamada al proveedor. Checkout y rutas continúan **PENDIENTE** hasta implementar y verificar contexto de servidor, autenticación real y ledger/cuota transaccional. No desplegar ni hacer llamadas reales sin autorización expresa.
- **Restricciones vigentes:** no producción, no despliegues, no pedidos reales, no llamadas Geoapify, no costos. Persistencia compartida segura y atomicidad entre pestañas continúan pendientes.
- **Regla de trabajo del fundador:** avanzar autónomamente en cada fase autorizada; al cerrar una fase entregar commit/evidencias y una acción clara para pasar a la siguiente. Solicitar intervención únicamente cuando exista una decisión, credencial o autorización que realmente haga falta; no reiniciar auditorías ni repetir tareas cerradas.
- **Siguiente fase:** preparar offline el adaptador de identidad y la reserva transaccional para el intermediario staging, junto con pruebas focalizadas. Mantenerlo sin habilitar, sin despliegue ni tráfico real mientras falten los gates de servidor.


## 10. Intermediario de rutas — 24 de noviembre de 2026

- **Fase offline completada en la rama actual:** `supabase/functions/ed-staging-geoapify-route/index.ts` delega al núcleo Node/Deno `gateway.mjs`; nuevas pruebas focalizadas en `gateway.test.mjs`.
- **Controles:** flags cerrados por defecto; body JSON estricto con límite; CORS exacto por entorno staging; operación idempotente y hash canónico; identidad solo por adaptador servidor validado; reserva solo si RPC confirma commit, usuario/operación/revisión/hash y contexto de staging. Respuesta sigue PENDIENTE; ningún transporte Geoapify, ruta confiable, tarifa ni pedido.
- **Evidencia:** 14/14 pruebas Node PASS; arnés local de `Deno.serve` confirma que flags activas sin adaptadores dan `GATEWAY_NOT_CONFIGURED`; `node --check` PASS. Deno no está disponible; no se afirma despliegue ni empaquetado Supabase.
- **Artefacto:** `docs/plan-perfeccionamiento-posterior/geoapify-edge-gateway-offline-20261124.md` contiene detalles, límites y evidencia.
- **Intervención requerida antes de la fase de conexión real:** confirmar ACL/tabla administrativa y RPC atómica existentes del proyecto staging, o autorizar diseño y aplicación de cambios en esa base. También será necesaria autorización explícita para habilitar/desplegar la función. Hasta entonces mantener flags cerradas; no consultar servicios externos ni hacer llamadas Geoapify.
- **Flujo de trabajo:** seguir autónomamente en tareas offline autorizadas; al cerrar una fase dejar commit y evidencia. Pausar solo ante una autorización, credencial o decisión técnica que no pueda inferirse con seguridad. No entregar instrucciones para que el usuario copie y pegue como sustituto de continuar el trabajo.


## 11. Contrato de staging verificado en lectura — 24 de noviembre de 2026

- **Inspección de solo lectura:** proyecto enlace-digital-staging; función activa ed-geoapify-routing, versión 1, con verificación JWT nativa desactivada. No se consultaron valores de secretos/flags, no se invocó la función, no se llamó Geoapify y no se modificó la base.
- **Contrato desplegado observado:** recibe un token de sesión propio del cliente, lo resume con SHA-256 y consulta public.ed_geoapify_session_valid; valida coordenadas enviadas por el cliente dentro de un rectángulo amplio de La Habana; reserva créditos mediante public.ed_reserve_geoapify_credits; después puede llamar al proveedor y devolver distancia y tarifa.
- **Esquema confirmado:** enlace_auth.cliente_sesiones contiene hash, vencimiento y revocación. public.ed_geoapify_daily_budget aplica un máximo de 2.000 créditos/día UTC. La RPC de cuota hace incremento atómico con ON CONFLICT, pero su contrato solo devuelve booleano y no recibe clave idempotente, usuario, operación, hash del payload, revisión ni contexto de inventario/dirección.
- **Permisos observados:** ambas RPC solo son ejecutables por service_role; la RPC de validación de sesión es SECURITY DEFINER en public y solo devuelve booleano; la RPC de cuota es SECURITY INVOKER. La función Edge usa service_role en servidor.
- **Desajuste bloqueante:** el núcleo offline de esta rama exige identidad de operador verificada y una reserva atómica vinculada al usuario, operación, payload y revisión del contexto. El endpoint desplegado usa sesión de cliente y la RPC de cuota antigua, que no acredita esos vínculos. No es seguro conectar checkout con el endpoint actual ni tratar su distancia/tarifa como verificada.
- **Riesgo operacional por confirmar:** la función desplegada puede emitir llamadas a Geoapify si sus flags y secretos de servidor están configurados. No se leyeron dichos valores ni se comprobó su consumo. La orden vigente prohíbe llamadas reales/costos y no autoriza cambiar secretos, flags, base de datos ni despliegues; por tanto, no se ejecutó ninguna operación de ese tipo.
- **Trabajo autónomo siguiente:** mantener el checkout en PENDIENTE y preparar el contrato de reemplazo más estrecho para una futura autorización: contexto confiable de almacenes/destino en servidor, idempotencia ligada al payload, límites de gasto y respuesta que no permita falsificar tarifa desde el navegador. Antes de habilitar rutas reales habrá que decidir y autorizar el tratamiento de la función antigua y los cambios de staging.


## 12. Bloqueo seguro desplegado en staging — 24 de noviembre de 2026

- Tras autorización expresa del fundador para terminar esta fase, se reemplazó la función activa de staging ed-geoapify-routing con una versión fail-closed tomada de supabase/functions/ed-geoapify-routing/. Conserva verify_jwt=false por compatibilidad del endpoint previo, pero no incorpora adaptadores de sesión, base de datos ni cuota y no incluye transporte Geoapify.
- **Verificación de despliegue:** Supabase informa ACTIVE, versión 2. La lectura del código desplegado confirma que importa gateway.mjs, no contiene fetch ni invoca authenticate/reserveAtomic; por tanto, las flags existentes no pueden disparar llamadas al proveedor. No se invocó el endpoint ni se consumieron créditos.
- **Rama:** se añadieron los archivos espejo del despliegue en commits d5f5e91c87dd0ffea09c8b1f55ac62c80e02d108 y 96a79b7db14966d6301d6f86afff0a310248f477. El núcleo coincide con el código offline probado previamente (14/14 casos).
- **Límite funcional:** el checkout permanece PENDIENTE. Staging no tiene almacenes, asociaciones producto-almacén ni un contexto de destino confiable suficiente para reconstruir la selección de origen más lejano desde servidor. No se inventaron estos datos ni se aplicó una migración especulativa.
- **Siguiente fase autónoma:** preparar el modelo mínimo para sincronizar productos, asociaciones, almacenes y coordenadas autorizadas con el servidor; implementarlo primero en rama y probar con datos sintéticos. La activación de rutas reales seguirá deshabilitada mientras no se autoricen llamadas Geoapify y su consumo de créditos.
