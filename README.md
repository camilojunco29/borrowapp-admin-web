# BorrowApp Admin Web

Panel administrativo en React + Vite + Tailwind CSS conectado a la API del proyecto.

## Instalación y ejecución local

Requiere Node.js 20.19 o posterior de la rama 20, o Node.js 22.12 o posterior.

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Configuración y alcance

`.env` admite `VITE_API_URL=https://api.example.com` o la URL con
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
La sesión se guarda en `sessionStorage` de la pestaña; al cerrarla tendrás que
iniciar sesión otra vez. Los tokens persistentes de versiones anteriores se
eliminan. Se comprueba el vencimiento antes de enviar solicitudes y al regresar
a la pestaña. La firma y los permisos siempre debe verificarlos el servidor.

## Validación

```bash
npm test
npm run build
```

Las pruebas usan un adaptador HTTP simulado: verifican las diez operaciones
del panel contra `api-openapi.json`, una copia del esquema público descargada
el 16 de noviembre de 2026. También prueba JWT, normalización de URL y correo,
errores de validación, expiración y respuestas tardías de sesiones anteriores.
También comprueban la neutralización de fórmulas en CSV y la actualización
de la organización en caché. No crean ni modifican datos remotos.

Se verificaron con GET la raíz pública (200), el esquema OpenAPI (200) y
`/api/v1/auth/me` sin token (401, CORS `*`). La prueba completa de acceso y
operaciones administrativas requiere una cuenta administradora real; no se
proporcionaron credenciales.

El resultado está en `dist/`. No se realizó ningún despliegue.

## Límites de seguridad que requieren backend

Los controles de rol del panel organizan la interfaz y no sustituyen la
autorización de la API. El backend disponible comprueba administrador por
organización para sanciones y cambios del punto central, pero su listado de
reportes exige únicamente membresía. Para restringir los reportes a
administradores hay que corregir esa ruta en el servidor.

`sessionStorage` limita la persistencia del token, pero sigue siendo accesible
a JavaScript. Una sesión con cookie `HttpOnly`, revocación al cerrar sesión y
protección CSRF requiere cambios coordinados en el servidor. Esos cambios no
se han hecho en este proyecto React.

El CSV se destina a lectura en hojas de cálculo. Los textos que podrían
interpretarse como fórmulas llevan un tabulador dentro de la celda entre
comillas; ese carácter también estará presente si se importa el CSV como datos.

## Anexos de entrega - 19/11/2026

- `database/`: creación del esquema PostgreSQL, relaciones, datos ficticios,
  consultas de verificación y diccionario físico derivado del ORM existente.
- `scripts/`: instrucciones de instalación, dependencias de referencia de la API,
  validadores locales, matriz de requisitos y resultados de pruebas.

Los scripts SQL se probaron en PostgreSQL embebido; la API se comprobó de forma
local sin modificar datos remotos ni el backend original. La matriz de cierre
registra como parcial el cálculo horario del backend cuando hay fracciones
de día, además de los pendientes de autorización y medición documentados.
