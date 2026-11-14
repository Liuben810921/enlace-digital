# Revisión de nueve capturas y endurecimiento de formularios móviles — 14 noviembre 2026

## Evidencia
- CI #43635509745: **success**; prueba de accesibilidad de aviso y botones.
- Se descargó y descomprimió el artefacto #14129273201 de CI visual #43635464747: **9 PNG**, 320/375/430 px en estados normal, cuarentena y recuperado. Se revisó una lámina de contacto con las nueve capturas.
- Las imágenes muestran aviso de cuarentena visible y botones de listado visualmente deshabilitados. **Defecto confirmado:** los campos y botones del formulario de alta de proveedor y almacén seguían pareciendo editables en cuarentena, aunque el backend local rechazaba guardar.

## Corrección
- Ambos formularios ahora usan `fieldset disabled` durante cuarentena; el bloqueo es nativo, accesible y excluye sus campos del foco de teclado.
- El test Chromium comprueba que ambos `fieldset` están deshabilitados, que los campos de nombre no se pueden editar, que el botón Editar está deshabilitado y que Tab no enfoca el campo de almacén.
- Se mantiene la recuperación explícita como único mecanismo para levantar cuarentena; las cotizaciones anteriores siguen inválidas.

## Alcance y pendientes
- Aún falta verificar la CI nueva tras estos cambios y examinar sus capturas actualizadas.
- No se ha certificado zoom 200 %, lector de pantalla, navegación completa por teclado, dispositivo Android físico, ni flujo comercial real.
- El HTML de prueba es una extracción de funciones de `index.html` con datos sintéticos, no una prueba de producción.
- Sin Supabase, staging, producción, clientes reales, pedidos, despliegue o activación de servicios.
