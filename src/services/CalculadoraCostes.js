/**
 * Servicio para calcular costes automáticamente
 * Replica la lógica de fórmulas del Excel fabricación.xlsb
 */

class CalculadoraCostes {
  constructor(db) {
    this.db = db;
  }

  /**
   * Calcula el coste de un ingrediente/artículo en la receta
   * Fórmula Excel: M = L * I (coste_kg * cantidad_neta_kg)
   * 
   * @param {number} cantidadBruta - Cantidad bruta introducida
   * @param {string} unidad - 'kg', 'lt', 'ud'
   * @param {number} perdida - Porcentaje de pérdida (0-1)
   * @param {number} costeKilo - Coste por kg/lt del ingrediente
   * @param {number} pesoUnidad - Peso de una unidad (si es 'ud')
   * @returns {Object} {cantidadNeta, cantidadKilos, costeTotal}
   */
  calcularCosteIngrediente(cantidadBruta, unidad, perdida, costeKilo, pesoUnidad = 0) {
    // Calcular cantidad en kg/lt según unidad
    // Fórmula Excel I: IF(F="kg",H) + IF(F="ud",H*G) + IF(F="lt",H)
    const unidadLower = (unidad || '').toLowerCase();
    let cantidadKilos = 0;
    if (unidadLower === 'kg' || unidadLower === 'lt' || unidadLower === 'l') {
      cantidadKilos = cantidadBruta;
    } else if (unidadLower === 'ud' || unidadLower === 'un') {
      cantidadKilos = cantidadBruta * pesoUnidad;
    }

    // Aplicar pérdidas/mermas
    // Fórmula Excel K: I - I*J
    const cantidadNeta = cantidadKilos - (cantidadKilos * perdida);

    // Calcular coste total
    // Fórmula Excel M: L * I
    const costeTotal = costeKilo * cantidadKilos;

    return {
      cantidadNeta,
      cantidadKilos,
      costeTotal
    };
  }

  /**
   * Calcula el coste total de un escandallo (receta)
   * Fórmula Excel: SUM(M8:M27) - suma de todos los costes de ingredientes
   * 
   * @param {number} platoId - ID del plato
   * @returns {Promise<Object>} {costeTotal, perdidaTotal, ingredientes[]}
   */
  async calcularCosteEscandallo(platoId) {
    return new Promise((resolve, reject) => {
      // Obtener todos los ingredientes del escandallo usando IDs
      this.db.all(
        `SELECT e.*, 
                i.coste_kilo, 
                i.peso_neto_envase as peso_unidad,
                i.nombre as nombre_ingrediente,
                i.codigo as codigo_ingrediente
         FROM escandallos e
         LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
         WHERE e.plato_id = ?`,
        [platoId],
        (err, ingredientes) => {
          if (err) return reject(err);

          let costeTotal = 0;
          let pesoNetoTotal = 0;
          let pesoBrutoTotal = 0;
          const detalles = [];

          // Calcular coste de cada ingrediente
          ingredientes.forEach(ing => {
            const calculo = this.calcularCosteIngrediente(
              ing.cantidad,
              ing.unidad,
              0, // pérdida por ahora en 0
              ing.coste_kilo || 0,
              ing.peso_unidad || 0
            );

            costeTotal += calculo.costeTotal;
            pesoNetoTotal += calculo.cantidadNeta;
            pesoBrutoTotal += calculo.cantidadKilos;

            detalles.push({
              ingrediente: ing.nombre_ingrediente,
              codigo: ing.codigo_ingrediente,
              cantidad: ing.cantidad,
              unidad: ing.unidad,
              ...calculo
            });
          });

          // Fórmula Excel J: IFERROR(100%-K/I,0) - Porcentaje de pérdida total
          const perdidaTotal = pesoBrutoTotal > 0 
            ? (100 - (pesoNetoTotal / pesoBrutoTotal) * 100) / 100
            : 0;

          resolve({
            costeTotal,
            costeEscandallo: costeTotal,
            pesoNetoTotal,
            pesoBrutoTotal,
            perdidaTotal,
            ingredientes: detalles
          });
        }
      );
    });
  }

  /**
   * Calcula el coste por ración de un plato
   * Fórmula Excel L: SUM(M8:M27)/K7 - coste total / peso neto total
   * 
   * @param {string} platoId - ID del plato
   * @param {number} pesoRacion - Peso de una ración en kg
   * @returns {Promise<number>} Coste por ración
   */
  async calcularCosteRacion(platoId, pesoRacion) {
    const escandallo = await this.calcularCosteEscandallo(platoId);
    
    // Si el peso neto es 0, retornar 0
    if (escandallo.pesoNetoTotal === 0) return 0;

    // Fórmula Excel L: SUM(M)/K - coste total / peso neto
    const costePorKilo = escandallo.costeTotal / escandallo.pesoNetoTotal;
    
    return costePorKilo * pesoRacion;
  }

