const {
    createSnippetController,
    getMySnippetByIdController,
    updateMySnippetController,
    deleteMySnippetController,
    toggleFavoriteController,
    listMySnippetsController,
    listPublicSnippetsController,
    getPublicSnippetByIdController
} = require('../../src/controllers/snippetController');
const {
    createSnippet,
    getSnippetById,
    updateSnippet,
    deleteSnippet,
    toggleFavorite,
    countSnippetsByUserWithFilters,
    getSnippetsByUserPaged,
    countPublicSnippets,
    getPublicSnippets
} = require('../../src/models/snippetModel');

jest.mock('../../src/models/snippetModel');

describe('Snippet Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            user: { id: 1 },
            body: {},
            params: {},
            query: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('createSnippetController', () => {
        test('debería crear un snippet exitosamente', async () => {
            req.body = {
                title: 'Mi código',
                code: 'console.log("test")',
                language: 'javascript',
                is_public: false,
                tags: ['test', 'demo']
            };

            createSnippet.mockResolvedValue({ id: 1 });

            await createSnippetController(req, res);

            expect(createSnippet).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Mi código',
                    code: 'console.log("test")',
                    language: 'javascript',
                    user_id: 1,
                    tags: JSON.stringify(['test', 'demo'])
                })
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Snippet creado correctamente',
                id: 1
            });
        });

        test('debería convertir tags a JSON string', async () => {
            req.body = {
                title: 'Test',
                code: 'code',
                language: 'js',
                tags: ['tag1', 'tag2']
            };

            createSnippet.mockResolvedValue({ id: 1 });

            await createSnippetController(req, res);

            expect(createSnippet).toHaveBeenCalledWith(
                expect.objectContaining({
                    tags: JSON.stringify(['tag1', 'tag2'])
                })
            );
        });
    });

    describe('getMySnippetByIdController', () => {
        test('debería retornar snippet si pertenece al usuario', async () => {
            req.params.id = '123';
            const mockSnippet = {
                id: 123,
                user_id: 1,
                title: 'Mi snippet',
                tags: JSON.stringify(['test'])
            };

            getSnippetById.mockResolvedValue(mockSnippet);

            await getMySnippetByIdController(req, res);

            expect(getSnippetById).toHaveBeenCalledWith(123);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 123,
                    title: 'Mi snippet',
                    tags: ['test'] // Tags parseados de JSON
                })
            );
        });

        test('debería retornar 404 si snippet no existe', async () => {
            req.params.id = '999';
            getSnippetById.mockResolvedValue(null);

            await getMySnippetByIdController(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Snippet no encontrado'
            });
        });

        test('debería retornar 403 si snippet no pertenece al usuario', async () => {
            req.params.id = '123';
            const mockSnippet = {
                id: 123,
                user_id: 2, // Diferente al usuario autenticado (id: 1)
                title: 'Snippet de otro usuario'
            };

            getSnippetById.mockResolvedValue(mockSnippet);

            await getMySnippetByIdController(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Acceso denegado: este snippet no pertenece al usuario.'
            });
        });
    });

    describe('updateMySnippetController', () => {
        test('debería actualizar snippet exitosamente', async () => {
            req.params.id = '123';
            req.body = { title: 'Título actualizado' };

            const existingSnippet = { id: 123, user_id: 1, title: 'Título viejo' };
            const updatedSnippet = { id: 123, user_id: 1, title: 'Título actualizado', tags: null };

            getSnippetById
                .mockResolvedValueOnce(existingSnippet) // Primera llamada: verificar existencia
                .mockResolvedValueOnce(updatedSnippet);  // Segunda llamada: obtener actualizado

            updateSnippet.mockResolvedValue({ affectedRows: 1 });

            await updateMySnippetController(req, res);

            expect(updateSnippet).toHaveBeenCalledWith(123, 1, { title: 'Título actualizado' });
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Snippet actualizado correctamente'
                })
            );
        });
    });

    describe('deleteMySnippetController', () => {
        test('debería eliminar snippet exitosamente', async () => {
            req.params.id = '123';
            const mockSnippet = { id: 123, user_id: 1 };

            getSnippetById.mockResolvedValue(mockSnippet);
            deleteSnippet.mockResolvedValue({ affectedRows: 1 });

            await deleteMySnippetController(req, res);

            expect(deleteSnippet).toHaveBeenCalledWith(123, 1);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Snippet eliminado correctamente'
            });
        });
    });

    describe('toggleFavoriteController', () => {
        test('debería marcar como favorito', async () => {
            req.params.id = '123';
            req.body = { is_favorite: true };

            const mockSnippet = { id: 123, user_id: 1 };
            getSnippetById.mockResolvedValue(mockSnippet);
            toggleFavorite.mockResolvedValue({ affectedRows: 1 });

            await toggleFavoriteController(req, res);

            expect(toggleFavorite).toHaveBeenCalledWith(123, 1, true);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Actualizado',
                is_favorite: true
            });
        });

        test('debería rechazar si is_favorite no es boolean', async () => {
            req.params.id = '123';
            req.body = { is_favorite: 'invalid' }; // String en lugar de boolean

            const mockSnippet = { id: 123, user_id: 1 };
            getSnippetById.mockResolvedValue(mockSnippet);

            await toggleFavoriteController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'is_favorite debe ser boolean'
            });
        });
    });

    describe('parseBool utility (testeada indirectamente)', () => {
        // parseBool se usa en listMySnippetsController para parsear query.is_favorite

        beforeEach(() => {
            // Configuración común para todos los tests de parseBool
            countSnippetsByUserWithFilters.mockResolvedValue(0);
            getSnippetsByUserPaged.mockResolvedValue([]);
        });

        test('debería parsear "true" string a boolean true', async () => {
            req.query = { is_favorite: 'true' };

            await listMySnippetsController(req, res);

            // Verificar que se llamó con is_favorite como boolean true
            expect(countSnippetsByUserWithFilters).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    is_favorite: true // Debe ser boolean, no string
                })
            );
        });

        test('debería parsear "false" string a boolean false', async () => {
            req.query = { is_favorite: 'false' };

            await listMySnippetsController(req, res);

            expect(countSnippetsByUserWithFilters).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    is_favorite: false // Debe ser boolean false
                })
            );
        });

        test('debería retornar undefined si el valor no es "true" ni "false"', async () => {
            req.query = { is_favorite: 'invalid' };

            await listMySnippetsController(req, res);

            expect(countSnippetsByUserWithFilters).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    is_favorite: undefined // Valor inválido retorna undefined
                })
            );
        });

        test('debería mantener boolean true si ya es boolean', async () => {
            req.query = { is_favorite: true }; // Ya es boolean

            await listMySnippetsController(req, res);

            expect(countSnippetsByUserWithFilters).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    is_favorite: true
                })
            );
        });
    });
    // Agregar al final del archivo, antes del cierre del último describe

    describe('listMySnippetsController', () => {
        test('debería listar snippets con paginación por defecto', async () => {
            req.query = {};

            countSnippetsByUserWithFilters.mockResolvedValue(25);
            getSnippetsByUserPaged.mockResolvedValue([
                { id: 1, title: 'Snippet 1', tags: null },
                { id: 2, title: 'Snippet 2', tags: null }
            ]);

            await listMySnippetsController(req, res);

            expect(countSnippetsByUserWithFilters).toHaveBeenCalledWith(1, {
                language: undefined,
                is_favorite: undefined,
            });
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    items: expect.any(Array),
                    page: 1,
                    limit: 12, // Valor por defecto
                    total: 25,
                    hasNext: true
                })
            );
        });

        test('debería aplicar paginación personalizada', async () => {
            req.query = { page: '2', limit: '5' };

            countSnippetsByUserWithFilters.mockResolvedValue(15);
            getSnippetsByUserPaged.mockResolvedValue([]);

            await listMySnippetsController(req, res);

            expect(getSnippetsByUserPaged).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    limit: 5,
                    offset: 5 // (page 2 - 1) * limit 5
                })
            );
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    page: 2,
                    limit: 5,
                    hasNext: true // 2 * 5 = 10 < 15
                })
            );
        });

        test('debería aplicar filtro de lenguaje', async () => {
            req.query = { language: 'javascript' };

            countSnippetsByUserWithFilters.mockResolvedValue(10);
            getSnippetsByUserPaged.mockResolvedValue([]);

            await listMySnippetsController(req, res);

            expect(countSnippetsByUserWithFilters).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    language: 'javascript'
                })
            );
        });

        test('debería parsear tags de JSON a array', async () => {
            req.query = {};

            countSnippetsByUserWithFilters.mockResolvedValue(1);
            getSnippetsByUserPaged.mockResolvedValue([
                { id: 1, title: 'Test', tags: JSON.stringify(['tag1', 'tag2']) }
            ]);

            await listMySnippetsController(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    items: [
                        expect.objectContaining({
                            tags: ['tag1', 'tag2'] // Tags parseados
                        })
                    ]
                })
            );
        });

        test('debería limitar el máximo de items por página a 50', async () => {
            req.query = { limit: '100' }; // Intenta más del máximo

            countSnippetsByUserWithFilters.mockResolvedValue(100);
            getSnippetsByUserPaged.mockResolvedValue([]);

            await listMySnippetsController(req, res);

            expect(getSnippetsByUserPaged).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    limit: 50 // Máximo permitido
                })
            );
        });

        test('debería usar página mínima de 1', async () => {
            req.query = { page: '0' }; // Página inválida

            countSnippetsByUserWithFilters.mockResolvedValue(10);
            getSnippetsByUserPaged.mockResolvedValue([]);

            await listMySnippetsController(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    page: 1 // Mínimo permitido
                })
            );
        });
    });

    describe('updateMySnippetController - Casos adicionales', () => {
        test('debería convertir tags array a JSON string', async () => {
            req.params.id = '123';
            req.body = { tags: ['tag1', 'tag2'] };

            const existingSnippet = { id: 123, user_id: 1 };
            const updatedSnippet = { id: 123, tags: JSON.stringify(['tag1', 'tag2']) };

            getSnippetById
                .mockResolvedValueOnce(existingSnippet)
                .mockResolvedValueOnce(updatedSnippet);

            updateSnippet.mockResolvedValue({ affectedRows: 1 });

            await updateMySnippetController(req, res);

            expect(updateSnippet).toHaveBeenCalledWith(
                123,
                1,
                expect.objectContaining({
                    tags: JSON.stringify(['tag1', 'tag2']) // Debe convertir a JSON
                })
            );
        });

        test('debería retornar 400 si no se aplicaron cambios', async () => {
            req.params.id = '123';
            req.body = { title: 'Nuevo título' };

            const existingSnippet = { id: 123, user_id: 1 };
            getSnippetById.mockResolvedValue(existingSnippet);
            updateSnippet.mockResolvedValue({ affectedRows: 0 }); // No se actualizó

            await updateMySnippetController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'No se aplicaron cambios'
            });
        });
    });

    describe('deleteMySnippetController - Casos adicionales', () => {
        test('debería retornar 400 si no se eliminó el snippet', async () => {
            req.params.id = '123';
            const mockSnippet = { id: 123, user_id: 1 };

            getSnippetById.mockResolvedValue(mockSnippet);
            deleteSnippet.mockResolvedValue({ affectedRows: 0 }); // No se eliminó

            await deleteMySnippetController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'No se eliminó el snippet'
            });
        });
    });

    describe('listPublicSnippetsController', () => {
        // Nota: Esta función no requiere req.user, es pública
        beforeEach(() => {
            req.user = undefined; // No hay usuario autenticado
        });

        test('debería listar snippets públicos con paginación', async () => {
            const { listPublicSnippetsController } = require('../../src/controllers/snippetController');
            const { countPublicSnippets, getPublicSnippets } = require('../../src/models/snippetModel');

            req.query = { page: '1', limit: '10' };

            countPublicSnippets.mockResolvedValue(20);
            getPublicSnippets.mockResolvedValue([
                { id: 1, title: 'Público 1', tags: null, is_public: 1 },
                { id: 2, title: 'Público 2', tags: null, is_public: 1 }
            ]);

            await listPublicSnippetsController(req, res);

            expect(countPublicSnippets).toHaveBeenCalledWith({
                language: undefined,
                q: undefined
            });
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    items: expect.any(Array),
                    page: 1,
                    limit: 10,
                    total: 20,
                    hasNext: true
                })
            );
        });

        test('debería aplicar filtro de búsqueda (q)', async () => {
            const { listPublicSnippetsController } = require('../../src/controllers/snippetController');
            const { countPublicSnippets } = require('../../src/models/snippetModel');

            req.query = { q: 'javascript' };

            countPublicSnippets.mockResolvedValue(5);
            getPublicSnippets.mockResolvedValue([]);

            await listPublicSnippetsController(req, res);

            expect(countPublicSnippets).toHaveBeenCalledWith(
                expect.objectContaining({
                    q: 'javascript'
                })
            );
        });

        test('debería aplicar filtro de lenguaje', async () => {
            const { listPublicSnippetsController } = require('../../src/controllers/snippetController');

            req.query = { language: 'python' };

            countPublicSnippets.mockResolvedValue(8);
            getPublicSnippets.mockResolvedValue([]);

            await listPublicSnippetsController(req, res);

            expect(countPublicSnippets).toHaveBeenCalledWith(
                expect.objectContaining({
                    language: 'python'
                })
            );
        });
    });

    describe('getPublicSnippetByIdController', () => {
        test('debería retornar snippet público', async () => {
            const { getPublicSnippetByIdController } = require('../../src/controllers/snippetController');

            req.params.id = '123';
            const mockSnippet = {
                id: 123,
                title: 'Snippet público',
                is_public: 1,
                tags: JSON.stringify(['public', 'demo'])
            };

            getSnippetById.mockResolvedValue(mockSnippet);

            await getPublicSnippetByIdController(req, res);

            expect(getSnippetById).toHaveBeenCalledWith(123);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 123,
                    title: 'Snippet público',
                    tags: ['public', 'demo'] // Tags parseados
                })
            );
        });

        test('debería retornar 404 si snippet no existe', async () => {
            const { getPublicSnippetByIdController } = require('../../src/controllers/snippetController');

            req.params.id = '999';
            getSnippetById.mockResolvedValue(null);

            await getPublicSnippetByIdController(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Snippet no encontrado'
            });
        });

        test('debería retornar 404 si snippet no es público', async () => {
            const { getPublicSnippetByIdController } = require('../../src/controllers/snippetController');

            req.params.id = '123';
            const mockSnippet = {
                id: 123,
                title: 'Snippet privado',
                is_public: 0 // No es público
            };

            getSnippetById.mockResolvedValue(mockSnippet);

            await getPublicSnippetByIdController(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Snippet no encontrado'
            });
        });
    });
});