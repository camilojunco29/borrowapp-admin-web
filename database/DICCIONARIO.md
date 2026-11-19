# Diccionario físico de datos

Derivado del modelo ORM disponible. Siete tablas; los nombres de columna coinciden con la implementación.

## usuarios

`id`, `nombre`, `correo`, `contrasena_hash`

## organizaciones

`id`, `nombre`, `tipo`, `codigo`, `punto_central`, `creada_por`

## membresias

`id`, `usuario_id`, `organizacion_id`, `rol`, `estado`, `identificador_interno`, `sancion_motivo`, `sancion_hasta`

## necesidades

`id`, `organizacion_id`, `solicitante_id`, `objeto`, `descripcion`, `fecha_inicio`, `fecha_fin`, `estado`, `creada_en`

## ofertas

`id`, `necesidad_id`, `prestador_id`, `modalidad`, `precio`, `unidad_cobro`, `fecha_entrega`, `estado`

## prestamos

`id`, `oferta_id`, `necesidad_id`, `organizacion_id`, `solicitante_id`, `prestador_id`, `objeto`, `fecha_inicio`, `fecha_fin`, `modalidad`, `precio_total`, `punto_central`, `estado`, `en_conflicto`, `entrega_prestador_en`, `entrega_solicitante_en`, `devolucion_solicitante_en`, `devolucion_prestador_en`

## reportes

`id`, `prestamo_id`, `organizacion_id`, `reportante_id`, `reportado_id`, `tipo`, `descripcion`, `estado`, `creado_en`, `sancion`, `nota_resolucion`, `admin_id`, `resuelto_en`

El DDL es la referencia de tipos, nulabilidad, claves foráneas e índices. Los valores predeterminados definidos por Python en el ORM se suministran explícitamente en el script de datos.
