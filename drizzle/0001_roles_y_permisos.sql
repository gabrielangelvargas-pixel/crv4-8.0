CREATE TABLE `rol_permisos` (
	`rol_id` int NOT NULL,
	`modulo` enum('rubros','proveedores','productos','stock','clientes','pedidos','usuarios','roles') NOT NULL,
	`accion` enum('ver','crear','editar','eliminar') NOT NULL,
	CONSTRAINT `rol_permisos_rol_id_modulo_accion_pk` PRIMARY KEY(`rol_id`,`modulo`,`accion`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` enum('admin','cliente'),
	`nombre` varchar(60) NOT NULL,
	`descripcion` varchar(255),
	`acceso_total` boolean NOT NULL DEFAULT false,
	`acceso_gestion` boolean NOT NULL DEFAULT true,
	`activo` boolean NOT NULL DEFAULT true,
	`creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_codigo_unique` UNIQUE(`codigo`),
	CONSTRAINT `roles_nombre_unique` UNIQUE(`nombre`)
);
--> statement-breakpoint
-- Roles iniciales y permisos del Vendedor (editado a mano)
INSERT INTO `roles` (`id`, `codigo`, `nombre`, `descripcion`, `acceso_total`, `acceso_gestion`) VALUES
	(1, 'admin', 'Administrador', 'Acceso total al sistema', true, true),
	(2, NULL, 'Vendedor', 'Atiende ventas y pedidos', false, true),
	(3, 'cliente', 'Cliente', 'Compra en la web; no entra a gestión', false, false);--> statement-breakpoint
INSERT INTO `rol_permisos` (`rol_id`, `modulo`, `accion`) VALUES
	(2, 'rubros', 'ver'),
	(2, 'productos', 'ver'),
	(2, 'stock', 'ver'),
	(2, 'clientes', 'ver'), (2, 'clientes', 'crear'), (2, 'clientes', 'editar'),
	(2, 'pedidos', 'ver'), (2, 'pedidos', 'crear'), (2, 'pedidos', 'editar');--> statement-breakpoint
-- Pasa los usuarios existentes del campo `rol` a `rol_id` sin perder datos
ALTER TABLE `usuarios` ADD `rol_id` int;--> statement-breakpoint
UPDATE `usuarios` SET `rol_id` = CASE `rol` WHEN 'admin' THEN 1 WHEN 'vendedor' THEN 2 ELSE 3 END;--> statement-breakpoint
ALTER TABLE `usuarios` MODIFY `rol_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `rol_permisos` ADD CONSTRAINT `rol_permisos_rol_id_roles_id_fk` FOREIGN KEY (`rol_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_rol_id_roles_id_fk` FOREIGN KEY (`rol_id`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usuarios` DROP COLUMN `rol`;