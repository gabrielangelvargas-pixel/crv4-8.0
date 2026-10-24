CREATE TABLE `portada_rubros` (
	`id` int NOT NULL,
	`titulo` varchar(80) NOT NULL DEFAULT 'Categorías más visitadas',
	`activo` boolean NOT NULL DEFAULT false,
	`creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `portada_rubros_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `rubros` ADD `visitas` int DEFAULT 0 NOT NULL;