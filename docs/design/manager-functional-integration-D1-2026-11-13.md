# Paquete D1 — Contrato funcional de gestores y cotizaciones (solo GitHub)

**Estado:** diseño de implementación; no integrado, no desplegado. Dependencia: `docs/PLAN_MAESTRO_FINALIZACION_SEGURIDAD_2026-11-13.md`.

## Flujo funcional propuesto

1. El gestor inicia sesión por un proveedor de identidad autorizado; el servidor obtiene identidad y rol de la sesión validada, nunca del JSON del navegador.
2. El servidor consulta solo clientes asignados al gestor. La búsqueda de clientes y direcciones no permite enumerar otros clientes.
3. El gestor prepara una cesta y selecciona destinatario guardado o dirección alternativa; no modifica la dirección habitual al crear una alternativa.
4. El backend resuelve precio/stock y orígenes efectivos, solicita una ruta confiable y calcula entrega y promociones. Si falta ruta, muestra «Tarifa pendiente de confirmar».
5. La cotización retorna ID, versión de cesta/destino/ruta/tarifa, vencimiento, importe bruto, pago del cliente y cobertura promocional; no crea pedidos reales.
6. Un cambio de cesta, dirección, almacén o tarifa invalida la cotización y requiere nueva confirmación.
7. El panel de gestor presenta ventas y comisiones de datos autorizados; no confunde comisión devengada con pago realizado.
8. El supervisor tiene lectura restringida; administrador general puede cambiar parámetros con motivo, versiones y auditoría; el administrador principal mantiene atribuciones definidas por política.

## Frontera de confianza

- **Navegador:** solo referencias opacas a cesta, cliente y destinatario, más clave de idempotencia y versión esperada. Nunca envía roles, subtotal autoritativo, kilómetros de confianza ni comisiones.
- **Servidor:** valida sesión, autorización por recurso, versionado, límites de entrada, precio/stock, origen efectivo, tarifa, promociones, idempotencia y respuesta.
- **Persistencia:** RLS según arquitectura real, operaciones transaccionales, permisos mínimos y auditoría administrativa. El rol `session_user` del laboratorio no se traslada sin revisión a un pool compartido.
- **Rutas:** origen y destino de referencia, versión y fuente confiable; rechazo de rutas inventadas, caducadas o de otra cesta.
- **Salida:** sin direcciones sensibles en logs, sin pedidos ni pagos reales mientras la bandera de activación siga apagada.

## Contratos mínimos para pruebas

| Operación conceptual | Entrada permitida | Comprobación esencial |
|---|---|---|
| `GET /manager/me` | sesión | Identidad y rol desde servidor; denegar sin sesión |
| `GET /manager/customers` | filtro acotado | Solo clientes asignados |
| `POST /manager/quote-preview` | referencias, versión, clave idempotente | Recalcular íntegramente en servidor; no confiar en importes del cliente |
| `GET /manager/quotes/:id` | ID opaco | Solo actor autorizado; snapshot y caducidad |
| `GET /manager/commissions` | período y paginación | Ventas/estado/importe atribuidos a gestor; sin datos ajenos |
| `POST /admin/delivery-settings` | versión esperada, cambios, motivo | Solo administrador autorizado, CAS y auditoría |

**Son contratos de diseño, no endpoints existentes.** No se han creado rutas HTTP ni acceso a base de datos.

## Criterios de aceptación D1

- Matriz de permisos cliente/gestor/supervisor/administrador general/principal aprobada y cubierta por pruebas.
- Cesta, destinatario y cliente de otro gestor rechazados.
- Alteración de importes, distancias o roles desde navegador rechazada.
- Reintento con igual clave y payload retorna misma cotización; conflicto distinto payload rechazado.
- Cotización caducada o invalidada por cambios no puede confirmarse silenciosamente.
- Importe bruto, importe al cliente, cobertura promocional y comisión separados.
- Interfaz móvil usable sin habilitar pedidos reales.
- CI aislada verde y revisión de cambios; staging y producción requieren autorización independiente.

## Decisiones pendientes de dirección

1. Fórmula exacta y momento de devengo/pago de comisión de gestores.
2. Alcance de lectura del supervisor en ventas, comisiones y auditoría.
3. Vigencia comercial de cotización y retención de claves de idempotencia.
4. Proveedor de rutas para La Habana y reglas de fallback.
5. Política final de tarifa especial y promociones cuando coexisten productos de distintos orígenes.

**Siguiente acción técnica segura:** implementar un prototipo de interfaz de gestores en fixture aislado y pruebas automáticas, reutilizando los módulos sintéticos existentes. No modificar el checkout ni la autenticación real sin revisión de arquitectura y permiso específico.
