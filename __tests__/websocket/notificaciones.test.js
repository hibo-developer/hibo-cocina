/**
 * Tests para WebSocket - Eventos en Tiempo Real
 * Sprint 2.10 - WebSocket Testing
 */

const path = require('path');
const io = require('socket.io-client');
const Notificacion = require(path.join(__dirname, '../../src/models/Notificacion'));
const { initializeDatabase, closeDatabase } = require(path.join(__dirname, '../../src/utils/database'));
const { runTestMigrations } = require(path.join(__dirname, '../../jest-setup-migrations'));

describe('🔌 WebSocket - Eventos en Tiempo Real', () => {
  
  let socket;
  const socketURL = 'http://localhost:3000';
  const socketOptions = {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  };

  beforeAll(async () => {
    await runTestMigrations();
    await initializeDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  afterEach((done) => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
    done();
  });

  describe('✅ Conexión WebSocket', () => {
    
    test('debe conectar a WebSocket correctamente', (done) => {
      socket = io(socketURL, socketOptions);
      
      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        done();
      });

      socket.on('connect_error', (error) => {
        done(error);
      });

      setTimeout(() => {
        if (!socket.connected) {
          done(new Error('WebSocket timeout'));
        }
      }, 5000);
    });

    test('debe recibir confirmación de conexión', (done) => {
      socket = io(socketURL, socketOptions);
      
      socket.on('connect', () => {
        socket.emit('user:identify', { userId: 1 }, (response) => {
          expect(response).toBeDefined();
          done();
        });
      });

      socket.on('connect_error', (error) => {
        done(error);
      });
    });

    test('debe desconectar gracefully', (done) => {
      socket = io(socketURL, socketOptions);
      
      socket.on('connect', () => {
        socket.disconnect();
        
        setTimeout(() => {
          expect(socket.connected).toBe(false);
          done();
        }, 500);
      });

      socket.on('connect_error', (error) => {
        done(error);
      });
    });
  });

  describe('📬 Eventos de Notificaciones', () => {
    
    test('debe recibir evento newNotification', (done) => {
      socket = io(socketURL, socketOptions);
      
      socket.on('connect', () => {
        socket.on('notificacion:new', (data) => {
          expect(data).toBeDefined();
          expect(data.id).toBeDefined();
          expect(data.tipo).toBeDefined();
          done();
        });

        // Simular creación de notificación
        socket.emit('test:createNotification', { 
          usuario_id: 1,
          tipo: 'test',
          titulo: 'Test',
          mensaje: 'Test message'
        });
      });

      socket.on('connect_error', (error) => {
        done(error);
      });

      setTimeout(() => {
        if (!socket.connected) {
          done(new Error('WebSocket timeout'));
        }
      }, 5000);
    });

    test('debe recibir evento de actualización', (done) => {
      socket = io(socketURL, socketOptions);
      
      socket.on('connect', () => {
        socket.on('notificacion:updated', (data) => {
          expect(data).toBeDefined();
          expect(data.id).toBeDefined();
          done();
        });

        // Simular actualización
        socket.emit('test:updateNotification', { id: 1 });
      });

      socket.on('connect_error', (error) => {
        done(error);
      });

      setTimeout(() => {
        done(new Error('Evento no recibido'));
      }, 5000);
    });

    test('debe recibir evento de eliminación', (done) => {
      socket = io(socketURL, socketOptions);
      
      socket.on('connect', () => {
        socket.on('notificacion:deleted', (data) => {
          expect(data).toBeDefined();
          expect(data.id).toBeDefined();
          done();
        });

        // Simular eliminación
        socket.emit('test:deleteNotification', { id: 1 });
      });

      socket.on('connect_error', (error) => {
        done(error);
      });

      setTimeout(() => {
        done(new Error('Evento no recibido'));
      }, 5000);
    });
  });

  describe('🔄 Reconexión', () => {
    
    test('debe reconectarse automáticamente', (done) => {
      socket = io(socketURL, socketOptions);
      let connected = false;
      let disconnected = false;

      socket.on('connect', () => {
        if (!connected) {
          connected = true;
          // Simular desconexión
          socket.io.engine.close();
        } else if (disconnected) {
          // Se reconectó exitosamente
          expect(socket.connected).toBe(true);
          done();
        }
      });

      socket.on('disconnect', () => {
        disconnected = true;
      });

      socket.on('connect_error', (error) => {
        // Ignorar errores de reconexión
      });

      setTimeout(() => {
        if (!disconnected) {
          done(new Error('No hubo desconexión'));
        }
      }, 10000);
    });
  });

  describe('👥 Multi-Cliente', () => {
    
    test('debe sincronizar entre múltiples clientes', (done) => {
      const socket1 = io(socketURL, socketOptions);
      const socket2 = io(socketURL, socketOptions);
      
      let socket1Ready = false;
      let socket2Ready = false;
      let eventReceived = false;

      socket1.on('connect', () => {
        socket1Ready = true;
      });

      socket2.on('connect', () => {
        socket2Ready = true;
      });

      // Escuchar en socket2
      socket2.on('notificacion:new', (data) => {
        eventReceived = true;
      });

      // Esperar a que ambos se conecten
      const checkReady = setInterval(() => {
        if (socket1Ready && socket2Ready) {
          clearInterval(checkReady);
          
          // Socket1 emite, socket2 debería recibir
          socket1.emit('test:createNotification', {
            usuario_id: 1,
            tipo: 'test',
            titulo: 'Broadcast Test',
            mensaje: 'This should be received by socket2'
          });

          setTimeout(() => {
            socket1.disconnect();
            socket2.disconnect();
            
            expect(eventReceived).toBe(true);
            done();
          }, 2000);
        }
      }, 100);

      setTimeout(() => {
        if (!socket1Ready || !socket2Ready) {
          done(new Error('Timeout conectando sockets'));
        }
      }, 5000);
    });
  });

  describe('⏱️ Timeout y Keepalive', () => {
    
    test('debe mantener conexión activa', (done) => {
      socket = io(socketURL, socketOptions);
      
      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        
        // Esperar sin actividad
        setTimeout(() => {
          expect(socket.connected).toBe(true);
          done();
        }, 5000);
      });

      socket.on('connect_error', (error) => {
        done(error);
      });
    });
  });

  describe('🚨 Manejo de Errores', () => {
    
    test('debe manejar conexión rechazada', (done) => {
      const badOptions = {
        ...socketOptions,
        reconnectionDelay: 100,
        reconnectionAttempts: 2
      };
      
      socket = io('http://localhost:9999', badOptions); // Puerto incorrecto
      
      socket.on('connect_error', (error) => {
        expect(error).toBeDefined();
        done();
      });

      setTimeout(() => {
        socket.disconnect();
        done(new Error('Debería haber error de conexión'));
      }, 3000);
    });

    test('debe limpiar recursos al desconectar', (done) => {
      socket = io(socketURL, socketOptions);
      
      socket.on('connect', () => {
        socket.disconnect();
        
        setTimeout(() => {
          expect(socket.connected).toBe(false);
          done();
        }, 500);
      });

      socket.on('connect_error', (error) => {
        done(error);
      });
    });
  });

  describe('🎯 Eventos Específicos del Negocio', () => {
    
    test('debe recibir alertas de stock bajo', (done) => {
      socket = io(socketURL, socketOptions);
      
      socket.on('connect', () => {
        socket.on('alerta:stock-bajo', (data) => {
          expect(data).toBeDefined();
          expect(data.ingrediente_id).toBeDefined();
          expect(data.stock_actual).toBeDefined();
          done();
        });

        // Simular actualización de stock bajo
        socket.emit('test:lowStockAlert', {
          ingrediente_id: 1,
          stock_actual: 5,
          stock_minimo: 10
        });
      });

      socket.on('connect_error', (error) => {
        done(error);
      });

      setTimeout(() => {
        done(new Error('Evento no recibido'));
      }, 5000);
    });

    test('debe recibir notificación personal de pedido', (done) => {
      socket = io(socketURL, socketOptions);
      
      socket.on('connect', () => {
        socket.on('pedido:nuevo', (data) => {
          expect(data).toBeDefined();
          expect(data.pedido_id).toBeDefined();
          expect(data.usuario_id).toBeDefined();
          done();
        });

        // Simular pedido nuevo
        socket.emit('test:newOrder', {
          pedido_id: 1,
          usuario_id: 1,
          fecha: new Date().toISOString()
        });
      });

      socket.on('connect_error', (error) => {
        done(error);
      });

      setTimeout(() => {
        done(new Error('Evento no recibido'));
      }, 5000);
    });
  });
});
