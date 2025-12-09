const { hashPassword, comparePassword } = require('../../src/utils/password');

describe('Password Utils', () => {
  test('hashPassword genera un hash diferente al password original', async () => {
    const password = 'miPassword123';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(50);
    expect(hash).toMatch(/^\$2[aby]\$/); // Formato bcrypt
  });

  test('comparePassword verifica correctamente un password válido', async () => {
    const password = 'miPassword123';
    const hash = await hashPassword(password);

    const isValid = await comparePassword(password, hash);
    expect(isValid).toBe(true);
  });

  test('comparePassword rechaza un password incorrecto', async () => {
    const password = 'miPassword123';
    const wrongPassword = 'passwordIncorrecto';
    const hash = await hashPassword(password);

    const isValid = await comparePassword(wrongPassword, hash);
    expect(isValid).toBe(false);
  });
});