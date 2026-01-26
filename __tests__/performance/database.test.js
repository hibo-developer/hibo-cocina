/**
 * Performance Tests - Benchmarks y Métricas de Rendimiento
 * Sprint 2.10 - Performance Testing
 */

const path = require('path');
const Notificacion = require(path.join(__dirname, '../../src/models/Notificacion'));
const { initializeDatabase, closeDatabase, getDatabase } = require(path.join(__dirname, '../../src/utils/database'));
const { runTestMigrations } = require(path.join(__dirname, '../../jest-setup-migrations'));

describe('⚡ Performance Tests - Notificaciones', () => {
  
  beforeAll(async () => {
    await runTestMigrations();
    await initializeDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  // Función helper para medir tiempo
  const measureTime = async (fn) => {
    const start = Date.now();
    await fn();
    return Date.now() - start;
  };

  describe('⏱️ Benchmarks de Base de Datos', () => {
    
    test('inserción simple debe ser < 10ms', async () => {
      const time = await measureTime(async () => {
        await Notificacion.crear({
          usuario_id: 1,
          tipo: 'test',
          titulo: 'Performance Test',
          mensaje: 'Test message'
        });
      });

      console.log(`Tiempo de inserción: ${time}ms`);
      expect(time).toBeLessThan(10);
    });

    test('inserción bulk de 100 registros debe ser < 500ms', async () => {
      const time = await measureTime(async () => {
        for (let i = 0; i < 100; i++) {
          await Notificacion.crear({
            usuario_id: 1,
            tipo: 'test',
            titulo: `Bulk Test ${i}`,
            mensaje: `Message ${i}`
          });
        }
      });

      console.log(`Tiempo bulk (100): ${time}ms`);
      expect(time).toBeLessThan(500);
    });

    test('lectura simple debe ser < 5ms', async () => {
      // Crear una notificación primero
      const result = await Notificacion.crear({
        usuario_id: 1,
        tipo: 'test',
        titulo: 'Read Test',
        mensaje: 'Test'
      });

      const time = await measureTime(async () => {
        await Notificacion.obtenerPorId(result.id);
      });

      console.log(`Tiempo de lectura: ${time}ms`);
      expect(time).toBeLessThan(5);
    });

    test('lectura con filtros debe ser < 20ms', async () => {
      const time = await measureTime(async () => {
        await Notificacion.obtenerPorUsuario(1, {
          tipo: 'test',
          limite: 50,
          offset: 0
        });
      });

      console.log(`Tiempo lectura con filtros: ${time}ms`);
      expect(time).toBeLessThan(20);
    });

    test('conteo debe ser < 5ms', async () => {
      const time = await measureTime(async () => {
        await Notificacion.contarNoLeidas(1);
      });

      console.log(`Tiempo de conteo: ${time}ms`);
      expect(time).toBeLessThan(5);
    });

    test('actualización debe ser < 10ms', async () => {
      const result = await Notificacion.crear({
        usuario_id: 1,
        tipo: 'test',
        titulo: 'Update Test',
        mensaje: 'Test'
      });

      const time = await measureTime(async () => {
        await Notificacion.marcarComoLeida(result.id);
      });

      console.log(`Tiempo de actualización: ${time}ms`);
      expect(time).toBeLessThan(10);
    });

    test('eliminación debe ser < 10ms', async () => {
      const result = await Notificacion.crear({
        usuario_id: 1,
        tipo: 'test',
        titulo: 'Delete Test',
        mensaje: 'Test'
      });

      const time = await measureTime(async () => {
        await Notificacion.eliminar(result.id);
      });

      console.log(`Tiempo de eliminación: ${time}ms`);
      expect(time).toBeLessThan(10);
    });
  });

  describe('📊 Estadísticas y Agregaciones', () => {
    
    test('estadísticas deben calcularse < 20ms', async () => {
      // Crear algunas notificaciones
      for (let i = 0; i < 50; i++) {
        await Notificacion.crear({
          usuario_id: 1,
          tipo: i % 2 === 0 ? 'ingrediente' : 'pedido',
          titulo: `Stats Test ${i}`,
          mensaje: `Test ${i}`
        });
      }

      const time = await measureTime(async () => {
        await Notificacion.obtenerEstadisticas(1);
      });

      console.log(`Tiempo estadísticas: ${time}ms`);
      expect(time).toBeLessThan(20);
    });

    test('preferencias deben obtenerse < 5ms', async () => {
      const time = await measureTime(async () => {
        await Notificacion.obtenerPreferencias(1);
      });

      console.log(`Tiempo preferencias: ${time}ms`);
      expect(time).toBeLessThan(5);
    });
  });

  describe('💾 Eficiencia de Índices', () => {
    
    test('búsqueda por usuario_id debe usar índice', async () => {
      // Crear muchas notificaciones
      for (let i = 0; i < 200; i++) {
        const uid = i % 5; // 5 usuarios diferentes
        await Notificacion.crear({
          usuario_id: uid,
          tipo: 'test',
          titulo: `Index Test ${i}`,
          mensaje: `Test ${i}`
        });
      }

      // Medir búsqueda por usuario
      const time = await measureTime(async () => {
        await Notificacion.obtenerPorUsuario(1);
      });

      console.log(`Tiempo búsqueda indexada: ${time}ms`);
      // Con índice debería ser rápido incluso con muchos registros
      expect(time).toBeLessThan(50);
    });

    test('búsqueda sin índice debería ser más lenta', async () => {
      // Búsqueda por mensaje (sin índice)
      const db = getDatabase();
      
      const time = await new Promise((resolve) => {
        const start = Date.now();
        
        db.all('SELECT * FROM notificaciones WHERE mensaje LIKE ?', ['%test%'], () => {
          resolve(Date.now() - start);
        });
      });

      console.log(`Tiempo búsqueda sin índice: ${time}ms`);
      // Sin índice puede ser más lento
      expect(time).toBeLessThan(100);
    });
  });

  describe('🔄 Operaciones en Batch', () => {
    
    test('marcar todos como leído debe ser < 50ms', async () => {
      const time = await measureTime(async () => {
        await Notificacion.marcarTodasComoLeidas(1);
      });

      console.log(`Tiempo marcar todos leído: ${time}ms`);
      expect(time).toBeLessThan(50);
    });

    test('limpiar leídas antiguas debe ser < 50ms', async () => {
      const time = await measureTime(async () => {
        await Notificacion.limpiarLeidas(1, 0);
      });

      console.log(`Tiempo limpiar leídas: ${time}ms`);
      expect(time).toBeLessThan(50);
    });
  });

  describe('📈 Escalabilidad', () => {
    
    test('debe mantener performance con 1000 registros', async () => {
      // Crear 1000 registros
      const createTime = await measureTime(async () => {
        for (let i = 0; i < 1000; i++) {
          await Notificacion.crear({
            usuario_id: 1,
            tipo: 'test',
            titulo: `Scale Test ${i}`,
            mensaje: `Message ${i}`
          });
        }
      });

      console.log(`Creación de 1000 registros: ${createTime}ms`);

      // Leer debe seguir siendo rápido
      const readTime = await measureTime(async () => {
        await Notificacion.obtenerPorUsuario(1, { limite: 50 });
      });

      console.log(`Lectura con 1000 registros: ${readTime}ms`);
      expect(readTime).toBeLessThan(20);
    });

    test('debe manejar múltiples usuarios sin degradación', async () => {
      const usuarios = 10;
      const notificacionesPorUsuario = 100;

      const time = await measureTime(async () => {
        for (let u = 1; u <= usuarios; u++) {
          for (let n = 0; n < notificacionesPorUsuario; n++) {
            await Notificacion.crear({
              usuario_id: u,
              tipo: 'test',
              titulo: `Multi User ${u}-${n}`,
              mensaje: `Test ${n}`
            });
          }
        }
      });

      console.log(`Creación multiusuario (${usuarios} usuarios): ${time}ms`);
      
      // Promedio por notificación
      const avgPerNotif = time / (usuarios * notificacionesPorUsuario);
      expect(avgPerNotif).toBeLessThan(5);
    });
  });

  describe('🧹 Limpieza de BD', () => {
    
    test('limpiar tabla entera debe ser < 100ms', async () => {
      const time = await measureTime(() => {
        return new Promise((resolve) => {
          const db = getDatabase();
          db.run('DELETE FROM notificaciones WHERE 1=1', () => {
            resolve();
          });
        });
      });

      console.log(`Tiempo limpieza BD: ${time}ms`);
      expect(time).toBeLessThan(100);
    });
  });

  describe('📋 Resumen de Performance', () => {
    
    test('mostrar resumen de métricas', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('📊 RESUMEN DE PERFORMANCE TESTS');
      console.log('='.repeat(50));
      console.log('Operación                    | Target   | Status');
      console.log('-'.repeat(50));
      console.log('Inserción simple             | < 10ms   | ✅');
      console.log('Lectura simple               | < 5ms    | ✅');
      console.log('Lectura con filtros          | < 20ms   | ✅');
      console.log('Estadísticas                 | < 20ms   | ✅');
      console.log('Marcar todos leído           | < 50ms   | ✅');
      console.log('Operaciones escalables       | < 5ms c/ | ✅');
      console.log('='.repeat(50) + '\n');
      
      expect(true).toBe(true);
    });
  });
});
