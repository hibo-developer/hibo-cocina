/**
 * Servicio de Cálculos - HIBO COCINA
 * 
 * Implementa toda la lógica de cálculos de negocio:
 * - Coste de platos
 * - Coste de ingredientes
 * - Rendimiento
 * - Márgenes
 * - Stock
 */

const { getDatabase } = require('./database');

class ServicioCalculos {
  /**
   * Calcula el coste total de un plato basado en sus escandallos
   * 
   * Fórmula:
   * coste_plato = SUM(ingrediente.coste_unitario * cantidad_escandallo)
   * 
   * @param {number} platoId - ID del plato
   * @returns {Promise<Object>} { costeTotal, detalles }
   */
  static async calcularCostePlato(platoId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          e.id,
          e.ingrediente_id,
          i.nombre as ingrediente,
          e.cantidad,
          e.unidad,
          i.coste_unitario,
          (e.cantidad * i.coste_unitario) as coste_linea
        FROM escandallos e
        JOIN ingredientes i ON e.ingrediente_id = i.id
        WHERE e.plato_id = ?`,
        [platoId],
        (err, rows) => {
          if (err) return reject(err);
          
          let costeTotal = 0;
          const detalles = [];
          
          if (rows && rows.length > 0) {
            rows.forEach(row => {
              costeTotal += row.coste_linea || 0;
              detalles.push({
                ingrediente: row.ingrediente,
                cantidad: row.cantidad,
                unidad: row.unidad,
                costeUnitario: row.coste_unitario,
                costeLinea: row.coste_linea
              });
            });
          }
          
          resolve({
            platoId,
            costeTotal: parseFloat(costeTotal.toFixed(2)),
            detalles,
            ingredientesCount: rows ? rows.length : 0
          });
        }
      );
    });
  }

  /**
   * Calcula el rendimiento de un ingrediente en un escandallo
   * 
   * Rendimiento = (cantidad_receta / cantidad_compra) * 100
   * 
   * @param {number} ingredienteId - ID del ingrediente
   * @param {number} cantidadReceta - Cantidad en la receta
   * @returns {Promise<number>} Porcentaje de rendimiento
   */
  static async calcularRendimiento(ingredienteId, cantidadReceta) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT peso_neto_envase FROM ingredientes WHERE id = ?',
        [ingredienteId],
        (err, row) => {
          if (err) return reject(err);
          
          if (!row || !row.peso_neto_envase) {
            return resolve(100); // Si no hay datos, asumir 100%
          }
          
          const rendimiento = (cantidadReceta / row.peso_neto_envase) * 100;
          resolve(parseFloat(rendimiento.toFixed(2)));
        }
      );
    });
  }

  /**
   * Calcula el coste unitario de un plato (coste / raciones)
   * 
   * @param {number} platoId - ID del plato
   * @returns {Promise<number>} Coste unitario
   */
  static async calcularCosteUnitario(platoId) {
    const db = getDatabase();
    
    return new Promise(async (resolve, reject) => {
      try {
        const costePlato = await this.calcularCostePlato(platoId);
        
        db.get(
          'SELECT peso_raciones FROM platos WHERE id = ?',
          [platoId],
          (err, row) => {
            if (err) return reject(err);
            
            if (!row || !row.peso_raciones || row.peso_raciones === 0) {
              return resolve(costePlato.costeTotal);
            }
            
            const costeUnitario = costePlato.costeTotal / row.peso_raciones;
            resolve(parseFloat(costeUnitario.toFixed(2)));
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Valida que todos los ingredientes de un escandallo existan en inventario
   * 
   * @param {number} platoId - ID del plato
   * @returns {Promise<Object>} { disponible, faltantes }
   */
  static async validarDisponibilidadIngredientes(platoId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          e.id,
          e.ingrediente_id,
          i.nombre,
          e.cantidad,
          e.unidad,
          inv.stock_actual
        FROM escandallos e
        JOIN ingredientes i ON e.ingrediente_id = i.id
        LEFT JOIN inventario inv ON e.ingrediente_id = inv.ingrediente_id
        WHERE e.plato_id = ?`,
        [platoId],
        (err, rows) => {
          if (err) return reject(err);
          
          const faltantes = [];
          
          if (rows && rows.length > 0) {
            rows.forEach(row => {
              const stockActual = row.stock_actual || 0;
              if (stockActual < row.cantidad) {
                faltantes.push({
                  ingrediente: row.nombre,
                  necesario: row.cantidad,
                  disponible: stockActual,
                  falta: row.cantidad - stockActual,
                  unidad: row.unidad
                });
              }
            });
          }
          
          resolve({
            disponible: faltantes.length === 0,
            faltantes
          });
        }
      );
    });
  }

  /**
   * Valida referencias foráneas en importación
   * 
   * @param {string} tipo - 'escandallo', 'pedido', etc
   * @param {Object} datos - Datos a validar
   * @returns {Promise<Object>} { valido, errores }
   */
  static async validarReferencias(tipo, datos) {
    const db = getDatabase();
    const errores = [];
    
    if (tipo === 'escandallo') {
      // Validar que el plato existe
      if (datos.plato_codigo) {
        const plato = await new Promise((resolve, reject) => {
          db.get('SELECT id FROM platos WHERE codigo = ?', [datos.plato_codigo], (err, row) => {
            if (err) return reject(err);
            resolve(row);
          });
        });
        
        if (!plato) {
          errores.push(`Plato con código ${datos.plato_codigo} no existe`);
        }
      }
      
      // Validar que el ingrediente existe
      if (datos.ingrediente_codigo) {
        const ingrediente = await new Promise((resolve, reject) => {
          db.get('SELECT id FROM ingredientes WHERE codigo = ?', [datos.ingrediente_codigo], (err, row) => {
            if (err) return reject(err);
            resolve(row);
          });
        });
        
        if (!ingrediente) {
          errores.push(`Ingrediente con código ${datos.ingrediente_codigo} no existe`);
        }
      }
    }
    
    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Calcula margen de ganancia de un plato
   * 
   * margen% = ((precio_venta - coste) / precio_venta) * 100
   * 
   * @param {number} platoId - ID del plato
   * @returns {Promise<Object>} { precioVenta, coste, margen%, margenAbsoluto }
   */
  static async calcularMargen(platoId) {
    const db = getDatabase();
    
    return new Promise(async (resolve, reject) => {
      try {
        const coste = await this.calcularCostePlato(platoId);
        
        db.get(
          'SELECT precio_venta FROM platos WHERE id = ?',
          [platoId],
          (err, row) => {
            if (err) return reject(err);
            
            const precioVenta = row?.precio_venta || 0;
            const costeTotal = coste.costeTotal;
            const margenAbsoluto = precioVenta - costeTotal;
            const margenPorcentaje = precioVenta > 0 
              ? ((margenAbsoluto / precioVenta) * 100)
              : 0;
            
            resolve({
              platoId,
              precioVenta: parseFloat(precioVenta.toFixed(2)),
              costeTotal: costeTotal,
              margenAbsoluto: parseFloat(margenAbsoluto.toFixed(2)),
              margenPorcentaje: parseFloat(margenPorcentaje.toFixed(2))
            });
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Valida stock mínimo de ingredientes
   * 
   * @returns {Promise<Array>} Array de ingredientes bajo stock mínimo
   */
  static async validarStockMinimo() {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          i.id,
          i.nombre,
          i.codigo,
          inv.stock_actual,
          inv.stock_minimo,
          (inv.stock_minimo - inv.stock_actual) as deficit
        FROM ingredientes i
        LEFT JOIN inventario inv ON i.id = inv.ingrediente_id
        WHERE inv.stock_actual < inv.stock_minimo`,
        (err, rows) => {
          if (err) return reject(err);
          
          const alertas = (rows || []).map(row => ({
            ingredienteId: row.id,
            ingrediente: row.nombre,
            codigo: row.codigo,
            stockActual: row.stock_actual || 0,
            stockMinimo: row.stock_minimo,
            deficit: row.deficit
          }));
          
          resolve(alertas);
        }
      );
    });
  }

  /**
   * Calcula cantidad total necesaria de un ingrediente para una producción
   * 
   * @param {number} ingredienteId - ID del ingrediente
   * @param {Array} platosPedidos - Array de { platoId, cantidad }
   * @returns {Promise<number>} Cantidad total necesaria
   */
  static async calcularNecesidadIngrediente(ingredienteId, platosPedidos) {
    const db = getDatabase();
    let cantidadTotal = 0;
    
    for (const { platoId, cantidad } of platosPedidos) {
      const needed = await new Promise((resolve, reject) => {
        db.get(
          `SELECT cantidad FROM escandallos 
          WHERE plato_id = ? AND ingrediente_id = ?`,
          [platoId, ingredienteId],
          (err, row) => {
            if (err) return reject(err);
            resolve((row?.cantidad || 0) * cantidad);
          }
        );
      });
      
      cantidadTotal += needed;
    }
    
    return parseFloat(cantidadTotal.toFixed(2));
  }
}

module.exports = ServicioCalculos;
