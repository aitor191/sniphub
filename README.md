# SnipHub

SnipHub - Gestor de snippets de código con inteligencia artificial.

## 📂 Estructura del proyecto

- /backend/src/controllers: Lógica del negocio.
- /backend/src/models: Consultas SQL directas.
- /backend/src/middlewares: Seguridad.
- /frontend/src/app: Componentes Angular.

## 🚀 Características

- ✅ Autenticación JWT segura
- ✅ CRUD completo de snippets
- ✅ Snippets públicos y privados
- ✅ Explicación de código con IA (Groq/Hugging Face)
- ✅ Sistema de caché inteligente para explicaciones
- ✅ Protección contra ataques (rate limiting, brute force)
- ✅ Tests automatizados

# Manual de Usuario

Este manual está dirigido a los usuarios finales de la aplicación **SnipHub**.

## Acceso y Registro

### Crear cuenta

1. Acceda a la URL de registro:  
   **https://sniphubeight.vercel.app/auth/register**
2. Complete el formulario con su **Nombre**, **Email** y **Contraseña**.
3. Tras el registro exitoso, será redirigido al **Login**, donde usará sus credenciales.
4. Una vez iniciada la sesión, accederá al **Dashboard**.

### Iniciar sesión

1. Si ya dispone de una cuenta, introduzca sus credenciales en la pantalla de inicio.
2. Si introduce la contraseña incorrectamente **5 veces**, su cuenta se bloqueará temporalmente por seguridad.

---

## Gestión de Snippets

### Crear un nuevo snippet

1. Pulse **"Nuevo Snippet"** en la barra lateral.
2. (Obligatorio) Rellene:
   - Título
   - Lenguaje
   - Código (editor)
3. (Opcional) Añada:
   - Descripción
   - Etiquetas (tags)
   - Opción **"Público"** para compartirlo con la comunidad
4. Pulse **"Crear"**.

### Buscar y Filtrar

- Use la barra superior de búsqueda para encontrar snippets por título.
- Use los filtros laterales para mostrar solo:
  - **Favoritos**
  - Un **lenguaje específico**

### Acceso a Favoritos

- Pulse **"Favoritos"** en el menú lateral para ver los snippets que haya marcado.

### Acceso a Snippets Públicos

- En el menú lateral encontrará **"Snippets Públicos"**, donde podrá acceder a los compartidos por otros usuarios.

---

## Uso de IA

### Explicar Código

1. Abra cualquier snippet de su biblioteca.
2. Pulse **"Explicar con IA"**.
3. Espere unos segundos mientras el sistema procesa el código.
4. Se mostrará una explicación detallada debajo del código.

---

## Perfil de Usuario

- En el menú izquierdo, acceda a **"Mi Perfil"** para modificar su información personal o consultar estadísticas de uso.

---

# Manual de Programador y Despliegue

Este manual está dirigido a desarrolladores que deseen instalar, mantener o desplegar el proyecto.

## Requisitos del Sistema

- **Node.js**: v20.x o superior
- **MySQL**: v8.0 o compatible (MariaDB)
- **Angular CLI**: v19.x (instalado globalmente: npm i -g @angular/cli).
- **Git**: Para clonar repositorio

## 🔧 Instalación Local (Desarrollo)

1. Clonar repositorio

- `git clone https://github.com/aitor191/sniphub.git`
- `cd sniphub`

2. Configurar Backend

- `cd backend`
- `npm install`
- `cp .env.example .env `
  (Editar .env con las credenciales de MySql local y claves de API Groq)

3. Configurar Base de datos

- Cree una base de datos vacía llamada sniphub_db en su MySQL local.
- El backend ejecutará automáticamente las migraciones (initDatabase.js) al iniciarse por primera vez.

4. Configurar Frontend

- `cd ../frontend`
- `npm install`

5. Ejecución

- Backend: `cd backend && npm run dev` (Puerto 4000)
- Frontend: `cd frontend && npm start` (Puerto 4200)

- Acceda a http://localhost:4200.

## Guía de Despliegue (Producción)

El proyecto está preparado para desplegarse en servicios PaaS como Railway o Render.

# Despliegue en Railway

1. Conecte su repositorio de GitHub a Railway.

2. Añada un servicio MySQL desde el dashboard de Railway.

3. Configure las Variables de Entorno en el servicio del proyecto:

- DB_HOST
- DB_USER
- DB_PASS: (Variables proporcionadas por Railway).
- JWT_SECRET: (Genere una cadena larga aleatoria).
- GROQ_API_KEY: (Su clave de API).

4. Build Command:

- `npm install && cd frontend && npm install && npm run build -- -- configuration production`

5. Start Command:

- `cd backend && npm start`

- Atención: El servidor Express está configurado para servir los archivos estáticos de Angular (dist/frontend) cuando está en producción, unificando frontend y backend en un solo despliegue.

## 🔌 Endpoints Principales

### Autenticación

- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/profile` - Perfil del usuario

### Snippets (requieren autenticación)

- `GET /api/snippets` - Listar snippets (con paginación y filtros)
- `POST /api/snippets` - Crear snippet
- `GET /api/snippets/:id` - Obtener snippet
- `PUT /api/snippets/:id` - Actualizar snippet
- `DELETE /api/snippets/:id` - Eliminar snippet
- `PATCH /api/snippets/:id/favorite` - Marcar/desmarcar favorito

### Snippets Públicos

- `GET /api/public/snippets` - Listar snippets públicos
- `GET /api/public/snippets/:id` - Obtener snippet público

### IA

- `POST /api/ai/explain` - Explicar código con IA (con caché)

## 🔐 Variables de Entorno

Copia `.env.example` a `.env` y configura las variables:
sh
cp .env.example .envEdita `.env` con tus credenciales:

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: Credenciales de MySQL
- `JWT_SECRET`: Clave secreta para tokens JWT (usa una clave segura)
- `PORT`: Puerto del servidor (default: 4000)
- `FRONTEND_URL`: URL del frontend para CORS (ej: http://localhost:4200)
- `GROQ_API_KEY` / `HUGGINGFACE_API_KEY`: Opcionales, para explicaciones con IA

## 🚀 Despliegue

1. Configura las variables de entorno en `.env`
2. Asegúrate de que MySQL esté corriendo
3. Ejecuta `npm start`

## 📚 Más Información

- [Documentación de Tests](./tests/README.md)

## 👤 Autor

Aitor R.

## 📄 Licencia

MIT
