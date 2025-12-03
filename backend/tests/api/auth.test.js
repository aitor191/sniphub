const request = require('supertest');
const express = require('express');
const authRoutes = require('../../src/routes/authRoutes');

// Crear app de prueba
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('POST /api/auth/register', () => {
    test('debería rechazar registro sin datos', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({});

        expect(response.status).toBe(400);
    });

    test('debería rechazar email inválido', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'email-invalido',
                password: 'password123'
            });

        expect(response.status).toBe(400);
    });

    test('debería rechazar password muy corto', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'test@test.com',
                password: '12345' // Menos de 6 caracteres
            });

        expect(response.status).toBe(400);
    });

    test('debería rechazar username muy corto', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'ab', // Menos de 3 caracteres
                email: 'test@test.com',
                password: 'password123'
            });

        expect(response.status).toBe(400);
    });
});

describe('POST /api/auth/login', () => {
    test('debería rechazar login sin credenciales', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({});

        expect(response.status).toBe(400);
    });

    test('debería rechazar email inválido', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'email-invalido',
                password: 'password123'
            });

        expect(response.status).toBe(400);
    });
});
