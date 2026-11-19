# Instalación y evidencias de entrega

## Panel web React

Requiere Node.js 20.19 o posterior de la rama 20, o 22.12 o posterior.

```powershell
git clone https://github.com/camilojunco29/borrowapp-admin-web.git
cd borrowapp-admin-web
npm ci
npm test
npm run build
npm run dev
```

Configura `.env` para el entorno que utilizarás, por ejemplo:

```text
VITE_API_URL=https://api.example.com/api/v1
```

Ese dominio es un ejemplo; no es una API del proyecto. El cliente permite HTTP
únicamente en localhost. Para entrar se necesita una cuenta que administre
una organización. La aplicación web es el panel administrativo; los flujos
de registro y préstamo entre miembros están en Flutter y en la API existente.

## API y base local

Este repositorio no incluye ni modifica el backend anterior. En una copia local
de ese backend, crea un entorno Python e instala sus dependencias:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

`scripts/requirements-api.txt` es una copia del archivo de dependencias del
backend para anexar a la entrega. Desde la carpeta backend existente:

```powershell
$env:DATABASE_URL = "postgresql://USUARIO:CLAVE@HOST:5432/BASE_PRUEBAS"
$env:SECRET_KEY = "REEMPLAZAR_POR_UN_SECRETO_LOCAL_ALEATORIO"
$env:CARGAR_DATOS_EJEMPLO = "false"
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Todos los valores anteriores son marcadores de ejemplo. No publiques la conexión,
claves reales ni archivos `.env`. La autenticación local es independiente de
las cuentas que existan en un servidor remoto.

Para crear tablas y cargar datos ficticios, consulta `database/README.md`.
Los scripts de prueba registran de forma explícita qué se comprobó localmente;
no certifican rendimiento bajo carga ni ejecución en dispositivos móviles.

## Evidencia y límites

Los resultados incluidos en `scripts/evidencias/` se obtuvieron el 19/11/2026.
El acceso al repositorio debe verificarse sin iniciar sesión antes de entregar:
si continúa privado, el docente necesitará autorización expresa.

### Repetir la validación funcional local de la API

Instala las dependencias de la API en un entorno Python de pruebas y ejecuta:

```powershell
python scripts/validar_api_local.py --backend "C:\ruta\backend" --output "C:\ruta\evidencias_locales"
```

El script crea una base SQLite temporal fuera del backend y usa TestClient;
no llama a un servidor remoto. Conserva los dos hallazgos conocidos en el
resultado en lugar de ocultarlos: lectura de reportes por miembros y tarifa
horaria que trunca fracciones de día.

### Repetir la validación SQL sin un servidor remoto

Opcionalmente, instala el motor de pruebas en la copia local del repositorio:

```powershell
npm install --no-save --package-lock=false --ignore-scripts @electric-sql/pglite
node scripts/validar_postgresql_local.mjs
```

El script usa PostgreSQL embebido en memoria, ejecuta los tres archivos SQL
y comprueba conteos, unicidad e integridad referencial. No sustituye una
prueba del servidor PostgreSQL donde vaya a desplegarse el backend.
