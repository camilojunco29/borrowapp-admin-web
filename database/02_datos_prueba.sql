-- Datos completamente ficticios para una base de pruebas vacía.
-- Los hashes son bcrypt válidos de una contraseña aleatoria descartada.
-- No hay contraseñas de acceso publicadas ni datos de cuentas reales.
BEGIN;
INSERT INTO usuarios (id,nombre,correo,contrasena_hash) VALUES
(1001,'Administrador Demo','admin@example.invalid','$2b$12$hPyAFh.pxpQEIxMysJer2u/P7i6s4GItmclw1g0mK420U3kIiXPiC'),
(1002,'Solicitante Demo','solicitante@example.invalid','$2b$12$hPyAFh.pxpQEIxMysJer2u/P7i6s4GItmclw1g0mK420U3kIiXPiC'),
(1003,'Prestador Demo','prestador@example.invalid','$2b$12$hPyAFh.pxpQEIxMysJer2u/P7i6s4GItmclw1g0mK420U3kIiXPiC');
INSERT INTO organizaciones (id,nombre,tipo,codigo,punto_central,creada_por) VALUES
(1001,'Universidad Demo','UNIVERSIDAD','K7Q4X','Biblioteca de prueba',1001),
(1002,'Empresa Demo','EMPRESA','M2X9P','Recepción de prueba',1003);
INSERT INTO membresias (id,usuario_id,organizacion_id,rol,estado,identificador_interno,sancion_motivo,sancion_hasta) VALUES
(1001,1001,1001,'ADMINISTRADOR','ACTIVO','ADM-01',NULL,NULL),
(1002,1002,1001,'MIEMBRO','ACTIVO','EST-02',NULL,NULL),
(1003,1003,1001,'MIEMBRO','ACTIVO','EST-03',NULL,NULL),
(1004,1003,1002,'ADMINISTRADOR','ACTIVO','EMP-03',NULL,NULL),
(1005,1002,1002,'MIEMBRO','ACTIVO','EMP-02',NULL,NULL);
INSERT INTO necesidades (id,organizacion_id,solicitante_id,objeto,descripcion,fecha_inicio,fecha_fin,estado,creada_en) VALUES
(1001,1001,1002,'Taladro de prueba','Registro ficticio de un préstamo en curso.',CURRENT_TIMESTAMP-INTERVAL '1 day',CURRENT_TIMESTAMP+INTERVAL '1 day','CON_PRESTAMO_CONFIRMADO',CURRENT_TIMESTAMP-INTERVAL '2 days'),
(1002,1001,1002,'Calculadora de prueba','Registro ficticio para consultar una oferta pendiente.',CURRENT_TIMESTAMP+INTERVAL '1 day',CURRENT_TIMESTAMP+INTERVAL '3 days','BUSCANDO_PRESTADOR',CURRENT_TIMESTAMP);
INSERT INTO ofertas (id,necesidad_id,prestador_id,modalidad,precio,unidad_cobro,fecha_entrega,estado) VALUES
(1001,1001,1003,'GRATIS',NULL,NULL,CURRENT_TIMESTAMP-INTERVAL '1 day','ACEPTADA'),
(1002,1002,1003,'ALQUILER',10000,'DIA',CURRENT_TIMESTAMP+INTERVAL '1 day','PENDIENTE');
INSERT INTO prestamos (id,oferta_id,necesidad_id,organizacion_id,solicitante_id,prestador_id,objeto,fecha_inicio,fecha_fin,modalidad,precio_total,punto_central,estado,en_conflicto,entrega_prestador_en,entrega_solicitante_en,devolucion_solicitante_en,devolucion_prestador_en) VALUES
(1001,1001,1001,1001,1002,1003,'Taladro de prueba',CURRENT_TIMESTAMP-INTERVAL '1 day',CURRENT_TIMESTAMP+INTERVAL '1 day','GRATIS',0,'Biblioteca de prueba','ACTIVO',TRUE,CURRENT_TIMESTAMP-INTERVAL '1 day',CURRENT_TIMESTAMP-INTERVAL '23 hours',NULL,NULL);
INSERT INTO reportes (id,prestamo_id,organizacion_id,reportante_id,reportado_id,tipo,descripcion,estado,creado_en,sancion,nota_resolucion,admin_id,resuelto_en) VALUES
(1001,1001,1001,1002,1003,'DANADO','Incidencia ficticia para revisión del administrador.','PENDIENTE',CURRENT_TIMESTAMP,NULL,NULL,NULL,NULL);
SELECT setval(pg_get_serial_sequence('usuarios','id'),(SELECT MAX(id) FROM usuarios),true);
SELECT setval(pg_get_serial_sequence('organizaciones','id'),(SELECT MAX(id) FROM organizaciones),true);
SELECT setval(pg_get_serial_sequence('membresias','id'),(SELECT MAX(id) FROM membresias),true);
SELECT setval(pg_get_serial_sequence('necesidades','id'),(SELECT MAX(id) FROM necesidades),true);
SELECT setval(pg_get_serial_sequence('ofertas','id'),(SELECT MAX(id) FROM ofertas),true);
SELECT setval(pg_get_serial_sequence('prestamos','id'),(SELECT MAX(id) FROM prestamos),true);
SELECT setval(pg_get_serial_sequence('reportes','id'),(SELECT MAX(id) FROM reportes),true);
COMMIT;
