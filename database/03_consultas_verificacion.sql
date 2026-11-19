-- Consultas de solo lectura para verificar el cargado de datos.
SELECT 'usuarios' AS tabla,COUNT(*) AS filas FROM usuarios
UNION ALL SELECT 'organizaciones',COUNT(*) FROM organizaciones
UNION ALL SELECT 'membresias',COUNT(*) FROM membresias
UNION ALL SELECT 'necesidades',COUNT(*) FROM necesidades
UNION ALL SELECT 'ofertas',COUNT(*) FROM ofertas
UNION ALL SELECT 'prestamos',COUNT(*) FROM prestamos
UNION ALL SELECT 'reportes',COUNT(*) FROM reportes;
-- Debe devolver cero filas (unicidad por usuario y organización).
SELECT usuario_id,organizacion_id,COUNT(*) FROM membresias GROUP BY usuario_id,organizacion_id HAVING COUNT(*)>1;
-- Debe devolver cero filas (solo una oferta aceptada por necesidad).
SELECT necesidad_id,COUNT(*) FROM ofertas WHERE estado='ACEPTADA' GROUP BY necesidad_id HAVING COUNT(*)>1;
-- Vista de relaciones y condiciones de un préstamo.
SELECT p.id,p.objeto,o.nombre AS organizacion,s.nombre AS solicitante,r.nombre AS prestador,p.estado,p.precio_total,p.punto_central
FROM prestamos p JOIN organizaciones o ON o.id=p.organizacion_id JOIN usuarios s ON s.id=p.solicitante_id JOIN usuarios r ON r.id=p.prestador_id;
-- Reportes pendientes y su organización.
SELECT id,prestamo_id,organizacion_id,tipo,estado FROM reportes WHERE estado='PENDIENTE';
