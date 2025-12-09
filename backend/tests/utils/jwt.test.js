const { signToken, verifyTokenString } = require('../../src/utils/jwt');

describe('JWT Utils', () => {
  test('signToken genera un token válido', () => {
    const payload = { id: 1, username: 'testuser' };
    const token = signToken(payload);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT tiene 3 partes
  });

  test('verifyTokenString verifica correctamente un token válido', () => {
    const payload = { id: 1, username: 'testuser' };
    const token = signToken(payload);
    const decoded = verifyTokenString(token);

    expect(decoded.id).toBe(1);
    expect(decoded.username).toBe('testuser');
    expect(decoded).toHaveProperty('iat');
    expect(decoded).toHaveProperty('exp');
  });

  test('verifyTokenString lanza error con token inválido', () => {
    expect(() => {
      verifyTokenString('token.invalido.aqui');
    }).toThrow();
  });
});