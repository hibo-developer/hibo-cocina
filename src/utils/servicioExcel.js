/**
 * ============================================================================
 * SERVICIO DE EXCEL - Mejoras Implementadas desde hibo-cocina-p
 * ============================================================================
 * 
 * Patrones de importación/exportación basados en Flask version
 * - Servicio centralizado para reutilizabilidad
 * - Limpeza inteligente de datos
 * - Validación sin fallar completamente
 * - Exportación masiva a CSV/XLSX
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

class ServicioExcel {
  /**
   * Extrae TODAS las hojas de un archivo Excel en un solo pase
   * (como lo hace pandas en Python)
   */
  static extraerDatos(rutaArchivo) {
    try {
      const workbook = XLSX.readFile(rutaArchivo);
      const datos = {};

      for (const hoja of workbook.SheetNames) {
        datos[hoja] = XLSX.utils.sheet_to_json(workbook.Sheets[hoja]);
      }

      return datos;
    } catch (error) {
      console.error(`Error al leer ${rutaArchivo}:`, error.message);
      return null;
    }
  }

  /**
   * Limpia un array de datos (como limpiar_dataframe en Python)
   * - Elimina filas completamente vacías
   * - Normaliza nombres de columnas
   * - Reemplaza valores vacíos con null
   */
  static limpiarDatos(array) {
    if (!Array.isArray(array)) return [];

    return array
      .filter(fila => {
        // Eliminar filas donde TODOS los valores estén vacíos
        return Object.values(fila).some(
          v => v !== null && v !== '' && v !== undefined
        );
      })
      .map(fila => {
        const limpia = {};
        for (const [clave, valor] of Object.entries(fila)) {
          // Normalizar nombre de columna
          const claveLimpia = String(clave).trim();
          
          // Reemplazar valores vacíos con null
          const valorLimpio = 
            valor === '' || valor === undefined 
              ? null 
              : valor;
          
          if (claveLimpia) {
            limpia[claveLimpia] = valorLimpio;
          }
        }
        return limpia;
      });
  }

  /**
   * Extrae código de un campo que puede contener código + descripción
   * Ej: "PL-123 Ensalada César" → "PL-123"
   */
  static extraerCodigo(valor) {
    if (!valor) return null;

    const texto = String(valor).trim();
    
    // Buscar patrones como "PL-1", "ART-123", "EVT-001"
    const match = texto.match(/^([A-Z]+-\d+)/);
    
    return match ? match[1] : texto;
  }

  /**
   * Convierte valores de Excel a Date (maneja formato de Excel)
   * 
   * Excel almacena fechas como números:
   * - Números enteros = días desde 1900-01-01
   * - Puede también ser string o Date object
   */
  static convertirFecha(valor) {
    if (!valor) return null;

    // Si ya es Date, devolverlo
    if (valor instanceof Date) {
      return isNaN(valor) ? null : valor;
    }

    // Si es número (fecha en formato Excel)
    if (typeof valor === 'number') {
      try {
        // Fórmula: días desde 1900-01-01 (con ajuste para bug de Excel)
        const fechaBase = new Date(1900, 0, 1);
        const fecha = new Date(fechaBase.getTime() + (valor - 2) * 24 * 60 * 60 * 1000);
        return isNaN(fecha) ? null : fecha;
      } catch (error) {
        return null;
      }
    }

    // Si es string, intentar parsear
    if (typeof valor === 'string') {
      try {
        const fecha = new Date(valor);
        return isNaN(fecha) ? null : fecha;
      } catch (error) {
        return null;
      }
    }

    return null;
  }

  /**
   * Genera un archivo XLSX con múltiples hojas
   * (Usado para reportes complejos)
   */
  static generarExcelMultiples(datos, nombreArchivo) {
    try {
      const workbook = XLSX.utils.book_new();

      // datos debe ser: { 'NombreHoja': [...], 'Otra': [...] }
      for (const [nombreHoja, datos] of Object.entries(datos)) {
        const worksheet = XLSX.utils.json_to_sheet(datos);
        XLSX.utils.book_append_sheet(workbook, worksheet, nombreHoja);
      }

      const rutaCompleta = path.join(process.cwd(), 'exports', nombreArchivo);
      
      // Crear carpeta si no existe
      const carpeta = path.dirname(rutaCompleta);
      if (!fs.existsSync(carpeta)) {
        fs.mkdirSync(carpeta, { recursive: true });
      }

      XLSX.writeFile(workbook, rutaCompleta);
      return rutaCompleta;
    } catch (error) {
      console.error('Error generando Excel:', error.message);
      return null;
    }
  }

  /**
   * Convierte array a CSV (para descarga en navegador)
   */
  static generarCSV(datos, delimitador = ',') {
    if (!Array.isArray(datos) || datos.length === 0) {
      return '';
    }

    const encabezados = Object.keys(datos[0]);
    const filas = [
      encabezados.join(delimitador),
      ...datos.map(fila =>
        encabezados
          .map(col => {
            const valor = fila[col];
            // Escapar comillas en CSV
            const texto = String(valor || '').replace(/"/g, '""');
            return `"${texto}"`;
          })
          .join(delimitador)
      )
    ];

    return filas.join('\n');
  }

  /**
   * Importar con validación inteligente (no fallar completamente)
   * 
   * Retorna objeto con:
   * - importados: número de registros creados
   * - errores: array de mensajes de error
   * - detalles: información adicional
   */
  static async importarConValidacion(
    datos,
    validador,
    procesador,
    nombreEntidad = 'Registro'
  ) {
    const resultados = {
      importados: 0,
      procesados: 0,
      errores: [],
      detalles: {}
    };

    for (let idx = 0; idx < datos.length; idx++) {
      const fila = datos[idx];
      
      try {
        resultados.procesados++;

        // Ejecutar validación
        const { valido, error } = validador(fila, idx + 1);
        if (!valido) {
          resultados.errores.push(error);
          continue;
        }

        // Ejecutar procesamiento (crear registro)
        const resultado = await procesador(fila);
        resultados.importados++;
        
        // Registrar detalles del éxito
        resultados.detalles[idx] = {
          estado: 'éxito',
          id: resultado.id || null
        };

      } catch (error) {
        resultados.errores.push(
          `${nombreEntidad} ${idx + 1}: ${error.message}`
        );
        
        resultados.detalles[idx] = {
          estado: 'error',
          mensaje: error.message
        };
      }
    }

    return resultados;
  }
}

module.exports = ServicioExcel;
