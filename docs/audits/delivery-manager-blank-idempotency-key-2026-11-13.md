# Validación de claves de idempotencia en blanco — 13 noviembre 2026

## Hallazgo
En el prototipo PostgreSQL desechable, `quote_preview` validaba `p_key` solo por longitud entre 1 y 80 caracteres. Una cadena de espacios (`'   '`) pasaba la validación y podía persistirse como identificador de operación. La aceptación se reprodujo por inspección de la condición y se añadió un caso de reproducción en la rama aislada.

## Corrección acotada
Se agrega `btrim(p_key)=''` al rechazo de entrada `invalid_request` (SQLSTATE `22023`). No se modifica la semántica de las claves válidas, el cálculo, los roles, las políticas RLS ni el sistema de locks.

## Prueba
La regresión Python registra el número de cotizaciones visibles para el gestor, llama a `quote_preview('   ','cart-a','customer-a',1)`, exige `psycopg.errors.InvalidParameterValue` y comprueba que el recuento no cambió. Se ejecuta en PostgreSQL desechable con el resto de la batería.

## Evidencia
- [Reproducción en rama aislada — 3b444b1](https://github.com/Liuben810921/enlace-digital/commit/3b444b1039bca2500674a5aa96c0a7becacb85f9)
- [Regresión — e01fdcb](https://github.com/Liuben810921/enlace-digital/commit/e01fdcbbc32b7c0ff24b21204b5889192c515b3f)
- [Corrección SQL — 8f0debb](https://github.com/Liuben810921/enlace-digital/commit/8f0debb745ce8aba7e5b27517e3812a2f6470023)
- [CI #43514891841](https://github.com/Liuben810921/enlace-digital/actions/runs/43514891841): en cola en la primera consulta, asociada al commit de regresión anterior a la corrección SQL. **No demuestra la corrección**.
- La ejecución sobre el commit SQL corregido aún no figuraba en la lista de GitHub Actions en la consulta inicial.

**Estado:** pendiente de verificación de CI sobre `8f0debb` o commit posterior que contenga la corrección y la regresión. No cerrar hasta éxito comprobado.

**Límites:** solo GitHub en rama aislada; no se accedió ni modificó Supabase, staging, producción, clientes reales ni pedidos.

## Cierre definitivo — 13 noviembre 2026

**Validación confirmada:** [GitHub Actions #43514938955](https://github.com/Liuben810921/enlace-digital/actions/runs/43514938955) finalizó `completed/success`, incluido el trabajo `test` (ID `132194388094`). Commit validado: `8832f4ea8c246f079bd84f99f5328f08ad385a12`.

Este commit incorpora la condición SQL `btrim(p_key)=''` para rechazar claves de operación formadas únicamente por espacios y la regresión que comprueba el rechazo mediante `InvalidParameterValue` y la ausencia de nuevas cotizaciones persistidas. Las pruebas cubren claves de uno y varios espacios.

**Dictamen:** auditoría de claves de idempotencia en blanco **cerrada satisfactoriamente** para el laboratorio PostgreSQL desechable. El cierre es exclusivamente documental; no implica fusión, despliegue ni validación de staging o producción. Se respetaron las restricciones de no acceder ni modificar Supabase, staging, producción, clientes reales o pedidos.
