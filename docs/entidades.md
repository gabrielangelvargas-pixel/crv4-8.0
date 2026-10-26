# CRV4 · Diseño de entidades

Base de datos prevista: MySQL (Hostinger). Todas las tablas llevan `creado_en` y `actualizado_en`.

## 1. Usuario (cerrada, v1)

| Campo | Tipo | Notas |
|---|---|---|
| id | entero, PK | |
| nombre_usuario | texto, único | se usa para el login |
| password_hash | texto, opcional | contraseña con hash bcrypt; el cliente la define al confirmar su primer pedido |
| nombre | texto | nombre visible |
| rol_id | FK a Rol | un solo rol por usuario |
| activo | booleano | bloquear sin borrar |
| cliente_id | FK a Cliente, opcional | solo para rol cliente |
| ultimo_acceso | fecha y hora | |

Reglas:
- Login con nombre de usuario (o teléfono, con o sin separadores) y contraseña (mínimo 8 caracteres).
- Desde la gestión solo se crean usuarios con roles de gestión; las cuentas de clientes las crea el checkout.
- Nadie cambia su propio rol ni se desactiva; quien no tiene acceso total no modifica ni crea administradores; siempre queda al menos un administrador activo.
- Cambiar una contraseña cierra las sesiones abiertas de ese usuario (si es la propia, menos la actual).
- Un usuario con ventas o movimientos de stock no se borra: se desactiva.
- Un visitante puede navegar y llenar el carrito sin cuenta. Al confirmar el pedido se le piden algunos datos, se crea su Cliente y su Usuario (rol cliente, el teléfono es el nombre de usuario) y queda con sesión persistente. Si ya existe un cliente con ese teléfono y sin cuenta, la cuenta nueva se le asocia; si ya tiene cuenta, debe ingresar con su contraseña.

## 2. Rubro (cerrada, v1)

| Campo | Tipo | Notas |
|---|---|---|
| id | entero, PK | |
| nombre | texto | único dentro del mismo padre |
| slug | texto, único | para la URL pública |
| descripcion | texto, opcional | |
| rubro_padre_id | FK a Rubro, opcional | vacío = rubro principal; con valor = subrubro |
| orden | entero | orden en el catálogo |
| imagen | texto, opcional | `rubros/<único>.webp`, recortada cuadrada 600 × 600; se muestra en el inicio |
| visitas | entero | veces que se abrió el catálogo filtrado por el rubro (primera página, sin búsqueda, sin contar al personal) |
| visible_web | booleano | |
| activo | booleano | |

Reglas:
- Se usan subrubros para filtrar productos.
- Cada producto pertenece a un único rubro, asignado en el nivel más específico (el subrubro); al filtrar por un rubro principal se muestran también los productos de sus subrubros.

## 3. Producto (cerrada, ficha común, v2)

| Campo | Tipo | Notas |
|---|---|---|
| id | entero, PK | |
| nombre | texto | |
| descripcion | texto | |
| rubro_id | FK a Rubro | siempre un subrubro |
| proveedor_id | FK a Proveedor | |
| tipo_variante | ninguna / color / tamaño / presentación | una sola dimensión por producto (confirmado) |
| imagen | texto, en desuso | foto vieja de la variante principal; al guardar el producto pasa a la variante y queda vacía |
| visible_web | booleano | |
| destacado | booleano | portada |
| activo | booleano | |

## 4. Variante (cerrada, lo que se vende y tiene stock, v1)

| Campo | Tipo | Notas |
|---|---|---|
| id | entero, PK | |
| producto_id | FK a Producto | |
| valor | texto | ej. "Rojo", "Grande", "Blister"; "Única" si el producto no tiene variantes |
| codigo | texto (hasta 13), único | código interno y de barras |
| codigo_proveedor | texto, opcional | |
| precio_costo | decimal | solo visible para admin |
| precio_venta | decimal | |
| precio_oferta | decimal, opcional | vacío = sin oferta |
| stock_actual | decimal | |
| imagen | texto, opcional | ruta dentro de la carpeta de imágenes, ej. `productos/vasos/7790895000997.webp` (ver reglas) |
| es_principal | booleano | la que se muestra por defecto |
| orden | entero | |
| activo | booleano | |

Reglas:
- Todo producto tiene al menos una variante; sin variantes reales tiene una sola ("Única"). Así pedidos, ventas y stock siempre apuntan a una variante.
- La URL pública usa el `codigo` de la variante principal; en la página se elige la variante.
- Cada variante tiene su foto: se ajusta a 500x500 (sin recortar, con fondo blanco), se convierte a WEBP y se guarda fuera de lo publicado (`CARPETA_IMAGENES`, por defecto `~/imagenes`) en `productos/<dirección web del subrubro>/<código de la variante>.webp`. Si cambia el código, el subrubro del producto o la dirección web del subrubro, el archivo se mueve.
- La tarjeta del catálogo usa la foto de la variante principal (o, si no tiene, la de la primera variante con foto). En la ficha, al elegir una variante se muestra su foto; si no tiene, la del producto.

