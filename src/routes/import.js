const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDatabase } = require('../utils/database');
const ServicioExcel = require('../utils/servicioExcel');

// Configurar multer para subidas de archivos
const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls) o CSV'));
    }
  }
});

/**
 * POST /api/importar
 * Importa datos desde un archivo Excel
 * Body: multipart/form-data con archivo
 * Retorna resumen de importación
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No se proporcionó archivo' 
      });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const ext = path.extname(fileName).toLowerCase();

    console.log(`📁 Importando archivo: ${fileName}`);

    // Determinar tipo de importación según el nombre del archivo
    let resumen = {
      archivo: fileName,
      timestamp: new Date().toISOString(),
      partidas: { importados: 0, errores: 0, detalles: [] },
      platos: { importados: 0, errores: 0, detalles: [] },
      ingredientes: { importados: 0, errores: 0, detalles: [] },
      escandallos: { importados: 0, errores: 0, detalles: [] },
      ofertas: { importados: 0, errores: 0, detalles: [] },
      eventos: { importados: 0, errores: 0, detalles: [] }
    };

    // Leer el archivo
    const datos = ServicioExcel.extraerDatos(filePath);

    // Procesar según tipo de archivo
    if (fileName.toLowerCase().includes('partida')) {
      resumen.partidas = await importarPartidas(datos);
    } else if (fileName.toLowerCase().includes('fabricación') || fileName.toLowerCase().includes('fabricacion')) {
      // Archivo de fabricación: importar todas sus hojas conocidas
      resumen.partidas = await importarPartidas(datos);
      resumen.platos = await importarPlatos(datos);
      resumen.ingredientes = await importarIngredientes(datos);
      resumen.escandallos = await importarEscandallos(datos);
    } else if (fileName.includes('plato')) {
      resumen.platos = await importarPlatos(datos);
    } else if (fileName.includes('ingrediente')) {
      resumen.ingredientes = await importarIngredientes(datos);
    } else if (fileName.includes('escandallos') || fileName.includes('escandallo')) {
      resumen.escandallos = await importarEscandallos(datos);
    } else if (fileName.includes('oferta')) {
      resumen.ofertas = await importarOfertas(datos);
      resumen.eventos = await importarEventos(datos);
    } else {
      // Si no hay patrón específico, intentar importar todos
      resumen.partidas = await importarPartidas(datos);
      resumen.platos = await importarPlatos(datos);
      resumen.ingredientes = await importarIngredientes(datos);
      resumen.escandallos = await importarEscandallos(datos);
      resumen.ofertas = await importarOfertas(datos);
      resumen.eventos = await importarEventos(datos);
    }

    // Limpiar archivo temporal
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      resumen
    });

  } catch (error) {
    console.error('❌ Error importando:', error);
    
    // Limpiar archivo si existe
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(400).json({ 
      error: error.message,
      success: false
    });
  }
});

// Funciones auxiliares de importación

async function importarPlatos(datos) {
  const db = getDatabase();
  const resultado = { importados: 0, errores: 0, detalles: [] };
  const platos = datos.platos || datos['Platos'] || [];
  const cleanDatos = ServicioExcel.limpiarDatos(platos);

  const procesador = async (fila, index) => {
    const codigo = ServicioExcel.extraerCodigo(
      ServicioExcel.getCampo(fila, ['Código','Codigo','CODIGO','COD','REF','ID','Cod_Platos','Codigo Plato','Código Plato','Cod Plato'])
    );
    const nombre = String(
      ServicioExcel.getCampo(fila, ['Nombre','PLATO','Plato','Nombre Plato','Nombre PLATO','Plato a la venta','Nombre plato','Titulo','Título'])
    ).trim();
    
    // Verificar duplicado
    const existe = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM platos WHERE codigo = ?', [codigo], (err, row) => {
        if (err) reject(err);
        resolve(!!row);
      });
    });

    if (existe) {
      throw new Error(`Plato con código ${codigo} ya existe`);
    }

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO platos (codigo, nombre, descripcion, estado, created_at)
         VALUES (?, ?, ?, 'activo', datetime('now'))`,
        [codigo, nombre, fila.descripcion || ''],
        function(err) {
          if (err) reject(err);
          resolve({ id: this.lastID, codigo, nombre });
        }
      );
    });
  };

  const validador = (fila) => {
    const codigo = ServicioExcel.extraerCodigo(
      ServicioExcel.getCampo(fila, ['Código','Codigo','CODIGO','COD','REF','ID','Cod_Platos','Codigo Plato','Código Plato','Cod Plato'])
    );
    const nombre = ServicioExcel.getCampo(fila, ['Nombre','PLATO','Plato','Nombre Plato','Nombre PLATO','Plato a la venta','Nombre plato','Titulo','Título']);
    if (!codigo || !nombre) {
      return { valido: false, error: 'Faltan campos: código, nombre' };
    }
    return { valido: true };
  };

  return await ServicioExcel.importarConValidacion(
    cleanDatos,
    validador,
    procesador,
    'Platos',
    resultado
  );
}

async function importarPartidas(datos) {
  const db = getDatabase();
  const resultado = { importados: 0, errores: 0, detalles: [] };
  const partidas = datos.partidas || datos['Partidas'] || [];
  const cleanDatos = ServicioExcel.limpiarDatos(partidas);

  const procesador = async (fila) => {
    const nombre = String(
      ServicioExcel.getCampo(fila, ['Nombre','Partida','Partidas','Sección','Seccion','Departamento','Area'])
    ).trim();
    const responsable = ServicioExcel.getCampo(fila, ['Responsable','Chef','Encargado']) || null;
    const descripcion = ServicioExcel.getCampo(fila, ['Descripción','Descripcion','Observaciones','Notas']) || null;

    const existe = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM partidas_cocina WHERE nombre = ?', [nombre], (err, row) => {
        if (err) reject(err);
        resolve(!!row);
      });
    });

    if (existe) {
      throw new Error(`Partida con nombre ${nombre} ya existe`);
    }

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO partidas_cocina (nombre, responsable, descripcion, activo, created_at, updated_at)
         VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))`,
        [nombre, responsable, descripcion],
        function(err) {
          if (err) reject(err);
          resolve({ id: this.lastID, nombre });
        }
      );
    });
  };

  const validador = (fila) => {
    const nombre = ServicioExcel.getCampo(fila, ['Nombre','Partida','Partidas','Sección','Seccion','Departamento','Area']);
    if (!nombre) {
      return { valido: false, error: 'Falta campo: nombre' };
    }
    return { valido: true };
  };

  return await ServicioExcel.importarConValidacion(
    cleanDatos,
    validador,
    procesador,
    'Partidas',
    resultado
  );
}

async function importarIngredientes(datos) {
  const db = getDatabase();
  const resultado = { importados: 0, errores: 0, detalles: [] };
  // Soportar fabricación.xlsx con hoja "Articulos"
  const ingredientes = datos.ingredientes || datos['Ingredientes'] || datos['Articulos'] || datos['articulos'] || [];
  const cleanDatos = ServicioExcel.limpiarDatos(ingredientes);

  const procesador = async (fila) => {
    const codigo = ServicioExcel.extraerCodigo(
      ServicioExcel.getCampo(fila, ['Código','Codigo','CODIGO','COD','REF','ID','Cod_Articulo','Codigo Articulo','Código Articulo','Cod Articulo'])
    );
    const nombre = String(
      ServicioExcel.getCampo(fila, ['Nombre','Articulo','ARTICULO','Nombre Articulo','Nombre artículo','Descripción','Descripcion'])
    ).trim();

    const existe = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM ingredientes WHERE codigo = ?', [codigo], (err, row) => {
        if (err) reject(err);
        resolve(!!row);
      });
    });

    if (existe) {
      throw new Error(`Ingrediente con código ${codigo} ya existe`);
    }

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO ingredientes (codigo, nombre, unidad, precio, estado, created_at)
         VALUES (?, ?, ?, ?, 'activo', datetime('now'))`,
        [codigo, nombre, fila.unidad || 'kg', parseFloat(fila.precio) || 0],
        function(err) {
          if (err) reject(err);
          resolve({ id: this.lastID, codigo, nombre });
        }
      );
    });
  };

  const validador = (fila) => {
    const codigo = ServicioExcel.extraerCodigo(
      ServicioExcel.getCampo(fila, ['Código','Codigo','CODIGO','COD','REF','ID','Cod_Articulo','Codigo Articulo','Código Articulo','Cod Articulo'])
    );
    const nombre = ServicioExcel.getCampo(fila, ['Nombre','Articulo','ARTICULO','Nombre Articulo','Nombre artículo','Descripción','Descripcion']);
    if (!codigo || !nombre) {
      return { valido: false, error: 'Faltan campos: código, nombre' };
    }
    return { valido: true };
  };

  return await ServicioExcel.importarConValidacion(
    cleanDatos,
    validador,
    procesador,
    'Ingredientes',
    resultado
  );
}

async function importarEscandallos(datos) {
  const db = getDatabase();
  const resultado = { importados: 0, errores: 0, detalles: [] };
  const escandallos = datos.escandallos || datos['Escandallos'] || [];
  const cleanDatos = ServicioExcel.limpiarDatos(escandallos);

  const procesador = async (fila) => {
    const { codigo, plato_codigo, ingrediente_codigo, cantidad } = fila;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO escandallos (codigo, plato_codigo, ingrediente_codigo, cantidad, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [codigo, plato_codigo, ingrediente_codigo, cantidad],
        function(err) {
          if (err) reject(err);
          resolve({ id: this.lastID, codigo });
        }
      );
    });
  };

  const validador = (fila) => {
    if (!fila.plato_codigo || !fila.ingrediente_codigo || !fila.cantidad) {
      return { valido: false, error: 'Faltan campos requeridos' };
    }
    return { valido: true };
  };

  return await ServicioExcel.importarConValidacion(
    cleanDatos,
    validador,
    procesador,
    'Escandallos',
    resultado
  );
}

async function importarOfertas(datos) {
  const db = getDatabase();
  const resultado = { importados: 0, errores: 0, detalles: [] };
  const ofertas = datos.ofertas || datos['Ofertas'] || [];
  const cleanDatos = ServicioExcel.limpiarDatos(ofertas);

  const procesador = async (fila) => {
    const { codigo, nombre } = fila;

    const existe = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM ofertas WHERE codigo = ?', [codigo], (err, row) => {
        if (err) reject(err);
        resolve(!!row);
      });
    });

    if (existe) {
      throw new Error(`Oferta con código ${codigo} ya existe`);
    }

    const precioRegular = parseFloat(fila.precio_regular) || 0;
    const precioOferta = parseFloat(fila.precio_oferta) || 0;
    const descuento = ((precioRegular - precioOferta) / precioRegular * 100).toFixed(2);

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO ofertas (codigo, nombre, estado, precio_regular, precio_oferta, descuento_porcentaje, fecha_inicio, fecha_fin, created_at)
         VALUES (?, ?, 'activa', ?, ?, ?, ?, ?, datetime('now'))`,
        [
          codigo,
          nombre,
          precioRegular,
          precioOferta,
          descuento,
          ServicioExcel.convertirFecha(fila.fecha_inicio),
          ServicioExcel.convertirFecha(fila.fecha_fin)
        ],
        function(err) {
          if (err) reject(err);
          resolve({ id: this.lastID, codigo, nombre });
        }
      );
    });
  };

  const validador = (fila) => {
    if (!fila.codigo || !fila.nombre) {
      return { valido: false, error: 'Faltan campos: código, nombre' };
    }
    return { valido: true };
  };

  return await ServicioExcel.importarConValidacion(
    cleanDatos,
    validador,
    procesador,
    'Ofertas',
    resultado
  );
}

async function importarEventos(datos) {
  const db = getDatabase();
  const resultado = { importados: 0, errores: 0, detalles: [] };
  const eventos = datos.eventos || datos['Eventos'] || [];
  const cleanDatos = ServicioExcel.limpiarDatos(eventos);

  const procesador = async (fila) => {
    const { codigo, nombre } = fila;

    const existe = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM eventos WHERE codigo = ?', [codigo], (err, row) => {
        if (err) reject(err);
        resolve(!!row);
      });
    });

    if (existe) {
      throw new Error(`Evento con código ${codigo} ya existe`);
    }

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO eventos (codigo, nombre, tipo_evento, fecha_evento, lugar, capacidad, precio_entrada, estado, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'programado', datetime('now'))`,
        [
          codigo,
          nombre,
          fila.tipo_evento || 'general',
          ServicioExcel.convertirFecha(fila.fecha_evento),
          fila.lugar || '',
          parseInt(fila.capacidad) || 0,
          parseFloat(fila.precio_entrada) || 0
        ],
        function(err) {
          if (err) reject(err);
          resolve({ id: this.lastID, codigo, nombre });
        }
      );
    });
  };

  const validador = (fila) => {
    if (!fila.codigo || !fila.nombre || !fila.fecha_evento) {
      return { valido: false, error: 'Faltan campos: código, nombre, fecha_evento' };
    }
    return { valido: true };
  };

  return await ServicioExcel.importarConValidacion(
    cleanDatos,
    validador,
    procesador,
    'Eventos',
    resultado
  );
}

module.exports = router;
