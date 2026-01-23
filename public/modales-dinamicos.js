/**
 * Sistema Dinámico de Modales con Auto-relleno
 * Mapeo automático: Hojas XLSB ↔ Campos Modal ↔ Validaciones
 */

// ============================================================================
// 1. DEFINICIÓN DE CONFIGURACIÓN DE MODALES
// ============================================================================

const MODAL_CONFIGS = {
  // MODAL 1: Registro de Producción (Trazabilidad)
  produccion: {
    titulo: '📦 Registrar Producción',
    hoja_origen: 'Trazabilidad Fecha + Produccion',
    campos: [
      {
        nombre: 'codigo_plato',
        etiqueta: 'Código Plato',
        tipo: 'select',
        required: true,
        lookup: 'platos',
        lookup_key: 'codigo',
        lookup_display: 'nombre',
        onChange: 'autoFillPlato'
      },
      {
        nombre: 'nombre_plato',
        etiqueta: 'Nombre Plato',
        tipo: 'text',
        readonly: true,
        required: false,
        dependsOn: 'codigo_plato'
      },
      {
        nombre: 'unidad',
        etiqueta: 'Unidad Escandallo',
        tipo: 'select',
        required: true,
        options: ['Kg', 'Lt', 'Ud', 'Gramo', 'Litro'],
        default: 'Kg'
      },
      {
        nombre: 'cantidad_producida',
        etiqueta: 'Cantidad Producida',
        tipo: 'number',
        required: true,
        min: 0.01,
        step: 0.01,
        onChange: 'calcularIngredientesNecesarios'
      },
      {
        nombre: 'grupo_conservacion',
        etiqueta: 'Grupo Conservación',
        tipo: 'select',
        required: true,
        options: ['Congelado', 'Fresco', 'Neutro', 'Refrigerado'],
        default: 'Fresco'
      },
      {
        nombre: 'partida_cocina',
        etiqueta: 'Partidas y Almacén',
        tipo: 'select',
        required: true,
        lookup: 'partidas-cocina',
        lookup_key: 'id',
        lookup_display: 'nombre'
      },
      {
        nombre: 'lote_produccion',
        etiqueta: 'Lote Producción',
        tipo: 'text',
        required: true,
        default: 'generateLote',
        readonly: true
      },
      {
        nombre: 'fecha_produccion',
        etiqueta: 'Fecha Producción',
        tipo: 'date',
        required: true,
        default: 'today',
        readonly: true
      },
      {
        nombre: 'semana',
        etiqueta: 'Semana del Año',
        tipo: 'number',
        readonly: true,
        autoCalc: true,
        formula: 'getWeekNumber(fecha_produccion)'
      },
      {
        nombre: 'dia_semana',
        etiqueta: 'Día de la Semana',
        tipo: 'select',
        required: true,
        options: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
        onChange: 'calcularTrazabilidad'
      },
      {
        nombre: 'anticipado',
        etiqueta: 'Anticipado',
        tipo: 'toggle',
        default: false
      },
      {
        nombre: 'responsable',
        etiqueta: 'Responsable',
        tipo: 'select',
        required: true,
        default: 'currentUser'
      },
      {
        nombre: 'trazabilidad_activa',
        etiqueta: 'Trazabilidad Activa',
        tipo: 'toggle',
        default: true
      },
      {
        nombre: 'observaciones',
        etiqueta: 'Observaciones',
        tipo: 'textarea',
        required: false,
        rows: 3
      },
      {
        nombre: 'coste_total',
        etiqueta: 'Coste Total (€)',
        tipo: 'number',
        readonly: true,
        autoCalc: true,
        formula: 'cantidad_producida * (platos[codigo_plato].coste_racion)'
      }
    ],
    validaciones: [
      { campo: 'codigo_plato', regla: 'existe_en_platos', error: 'Plato no existe' },
      { campo: 'cantidad_producida', regla: 'mayor_cero', error: 'Cantidad debe ser mayor a 0' },
      { campo: 'partida_cocina', regla: 'existe_en_partidas', error: 'Partida no existe' }
    ]
  },

  // MODAL 2: Crear Partida Cocina
  partida_cocina: {
    titulo: '🔪 Nueva Partida Cocina',
    hoja_origen: 'Partidas',
    campos: [
      {
        nombre: 'nombre',
        etiqueta: 'Nombre Partida',
        tipo: 'text',
        required: true,
        placeholder: 'Ej: Cocina Fria, Cocina Caliente'
      },
      {
        nombre: 'responsable',
        etiqueta: 'Responsable',
        tipo: 'select',
        required: true,
        default: 'currentUser'
      },
      {
        nombre: 'anticipado',
        etiqueta: 'Anticipado',
        tipo: 'toggle',
        default: false
      },
      {
        nombre: 'trazabilidad_activa',
        etiqueta: 'Trazabilidad Activa',
        tipo: 'toggle',
        default: true
      },
      {
        nombre: 'descripcion',
        etiqueta: 'Descripción',
        tipo: 'textarea',
        required: false
      },
      {
        nombre: 'activo',
        etiqueta: 'Activo',
        tipo: 'toggle',
        default: true
      }
    ],
    validaciones: [
      { campo: 'nombre', regla: 'no_vacio', error: 'El nombre es obligatorio' },
      { campo: 'nombre', regla: 'unico_en_tabla', tabla: 'partidas_cocina', error: 'Ya existe una partida con este nombre' }
    ]
  },

  // MODAL 3: Crear Pedido
  pedido: {
    titulo: '📋 Nuevo Pedido',
    hoja_origen: 'Base_Pedidos',
    campos: [
      {
        nombre: 'codigo_plato',
        etiqueta: 'Código Plato',
        tipo: 'select',
        required: true,
        lookup: 'platos',
        lookup_filter: 'plato_venta = true',  // Solo platos a venta
        onChange: 'autoFillPlatoInfo'
      },
      {
        nombre: 'nombre_plato',
        etiqueta: 'Nombre Plato',
        tipo: 'text',
        readonly: true,
        dependsOn: 'codigo_plato'
      },
      {
        nombre: 'cantidad',
        etiqueta: 'Cantidad (UD)',
        tipo: 'number',
        required: true,
        min: 1,
        onChange: 'calcularCostePedido'
      },
      {
        nombre: 'formato_envase',
        etiqueta: 'Formato Envase',
        tipo: 'select',
        required: true,
        options: ['Cubetas', 'Barqueta GN 100', 'Barqueta GN 60', 'Barqueta GN 30', 'Mono']
      },
      {
        nombre: 'cliente',
        etiqueta: 'Cliente',
        tipo: 'select',
        required: true,
        lookup: 'clientes',
        lookup_key: 'id',
        lookup_display: 'nombre'
      },
      {
        nombre: 'dia_servicio',
        etiqueta: 'Día Servicio',
        tipo: 'select',
        required: true,
        options: [
          'Lunes 1 Alm.', 'Lunes 1 Cen.',
          'Martes 2 Alm.', 'Martes 2 Cen.',
          'Miércoles 3 Alm.', 'Miércoles 3 Cen.',
          'Jueves 4 Alm.', 'Jueves 4 Cen.',
          'Viernes 5 Alm.', 'Viernes 5 Cen.',
          'Sábado 6 Alm.', 'Sábado 6 Cen.',
          'Domingo 7 Alm.', 'Domingo 7 Cen.'
        ],
        onChange: 'cargarDiasProduccionValidos'
      },
      {
        nombre: 'dia_produccion',
        etiqueta: 'Día Producción',
        tipo: 'select',
        required: true,
        dependsOn: 'dia_servicio',
        dynamic: true
      },
      {
        nombre: 'estado',
        etiqueta: 'Estado',
        tipo: 'select',
        required: true,
        options: ['PEDIDO', 'EN PROCESO', 'SERVIDO'],
        default: 'PEDIDO'
      },
      {
        nombre: 'fecha_pedido',
        etiqueta: 'Fecha Pedido',
        tipo: 'date',
        default: 'today',
        readonly: true
      }
    ],
    validaciones: [
      { campo: 'codigo_plato', regla: 'existe_y_venta', error: 'Plato no disponible para venta' },
      { campo: 'cantidad', regla: 'cantidad_disponible', error: 'Stock insuficiente' },
      { campo: 'dia_produccion', regla: 'validar_planning', error: 'Configuración de producción no válida' }
    ]
  },

  // MODAL 4: Crear Artículo
  articulo: {
    titulo: '📦 Nuevo Artículo',
    hoja_origen: 'Articulos',
    campos: [
      {
        nombre: 'codigo',
        etiqueta: 'Código Interno',
        tipo: 'text',
        required: true,
        default: 'generateCodigoAR',
        readonly: true,
        pattern: 'AR-[0-9]+'
      },
      {
        nombre: 'nombre',
        etiqueta: 'ARTICULOS',
        tipo: 'text',
        required: true
      },
      {
        nombre: 'familia',
        etiqueta: 'Familia',
        tipo: 'select',
        required: true,
        options: [
          'Aceites y Grasas', 'Bebidas', 'Carnes', 'Conservas',
          'Frutas', 'Hortalizas', 'Lácteos', 'Mariscos', 'Pescados'
        ]
      },
      {
        nombre: 'grupo_conservacion',
        etiqueta: 'Grupo Conservación',
        tipo: 'select',
        required: true,
        options: ['Congelado', 'Fresco', 'Neutro', 'Seco']
      },
      {
        nombre: 'partidas_almacen',
        etiqueta: 'Partidas y Almacén',
        tipo: 'select',
        required: true,
        options: ['Economato', 'Cocina', 'Almacén', 'Bodega']
      },
      {
        nombre: 'unidad_economato',
        etiqueta: 'Unidad Economato',
        tipo: 'select',
        required: true,
        options: ['Lt', 'Kg', 'Ud', 'Gramo', 'Litro', 'Caja']
      },
      {
        nombre: 'unidad_escandallo',
        etiqueta: 'Unidad Escandallo',
        tipo: 'select',
        required: true,
        options: ['Lt', 'Kg', 'Ud', 'Gramo', 'Litro']
      },
      {
        nombre: 'formato_envases',
        etiqueta: 'Formato Envases',
        tipo: 'select',
        options: ['Garrafa', 'Bote', 'Caja', 'Bolsa', 'Bandeja', 'Tarrina'],
        default: 'Caja'
      },
      {
        nombre: 'peso_neto_envase',
        etiqueta: 'Peso neto Envase/Ud',
        tipo: 'number',
        default: 0,
        min: 0
      },
      {
        nombre: 'unidad_por_formatos',
        etiqueta: 'Unidad por formatos',
        tipo: 'number',
        default: 1,
        min: 1
      },
      {
        nombre: 'coste_unidad',
        etiqueta: 'Coste de la Unidad',
        tipo: 'number',
        required: true,
        min: 0
      },
      {
        nombre: 'coste_kilo',
        etiqueta: 'Coste Kilo',
        tipo: 'number',
        required: true,
        min: 0
      },
      {
        nombre: 'proveedores',
        etiqueta: 'Proveedores',
        tipo: 'text',
        placeholder: 'Ej: TOP CASH'
      },
      {
        nombre: 'bulto',
        etiqueta: 'Bulto',
        tipo: 'text',
        default: 'Caja'
      },
      {
        nombre: 'envases_por_bulto',
        etiqueta: 'Envases por Bulto',
        tipo: 'number',
        default: 1,
        min: 1
      },
      {
        nombre: 'coste_envase',
        etiqueta: 'Coste Envase',
        tipo: 'number',
        readonly: true,
        autoCalc: true,
        formula: 'coste_unidad * unidad_por_formatos'
      },
      {
        nombre: 'activo',
        etiqueta: 'Activo',
        tipo: 'toggle',
        default: true
      }
    ],
    validaciones: [
      { campo: 'codigo', regla: 'unico_en_tabla', tabla: 'ingredientes', error: 'Código ya existe' },
      { campo: 'nombre', regla: 'no_vacio', error: 'El nombre es obligatorio' },
      { campo: 'coste_kilo', regla: 'numero_positivo', error: 'El coste debe ser positivo' }
    ]
  },

  // MODAL 5: Crear Plato
  plato: {
    titulo: '🍽️ Nuevo Plato',
    hoja_origen: 'Platos Menu',
    campos: [
      {
        nombre: 'codigo',
        etiqueta: 'Código Plato',
        tipo: 'text',
        required: true,
        default: 'generateCodigoPL',
        readonly: true,
        pattern: 'PL-[0-9]+'
      },
      {
        nombre: 'nombre',
        etiqueta: 'Nombre Plato',
        tipo: 'text',
        required: true
      },
      {
        nombre: 'grupo_menu',
        etiqueta: 'Grupo Menú',
        tipo: 'select',
        required: true,
        options: [
          'Aperitivos', 'Arroces', 'Carnes', 'Ensaladas',
          'Pescados', 'Postres', 'Sopas', 'Verduras'
        ]
      },
      {
        nombre: 'unidad_escandallo',
        etiqueta: 'Unidad Escandallo',
        tipo: 'select',
        required: true,
        options: ['Kg', 'Lt', 'Ud', 'Gramo', 'Litro'],
        default: 'Kg'
      },
      {
        nombre: 'peso_raciones',
        etiqueta: 'Peso Raciones (Kg)',
        tipo: 'number',
        required: true,
        default: 0.75,
        min: 0.1
      },
      {
        nombre: 'coste_racion',
        etiqueta: 'Coste Raciones (€)',
        tipo: 'number',
        readonly: true,
        autoCalc: true,
        formula: 'calculada_desde_escandallo'
      },
      {
        nombre: 'plato_venta',
        etiqueta: 'Plato a la Venta',
        tipo: 'toggle',
        default: true
      },
      {
        nombre: 'preparacion',
        etiqueta: 'Preparación (Cocina)',
        tipo: 'select',
        required: true,
        options: ['Fria', 'Caliente'],
        onChange: 'cargarPuntosControlSanidad'
      },
      {
        nombre: 'formato_cubetas',
        etiqueta: 'Cubetas',
        tipo: 'number',
        default: 0,
        min: 0
      },
      {
        nombre: 'formato_gn100',
        etiqueta: 'Barqueta GN 100',
        tipo: 'number',
        default: 0,
        min: 0
      },
      {
        nombre: 'formato_mono',
        etiqueta: 'Mono',
        tipo: 'number',
        default: 0,
        min: 0
      },
      {
        nombre: 'formato_gn60',
        etiqueta: 'Barqueta GN 60',
        tipo: 'number',
        default: 0,
        min: 0
      },
      {
        nombre: 'formato_gn30',
        etiqueta: 'Barqueta GN 30',
        tipo: 'number',
        default: 0,
        min: 0
      },
      {
        nombre: 'stock_activo',
        etiqueta: 'Activar Stock',
        tipo: 'toggle',
        default: false
      },
      {
        nombre: 'stock_cantidad',
        etiqueta: 'STOCK Disponible',
        tipo: 'number',
        readonly: true,
        default: 0
      },
      {
        nombre: 'plantilla_produccion',
        etiqueta: 'Plantillas PROD',
        tipo: 'select',
        options: ['Preparacion', 'Cocina', 'Terminados', 'No Aplica'],
        default: 'Preparacion'
      }
    ],
    validaciones: [
      { campo: 'codigo', regla: 'unico_en_tabla', tabla: 'platos', error: 'Código ya existe' },
      { campo: 'nombre', regla: 'no_vacio', error: 'El nombre es obligatorio' }
    ]
  },

  // MODAL 6: Crear Escandallo (Receta)
  escandallo: {
    titulo: '📖 Nueva Receta (Escandallo)',
    hoja_origen: 'Escandallo',
    campos: [
      {
        nombre: 'codigo_plato',
        etiqueta: 'Plato',
        tipo: 'select',
        required: true,
        lookup: 'platos',
        readonly: true,  // Viene del contexto
        onChange: 'cargarEscandalloExistente'
      },
      {
        nombre: 'ingredientes',
        etiqueta: 'Ingredientes',
        tipo: 'dinamico_array',  // Array de ingredientes
        required: true,
        subitems: [
          {
            nombre: 'codigo_articulo',
            etiqueta: 'Ingrediente',
            tipo: 'select',
            required: true,
            lookup: 'articulos',
            lookup_key: 'codigo',
            lookup_display: 'nombre'
          },
          {
            nombre: 'cantidad',
            etiqueta: 'Cantidad',
            tipo: 'number',
            required: true,
            min: 0.01
          },
          {
            nombre: 'unidad',
            etiqueta: 'Unidad',
            tipo: 'text',
            readonly: true,
            dependsOn: 'codigo_articulo'
          },
          {
            nombre: 'coste_total',
            etiqueta: 'Coste Total',
            tipo: 'number',
            readonly: true,
            autoCalc: true
          }
        ]
      }
    ],
    validaciones: [
      { campo: 'codigo_plato', regla: 'existe', error: 'Plato no existe' },
      { campo: 'ingredientes', regla: 'no_vacio', error: 'Debe agregar al menos un ingrediente' }
    ]
  },

  // MODAL 7: Control Sanidad (APPCC)
  sanidad: {
    titulo: '🧪 Control Sanidad (APPCC)',
    hoja_origen: 'Sanidad',
    campos: [
      {
        nombre: 'platos',
        etiqueta: 'Plato',
        tipo: 'select',
        required: true,
        lookup: 'platos',
        lookup_key: 'codigo',
        lookup_display: 'nombre',
        onChange: 'autoFillSanidadData'
      },
      {
        nombre: 'ingredientes',
        etiqueta: 'Ingredientes',
        tipo: 'select',
        required: true,
        lookup: 'ingredientes',
        lookup_key: 'codigo',
        lookup_display: 'nombre'
      },
      {
        nombre: 'lote_produccion',
        etiqueta: 'Lote Producción',
        tipo: 'search-select',
        required: false,
        lookup: 'trazabilidad',
        lookup_filter: 'activo = 1',
        onChange: 'autoFillLoteData'
      },
      {
        nombre: 'fecha_produccion',
        etiqueta: 'Fecha de Producción',
        tipo: 'date',
        required: true,
        default: 'today'
      },
      {
        nombre: 'punto_critico',
        etiqueta: 'Punto Crítico',
        tipo: 'select',
        required: true,
        options: ['Temperatura', 'Tiempo de Cocción', 'pH', 'Humedad', 'Contaminación Cruzada', 'Higiene Personal'],
        onChange: 'mostrarRangosExpectados'
      },
      {
        nombre: 'valor_medido',
        etiqueta: 'Valor Medido',
        tipo: 'number',
        required: true,
        step: 0.1
      },
      {
        nombre: 'valor_esperado',
        etiqueta: 'Valor Esperado',
        tipo: 'text',
        readonly: true,
        dependsOn: 'punto_critico'
      },
      {
        nombre: 'punto_corrector',
        etiqueta: 'Punto Corrector / Acción Correctora',
        tipo: 'textarea',
        required: false,
        rows: 2,
        placeholder: 'Describir acción tomada si no cumple'
      },
      {
        nombre: 'resultado',
        etiqueta: 'Resultado',
        tipo: 'select',
        required: true,
        options: ['✓ OK', '✗ FUERA RANGO'],
        onChange: 'mostrarAccionCorrectora'
      },
      {
        nombre: 'responsable',
        etiqueta: 'Responsable',
        tipo: 'select',
        default: 'currentUser',
        readonly: true
      },
      {
        nombre: 'observaciones',
        etiqueta: 'Observaciones',
        tipo: 'textarea',
        required: false,
        rows: 2
      }
    ],
    validaciones: [
      { campo: 'platos', regla: 'existe', error: 'El plato no existe' },
      { campo: 'valor_medido', regla: 'numero', error: 'Debe ser un número' },
      { 
        campo: 'punto_corrector',
        regla: 'required_if',
        condicion: 'resultado == "✗ FUERA RANGO"',
        error: 'Debe indicar acción correctora cuando está fuera de rango'
      }
    ]
  },

  // MODAL 8: Etiquetas y Alergenos
  etiquetas: {
    titulo: '🏷️ Crear Etiqueta (Alergenos)',
    hoja_origen: 'Etiquetas',
    campos: [
      {
        nombre: 'codigo_plato',
        etiqueta: 'Código Plato',
        tipo: 'select',
        required: true,
        lookup: 'platos',
        lookup_key: 'codigo',
        lookup_display: 'nombre',
        onChange: 'autoFillEtiquetaData'
      },
      {
        nombre: 'descripcion',
        etiqueta: 'Descripción',
        tipo: 'textarea',
        required: true,
        placeholder: 'Descripción del plato para la etiqueta'
      },
      {
        nombre: 'informacion_nutricional',
        etiqueta: 'Información Nutricional',
        tipo: 'textarea',
        required: false,
        placeholder: 'Calorías, proteínas, grasas, carbohidratos'
      },
      {
        nombre: 'ingredientes',
        etiqueta: 'Ingredientes',
        tipo: 'textarea',
        required: true,
        placeholder: 'Lista de ingredientes utilizados'
      },
      {
        nombre: 'alergenos',
        etiqueta: '⚠️ Alergenos',
        tipo: 'checkbox-list',
        required: false,
        options: [
          'Gluten',
          'Crustáceos',
          'Huevo',
          'Pescado',
          'Cacahuete',
          'Frutos secos',
          'Soja',
          'Leche',
          'Apio',
          'Mostaza',
          'Granos de sesamo',
          'Moluscos',
          'Sulfitos',
          'Ninguno'
        ]
      },
      {
        nombre: 'instrucciones_preparacion',
        etiqueta: 'Instrucciones de Preparación',
        tipo: 'textarea',
        required: false,
        placeholder: 'Cómo preparar o servir el plato'
      },
      {
        nombre: 'modo_conservacion',
        etiqueta: 'Modo de Conservación',
        tipo: 'select',
        required: true,
        options: ['Temperatura Ambiente', 'Refrigeración (0-4°C)', 'Congelación (-18°C)', 'Fresco']
      },
      {
        nombre: 'durabilidad_dias',
        etiqueta: 'Durabilidad (días)',
        tipo: 'number',
        required: true,
        min: 1,
        placeholder: 'Número de días de conservación'
      },
      {
        nombre: 'lote_impresion',
        etiqueta: 'Lote Impresión',
        tipo: 'text',
        required: false,
        readonly: true,
        default: 'generateLotePrint'
      }
    ],
    validaciones: [
      { campo: 'codigo_plato', regla: 'existe', error: 'El código de plato no existe' },
      { campo: 'descripcion', regla: 'minlength', valor: 10, error: 'Descripción debe tener al menos 10 caracteres' },
      { campo: 'ingredientes', regla: 'minlength', valor: 10, error: 'Ingredientes debe tener al menos 10 caracteres' },
      { campo: 'durabilidad_dias', regla: 'numero', error: 'Durabilidad debe ser un número' }
    ]
  },

  // MODAL 9: Evento
  evento: {
    titulo: '🎉 Nuevo Evento',
    hoja_origen: 'Eventos (oferta_c.xlsb)',
    campos: [
      {
        nombre: 'codigo',
        etiqueta: 'Código Evento',
        tipo: 'text',
        required: true,
        default: 'generateCodigoEvento',
        readonly: true,
        pattern: 'Evento_[0-9]+'
      },
      {
        nombre: 'nombre',
        etiqueta: 'Nombre Evento',
        tipo: 'text',
        required: true,
        placeholder: 'Ej: Bodas, Corporativo, Cumpleaños'
      },
      {
        nombre: 'tipo',
        etiqueta: 'Tipo de Evento',
        tipo: 'select',
        required: true,
        options: ['Boda', 'Corporativo', 'Cumpleaños', 'Comunión', 'Bautizo', 'Otro']
      },
      {
        nombre: 'fecha',
        etiqueta: 'Fecha del Evento',
        tipo: 'date',
        required: true,
        min: 'today'
      },
      {
        nombre: 'clientes',
        etiqueta: 'Clientes',
        tipo: 'multi-select',
        lookup: 'clientes',
        lookup_key: 'id',
        lookup_display: 'nombre'
      },
      {
        nombre: 'estado',
        etiqueta: 'Estado',
        tipo: 'select',
        options: ['Pendiente', 'Confirmado', 'En curso', 'Completado'],
        default: 'Pendiente'
      }
    ]
  },

  // MODAL 10: Ingrediente/Artículo
  ingrediente: {
    titulo: '🧄 Nuevo Ingrediente/Artículo',
    hoja_origen: 'Articulos (fabricación.xlsb)',
    campos: [
      {
        nombre: 'codigo',
        etiqueta: 'Código Interno',
        tipo: 'text',
        required: true,
        default: 'generateCodigoAR',
        readonly: true,
        pattern: 'AR-[0-9]+'
      },
      {
        nombre: 'nombre',
        etiqueta: 'Nombre Artículo',
        tipo: 'text',
        required: true,
        placeholder: 'Ej: Aceite de Oliva Virgen Extra'
      },
      {
        nombre: 'descripcion',
        etiqueta: 'Descripción',
        tipo: 'textarea',
        required: false,
        placeholder: 'Descripción detallada del artículo'
      },
      {
        nombre: 'grupo_conservacion',
        etiqueta: 'Grupo Conservación',
        tipo: 'select',
        required: true,
        options: ['Fresco', 'Congelado', 'Neutro', 'Refrigerado']
      },
      {
        nombre: 'proveedor',
        etiqueta: 'Proveedor',
        tipo: 'text',
        required: false,
        placeholder: 'Nombre del proveedor habitual'
      }
    ],
    validaciones: [
      { campo: 'nombre', regla: 'no_vacio', error: 'El nombre es obligatorio' },
      { campo: 'codigo', regla: 'unico_en_tabla', tabla: 'ingredientes', error: 'Ya existe un artículo con este código' }
    ]
  },

  // MODAL 11: Escandallo (Receta)
  escandallo: {
    titulo: '📋 Nuevo Escandallo',
    hoja_origen: 'Escandallo (fabricación.xlsb)',
    campos: [
      {
        nombre: 'plato_id',
        etiqueta: 'Plato',
        tipo: 'select',
        required: true,
        lookup: 'platos',
        lookup_key: 'id',
        lookup_display: 'nombre',
        onChange: 'autoFillPlatoInfo'
      },
      {
        nombre: 'ingrediente_id',
        etiqueta: 'Ingrediente',
        tipo: 'select',
        required: true,
        lookup: 'ingredientes',
        lookup_key: 'id',
        lookup_display: 'nombre',
        onChange: 'autoFillIngredienteInfo'
      },
      {
        nombre: 'planning',
        etiqueta: 'Tipo Preparación',
        tipo: 'select',
        required: false,
        options: ['Medir', 'Pesar', 'Contar', 'Troceado', 'Cocido', 'Otro']
      },
      {
        nombre: 'cantidad',
        etiqueta: 'Cantidad Ud Escandallo',
        tipo: 'number',
        required: true,
        min: 0.001,
        step: 0.001,
        placeholder: '0.000'
      },
      {
        nombre: 'unidad',
        etiqueta: 'Unidad',
        tipo: 'select',
        required: true,
        options: ['Kg', 'g', 'L', 'ml', 'Ud', 'Pieza', 'Lt']
      },
      {
        nombre: 'peso_unidad',
        etiqueta: 'Peso Unidad (Kg)',
        tipo: 'number',
        required: false,
        min: 0,
        step: 0.001,
        placeholder: '0.000'
      },
      {
        nombre: 'kilo_bruto',
        etiqueta: 'Kilo Bruto',
        tipo: 'number',
        required: false,
        min: 0,
        step: 0.001,
        placeholder: '0.000'
      },
      {
        nombre: 'perdida_elaboracion',
        etiqueta: '% Pérdida 1º Elaboración',
        tipo: 'number',
        required: false,
        min: 0,
        max: 100,
        step: 0.01,
        placeholder: '0.00'
      },
      {
        nombre: 'peso_neto_real',
        etiqueta: 'Peso Neto Real (Kg)',
        tipo: 'number',
        required: false,
        readonly: true,
        autoCalc: true,
        placeholder: 'Se calcula automáticamente'
      },
      {
        nombre: 'coste',
        etiqueta: 'Coste (€)',
        tipo: 'number',
        required: false,
        readonly: true,
        autoCalc: true,
        placeholder: 'Se calcula automáticamente'
      },
      {
        nombre: 'partidas',
        etiqueta: 'Partida Cocina',
        tipo: 'select',
        required: false,
        lookup: 'partidas-cocina',
        lookup_key: 'id',
        lookup_display: 'nombre'
      },
      {
        nombre: 'activa',
        etiqueta: 'Activa',
        tipo: 'checkbox',
        required: false,
        default: true
      },
      {
        nombre: 'mise_en_place',
        etiqueta: 'Mise en Place',
        tipo: 'textarea',
        required: false,
        rows: 2,
        placeholder: 'Instrucciones de preparación previa'
      },
      {
        nombre: 'punto_critico',
        etiqueta: 'Punto Crítico',
        tipo: 'text',
        required: false,
        placeholder: 'Ej: Temperatura mínima 75°C'
      },
      {
        nombre: 'punto_corrector',
        etiqueta: 'Acción Correctora',
        tipo: 'text',
        required: false,
        placeholder: 'Ej: Cocinar hasta alcanzar temperatura'
      }
    ],
    validaciones: [
      { campo: 'plato_id', regla: 'existe', error: 'El plato seleccionado no existe' },
      { campo: 'ingrediente_id', regla: 'existe', error: 'El ingrediente seleccionado no existe' },
      { campo: 'cantidad', regla: 'mayor_cero', error: 'La cantidad debe ser mayor a 0' }
    ]
  },

  // MODAL 12: Inventario
  inventario: {
    titulo: '📦 Actualizar Inventario',
    hoja_origen: 'Inventario (fabricación.xlsb)',
    campos: [
      {
        nombre: 'codigo_interno',
        etiqueta: 'Código Artículo',
        tipo: 'select',
        required: true,
        lookup: 'ingredientes',
        lookup_key: 'codigo',
        lookup_display: 'nombre',
        onChange: 'autoFillInventarioInfo'
      },
      {
        nombre: 'articulo',
        etiqueta: 'Nombre Artículo',
        tipo: 'text',
        required: false,
        readonly: true,
        dependsOn: 'codigo_interno'
      },
      {
        nombre: 'grupo_conservacion',
        etiqueta: 'Grupo Conservación',
        tipo: 'text',
        required: false,
        readonly: true,
        dependsOn: 'codigo_interno'
      },
      {
        nombre: 'inventario',
        etiqueta: 'Cantidad en Stock',
        tipo: 'number',
        required: true,
        min: 0,
        step: 0.01,
        placeholder: '0.00'
      },
      {
        nombre: 'stock_deseado',
        etiqueta: 'Stock Deseado (%)',
        tipo: 'number',
        required: false,
        min: 0,
        max: 100,
        default: 100
      },
      {
        nombre: 'stock_reserva',
        etiqueta: 'Stock de Reserva',
        tipo: 'number',
        required: false,
        min: 0,
        step: 0.01,
        placeholder: '0.00'
      },
      {
        nombre: 'pedidos',
        etiqueta: 'Pedidos Pendientes',
        tipo: 'number',
        required: false,
        min: 0,
        step: 0.01,
        default: 0
      }
    ],
    validaciones: [
      { campo: 'codigo_interno', regla: 'existe', error: 'El código interno no existe' },
      { campo: 'inventario', regla: 'mayor_igual_cero', error: 'El inventario no puede ser negativo' }
    ]
  }
};