## 5. Proveedor (cerrada, v1)

| Campo | Tipo | Notas |
|---|---|---|
| id | entero, PK | |
| nombre | texto | razón social |
| nombre_fantasia | texto, opcional | |
| contacto | texto, opcional | persona de contacto |
| telefono | texto, opcional | |
| email | texto, opcional | |
| direccion | texto, opcional | |
| notas | texto, opcional | |
| activo | booleano | |

Sin identificación fiscal por ahora. No se registran compras a proveedores por ahora: el stock se ajusta manualmente.

## 6. Cliente (cerrada, v1)

| Campo | Tipo | Notas |
|---|---|---|
| id | entero, PK | |
| nombre | texto | nombre y apellido en un solo campo |
| telefono | texto | obligatorio |
| email | texto, opcional | |
| notas | texto, opcional | internas, solo admin y vendedor |
| origen | web / presencial | |
| activo | booleano | |

Reglas:
- El teléfono se guarda sin espacios ni separadores y no se repite entre clientes (será el usuario de la web).
- "Consumidor final" se precarga para las ventas presenciales: no se borra ni cambia de nombre o teléfono.
- Un cliente con pedidos o con cuenta web no se borra: se desactiva. Una dirección usada en un pedido no se quita.

## 7. Direccion (del cliente, v1)

| Campo | Tipo | Notas |
|---|---|---|
| id | entero, PK | |
| cliente_id | FK a Cliente | un cliente puede tener varias |
| alias | texto, opcional | ej. "Casa", "Trabajo" |
| calle_numero | texto | |
| barrio | texto | |
| localidad | texto | |
| provincia | texto | |
| referencias | texto, opcional | |
| es_principal | booleano | |

Reglas del checkout sin sesión:
- Se piden nombre, teléfono, dirección, y si retira en el local o se envía a una dirección agendada.
- Se crean Cliente, Direccion y Usuario (rol cliente) y queda con sesión persistente.
- El teléfono funciona como nombre de usuario del cliente y se pide una contraseña.

## 8. Pedido (cerrada, v1)

| Campo | Tipo | Notas |
|---|---|---|
| id | entero, PK | |
| numero | entero, único | correlativo visible para el cliente |
| canal | web / presencial | presencial = venta en el local, la carga el vendedor y queda entregada al instante |
| cliente_id | FK a Cliente | obligatorio; en presencial se precarga "Consumidor final" |
| tipo_entrega | retiro / envio | |
| direccion_id | FK a Direccion, opcional | solo si es envío |
| direccion_texto | texto, opcional | copia de la dirección al momento del pedido |
| estado | pendiente / confirmado / preparado / listo_o_enviado / entregado / cancelado | |
| subtotal | decimal | suma de subtotales de venta |
| subtotal_costo | decimal | suma de subtotales de costo (solo admin) |
| adicional | decimal | importe cargado a mano (ej. envío) |
| adicional_detalle | texto, opcional | ej. "Envío" |
| total | decimal | subtotal + adicional |
| notas_cliente | texto, opcional | |
| notas_internas | texto, opcional | |
| atendido_por | FK a Usuario, opcional | admin o vendedor que lo gestiona |

## 9. PedidoItem (cerrada, v1)

| Campo | Tipo | Notas |
|---|---|---|
| id | entero, PK | |
| pedido_id | FK a Pedido | |
| variante_id | FK a Variante | |
| descripcion | texto | copia de nombre + variante al momento del pedido |
| cantidad | decimal | |
| precio_unitario | decimal | precio aplicado (oferta si había) al momento del pedido |
| precio_costo | decimal | costo al momento del pedido (solo admin) |
| subtotal | decimal | cantidad x precio_unitario |
| subtotal_costo | decimal | cantidad x precio_costo |

Reglas del pedido:
- El stock se descuenta cuando el pedido pasa a **entregado**.
- Disponible = stock_actual menos lo comprometido en pedidos confirmados aún no entregados (cálculo, no campo).
- El catálogo público no muestra cantidades: solo "Disponible" o "Sin stock". Si no hay disponible, no se puede agregar al carrito.
- Las ventas presenciales son Pedidos con canal = presencial (no hay entidad Venta aparte).
- Existe un Cliente fijo "Consumidor final" que se precarga al abrir una venta presencial; antes de confirmarla se puede cambiar por un cliente existente o dar de alta uno nuevo, para que quede en su historial.
- Estados: un pedido avanza (puede saltear pasos) o se cancela. Al pasar a entregado descuenta el stock (movimiento entrega_pedido).
- Una venta entregada se puede anular (pasa a cancelado y devuelve el stock con movimientos devolucion); requiere el permiso de eliminar pedidos.
- Los precios y costos de los renglones se toman de la base al registrar la venta, nunca del navegador. El precio aplicado es el de oferta si hay.
- El adicional se puede cambiar mientras el pedido no esté entregado ni cancelado; el total se recalcula.
- Solo se elimina definitivamente un pedido que nunca movió stock.
- El carrito vive en el navegador (solo variante y cantidad); precios y disponibilidad se consultan siempre al servidor.
- Un pedido web entra como canal web, estado pendiente y adicional 0; el costo de envío se carga después como adicional.
- Pagos y medios de pago: más adelante.

