# SnipHub Backend API

Backend REST API para SnipHub - Gestor de snippets de código con inteligencia artificial.

## 🚀 Características

- ✅ Autenticación JWT segura
- ✅ CRUD completo de snippets
- ✅ Sistema de categorías
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
   cp .env
   # Editar .env con tus credenciales
3. **Crear base de datos**
   CREATE DATABASE sniphub_db;
4. **Iniciar servidor** 
   npm start
   # O en modo desarrollo:
   npm run dev
      
   El servidor estará disponible en `http://localhost:4000`a

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

Ver [.env.example](./.env.example) para la lista completa.

## 📚 Más Información

- [Documentación de Tests](./tests/README.md)

## 👤 Autor

Aitor

## 📄 Licencia

MIT