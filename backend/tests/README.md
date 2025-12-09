# SnipHub Backend - Testing

## Tipos de Tests Implementados

### 1. Tests Unitarios
- **Utils** (password.js, jwt.js) ✅
- **Middlewares** (verifyToken, validateRequest, bruteGuard) ✅
- **Controllers**: 
  - authController ✅
  - snippetController ✅

### 2. Tests de Integración
- **API Endpoints** (auth): Validación de rutas HTTP completas ✅

## Estadísticas
- **Total de tests**: 58 tests automatizados
- **Test suites**: 8 archivos de test

## Herramientas
- **Jest**: Framework de testing
- **Supertest**: Testing de APIs HTTP
- **Mocks**: Simulación de base de datos y dependencias externas

## Ejecutar Tests
npm test              # Ejecutar todos los tests
npm run test:coverage # Con reporte de cobertura