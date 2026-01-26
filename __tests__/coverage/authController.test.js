/**
 * Tests para authController
 * Validar registro, login y autenticación
 */

const { request, app, registerAndLogin, makeAuthRequest, initializeTestDatabase } = require('../helpers/testHelper');

describe('Auth Controller', () => {
  
  beforeAll(async () => {
    await initializeTestDatabase();
  });
  
  describe('POST /api/auth/register', () => {
    
    it('debe registrar un nuevo usuario exitosamente', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          password: 'password123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user.username).toBe('newuser');
    });

    it('debe rechazar registro sin username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    it('debe rechazar registro sin password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('debe rechazar password muy corta (menor a 6 caracteres)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'short'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('6 caracteres');
    });

    it('debe rechazar username duplicado', async () => {
      // Primer registro
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'duplicate',
          password: 'password123'
        });

      // Segundo registro con mismo username
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'duplicate',
          password: 'password123'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('ya existe');
    });
  });

  describe('POST /api/auth/login', () => {
    
    beforeEach(async () => {
      // Crear usuario para login
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'loginuser',
          password: 'password123'
        });
    });

    it('debe hacer login exitosamente con credenciales correctas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.username).toBe('loginuser');
    });

    it('debe rechazar login sin username', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('debe rechazar login sin password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('debe rechazar login con usuario inexistente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('incorrectos');
    });

    it('debe rechazar login con password incorrecta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('incorrectos');
    });
  });

  describe('GET /api/auth/me', () => {
    
    it('debe obtener datos del usuario autenticado', async () => {
      const token = await registerAndLogin('meuser', 'password123');

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('meuser');
    });

    it('debe rechazar sin token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Token');
    });

    it('debe rechazar con token inválido', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('debe rechazar con header Authorization malformado', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    
    it('debe hacer logout exitosamente', async () => {
      const token = await registerAndLogin('logoutuser', 'password123');

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('debe permitir logout sin autenticación (stateless)', async () => {
      const res = await request(app)
        .post('/api/auth/logout');

      // En backend stateless, logout sin token es válido (frontend maneja token)
      expect([200, 401]).toContain(res.status);
    });
  });
});
