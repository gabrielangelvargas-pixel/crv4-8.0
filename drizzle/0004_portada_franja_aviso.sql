CREATE TABLE `portada_aviso` (
	`id` int NOT NULL,
	`titulo` varchar(80),
	`texto` varchar(300),
	`imagen` varchar(255),
	`boton_texto` varchar(30),
	`enlace` varchar(255),
	`desde` date,
	`hasta` date,
	`frecuencia` enum('siempre','dia','una_vez') NOT NULL DEFAULT 'dia',
	`activo` boolean NOT NULL DEFAULT false,
	`creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `portada_aviso_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portada_franja` (
	`id` int NOT NULL,
	`frases` varchar(600) NOT NULL DEFAULT '',
	`icono` varchar(30) NOT NULL DEFAULT 'corazon',
	`color_fondo` char(7) NOT NULL DEFAULT '#1e40af',
	`color_texto` char(7) NOT NULL DEFAULT '#ffffff',
	`activo` boolean NOT NULL DEFAULT false,
	`creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `portada_franja_id` PRIMARY KEY(`id`)
);
