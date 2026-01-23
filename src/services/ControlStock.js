/**
 * Servicio para control de stock e inventario
 * Replica la lógica de fórmulas del Excel para gestión de stock
 */

class ControlStock {
  constructor(db) {
    this.db = db;
  }

  /**
   * Actualiza el stock después de una producción
   * Descontar ingredientes utilizados del inventario
   * 
   * @param {string} platoId - ID del plato producido
   * @param {number} cantidad - Cantidad de platos producidos
   * @returns {Promise<Object>} Resultado de la actualización
   */
  async descontarProduccion(platoId, cantidad) {
    return new Promise(async (resolve, reject) => {
      try {
        // Obtener todos los ingredientes del escandallo
        this.db.all(
          `SELECT e.ingrediente_codigo, e.cantidad, e.unidad
           FROM escandallos e
           WHERE e.plato_codigo = ?`,
          [platoId],
          async (err, ingredientes) => {
            if (err) return reject(err);

            const movimientos = [];

            for (const ing of ingredientes) {
              const cantidadUsar = ing.cantidad * cantidad;
              
              // Actualizar stock en inventario
              await this.actualizarStock(
                ing.ingrediente_codigo,
                -cantidadUsar, // Negativo para descontar
                `Producción de ${cantidad} x ${platoId}`
              );

              movimientos.push({
                ingrediente: ing.ingrediente_codigo,
                cantidad: cantidadUsar,
                unidad: ing.unidad
              });
            }

            resolve({
              platoId,
              cantidadProducida: cantidad,
              movimientos,
              fecha: new Date().toISOString()
            });
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Actualiza el stock de un ingrediente
   * 
   * @param {string} ingredienteId - Código del ingrediente
   * @param {number} cantidad - Cantidad a sumar/restar (positivo=entrada, negativo=salida)
   * @param {string} motivo - Razón del movimiento
   * @returns {Promise<Object>}
   */
  async actualizarStock(ingredienteId, cantidad, motivo = '') {
    return new Promise((resolve, reject) => {
      // Primero obtener stock actual
      this.db.get(
        'SELECT stock_actual FROM inventario WHERE codigo_articulo = ?',
        [ingredienteId],
        (err, row) => {
          if (err) return reject(err);

          const stockActual = row ? row.stock_actual : 0;
          const nuevoStock = stockActual + cantidad;

          // Actualizar o insertar
          const sql = row 
            ? 'UPDATE inventario SET stock_actual = ? WHERE codigo_articulo = ?'
            : 'INSERT INTO inventario (stock_actual, codigo_articulo) VALUES (?, ?)';

          this.db.run(sql, [nuevoStock, ingredienteId], (err) => {
            if (err) return reject(err);

            // Registrar movimiento
            this.registrarMovimiento(ingredienteId, cantidad, motivo, nuevoStock);

            resolve({
              ingredienteId,
              stockAnterior: stockActual,
              movimiento: cantidad,
              stockNuevo: nuevoStock,
              motivo
            });
          });
        }
      );
    });
  }

  /**
   * Registra un movimiento de stock en historial
   * 
   * @param {string} ingredienteId
   * @param {number} cantidad
   * @param {string} motivo
   * @param {number} stockFinal
   */
  registrarMovimiento(ingredienteId, cantidad, motivo, stockFinal) {
    const sql = `
      INSERT INTO movimientos_stock 
      (fecha, articulo_codigo, tipo, cantidad, motivo, stock_resultante)
      VALUES (datetime('now'), ?, ?, ?, ?, ?)
    `;

    const tipo = cantidad > 0 ? 'ENTRADA' : 'SALIDA';

    this.db.run(sql, [
      ingredienteId,
      tipo,
      Math.abs(cantidad),
      motivo,
      stockFinal
    ], (err) => {
      if (err) console.error('Error al registrar movimiento:', err);
    });
  }

  /**
   * Calcula las necesidades semanales de ingredientes
   * Fórmula Excel: SUMIF(Escandallos, ingrediente) * pedidos_semana
   * 
   * @param {number} semana - Número de semana
   * @returns {Promise<Array>} Lista de necesidades
   */
  async calcularNecesidadesSemanales(semana) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          i.codigo,
          i.nombre,
          i.unidad,
          SUM(e.cantidad * p.cantidad_pedida) as cantidad_necesaria,
          inv.stock_actual,
          (SUM(e.cantidad * p.cantidad_pedida) - COALESCE(inv.stock_actual, 0)) as cantidad_pedir
        FROM pedidos p
        JOIN escandallos e ON p.plato_id = e.plato_id
        JOIN ingredientes i ON e.ingrediente_id = i.id
        LEFT JOIN inventario inv ON i.codigo = inv.codigo_articulo
        WHERE p.semana = ?
        GROUP BY i.codigo
        HAVING cantidad_pedir > 0
        ORDER BY i.familia, i.nombre
      `;

      this.db.all(sql, [semana], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  /**
   * Verifica alertas de stock bajo
   * Fórmula Excel: IF(stock_actual < stock_reserva, "ALERTA", "OK")
   * 
   * @returns {Promise<Array>} Ingredientes con stock bajo
   */
  async verificarAlertas() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          i.codigo,
          i.nombre,
          inv.stock_actual,
          i.stock_reserva,
          i.unidad,
          (i.stock_reserva - inv.stock_actual) as cantidad_faltante
        FROM ingredientes i
        LEFT JOIN inventario inv ON i.codigo = inv.codigo_articulo
        WHERE COALESCE(inv.stock_actual, 0) < i.stock_reserva
          AND i.activo = 1
        ORDER BY cantidad_faltante DESC
      `;

      this.db.all(sql, [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  /**
   * Calcula el coste de inventario actual
   * 
   * @returns {Promise<Object>} Valor total del inventario
   */
  async calcularValorInventario() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          SUM(inv.stock_actual * i.coste_kilo) as valor_total,
          COUNT(*) as total_articulos
        FROM inventario inv
        JOIN ingredientes i ON inv.codigo_articulo = i.codigo
        WHERE inv.stock_actual > 0
      `;

      this.db.get(sql, [], (err, row) => {
        if (err) return reject(err);
        resolve({
          valorTotal: row?.valor_total || 0,
          totalArticulos: row?.total_articulos || 0,
          fecha: new Date().toISOString()
        });
      });
    });
  }
}

module.exports = ControlStock;