## 10. MovimientoStock (cerrada, v1)

| Campo | Tipo | Notas |
|---|---|---|
| id | entero, PK | |
| variante_id | FK a Variante | |
| tipo | ingreso / ajuste / entrega_pedido / devolucion | |
| cantidad | decimal | positiva suma, negativa resta |
| stock_anterior | decimal | |
| stock_nuevo | decimal | |
| pedido_id | FK a Pedido, opcional | cuando lo genera una entrega o devolución |
| usuario_id | FK a Usuario | quién lo hizo |
| motivo | texto, opcional | |
| fecha | fecha y hora | |

Reglas:
- Ingresos y ajustes: solo admin.
- Entregar un pedido genera automáticamente movimientos de tipo entrega_pedido.

## 11. Portada (slider del inicio de la web)

| Campo | Tipo | Notas |
|---|---|---|
| id | entero, PK | |
| titulo | texto, opcional | texto alternativo de la imagen |
| enlace | texto, opcional | página de la web (`/catalogo?rubro=...`) o `https://...` |
| imagen_escritorio | texto | `portadas/<único>-escritorio.webp`, 1920 × 640 (3:1), compu y tablet |
| imagen_movil | texto, opcional | `portadas/<único>-movil.webp`, 1080 × 1080 (1:1), celular |
| orden | entero | menor primero |
| activo | sí/no | |

Reglas:
- Las imágenes se recortan desde el centro al tamaño exacto y se guardan en WEBP en la carpeta de imágenes; cada subida usa un nombre nuevo y borra la anterior.
- En el celular el slider es cuadrado si al menos una activa tiene imagen cuadrada, y ahí solo se muestran las que la tienen. Si ninguna la tiene, se usa la ancha.
- Se administra con el permiso `portada`.

## 12. PortadaBloque (bloques de información debajo del slider)

| Campo | Tipo | Notas |
|---|---|---|
| id | entero, PK | |
| icono | texto | clave de la lista fija de íconos (`src/lib/iconos-bloque.ts`) |
| titulo | texto | hasta 60 letras; se muestra en mayúsculas |
| texto | texto, opcional | hasta 160 letras |
| orden | entero | lo fija el orden de la lista en Gestión |
| activo | sí/no | "Visible" |

Reglas:
- Se editan todos juntos en Gestión › Portada de la web (hasta 8) y se guardan de una vez.
- La migración carga 4 de ejemplo (compra mayorista, descuentos, medios de pago, envíos).

## 13. PortadaFranja (franja de texto que se desplaza en el inicio)

Una sola fila (id = 1); si no existe, vale lo de por defecto (oculta).

| Campo | Tipo | Notas |
|---|---|---|
| id | entero, PK | siempre 1 |
| frases | texto | una por renglón, hasta 10 (600 letras en total) |
| icono | texto | ícono entre frases, de la misma lista que los bloques |
| color_fondo / color_texto | texto | `#rrggbb` |
| activo | sí/no | necesita al menos una frase |

Reglas:
- Se muestra en el inicio, debajo de los bloques de información. Con "reducir movimiento" activado en el equipo queda quieta.

## 14. PortadaAviso (aviso emergente / modal publicitario del inicio)

Una sola fila (id = 1); si no existe, no hay aviso.

| Campo | Tipo | Notas |
|---|---|---|
| id | entero, PK | siempre 1 |
| titulo | texto, opcional | hasta 80 letras |
| texto | texto, opcional | hasta 300 letras; Enter corta la línea |
| imagen | texto, opcional | `portadas/<único>-aviso.webp`, se achica hasta 1080 × 1350 sin recortar (ideal 4:5) |
| boton_texto | texto, opcional | necesita enlace |
| enlace | texto, opcional | página de la web o `https://...`; sin botón, se abre al tocar la imagen |
| desde / hasta | fecha, opcional | fuera de ese rango no aparece (fecha de Argentina) |
| frecuencia | `siempre` \| `dia` \| `una_vez` | cada visita (sesión del navegador), una vez por día o una sola vez |
| activo | sí/no | necesita imagen, título o texto |

Reglas:
- Aparece solo en el inicio. El navegador recuerda que ya se vio; al guardar el aviso cuenta como nuevo y vuelve a mostrarse.

## 15. PortadaRubros (bloque de categorías más visitadas del inicio)

Una sola fila (id = 1); si no existe, el bloque está oculto.

| Campo | Tipo | Notas |
|---|---|---|
| id | entero, PK | siempre 1 |
| titulo | texto | por defecto "Categorías más visitadas" |
| activo | sí/no | |

Reglas:
- Muestra los 4 rubros (principales o subrubros) con productos a la vista que tienen más visitas; a igual cantidad, el orden del catálogo. Va debajo de la franja de texto.

## Para más adelante
Pagos y medios de pago, estadísticas, compras a proveedores, identificación fiscal del proveedor, variantes con dos dimensiones.