  /**
   * Calcula los alérgenos de un plato basándose en sus ingredientes
   * Fórmula Excel: IF(COUNTIF(AO8:AO27,"X"),"x",0) para cada alérgeno
   * 
   * @param {number} platoId - ID del plato
   * @returns {Promise<Object>} Objeto con alérgenos
   */
  async calcularAlergenosPlato(platoId) {
    return new Promise((resolve, reject) => {
      // Obtener ingredientes del escandallo con sus alérgenos
      this.db.all(
        `SELECT i.sesamo, i.pescado, i.mariscos, i.apio, i.frutos_secos,
                i.sulfitos, i.lacteos, i.altramuces, i.gluten, i.ovoproductos
         FROM escandallos e
         JOIN ingredientes i ON e.ingrediente_id = i.id
         WHERE e.plato_id = ? AND e.cantidad > 0`,
        [platoId],
        (err, rows) => {
          if (err) return reject(err);

          // Inicializar alérgenos
          const alergenos = {
            sesamo: 0,
            pescado: 0,
            mariscos: 0,
            apio: 0,
            frutos_secos: 0,
            sulfitos: 0,
            lacteos: 0,
            altramuces: 0,
            gluten: 0,
            ovoproductos: 0
          };

          // Si algún ingrediente tiene el alérgeno, marcar en el plato
          rows.forEach(ing => {
            Object.keys(alergenos).forEach(alergeno => {
              if (ing[alergeno] === 1 || ing[alergeno] === 'X' || ing[alergeno] === 'x') {
                alergenos[alergeno] = 'x';
              }
            });
          });

          resolve(alergenos);
        }
      );
    });
  }

  /**
   * Actualiza el coste de un plato después de modificar el escandallo
   * 
   * @param {string} platoId - ID del plato
   * @returns {Promise<Object>} Datos actualizados del plato
   */
  async actualizarCostePlato(platoId) {
    return new Promise(async (resolve, reject) => {
      try {
        // Obtener peso de ración del plato
        // Obtener datos del plato usando ID
        this.db.get(
          'SELECT peso_raciones FROM platos WHERE id = ?',
          [platoId],
          async (err, plato) => {
            if (err) return reject(err);
            if (!plato) return reject(new Error('Plato no encontrado'));

            const pesoRacion = plato.peso_raciones || 0;
            
            // Calcular coste de escandallo
            const escandallo = await this.calcularCosteEscandallo(platoId);
            
            // Calcular coste de ración
            const costeRacion = pesoRacion > 0 && escandallo.pesoNetoTotal > 0
              ? (escandallo.costeTotal / escandallo.pesoNetoTotal) * pesoRacion
              : 0;
            
            // Calcular alérgenos heredados
            const alergenos = await this.calcularAlergenosPlato(platoId);

            // Actualizar plato en la BD usando ID
            this.db.run(
              `UPDATE platos 
               SET coste_racion = ?,
                   coste_escandallo = ?,
                   sesamo = ?, pescado = ?, mariscos = ?, apio = ?, frutos_secos = ?,
                   sulfitos = ?, lacteos = ?, altramuces = ?, gluten = ?, ovoproductos = ?
               WHERE id = ?`,
              [
                costeRacion,
                escandallo.costeTotal,
                alergenos.sesamo, alergenos.pescado, alergenos.mariscos, alergenos.apio,
                alergenos.frutos_secos, alergenos.sulfitos, alergenos.lacteos,
                alergenos.altramuces, alergenos.gluten, alergenos.ovoproductos,
                platoId
              ],
              function(err) {
                if (err) return reject(err);
                
                resolve({
                  platoId,
                  costeRacion,
                  costeEscandallo: escandallo.costeTotal,
                  alergenos,
                  actualizado: true
                });
              }
            );
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Calcula el peso de una porción en formato GN
   * Fórmula Excel O: IFS basado en formato y porciones
   * 
   * @param {string} formato - 'GN 1/1', 'GN 1/2', 'GN 1/3', etc.
   * @param {number} porciones - Número de porciones
   * @param {number} pesoTotal - Peso total del plato
   * @returns {number} Peso por porción
   */
  calcularPesoPorcion(formato, porciones, pesoTotal) {
    if (porciones === 0) return 0;
    
    // Por ahora, división simple
    // TODO: Implementar lógica específica por formato GN
    return pesoTotal / porciones;
  }
}

module.exports = CalculadoraCostes;
