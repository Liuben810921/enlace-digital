# ST-PRE-05 — guía mínima del Owner para evidencias G2, G3 y G4

**Fecha:** 2026-11-10. **Proyecto exclusivo:** `enlace-digital-staging` (`xqahthghvozeigbojhyi`). **Base:** `bdb69b7acbf69a13d80e8b809d3f33b3de111cdf`. **Verificación previa:** GitHub Actions PostgreSQL run `42923003774` **SUCCESS**, job `isolated-synthetic-only` completado sin fallos.

**Alcance:** esta guía prepara una futura aportación **voluntaria y separadamente autorizada** de evidencias administrativas por el Owner. **No autoriza abrir paneles, inspeccionar valores, ejecutar pruebas, activar servicios, escribir datos ni desplegar funciones.** Estado inicial: **G2 BLOCKED, G3 BLOCKED, G4 PARCIAL/BLOCKED**.

## Regla de captura segura (obligatoria)
1. Confirmar visualmente que se está en **staging** y nunca en producción. No entrar en listados de usuarios, pedidos, correos, registros, claves o filas.
2. Elegir únicamente paneles que muestren un **indicador de estado o presencia separado del valor** (activado/desactivado, configurado/no configurado, backup disponible/no disponible). Si estado y valor aparecen juntos, **no hacer captura ni copiar texto**: registrar **BLOCKED**.
3. No revelar ni copiar valores de variables de entorno, URL de webhook, destinatarios, correos, teléfonos, IDs de clientes, tokens, contraseñas, cadenas de conexión, service_role, publishable keys, JWT, claves SMTP, proveedores de pago, ni logs o payloads. Tampoco pegar capturas sin revisar en issues/PR públicos.
4. Antes de compartir cualquier imagen, **recortar fuera del área visible todos los datos sensibles** y revisar la imagen final. Preferir certificación textual de estado sin valores cuando la interfaz no permite una captura segura. Mantener evidencias privadas bajo control del Owner; en GitHub registrar únicamente identificador de evidencia privada y hash del documento redactado, nunca su contenido sensible.
5. No pulsar acciones de guardar, enviar, probar, regenerar, restaurar, activar, conectar, borrar, ejecutar o desplegar. Una opción que abra una pantalla con valores sin poder evitarlos implica **BLOCKED**.
6. Ningún resultado `PASS` parcial sustituye el requisito de **aislamiento efectivo**. Un toggle visual desactivado no demuestra por sí solo que no existan otros caminos de envío.

## Matriz mínima de evidencias y responsables
| ID | Comprobación administrativa permitida tras autorización específica | Evidencia segura que debe aportar el Owner | Responsable que valida | Criterio PASS / BLOCKED |
|---|---|---|---|---|
| G2-COR | Estado de Auth Email/SMTP, Email Hooks y SMS sin valores | Estado de envío y transporte externo, identificación de rutas alternativas bloqueadas | Owner + seguridad | PASS solo si todas las vías de salida relevantes están demostrablemente aisladas; BLOCKED si falta alguna |
| G2-PAY | Estado de pasarelas de pago, integraciones y captura de dinero | Declaración de que no hay cobros reales posibles desde fixtures, con inventario redactado de puntos de entrada | Comercial + seguridad | PASS con aislamiento verificable de cada ruta; BLOCKED si depende de un proveedor no comprobado |
| G2-ORD | Estado de pedidos, stock, avisos y tareas automáticas | Evidencia de desactivación efectiva y ausencia de efectos en pedidos reales | Comercial + técnico | PASS si todos los flujos están aislados; BLOCKED si solo existe una bandera no contrastada |
| G2-WEB | Estado de webhooks, colas, cron y salidas externas | Lista de categorías y estados sin URLs ni payloads; 0 Edge desplegadas ya observado | Técnico + seguridad | PASS con cobertura completa de salidas; BLOCKED ante rutas desconocidas |
| G3-BAK | Estado de backup/PITR, retención y posibilidad de restauración | Disponibilidad, alcance, retención y fecha de verificación **sin contenido de backup** | Owner + seguridad | PASS documental solo si restauración aplicable está acreditada; BLOCKED si no es verificable |
| G3-REV | Plan de limpieza selectiva, FK, permisos y recuperación | Procedimiento por IDs ficticios exactos, orden de dependencias, abortar ante error, responsable de reversión | Técnico + Owner | PASS de diseño si la secuencia está justificada; **BLOCKED operativo** hasta ensayo autorizado |
| G4-AUTH | Estados de Auth/providers, email recovery, sesiones y gateway/JWT | Estado por categoría; esquema de autorización y separación entre clave pública y sesión de cliente | Owner + seguridad | PASS solo con estados efectivos y controles de sesión comprobables; BLOCKED si hay valores inseparables |
| G4-FLAG | Presencia/estado de banderas y secretos sin valores | Confirmación de **presencia y protección** de variables requeridas, sin revelar contenidos ni sus valores | Owner + técnico | PASS documental únicamente si el panel muestra presencia separada; BLOCKED en otro caso |

**No confundir:** `SUPABASE_PUBLISHABLE_KEYS` y la clave pública no autentican a un cliente. `SUPABASE_SERVICE_ROLE_KEY` es de servidor y no debe exponerse al navegador. Las banderas `ED_STAGING_CUSTOMER_AUTH_ENABLED` y `ED_STAGING_ALLOWED_ORIGIN` no se leerán ni copiarán.

## Plantilla de certificación (sin secretos ni valores)
```text
Proyecto: enlace-digital-staging / xqahthghvozeigbojhyi
Fecha UTC:
Responsable Owner (rol, sin identificador personal):
Revisor de seguridad (rol):
Autorización específica de inspección (referencia):
Control: [G2-COR | G2-PAY | G2-ORD | G2-WEB | G3-BAK | G3-REV | G4-AUTH | G4-FLAG]
Fuente administrativa (nombre del panel, sin URL ni valores):
Estado comprobable: [aislado | no aislado | no verificable]
Cobertura y rutas alternativas revisadas (categorías, sin datos):
Evidencia redactada: [referencia privada o "sin captura segura"]
Hash de evidencia redactada (opcional):
Limitaciones:
Resultado: [PASS documental | FAIL | BLOCKED | NOT RUN]
Acción posterior: [ninguna | solicitar autorización independiente]
Confirmación: no se leyeron valores/secretos/filas, no se ejecutaron cambios
```

## GO/NO-GO
- **GO únicamente para proponer la siguiente revisión:** ocho controles documentados con evidencia verificable y revisión independiente, sin `FAIL` o `BLOCKED` crítico; todavía requerirá autorización distinta para cada despliegue, cambio de configuración o escritura sintética.
- **NO-GO para pruebas con escrituras o despliegues:** cualquier salida externa no aislada, respaldo/reversión sin acreditar, estado Auth/gateway desconocido, secreto expuesto, dependencia de datos reales o evidencia incompleta.
- Si la pantalla administrativa revela valores junto al estado, registrar **BLOCKED**, sin intentar acceder por SQL, logs, API alternativa ni captura parcial de esa pantalla.

## Trazabilidad y reversión
Documento y test offline solamente en GitHub; revertir los commits correspondientes si se requiere. **Sin cambios en Supabase, staging desplegado ni producción**. La aportación futura de evidencias requiere una **autorización independiente**; pruebas ficticias, escrituras, despliegues y cambios de configuración necesitan otras autorizaciones independientes.
