# Base de datos - anexos de entrega

Estos scripts documentan las siete tablas del backend existente. Se generaron
desde su modelo SQLAlchemy, sin modificar el proyecto original ni consultar
datos de producción. Son para una base PostgreSQL **nueva y vacía**.

## Orden de ejecución

Define `DATABASE_URL` con la conexión a tu base local de pruebas y ejecuta:

```powershell
psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f database/01_creacion_tablas.sql
psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f database/02_datos_prueba.sql
psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f database/03_consultas_verificacion.sql
```

- `01_creacion_tablas.sql`: tablas, claves primarias/foráneas, índices únicos y
  el índice parcial que permite una sola oferta aceptada por necesidad.
- `02_datos_prueba.sql`: tres usuarios ficticios, dos organizaciones, cinco
  membresías, dos necesidades, dos ofertas, un préstamo y un reporte.
- `03_consultas_verificacion.sql`: conteos y consultas de integridad de solo lectura.
- `DICCIONARIO.md`: nombres físicos de las columnas del modelo real.

No se deben ejecutar estos archivos en producción ni sobre una base existente.
El esquema no es una migración y no intenta borrar o reemplazar tablas.
Las tres cuentas ficticias tienen hashes bcrypt de una contraseña aleatoria
descartada; no hay una contraseña de acceso publicada. Para probar autenticación,
crea cuentas sintéticas en una API local de pruebas.

Los valores predeterminados del ORM que se calculan en Python no son valores
predeterminados del servidor SQL: el script de datos proporciona esos campos.
Las validaciones de fechas, roles por operación y transiciones permanecen en
la API; los scripts no pretenden reemplazarlas.

Los tres scripts se ejecutaron correctamente en PostgreSQL embebido (PGlite)
el 19/11/2026. Se verificaron los conteos esperados y el rechazo de membresías
duplicadas, dos ofertas aceptadas por necesidad y claves foráneas inexistentes.
La evidencia está en `scripts/evidencias/validacion_postgresql_local.json`.
