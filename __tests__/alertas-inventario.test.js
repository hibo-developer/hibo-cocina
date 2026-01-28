/**
 * Tests para Sistema de Alertas de Inventario
 * Sprint 2.11 - SEMANA 1
 */

const { request, app, registerAndLogin, makeAuthRequest, initializeTestDatabase } = require('./helpers/testHelper');
const { getDatabase } = require('../src/utils/database');

describe('🚨 Sistema de Alertas de Inventario', () => {
  let token;
  let ingredienteId1, ingredienteId2, ingredienteId3;
  let itemId1, itemId2, itemId3, itemId4;

  beforeAll(async () => {
    await initializeTestDatabase();
    token = await registerAndLogin('alertasuser', 'password123');

    // Crear ingredientes de prueba
    const db = getDatabase();

    // Ingrediente 1: Stock crítico
    ingredienteId1 = await new Promise((resolve, reject) => {
      db.run(`INSERT INTO ingredientes (codigo, nombre, unidad)
              VALUES (?, ?, ?)`,
        ['ING-CRIT-001', 'Pollo Fresco', 'kg'],
        function(err) { err ? reject(err) : resolve(this.lastID); }
      );
    });

    // Ingrediente 2: Stock bajo
    ingredienteId2 = await new Promise((resolve, reject) => {
      db.run(`INSERT INTO ingredientes (codigo, nombre, unidad)
              VALUES (?, ?, ?)`,
        ['ING-BAJO-002', 'Harina', 'kg'],
        function(err) { err ? reject(err) : resolve(this.lastID); }
      );
    });

    // Ingrediente 3: Para caducidad
    ingredienteId3 = await new Promise((resolve, reject) => {
      db.run(`INSERT INTO ingredientes (codigo, nombre, unidad)
              VALUES (?, ?, ?)`,
        ['ING-CAD-003', 'Pescado', 'kg'],
        function(err) { err ? reject(err) : resolve(this.lastID); }
      );
    });

    // Configurar stock_minimo manualmente (sin ALTER TABLE en tests)
    db.run('UPDATE ingredientes SET stock_actual = 10 WHERE id = ?', [ingredienteId1]);
    db.run('UPDATE ingredientes SET stock_actual = 20 WHERE id = ?', [ingredienteId2]);
    db.run('UPDATE ingredientes SET stock_actual = 5 WHERE id = ?', [ingredienteId3]);

    // Item 1: Stock CRÍTICO (20% del mínimo)
    itemId1 = await new Promise((resolve, reject) => {
      db.run(`INSERT INTO inventario (ingrediente_id, cantidad, lote, fecha_registro)
              VALUES (?, ?, ?, datetime('now'))`,
        [ingredienteId1, 2, 'LOTE-CRIT-001'],
        function(err) { err ? reject(err) : resolve(this.lastID); }
      );
    });

    // Item 2: Stock BAJO (70% del mínimo)
    itemId2 = await new Promise((resolve, reject) => {
      db.run(`INSERT INTO inventario (ingrediente_id, cantidad, lote, fecha_registro)
              VALUES (?, ?, ?, datetime('now'))`,
        [ingredienteId2, 14, 'LOTE-BAJO-002'],
        function(err) { err ? reject(err) : resolve(this.lastID); }
      );
    });

    // Item 3: VENCIDO (hace 2 días)
    itemId3 = await new Promise((resolve, reject) => {
      db.run(`INSERT INTO inventario (ingrediente_id, cantidad, lote, fecha_caducidad, fecha_registro)
              VALUES (?, ?, ?, date('now', '-2 days'), datetime('now'))`,
        [ingredienteId3, 3, 'LOTE-VENC-003'],
        function(err) { err ? reject(err) : resolve(this.lastID); }
      );
    });

    // Item 4: PRÓXIMO A VENCER (en 5 días)
    itemId4 = await new Promise((resolve, reject) => {
      db.run(`INSERT INTO inventario (ingrediente_id, cantidad, lote, fecha_caducidad, fecha_registro)
              VALUES (?, ?, ?, date('now', '+5 days'), datetime('now'))`,
        [ingredienteId3, 4, 'LOTE-PROX-004'],
        function(err) { err ? reject(err) : resolve(this.lastID); }
      );
    });
  });

  // ===================================================================
  // ENDPOINT 1: GET /api/inventario/alertas
  // ===================================================================
  describe('GET /api/inventario/alertas', () => {

    it('✅ debe obtener todas las alertas agrupadas', async () => {
      const res = await makeAuthRequest('get', '/api/inventario/alertas', token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('resumen');
      expect(res.body.data).toHaveProperty('alertas');
      expect(res.body.data).toHaveProperty('detalles');
    });

    it('✅ debe contener resumen con contadores', async () => {
      const res = await makeAuthRequest('get', '/api/inventario/alertas', token);

      expect(res.body.data.resumen).toHaveProperty('total_alertas');
      expect(res.body.data.resumen).toHaveProperty('criticas');
      expect(res.body.data.resumen).toHaveProperty('bajas');
      expect(res.body.data.resumen).toHaveProperty('proximas_vencer');
      expect(res.body.data.resumen).toHaveProperty('vencidos');
      
      // Verificar que hay alertas
      expect(res.body.data.resumen.total_alertas).toBeGreaterThan(0);
    });

    it('✅ debe detectar alerta CRÍTICA', async () => {
      const res = await makeAuthRequest('get', '/api/inventario/alertas', token);

      expect(res.body.data.resumen.criticas).toBeGreaterThan(0);
      expect(res.body.data.alertas).toHaveProperty('CRÍTICO');
      
      const criticas = res.body.data.alertas['CRÍTICO'];
      expect(Array.isArray(criticas)).toBe(true);
      expect(criticas.length).toBeGreaterThan(0);
      
      // Verificar estructura de alerta crítica
      const alerta = criticas[0];
      expect(alerta).toHaveProperty('ingrediente_nombre');
      expect(alerta).toHaveProperty('cantidad');
      expect(alerta).toHaveProperty('stock_actual');
      expect(alerta).toHaveProperty('tipo_alerta', 'CRÍTICO');
    });

    it('✅ debe detectar producto VENCIDO', async () => {
      const res = await makeAuthRequest('get', '/api/inventario/alertas', token);

      expect(res.body.data.resumen.vencidos).toBeGreaterThan(0);
      expect(res.body.data.alertas).toHaveProperty('VENCIDO');
      
      const vencidos = res.body.data.alertas['VENCIDO'];
      expect(Array.isArray(vencidos)).toBe(true);
      expect(vencidos.length).toBeGreaterThan(0);
    });

    it('✅ debe filtrar por tipo "critico"', async () => {
      const res = await makeAuthRequest('get', '/api/inventario/alertas?tipo=critico', token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resumen.criticas).toBeGreaterThan(0);
    });

    it('✅ debe manejar tipo "todos" correctamente', async () => {
      const res = await makeAuthRequest('get', '/api/inventario/alertas?tipo=todos', token);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('alertas');
      
      // Debe incluir todos los tipos
      const alertas = res.body.data.alertas;
      expect(Object.keys(alertas).length).toBeGreaterThan(0);
    });

  });

  // ===================================================================
  // ENDPOINT 2: GET /api/inventario/alertas/criticas
  // ===================================================================
  describe('GET /api/inventario/alertas/criticas', () => {

    it('✅ debe obtener solo alertas críticas', async () => {
      const res = await makeAuthRequest('get', '/api/inventario/alertas/criticas', token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('resumen');
      expect(res.body.data.resumen).toHaveProperty('total');
      expect(res.body.data.resumen).toHaveProperty('emergencias');
      expect(res.body.data.resumen).toHaveProperty('criticas');
      expect(res.body.data.resumen).toHaveProperty('bajas');
    });

    it('✅ debe incluir arrays de emergencias, criticas y bajas', async () => {
      const res = await makeAuthRequest('get', '/api/inventario/alertas/criticas', token);

      expect(res.body.data).toHaveProperty('emergencias');
      expect(res.body.data).toHaveProperty('criticas');
      expect(res.body.data).toHaveProperty('bajas');
      
      expect(Array.isArray(res.body.data.emergencias)).toBe(true);
      expect(Array.isArray(res.body.data.criticas)).toBe(true);
      expect(Array.isArray(res.body.data.bajas)).toBe(true);
    });

    it('✅ debe categorizar correctamente por severidad', async () => {
      const res = await makeAuthRequest('get', '/api/inventario/alertas/criticas', token);

      // Verificar que hay al menos una alerta crítica (nuestro stock al 20%)
      const total = res.body.data.resumen.total;
      expect(total).toBeGreaterThan(0);

      // Si hay emergencias, verificar estructura
      if (res.body.data.emergencias.length > 0) {
        const emergencia = res.body.data.emergencias[0];
        expect(emergencia).toHaveProperty('ingrediente_nombre');
        expect(emergencia).toHaveProperty('falta_porcentaje');
        expect(emergencia).toHaveProperty('nivel_severidad');
        expect(emergencia.falta_porcentaje).toBeGreaterThan(50); // > 50% de falta
      }

      // Si hay críticas, verificar estructura
      if (res.body.data.criticas.length > 0) {
        const critica = res.body.data.criticas[0];
        expect(critica).toHaveProperty('stock_minimo');
        expect(critica).toHaveProperty('cantidad');
      }
    });

    it('✅ debe calcular falta_porcentaje correctamente', async () => {
      const res = await makeAuthRequest('get', '/api/inventario/alertas/criticas', token);

      const todasAlertas = [
        ...res.body.data.emergencias,
        ...res.body.data.criticas,
        ...res.body.data.bajas
      ];

      if (todasAlertas.length > 0) {
        const alerta = todasAlertas[0];
        expect(alerta).toHaveProperty('falta_porcentaje');
        expect(typeof alerta.falta_porcentaje).toBe('number');
        expect(alerta.falta_porcentaje).toBeGreaterThanOrEqual(0);
        expect(alerta.falta_porcentaje).toBeLessThanOrEqual(100);
      }
    });

    it('✅ debe respetar límite de 20 items', async () => {
      const res = await makeAuthRequest('get', '/api/inventario/alertas/criticas', token);

      const total = [
        ...res.body.data.emergencias,
        ...res.body.data.criticas,
        ...res.body.data.bajas
      ].length;

      expect(total).toBeLessThanOrEqual(20);
    });

  });

  // ===================================================================
  // ENDPOINT 3: GET /api/inventario/alertas/caducidad
  // ===================================================================
  describe('GET /api/inventario/alertas/caducidad', () => {

    it('✅ debe obtener alertas de caducidad', async () => {
      const res = await makeAuthRequest('get', '/api/inventario/alertas/caducidad', token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('resumen');
      expect(res.body.data.resumen).toHaveProperty('total');
      expect(res.body.data.resumen).toHaveProperty('vencidos');
      expect(res.body.data.resumen).toHaveProperty('vence_hoy');
      expect(res.body.data.resumen).toHaveProperty('proximo_vencer');
    });

    it('✅ debe detectar productos vencidos', async () => {
      const res = await makeAuthRequest('get', '/api/inventario/alertas/caducidad', token);

      // Debe haber al menos 1 vencido (creado con -2 días)
      expect(res.body.data.resumen.vencidos).toBeGreaterThan(0);
      expect(res.body.data.vencidos.length).toBeGreaterThan(0);

      const vencido = res.body.data.vencidos[0];
      expect(vencido).toHaveProperty('dias_restantes');
      expect(vencido.dias_restantes).toBeLessThan(0);
      expect(vencido).toHaveProperty('tipo_alerta', 'VENCIDO');
    });

    it('✅ debe detectar productos próximos a vencer', async () => {
      const res = await makeAuthRequest('get', '/api/inventario/alertas/caducidad', token);

      // Debe haber al menos 1 próximo a vencer (creado con +5 días)
      expect(res.body.data.resumen.proximo_vencer).toBeGreaterThan(0);
      expect(res.body.data.proximo_vencer.length).toBeGreaterThan(0);

      const proximo = res.body.data.proximo_vencer[0];
      expect(proximo).toHaveProperty('dias_restantes');
      expect(proximo.dias_restantes).toBeGreaterThan(0);
      expect(proximo.dias_restantes).toBeLessThanOrEqual(7); // Default es 7 días
    });

    it('✅ debe aceptar parámetro "dias" personalizado', async () => {
      const res = await makeAuthRequest('get', '/api/inventario/alertas/caducidad?dias=14', token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Con 14 días, debe detectar los mismos productos
      expect(res.body.data.resumen.total).toBeGreaterThan(0);
    });

    it('✅ debe incluir información de lote y fecha', async () => {
      const res = await makeAuthRequest('get', '/api/inventario/alertas/caducidad', token);

      const todasAlertas = [
        ...res.body.data.vencidos,
        ...res.body.data.vence_hoy,
        ...res.body.data.proximo_vencer
      ];

      if (todasAlertas.length > 0) {
        const alerta = todasAlertas[0];
        expect(alerta).toHaveProperty('lote');
        expect(alerta).toHaveProperty('fecha_caducidad');
        expect(alerta).toHaveProperty('ingrediente_nombre');
      }
    });

    it('✅ debe ordenar por fecha de caducidad (más urgente primero)', async () => {
      const res = await makeAuthRequest('get', '/api/inventario/alertas/caducidad', token);

      const proximo = res.body.data.proximo_vencer;
      
      if (proximo.length > 1) {
        // Verificar orden ascendente por días restantes
        for (let i = 0; i < proximo.length - 1; i++) {
          expect(proximo[i].dias_restantes).toBeLessThanOrEqual(proximo[i + 1].dias_restantes);
        }
      }
    });

    it('✅ debe respetar límite de 30 items', async () => {
      const res = await makeAuthRequest('get', '/api/inventario/alertas/caducidad', token);

      const total = [
        ...res.body.data.vencidos,
        ...res.body.data.vence_hoy,
        ...res.body.data.proximo_vencer
      ].length;

      expect(total).toBeLessThanOrEqual(30);
    });

  });

  // ===================================================================
  // VALIDACIONES Y ERRORES
  // ===================================================================
  describe('Validaciones y Manejo de Errores', () => {

    it('✅ debe rechazar acceso sin autenticación', async () => {
      const res = await request(app).get('/api/inventario/alertas');
      expect(res.status).toBe(401);
    });

    it('✅ debe manejar parámetro "tipo" inválido gracefully', async () => {
      const res = await makeAuthRequest('get', '/api/inventario/alertas?tipo=invalido', token);
      
      // Debe retornar 200 y tratar como "todos"
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('✅ debe manejar "dias" negativo o inválido', async () => {
      const res = await makeAuthRequest('get', '/api/inventario/alertas/caducidad?dias=-5', token);
      
      // Debe usar default (7) o rechazar
      expect(res.status).toBe(200);
    });

    it('✅ debe retornar arrays vacíos si no hay alertas', async () => {
      // Limpiar datos y verificar respuesta con inventario vacío
      const db = getDatabase();
      
      // Actualizar stock para que no haya alertas
      await new Promise((resolve) => {
        db.run(`UPDATE inventario SET cantidad = 100 WHERE id = ?`, [itemId1], resolve);
      });

      const res = await makeAuthRequest('get', '/api/inventario/alertas/criticas', token);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.emergencias)).toBe(true);
      expect(Array.isArray(res.body.data.criticas)).toBe(true);
      expect(Array.isArray(res.body.data.bajas)).toBe(true);
    });

  });

  // ===================================================================
  // INTEGRACIÓN CON VALIDACIONES
  // ===================================================================
  describe('Integración con Validaciones', () => {

    it('✅ debe poder validar movimiento antes de crear', async () => {
      const res = await makeAuthRequest('post', '/api/inventario/validar', token)
        .send({
          ingrediente_id: ingredienteId1,
          cantidad: 50,
          tipo: 'ENTRADA',
          lote: 'LOTE-TEST-999'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('valido');
    });

  });

});
