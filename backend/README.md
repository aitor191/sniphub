# SnipHub Backend API

Backend REST API para SnipHub - Gestor de snippets de código con inteligencia artificial.

## 🚀 Características

- ✅ Autenticación JWT segura
- ✅ CRUD completo de snippets
- ✅ Snippets públicos y privados
- ✅ Explicación de código con IA (Groq/Hugging Face)
- ✅ Sistema de caché inteligente para explicaciones
- ✅ Protección contra ataques (rate limiting, brute force)
- ✅ Tests automatizados (58 tests, 49% cobertura)

## 📋 Requisitos Previos

- Node.js >= 16.x
- MySQL >= 5.7 o MariaDB >= 10.3
- npm o yarn

## 🔧 Instalación

1. **Instalar dependencias**
   npm install
2. **Configurar variables de entorno**
   cp .env.example .env
   # Editar .env con tus credenciales
3. **Crear base de datos**
   CREATE DATABASE sniphub_db;
4. **Iniciar servidor** 
   npm start
   # O en modo desarrollo:
   npm run dev
      
   El servidor estará disponible en `http://localhost:4000`

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

## 🧪 Testing

npm test              # Ejecutar todos los tests
npm run test:coverage # Con reporte de cobertura
**Cobertura:** 49.29% total | Autenticación: 100% | Snippets: 92%

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