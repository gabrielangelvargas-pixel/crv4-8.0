CREATE TABLE `clientes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(150) NOT NULL,
	`telefono` varchar(40) NOT NULL,
	`email` varchar(150),
	`notas` text,
	`origen` enum('web','presencial') NOT NULL DEFAULT 'web',
	`activo` boolean NOT NULL DEFAULT true,
	`creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `clientes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `direcciones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cliente_id` int NOT NULL,
	`alias` varchar(60),
	`calle_numero` varchar(150) NOT NULL,
	`barrio` varchar(100),
	`localidad` varchar(100) NOT NULL,
	`provincia` varchar(100) NOT NULL,
	`referencias` varchar(255),
	`es_principal` boolean NOT NULL DEFAULT false,
	`creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `direcciones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `movimientos_stock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`variante_id` int NOT NULL,
	`tipo` enum('ingreso','ajuste','entrega_pedido','devolucion') NOT NULL,
	`cantidad` decimal(12,3) NOT NULL,
	`stock_anterior` decimal(12,3) NOT NULL,
	`stock_nuevo` decimal(12,3) NOT NULL,
	`pedido_id` int,
	`usuario_id` int NOT NULL,
	`motivo` varchar(255),
	`creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `movimientos_stock_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pedido_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pedido_id` int NOT NULL,
	`variante_id` int NOT NULL,
	`descripcion` varchar(250) NOT NULL,
	`cantidad` decimal(12,3) NOT NULL,
	`precio_unitario` decimal(12,2) NOT NULL,
	`precio_costo` decimal(12,2) NOT NULL,
	`subtotal` decimal(12,2) NOT NULL,
	`subtotal_costo` decimal(12,2) NOT NULL,
	CONSTRAINT `pedido_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pedidos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numero` int NOT NULL,
	`canal` enum('web','presencial') NOT NULL,
	`cliente_id` int NOT NULL,
	`tipo_entrega` enum('retiro','envio') NOT NULL DEFAULT 'retiro',
	`direccion_id` int,
	`direccion_texto` varchar(400),
	`estado` enum('pendiente','confirmado','preparado','listo_o_enviado','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
	`subtotal` decimal(12,2) NOT NULL DEFAULT '0',
	`subtotal_costo` decimal(12,2) NOT NULL DEFAULT '0',
	`adicional` decimal(12,2) NOT NULL DEFAULT '0',
	`adicional_detalle` varchar(100),
	`total` decimal(12,2) NOT NULL DEFAULT '0',
	`notas_cliente` text,
	`notas_internas` text,
	`atendido_por` int,
	`creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `pedidos_id` PRIMARY KEY(`id`),
	CONSTRAINT `pedidos_numero_unique` UNIQUE(`numero`)
);
--> statement-breakpoint
CREATE TABLE `productos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(150) NOT NULL,
	`descripcion` text,
	`rubro_id` int NOT NULL,
	`proveedor_id` int,
	`tipo_variante` enum('ninguna','color','tamano','presentacion') NOT NULL DEFAULT 'ninguna',
	`imagen` varchar(255),
	`visible_web` boolean NOT NULL DEFAULT true,
	`destacado` boolean NOT NULL DEFAULT false,
	`activo` boolean NOT NULL DEFAULT true,
	`creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `productos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proveedores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(150) NOT NULL,
	`nombre_fantasia` varchar(150),
	`contacto` varchar(120),
	`telefono` varchar(40),
	`email` varchar(150),
	`direccion` varchar(200),
	`notas` text,
	`activo` boolean NOT NULL DEFAULT true,
	`creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `proveedores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rubros` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(100) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`descripcion` text,
	`rubro_padre_id` int,
	`orden` int NOT NULL DEFAULT 0,
	`imagen` varchar(255),
	`visible_web` boolean NOT NULL DEFAULT true,
	`activo` boolean NOT NULL DEFAULT true,
	`creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `rubros_id` PRIMARY KEY(`id`),
	CONSTRAINT `rubros_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `rubros_padre_nombre_uq` UNIQUE(`rubro_padre_id`,`nombre`)
);
--> statement-breakpoint
CREATE TABLE `sesiones` (
	`id` char(64) NOT NULL,
	`usuario_id` int NOT NULL,
	`expira_en` datetime NOT NULL,
	`creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `sesiones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre_usuario` varchar(60) NOT NULL,
	`password_hash` varchar(100),
	`nombre` varchar(120) NOT NULL,
	`rol` enum('admin','vendedor','cliente') NOT NULL,
	`activo` boolean NOT NULL DEFAULT true,
	`cliente_id` int,
	`ultimo_acceso` datetime,
	`creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `usuarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `usuarios_nombre_usuario_unique` UNIQUE(`nombre_usuario`)
);
--> statement-breakpoint
CREATE TABLE `variantes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`producto_id` int NOT NULL,
	`valor` varchar(80) NOT NULL DEFAULT 'Única',
	`codigo` varchar(13) NOT NULL,
	`codigo_proveedor` varchar(40),
	`precio_costo` decimal(12,2) NOT NULL DEFAULT '0',
	`precio_venta` decimal(12,2) NOT NULL DEFAULT '0',
	`precio_oferta` decimal(12,2),
	`stock_actual` decimal(12,3) NOT NULL DEFAULT '0',
	`imagen` varchar(255),
	`es_principal` boolean NOT NULL DEFAULT false,
	`orden` int NOT NULL DEFAULT 0,
	`activo` boolean NOT NULL DEFAULT true,
	`creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `variantes_id` PRIMARY KEY(`id`),
	CONSTRAINT `variantes_codigo_unique` UNIQUE(`codigo`)
);
--> statement-breakpoint
ALTER TABLE `direcciones` ADD CONSTRAINT `direcciones_cliente_id_clientes_id_fk` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `movimientos_stock` ADD CONSTRAINT `movimientos_stock_variante_id_variantes_id_fk` FOREIGN KEY (`variante_id`) REFERENCES `variantes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `movimientos_stock` ADD CONSTRAINT `movimientos_stock_pedido_id_pedidos_id_fk` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `movimientos_stock` ADD CONSTRAINT `movimientos_stock_usuario_id_usuarios_id_fk` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pedido_items` ADD CONSTRAINT `pedido_items_pedido_id_pedidos_id_fk` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pedido_items` ADD CONSTRAINT `pedido_items_variante_id_variantes_id_fk` FOREIGN KEY (`variante_id`) REFERENCES `variantes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_cliente_id_clientes_id_fk` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_direccion_id_direcciones_id_fk` FOREIGN KEY (`direccion_id`) REFERENCES `direcciones`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_atendido_por_usuarios_id_fk` FOREIGN KEY (`atendido_por`) REFERENCES `usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `productos` ADD CONSTRAINT `productos_rubro_id_rubros_id_fk` FOREIGN KEY (`rubro_id`) REFERENCES `rubros`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `productos` ADD CONSTRAINT `productos_proveedor_id_proveedores_id_fk` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rubros` ADD CONSTRAINT `rubros_rubro_padre_id_rubros_id_fk` FOREIGN KEY (`rubro_padre_id`) REFERENCES `rubros`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sesiones` ADD CONSTRAINT `sesiones_usuario_id_usuarios_id_fk` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_cliente_id_clientes_id_fk` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `variantes` ADD CONSTRAINT `variantes_producto_id_productos_id_fk` FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `clientes_telefono_idx` ON `clientes` (`telefono`);--> statement-breakpoint
CREATE INDEX `movimientos_variante_idx` ON `movimientos_stock` (`variante_id`);--> statement-breakpoint
CREATE INDEX `pedido_items_pedido_idx` ON `pedido_items` (`pedido_id`);--> statement-breakpoint
CREATE INDEX `pedidos_cliente_idx` ON `pedidos` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `pedidos_estado_idx` ON `pedidos` (`estado`);--> statement-breakpoint
CREATE INDEX `productos_rubro_idx` ON `productos` (`rubro_id`);--> statement-breakpoint
CREATE INDEX `sesiones_usuario_idx` ON `sesiones` (`usuario_id`);--> statement-breakpoint
CREATE INDEX `variantes_producto_idx` ON `variantes` (`producto_id`);