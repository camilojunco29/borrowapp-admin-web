-- Esquema PostgreSQL derivado del modelo ORM existente. Solo base NUEVA de pruebas.

-- No contiene DROP, DELETE, usuarios reales ni credenciales de conexión.

BEGIN;

CREATE TABLE usuarios (
	id SERIAL NOT NULL,
	nombre VARCHAR(120) NOT NULL,
	correo VARCHAR(160) NOT NULL,
	contrasena_hash VARCHAR(255) NOT NULL,
	PRIMARY KEY (id)
);

CREATE UNIQUE INDEX ix_usuarios_correo ON usuarios (correo);

CREATE TABLE organizaciones (
	id SERIAL NOT NULL,
	nombre VARCHAR(160) NOT NULL,
	tipo VARCHAR(40) NOT NULL,
	codigo VARCHAR(5) NOT NULL,
	punto_central VARCHAR(200) NOT NULL,
	creada_por INTEGER NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(creada_por) REFERENCES usuarios (id)
);

CREATE UNIQUE INDEX ix_organizaciones_codigo ON organizaciones (codigo);

CREATE TABLE membresias (
	id SERIAL NOT NULL,
	usuario_id INTEGER NOT NULL,
	organizacion_id INTEGER NOT NULL,
	rol VARCHAR(40) NOT NULL,
	estado VARCHAR(40) NOT NULL,
	identificador_interno VARCHAR(60) NOT NULL,
	sancion_motivo TEXT,
	sancion_hasta TIMESTAMP WITHOUT TIME ZONE,
	PRIMARY KEY (id),
	CONSTRAINT uq_membresia UNIQUE (usuario_id, organizacion_id),
	FOREIGN KEY(usuario_id) REFERENCES usuarios (id),
	FOREIGN KEY(organizacion_id) REFERENCES organizaciones (id)
);

CREATE INDEX ix_membresias_organizacion_id ON membresias (organizacion_id);

CREATE INDEX ix_membresias_usuario_id ON membresias (usuario_id);

CREATE TABLE necesidades (
	id SERIAL NOT NULL,
	organizacion_id INTEGER NOT NULL,
	solicitante_id INTEGER NOT NULL,
	objeto VARCHAR(160) NOT NULL,
	descripcion TEXT NOT NULL,
	fecha_inicio TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	fecha_fin TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	estado VARCHAR(40) NOT NULL,
	creada_en TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(organizacion_id) REFERENCES organizaciones (id),
	FOREIGN KEY(solicitante_id) REFERENCES usuarios (id)
);

CREATE INDEX ix_necesidades_organizacion_id ON necesidades (organizacion_id);

CREATE TABLE ofertas (
	id SERIAL NOT NULL,
	necesidad_id INTEGER NOT NULL,
	prestador_id INTEGER NOT NULL,
	modalidad VARCHAR(40) NOT NULL,
	precio FLOAT,
	unidad_cobro VARCHAR(40),
	fecha_entrega TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	estado VARCHAR(40) NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(necesidad_id) REFERENCES necesidades (id),
	FOREIGN KEY(prestador_id) REFERENCES usuarios (id)
);

CREATE INDEX ix_ofertas_necesidad_id ON ofertas (necesidad_id);

CREATE UNIQUE INDEX uq_una_oferta_aceptada ON ofertas (necesidad_id) WHERE estado = 'ACEPTADA';

CREATE TABLE prestamos (
	id SERIAL NOT NULL,
	oferta_id INTEGER NOT NULL,
	necesidad_id INTEGER NOT NULL,
	organizacion_id INTEGER NOT NULL,
	solicitante_id INTEGER NOT NULL,
	prestador_id INTEGER NOT NULL,
	objeto VARCHAR(160) NOT NULL,
	fecha_inicio TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	fecha_fin TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	modalidad VARCHAR(40) NOT NULL,
	precio_total FLOAT NOT NULL,
	punto_central VARCHAR(200) NOT NULL,
	estado VARCHAR(40) NOT NULL,
	en_conflicto BOOLEAN NOT NULL,
	entrega_prestador_en TIMESTAMP WITHOUT TIME ZONE,
	entrega_solicitante_en TIMESTAMP WITHOUT TIME ZONE,
	devolucion_solicitante_en TIMESTAMP WITHOUT TIME ZONE,
	devolucion_prestador_en TIMESTAMP WITHOUT TIME ZONE,
	PRIMARY KEY (id),
	UNIQUE (oferta_id),
	FOREIGN KEY(oferta_id) REFERENCES ofertas (id),
	FOREIGN KEY(necesidad_id) REFERENCES necesidades (id),
	FOREIGN KEY(organizacion_id) REFERENCES organizaciones (id),
	FOREIGN KEY(solicitante_id) REFERENCES usuarios (id),
	FOREIGN KEY(prestador_id) REFERENCES usuarios (id)
);

CREATE INDEX ix_prestamos_organizacion_id ON prestamos (organizacion_id);

CREATE TABLE reportes (
	id SERIAL NOT NULL,
	prestamo_id INTEGER NOT NULL,
	organizacion_id INTEGER NOT NULL,
	reportante_id INTEGER NOT NULL,
	reportado_id INTEGER NOT NULL,
	tipo VARCHAR(40) NOT NULL,
	descripcion TEXT NOT NULL,
	estado VARCHAR(40) NOT NULL,
	creado_en TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	sancion VARCHAR(40),
	nota_resolucion TEXT,
	admin_id INTEGER,
	resuelto_en TIMESTAMP WITHOUT TIME ZONE,
	PRIMARY KEY (id),
	FOREIGN KEY(prestamo_id) REFERENCES prestamos (id),
	FOREIGN KEY(organizacion_id) REFERENCES organizaciones (id),
	FOREIGN KEY(reportante_id) REFERENCES usuarios (id),
	FOREIGN KEY(reportado_id) REFERENCES usuarios (id),
	FOREIGN KEY(admin_id) REFERENCES usuarios (id)
);

CREATE INDEX ix_reportes_organizacion_id ON reportes (organizacion_id);

CREATE INDEX ix_reportes_prestamo_id ON reportes (prestamo_id);

COMMIT;