// ============================================================================
// 2. FUNCIONES DE GENERACIÓN AUTOMÁTICA
// ============================================================================

function generateLote() {
  const hoy = new Date();
  const fecha = hoy.toISOString().split('T')[0].replace(/-/g, '');  // YYYYMMDD
  const secuencia = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${fecha}-${secuencia}`;
}

function generateCodigoAR() {
  return fetch('/api/articulos/next-codigo')
    .then(r => r.json())
    .then(d => d.codigo);  // AR-1001
}

function generateCodigoPL() {
  return fetch('/api/platos/next-codigo')
    .then(r => r.json())
    .then(d => d.codigo);  // PL-1001
}

function generateCodigoEvento() {
  return fetch('/api/eventos/next-codigo')
    .then(r => r.json())
    .then(d => d.codigo);  // Evento_1
}

// ============================================================================
// 3. FUNCIONES DE AUTO-RELLENO
// ============================================================================

async function autoFillPlato(codigoSeleccionado) {
  const plato = await fetch(`/api/platos/${codigoSeleccionado}`).then(r => r.json());
  
  document.querySelector('[name="nombre_plato"]').value = plato.nombre;
  document.querySelector('[name="preparacion"]').value = plato.preparacion;
  
  // Cargar escandallo asociado
  const escandallo = await fetch(`/api/escandallo?codigo_plato=${codigoSeleccionado}`)
    .then(r => r.json());
  
  displayEscandalloInfo(escandallo);
}

async function autoFillPlatoInfo(codigoSeleccionado) {
  const plato = await fetch(`/api/platos/${codigoSeleccionado}`).then(r => r.json());
  document.querySelector('[name="nombre_plato"]').value = plato.nombre;
  
  // Cargar información de envases
  const envases = await fetch(`/api/platos/${codigoSeleccionado}/envases`)
    .then(r => r.json());
  
  const envaseSelect = document.querySelector('[name="formato_envase"]');
  envaseSelect.innerHTML = '';
  envases.forEach(env => {
    const option = document.createElement('option');
    option.value = env;
    option.textContent = env;
    envaseSelect.appendChild(option);
  });
}

async function autoFillSanidadData(loteProduccion) {
  const trazabilidad = await fetch(`/api/trazabilidad/${loteProduccion}`).then(r => r.json());
  
  document.querySelector('[name="plato"]').value = trazabilidad.codigo_plato;
  document.querySelector('[name="fecha_produccion"]').value = trazabilidad.fecha_produccion;
  
  // Cargar puntos críticos según plato
  const plato = await fetch(`/api/platos/${trazabilidad.codigo_plato}`).then(r => r.json());
  cargarPuntosControlSanidad(plato.preparacion);
}

function cargarPuntosControlSanidad(preparacion) {
  const puntosValidos = preparacion === 'Caliente' 
    ? ['Temperatura', 'Tiempo', 'Contaminación']
    : ['pH', 'Humedad', 'Contaminación'];
  
  const select = document.querySelector('[name="punto_critico"]');
  select.innerHTML = '';
  puntosValidos.forEach(punto => {
    const option = document.createElement('option');
    option.value = punto;
    option.textContent = punto;
    select.appendChild(option);
  });
}

function mostrarRangosExpectados(puntoCritico) {
  const rangos = {
    'Temperatura': '65°C - 85°C (caliente) / 0°C - 4°C (fresco)',
    'Tiempo': '10 - 60 minutos según plato',
    'pH': '3.5 - 4.6 para ácidos',
    'Humedad': '60% - 85%',
    'Contaminación': '< 1.000 UFC/g'
  };
  
  document.querySelector('[name="valor_esperado"]').value = rangos[puntoCritico] || '';
}

async function cargarDiasProduccionValidos(diaServicio) {
  // Buscar en PLANG.PROD qué dias de producción están disponibles
  const plannings = await fetch(`/api/plang-prod?dia_servicio=${diaServicio}`)
    .then(r => r.json());
  
  const diasValidos = [...new Set(plannings.map(p => p.dia_produccion))];
  
  const select = document.querySelector('[name="dia_produccion"]');
  select.innerHTML = '';
  diasValidos.forEach(dia => {
    const option = document.createElement('option');
    option.value = dia;
    option.textContent = dia;
    select.appendChild(option);
  });
}

// ============================================================================
// 4. FUNCIONES DE AUTO-CÁLCULO
// ============================================================================

async function calcularIngredientesNecesarios(cantidad) {
  const codigoPlato = document.querySelector('[name="codigo_plato"]').value;
  const escandallo = await fetch(`/api/escandallo?codigo_plato=${codigoPlato}`)
    .then(r => r.json());
  
  const ingredientesNecesarios = escandallo.map(item => ({
    ...item,
    cantidad_necesaria: item.cantidad * cantidad
  }));
  
  // Mostrar resumen
  displayIngredientesResumen(ingredientesNecesarios);
  
  // Calcular coste
  const costeTotal = ingredientesNecesarios.reduce((sum, item) => 
    sum + (item.coste_kilo * item.cantidad_necesaria), 0);
  
  document.querySelector('[name="coste_total"]').value = costeTotal.toFixed(2);
}

function calcularCostePedido(cantidad) {
  const codigoPlato = document.querySelector('[name="codigo_plato"]').value;
  // Buscar coste racion del plato y multiplicar
  // (en implementación real, hacer fetch a la API)
}

// ============================================================================
// 5. GENERADOR DE MODAL DINÁMICO
// ============================================================================

class ModalDinamico {
  constructor(nombreConfig) {
    this.config = MODAL_CONFIGS[nombreConfig];
    this.data = {};
  }

  async render() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = `modal-${this.config.titulo.replace(/\s+/g, '-')}`;

    const content = document.createElement('div');
    content.className = 'modal-content';

    // Encabezado
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
      <h2>${this.config.titulo}</h2>
      <span class="modal-close" onclick="cerrarModalDinamico(this)">✕</span>
    `;
    content.appendChild(header);

    // Formulario
    const form = document.createElement('form');
    form.id = `form-${this.config.titulo.replace(/\s+/g, '-')}`;
    form.className = 'modal-form';

    for (const campo of this.config.campos) {
      const formGroup = this.crearCampo(campo);
      form.appendChild(formGroup);
    }

    // Footer
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.innerHTML = `
      <button type="button" class="btn-cancel" onclick="cerrarModalDinamico(this)">Cancelar</button>
      <button type="submit" class="btn-primary">Guardar</button>
    `;

    form.appendChild(footer);
    content.appendChild(form);
    modal.appendChild(content);

    // Event listeners
    form.addEventListener('submit', (e) => this.guardar(e));
    
    // Cerrar al hacer clic fuera del modal
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cerrarModalDinamico(modal);
      }
    });

    return modal;
  }

  crearCampo(campo) {
    const group = document.createElement('div');
    group.className = 'form-group';
    group.id = `group-${campo.nombre}`;
    
    // Label
    const label = document.createElement('label');
    label.htmlFor = campo.nombre;
    label.innerHTML = `
      ${campo.etiqueta}
      ${campo.required ? '<span class="required">*</span>' : ''}
    `;
    group.appendChild(label);

    let input;

    switch (campo.tipo) {
      case 'select':
        input = this.crearSelect(campo);
        break;
      case 'multi-select':
        input = this.crearMultiSelect(campo);
        break;
      case 'date':
        input = this.crearDate(campo);
        break;
      case 'number':
        input = this.crearNumber(campo);
        break;
      case 'textarea':
        input = this.crearTextarea(campo);
        break;
      case 'toggle':
        input = this.crearToggle(campo);
        break;
      case 'search-select':
        input = this.crearSearchSelect(campo);
        break;
      case 'dinamico_array':
        input = this.crearArrayDinamico(campo);
        break;
      default:
        input = document.createElement('input');
        input.type = 'text';
    }

    input.name = campo.nombre;
    input.id = campo.nombre;
    input.required = campo.required;
    input.readOnly = campo.readonly;
    
    if (campo.placeholder) input.placeholder = campo.placeholder;
    if (campo.min !== undefined) input.min = campo.min;
    if (campo.pattern) input.pattern = campo.pattern;

    // Event listeners para auto-relleno
    if (campo.onChange) {
      input.addEventListener('change', () => {
        window[campo.onChange](input.value);
      });
    }

    group.appendChild(input);
    return group;
  }

  crearSelect(campo) {
    const select = document.createElement('select');
    
    if (campo.lookup) {
      // Cargar datos desde API
      fetch(`/api/${campo.lookup}`)
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
          return r.json();
        })
        .then(datos => {
          // Manejar respuestas que vienen en formato { data: [] }
          if (datos && datos.data && Array.isArray(datos.data)) {
            datos = datos.data;
          } else if (!Array.isArray(datos)) {
            console.warn(`Datos de lookup ${campo.lookup} no es un array:`, datos);
            datos = [];
          }
          const defaultOption = document.createElement('option');
          defaultOption.value = '';
          defaultOption.textContent = `-- Seleccionar ${campo.etiqueta} --`;
          select.appendChild(defaultOption);

          datos.forEach(item => {
            const option = document.createElement('option');
            option.value = item[campo.lookup_key];
            option.textContent = item[campo.lookup_display];
            select.appendChild(option);
          });
        })
        .catch(error => {
          console.error(`Error cargando lookup ${campo.lookup}:`, error);
          const defaultOption = document.createElement('option');
          defaultOption.value = '';
          defaultOption.textContent = `Error cargando datos`;
          select.appendChild(defaultOption);
          select.disabled = true;
        });
    } else if (campo.options) {
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = `-- Seleccionar --`;
      select.appendChild(defaultOption);

      campo.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        select.appendChild(option);
      });
    }

    return select;
  }

  crearMultiSelect(campo) {
    const div = document.createElement('div');
    div.className = 'multi-select';
    
    if (campo.lookup) {
      fetch(`/api/${campo.lookup}`)
        .then(r => r.json())
        .then(datos => {
          datos.forEach(item => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = item[campo.lookup_key];
            checkbox.name = campo.nombre;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(item[campo.lookup_display]));
            div.appendChild(label);
          });
        });
    }

    return div;
  }

  crearDate(campo) {
    const input = document.createElement('input');
    input.type = 'date';
    if (campo.default === 'today') {
      input.value = new Date().toISOString().split('T')[0];
    }
    if (campo.min === 'today') {
      input.min = new Date().toISOString().split('T')[0];
    }
    return input;
  }

  crearNumber(campo) {
    const input = document.createElement('input');
    input.type = 'number';
    if (campo.min !== undefined) input.min = campo.min;
    if (campo.step) input.step = campo.step;
    return input;
  }

  crearTextarea(campo) {
    const textarea = document.createElement('textarea');
    textarea.rows = 4;
    textarea.placeholder = campo.placeholder || '';
    return textarea;
  }

  crearToggle(campo) {
    const label = document.createElement('label');
    label.className = 'toggle-label';
    const input = document.createElement('input');
    input.type = 'checkbox';
    if (campo.default) input.checked = true;
    label.appendChild(input);
    label.appendChild(document.createTextNode(' Activado'));
    return label;
  }

  crearSearchSelect(campo) {
    const container = document.createElement('div');
    container.className = 'search-select-container';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'search-input';
    input.placeholder = `Buscar ${campo.etiqueta}...`;

    const suggestions = document.createElement('ul');
    suggestions.className = 'suggestions-list';

    input.addEventListener('input', async (e) => {
      const busqueda = e.target.value;
      if (busqueda.length < 2) {
        suggestions.innerHTML = '';
        return;
      }

      const datos = await fetch(`/api/${campo.lookup}?search=${busqueda}`)
        .then(r => r.json());

      suggestions.innerHTML = '';
      datos.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item[campo.lookup_display];
        li.addEventListener('click', () => {
          input.value = item[campo.lookup_key];
          suggestions.innerHTML = '';
          input.dispatchEvent(new Event('change'));
        });
        suggestions.appendChild(li);
      });
    });

    container.appendChild(input);
    container.appendChild(suggestions);
    return container;
  }

  crearArrayDinamico(campo) {
    const container = document.createElement('div');
    container.className = 'dynamic-array-container';

    const agregarBtn = document.createElement('button');
    agregarBtn.type = 'button';
    agregarBtn.textContent = '+ Agregar Item';
    agregarBtn.className = 'btn-add';

    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'dynamic-items';

    agregarBtn.addEventListener('click', () => {
      const item = document.createElement('div');
      item.className = 'dynamic-item';

      campo.subitems.forEach(subfield => {
        const grupo = this.crearCampo(subfield);
        item.appendChild(grupo);
      });

      const eliminarBtn = document.createElement('button');
      eliminarBtn.type = 'button';
      eliminarBtn.textContent = '✕ Eliminar';
      eliminarBtn.className = 'btn-remove';
      eliminarBtn.addEventListener('click', () => item.remove());

      item.appendChild(eliminarBtn);
      itemsContainer.appendChild(item);
    });

    container.appendChild(agregarBtn);
    container.appendChild(itemsContainer);
    return container;
  }

  async guardar(event) {
    event.preventDefault();

    // Validar
    if (!this.validar()) return;

    // Recolectar datos
    const formData = new FormData(document.getElementById(`form-${this.config.titulo.replace(/\s+/g, '-')}`));
    const data = Object.fromEntries(formData);

    // Guardar en BD
    const endpoint = `/api/${this.getTablaDestino()}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      mostrarExito('Guardado exitosamente');
      const modalElement = document.getElementById(`modal-${this.config.titulo.replace(/\s+/g, '-')}`);
      cerrarModalDinamico(modalElement);
      // Recargar tabla
      this.recargarDatos();
    } else {
      mostrarError('Error al guardar');
    }
  }

  validar() {
    let valido = true;
    
    this.config.validaciones?.forEach(validacion => {
      const campo = document.querySelector(`[name="${validacion.campo}"]`);
      if (!campo) return;

      let esValido = true;

      switch (validacion.regla) {
        case 'no_vacio':
          esValido = campo.value.trim() !== '';
          break;
        case 'numero':
          esValido = !isNaN(campo.value);
          break;
        case 'numero_positivo':
          esValido = parseFloat(campo.value) > 0;
          break;
        case 'mayor_cero':
          esValido = parseFloat(campo.value) > 0;
          break;
        case 'unico_en_tabla':
          // Implementar búsqueda en API
          // esValido = await checkUnique(validacion.tabla, validacion.campo, campo.value);
          break;
      }

      if (!esValido) {
        campo.classList.add('error');
        campo.setAttribute('data-error', validacion.error);
        valido = false;
      } else {
        campo.classList.remove('error');
      }
    });

    return valido;
  }

  getTablaDestino() {
    const mapeAhojaTabla = {
      'produccion': 'trazabilidad',
      'partida_cocina': 'partidas-cocina',
      'pedido': 'pedidos',
      'articulo': 'articulos',
      'plato': 'platos',
      'escandallo': 'escandallos',
      'sanidad': 'sanidad',
      'etiquetas': 'etiquetas',
      'evento': 'eventos',
      'ingrediente': 'ingredientes',
      'inventario': 'inventario'
    };
    
    for (const [key, tabla] of Object.entries(MODAL_CONFIGS)) {
      if (this.config === tabla) return mapeAhojaTabla[key];
    }
  }

  recargarDatos() {
    window.location.reload();
  }
}

// ============================================================================
// 6. UTILIDAD: ABRIR MODAL
// ============================================================================

async function abrirModalDinamico(nombreConfig) {
  const modal = new ModalDinamico(nombreConfig);
  const htmlModal = await modal.render();
  document.body.appendChild(htmlModal);
  
  // Bloquear scroll del body
  document.body.classList.add('modal-open');
}

function cerrarModalDinamico(elemento) {
  // Obtener el modal overlay
  let modal = elemento;
  if (elemento.tagName !== 'DIV' || !elemento.classList.contains('modal-overlay')) {
    modal = elemento.closest('.modal-overlay');
  }
  
  if (modal) {
    modal.remove();
  }
  
  // Restaurar scroll del body si no hay más modales abiertos
  if (!document.querySelector('.modal-overlay')) {
    document.body.classList.remove('modal-open');
  }
}

// Exports
window.ModalDinamico = ModalDinamico;
window.abrirModalDinamico = abrirModalDinamico;
window.cerrarModalDinamico = cerrarModalDinamico;
window.MODAL_CONFIGS = MODAL_CONFIGS;
