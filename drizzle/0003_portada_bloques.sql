CREATE TABLE `portada_bloques` (
	`id` int AUTO_INCREMENT NOT NULL,
	`icono` varchar(30) NOT NULL,
	`titulo` varchar(60) NOT NULL,
	`texto` varchar(160),
	`orden` int NOT NULL DEFAULT 0,
	`activo` boolean NOT NULL DEFAULT true,
	`creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `portada_bloques_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
INSERT INTO `portada_bloques` (`icono`, `titulo`, `texto`, `orden`) VALUES
	('cajas', 'Compra mayorista', 'Mínimo de inversión $100.000.', 0),
	('etiqueta', 'Descuentos', 'Superando los $200.000 en tu pedido.', 1),
	('billetera', 'Medios de pago', 'Tarjetas, transferencia y efectivo.', 2),
	('camion', 'Envíos al país', 'Despachos rápidos y seguros.', 3);
