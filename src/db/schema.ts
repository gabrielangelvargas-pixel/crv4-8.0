// Esquema de la base de datos (Drizzle ORM + MySQL/MariaDB).
// Refleja docs/entidades.md. Los importes y cantidades se guardan como DECIMAL
// y Drizzle los devuelve como string para no perder precisión.
import { relations, sql } from "drizzle-orm";
import { ACCIONES, MODULOS } from "@/lib/auth/permisos-catalogo";
import { FRECUENCIAS_AVISO } from "@/lib/promociones";
import {
  type AnyMySqlColumn,
  boolean,
  char,
  date,
  datetime,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

const timestamps = {
  creadoEn: datetime("creado_en", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  actualizadoEn: datetime("actualizado_en", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
};

const importe = (name: string) => decimal(name, { precision: 12, scale: 2 });
const cantidad = (name: string) => decimal(name, { precision: 12, scale: 3 });

export const CODIGOS_ROL = ["admin", "cliente"] as const;
export type CodigoRol = (typeof CODIGOS_ROL)[number];

// 11. Rol. `codigo` identifica los roles del sistema (no se borran).
export const roles = mysqlTable("roles", {
  id: int("id").autoincrement().primaryKey(),
  codigo: mysqlEnum("codigo", CODIGOS_ROL).unique(),
  nombre: varchar("nombre", { length: 60 }).notNull().unique(),
  descripcion: varchar("descripcion", { length: 255 }),
  accesoTotal: boolean("acceso_total").notNull().default(false),
  accesoGestion: boolean("acceso_gestion").notNull().default(true),
  activo: boolean("activo").notNull().default(true),
  ...timestamps,
});

// 12. Permisos de cada rol: combinación de módulo y acción.
export const rolPermisos = mysqlTable(
  "rol_permisos",
  {
    rolId: int("rol_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    modulo: mysqlEnum("modulo", MODULOS).notNull(),
    accion: mysqlEnum("accion", ACCIONES).notNull(),
  },
  (t) => [primaryKey({ columns: [t.rolId, t.modulo, t.accion] })],
);

// 1. Usuario
export const usuarios = mysqlTable("usuarios", {
  id: int("id").autoincrement().primaryKey(),
  nombreUsuario: varchar("nombre_usuario", { length: 60 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 100 }),
  nombre: varchar("nombre", { length: 120 }).notNull(),
  rolId: int("rol_id")
    .notNull()
    .references(() => roles.id),
  activo: boolean("activo").notNull().default(true),
  clienteId: int("cliente_id").references((): AnyMySqlColumn => clientes.id),
  ultimoAcceso: datetime("ultimo_acceso", { mode: "date" }),
  ...timestamps,
});

// Sesiones de login. Se guarda el hash del token, nunca el token.
export const sesiones = mysqlTable(
  "sesiones",
  {
    id: char("id", { length: 64 }).primaryKey(),
    usuarioId: int("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    expiraEn: datetime("expira_en", { mode: "date" }).notNull(),
    creadoEn: timestamps.creadoEn,
  },
  (t) => [index("sesiones_usuario_idx").on(t.usuarioId)],
);

// 2. Rubro (con subrubros)
export const rubros = mysqlTable(
  "rubros",
  {
    id: int("id").autoincrement().primaryKey(),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    descripcion: text("descripcion"),
    rubroPadreId: int("rubro_padre_id").references((): AnyMySqlColumn => rubros.id),
    orden: int("orden").notNull().default(0),
    imagen: varchar("imagen", { length: 255 }),
    visibleWeb: boolean("visible_web").notNull().default(true),
    activo: boolean("activo").notNull().default(true),
    ...timestamps,
  },
  (t) => [uniqueIndex("rubros_padre_nombre_uq").on(t.rubroPadreId, t.nombre)],
);

// 5. Proveedor
export const proveedores = mysqlTable("proveedores", {
  id: int("id").autoincrement().primaryKey(),
  nombre: varchar("nombre", { length: 150 }).notNull(),
  nombreFantasia: varchar("nombre_fantasia", { length: 150 }),
  contacto: varchar("contacto", { length: 120 }),
  telefono: varchar("telefono", { length: 40 }),
  email: varchar("email", { length: 150 }),
  direccion: varchar("direccion", { length: 200 }),
  notas: text("notas"),
  activo: boolean("activo").notNull().default(true),
  ...timestamps,
});

export const TIPOS_VARIANTE = ["ninguna", "color", "tamano", "presentacion"] as const;

// 3. Producto (ficha común)
export const productos = mysqlTable(
  "productos",
  {
    id: int("id").autoincrement().primaryKey(),
    nombre: varchar("nombre", { length: 150 }).notNull(),
    descripcion: text("descripcion"),
    rubroId: int("rubro_id")
      .notNull()
      .references(() => rubros.id),
    proveedorId: int("proveedor_id").references(() => proveedores.id),
    tipoVariante: mysqlEnum("tipo_variante", TIPOS_VARIANTE)
      .notNull()
      .default("ninguna"),
    imagen: varchar("imagen", { length: 255 }),
    visibleWeb: boolean("visible_web").notNull().default(true),
    destacado: boolean("destacado").notNull().default(false),
    activo: boolean("activo").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("productos_rubro_idx").on(t.rubroId)],
);

// 4. Variante (lo que se vende y tiene stock)
export const variantes = mysqlTable(
  "variantes",
  {
    id: int("id").autoincrement().primaryKey(),
    productoId: int("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "cascade" }),
    valor: varchar("valor", { length: 80 }).notNull().default("Única"),
    codigo: varchar("codigo", { length: 13 }).notNull().unique(),
    codigoProveedor: varchar("codigo_proveedor", { length: 40 }),
    precioCosto: importe("precio_costo").notNull().default("0"),
    precioVenta: importe("precio_venta").notNull().default("0"),
    precioOferta: importe("precio_oferta"),
    stockActual: cantidad("stock_actual").notNull().default("0"),
    imagen: varchar("imagen", { length: 255 }),
    esPrincipal: boolean("es_principal").notNull().default(false),
    orden: int("orden").notNull().default(0),
    activo: boolean("activo").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("variantes_producto_idx").on(t.productoId)],
);

export const ORIGENES_CLIENTE = ["web", "presencial"] as const;

// Cliente precargado para las ventas presenciales; no se borra ni se renombra.
export const CONSUMIDOR_FINAL = "Consumidor final";

// 6. Cliente
export const clientes = mysqlTable(
  "clientes",
  {
    id: int("id").autoincrement().primaryKey(),
    nombre: varchar("nombre", { length: 150 }).notNull(),
    telefono: varchar("telefono", { length: 40 }).notNull(),
    email: varchar("email", { length: 150 }),
    notas: text("notas"),
    origen: mysqlEnum("origen", ORIGENES_CLIENTE).notNull().default("web"),
    activo: boolean("activo").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("clientes_telefono_idx").on(t.telefono)],
);

// 7. Dirección (varias por cliente)
export const direcciones = mysqlTable("direcciones", {
  id: int("id").autoincrement().primaryKey(),
  clienteId: int("cliente_id")
    .notNull()
    .references(() => clientes.id, { onDelete: "cascade" }),
  alias: varchar("alias", { length: 60 }),
  calleNumero: varchar("calle_numero", { length: 150 }).notNull(),
  barrio: varchar("barrio", { length: 100 }),
  localidad: varchar("localidad", { length: 100 }).notNull(),
  provincia: varchar("provincia", { length: 100 }).notNull(),
  referencias: varchar("referencias", { length: 255 }),
  esPrincipal: boolean("es_principal").notNull().default(false),
  ...timestamps,
});

export const CANALES = ["web", "presencial"] as const;
export const TIPOS_ENTREGA = ["retiro", "envio"] as const;
export const ESTADOS_PEDIDO = [
  "pendiente",
  "confirmado",
  "preparado",
  "listo_o_enviado",
  "entregado",
  "cancelado",
] as const;

// 8. Pedido (web y ventas presenciales)
export const pedidos = mysqlTable(
  "pedidos",
  {
    id: int("id").autoincrement().primaryKey(),
    numero: int("numero").notNull().unique(),
    canal: mysqlEnum("canal", CANALES).notNull(),
    clienteId: int("cliente_id")
      .notNull()
      .references(() => clientes.id),
    tipoEntrega: mysqlEnum("tipo_entrega", TIPOS_ENTREGA).notNull().default("retiro"),
    direccionId: int("direccion_id").references(() => direcciones.id),
    direccionTexto: varchar("direccion_texto", { length: 400 }),
    estado: mysqlEnum("estado", ESTADOS_PEDIDO).notNull().default("pendiente"),
    subtotal: importe("subtotal").notNull().default("0"),
    subtotalCosto: importe("subtotal_costo").notNull().default("0"),
    adicional: importe("adicional").notNull().default("0"),
    adicionalDetalle: varchar("adicional_detalle", { length: 100 }),
    total: importe("total").notNull().default("0"),
    notasCliente: text("notas_cliente"),
    notasInternas: text("notas_internas"),
    atendidoPor: int("atendido_por").references(() => usuarios.id),
    ...timestamps,
  },
  (t) => [
    index("pedidos_cliente_idx").on(t.clienteId),
    index("pedidos_estado_idx").on(t.estado),
  ],
);

// 9. Renglón de pedido
export const pedidoItems = mysqlTable(
  "pedido_items",
  {
    id: int("id").autoincrement().primaryKey(),
    pedidoId: int("pedido_id")
      .notNull()
      .references(() => pedidos.id, { onDelete: "cascade" }),
    varianteId: int("variante_id")
      .notNull()
      .references(() => variantes.id),
    descripcion: varchar("descripcion", { length: 250 }).notNull(),
    cantidad: cantidad("cantidad").notNull(),
    precioUnitario: importe("precio_unitario").notNull(),
    precioCosto: importe("precio_costo").notNull(),
    subtotal: importe("subtotal").notNull(),
    subtotalCosto: importe("subtotal_costo").notNull(),
  },
  (t) => [index("pedido_items_pedido_idx").on(t.pedidoId)],
);

export const TIPOS_MOVIMIENTO = ["ingreso", "ajuste", "entrega_pedido", "devolucion"] as const;

// 10. Movimiento de stock (historial)
export const movimientosStock = mysqlTable(
  "movimientos_stock",
  {
    id: int("id").autoincrement().primaryKey(),
    varianteId: int("variante_id")
      .notNull()
      .references(() => variantes.id),
    tipo: mysqlEnum("tipo", TIPOS_MOVIMIENTO).notNull(),
    cantidad: cantidad("cantidad").notNull(),
    stockAnterior: cantidad("stock_anterior").notNull(),
    stockNuevo: cantidad("stock_nuevo").notNull(),
    pedidoId: int("pedido_id").references(() => pedidos.id),
    usuarioId: int("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    motivo: varchar("motivo", { length: 255 }),
    fecha: timestamps.creadoEn,
  },
  (t) => [index("movimientos_variante_idx").on(t.varianteId)],
);

// 13. Portada: imágenes del slider del inicio de la web.
export const portadas = mysqlTable("portadas", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 120 }),
  enlace: varchar("enlace", { length: 255 }),
  imagenEscritorio: varchar("imagen_escritorio", { length: 255 }).notNull(),
  imagenMovil: varchar("imagen_movil", { length: 255 }),
  orden: int("orden").notNull().default(0),
  activo: boolean("activo").notNull().default(true),
  ...timestamps,
});

// 14. Bloques de información debajo del slider (ícono, título y texto).
export const portadaBloques = mysqlTable("portada_bloques", {
  id: int("id").autoincrement().primaryKey(),
  icono: varchar("icono", { length: 30 }).notNull(),
  titulo: varchar("titulo", { length: 60 }).notNull(),
  texto: varchar("texto", { length: 160 }),
  orden: int("orden").notNull().default(0),
  activo: boolean("activo").notNull().default(true),
  ...timestamps,
});

// 15. Franja de texto que se desplaza en el inicio (una sola fila, id = 1).
export const portadaFranja = mysqlTable("portada_franja", {
  id: int("id").primaryKey(),
  frases: varchar("frases", { length: 600 }).notNull().default(""),
  icono: varchar("icono", { length: 30 }).notNull().default("corazon"),
  colorFondo: char("color_fondo", { length: 7 }).notNull().default("#1e40af"),
  colorTexto: char("color_texto", { length: 7 }).notNull().default("#ffffff"),
  activo: boolean("activo").notNull().default(false),
  ...timestamps,
});

// 16. Aviso emergente (modal publicitario) del inicio (una sola fila, id = 1).
export const portadaAviso = mysqlTable("portada_aviso", {
  id: int("id").primaryKey(),
  titulo: varchar("titulo", { length: 80 }),
  texto: varchar("texto", { length: 300 }),
  imagen: varchar("imagen", { length: 255 }),
  botonTexto: varchar("boton_texto", { length: 30 }),
  enlace: varchar("enlace", { length: 255 }),
  desde: date("desde", { mode: "string" }),
  hasta: date("hasta", { mode: "string" }),
  frecuencia: mysqlEnum("frecuencia", FRECUENCIAS_AVISO).notNull().default("dia"),
  activo: boolean("activo").notNull().default(false),
  ...timestamps,
});

// Relaciones (para consultas con `db.query`)
export const rolesRelations = relations(roles, ({ many }) => ({
  permisos: many(rolPermisos),
  usuarios: many(usuarios),
}));

export const rolPermisosRelations = relations(rolPermisos, ({ one }) => ({
  rol: one(roles, { fields: [rolPermisos.rolId], references: [roles.id] }),
}));

export const usuariosRelations = relations(usuarios, ({ one }) => ({
  rol: one(roles, { fields: [usuarios.rolId], references: [roles.id] }),
  cliente: one(clientes, { fields: [usuarios.clienteId], references: [clientes.id] }),
}));

export const rubrosRelations = relations(rubros, ({ one, many }) => ({
  padre: one(rubros, {
    fields: [rubros.rubroPadreId],
    references: [rubros.id],
    relationName: "subrubros",
  }),
  subrubros: many(rubros, { relationName: "subrubros" }),
  productos: many(productos),
}));

export const productosRelations = relations(productos, ({ one, many }) => ({
  rubro: one(rubros, { fields: [productos.rubroId], references: [rubros.id] }),
  proveedor: one(proveedores, {
    fields: [productos.proveedorId],
    references: [proveedores.id],
  }),
  variantes: many(variantes),
}));

export const variantesRelations = relations(variantes, ({ one }) => ({
  producto: one(productos, { fields: [variantes.productoId], references: [productos.id] }),
}));

export const clientesRelations = relations(clientes, ({ many }) => ({
  direcciones: many(direcciones),
  pedidos: many(pedidos),
}));

export const direccionesRelations = relations(direcciones, ({ one }) => ({
  cliente: one(clientes, { fields: [direcciones.clienteId], references: [clientes.id] }),
}));

export const pedidosRelations = relations(pedidos, ({ one, many }) => ({
  cliente: one(clientes, { fields: [pedidos.clienteId], references: [clientes.id] }),
  direccion: one(direcciones, {
    fields: [pedidos.direccionId],
    references: [direcciones.id],
  }),
  items: many(pedidoItems),
}));

export const pedidoItemsRelations = relations(pedidoItems, ({ one }) => ({
  pedido: one(pedidos, { fields: [pedidoItems.pedidoId], references: [pedidos.id] }),
  variante: one(variantes, { fields: [pedidoItems.varianteId], references: [variantes.id] }),
}));
