# BorrowApp Admin Web

Panel administrativo en React + Vite + Tailwind CSS conectado a `https://borrowapp.onrender.com/api/v1`.

## Instalación y ejecución local

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Configuración y alcance

`.env` admite `VITE_API_URL=https://borrowapp.onrender.com` o la URL con
`/api/v1`. Reinicia Vite después de cambiarla. El cliente espera hasta 70 segundos
para permitir el arranque en frío de Render.

Usa una cuenta existente con membresía `ADMINISTRADOR` y organización asociada.
Este proyecto es el panel administrativo: inicio y cierre de sesión, selección
de comunidad, miembros, reportes y su resolución, reversión de sanciones, punto
central, necesidades con sus ofertas, auditoría de préstamos, filtros y CSV.
Los flujos de registro, creación de comunidades y préstamo entre usuarios siguen
en Flutter; no se agregaron pantallas nuevas para ellos.

El panel consulta `/auth/me` al restaurar la sesión. Un error de conexión permite
reintentar sin borrar el token; un 401 de un recurso protegido cierra la sesión.
Cambiar de comunidad limpia los datos y descarta respuestas de consultas anteriores.

## Validación

```bash
npm test
npm run build
```

`tests/api.test.js` usa un adaptador HTTP simulado: verifica las diez operaciones
del panel contra `api-openapi.json`, una copia del esquema público descargada
el 16 de noviembre de 2026. También prueba JWT, normalización de URL y correo,
errores de validación y expiración de sesión. No crea ni modifica datos remotos.

Se verificaron con GET la raíz pública (200), el esquema OpenAPI (200) y
`/api/v1/auth/me` sin token (401, CORS `*`). La prueba completa de acceso y
operaciones administrativas requiere una cuenta administradora real; no se
proporcionaron credenciales.

En el entorno restringido de Codex, `npm run build` encontró una restricción de
lectura de directorios padre al cargar la configuración con esbuild. La misma
compilación pasó cargando directamente la configuración:

```bash
node --input-type=module -e "import {build} from 'vite'; import config from './vite.config.js'; await build({...config,configFile:false});"
```

El resultado está en `dist/`. No se realizó ningún despliegue.
