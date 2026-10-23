CREATE TABLE `portadas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(120),
	`enlace` varchar(255),
	`imagen_escritorio` varchar(255) NOT NULL,
	`imagen_movil` varchar(255),
	`orden` int NOT NULL DEFAULT 0,
	`activo` boolean NOT NULL DEFAULT true,
	`creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `portadas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `rol_permisos` MODIFY COLUMN `modulo` enum('rubros','proveedores','productos','stock','clientes','pedidos','usuarios','roles','portada') NOT NULL;