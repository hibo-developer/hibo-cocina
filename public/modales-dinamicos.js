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
        required: true,
        onInput: 'buscarDuplicadosPlato'
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
        etiqueta: 'Nombre Artículo *',
        tipo: 'text',
        required: true,
        placeholder: 'Ej: Aceite de Oliva Virgen Extra',
        onBlur: 'detectarAlergenosAutomatico',
        onInput: 'buscarDuplicadosIngrediente'
      },
      {
        nombre: 'descripcion',
        etiqueta: 'Descripción',
        tipo: 'textarea',
        required: false,
        placeholder: 'Descripción detallada del artículo'
      },
      {
        nombre: 'familia',
        etiqueta: 'Familia',
        tipo: 'autocomplete',
        required: false,
        placeholder: 'Escribe para buscar familia...',
        options: ['Aceites y Grasas', 'Agua', 'Arroz', 'Articulos', 'Azúcar y derivados', 'Base culinaria', 
                  'Bebidas con alcohol', 'Bebidas sin alcohol', 'Café y derivado', 'Carnes', 'Cereales', 'Cerveza', 
                  'Condimentos y especias', 'Desechable', 'Encurtidos', 'Fiambres', 'Frutas', 'Fruto seco', 'General', 
                  'Harina y derivado', 'Infusión', 'Legumbres', 'Limpieza', 'Lácteos y deri.', 'Marisco', 'Masa', 'Menaje', 
                  'Ovoproductos', 'Panadería', 'Pasta', 'Pastelería', 'Pescados', 'Planta aromáticas', 'Platos', 'Postres', 
                  'Preparado', 'Preparado entremet.', 'Salsas', 'Tubérculos', 'Verduras', 'Vinagre', 'Zumo y jugo']
      },
      {
        nombre: 'grupo_conservacion',
        etiqueta: 'Grupo Conservación *',
        tipo: 'select',
        required: true,
        options: ['Fresco', 'Congelado', 'Neutro', 'Refrigerado']
      },
      {
        nombre: 'unidad_economato',
        etiqueta: 'Unidad Economato',
        tipo: 'select',
        required: false,
        options: ['Ud', 'Kg', 'Lt']
      },
      {
        nombre: 'unidad_escandallo',
        etiqueta: 'Unidad Escandallo',
        tipo: 'select',
        required: false,
        options: ['Ud', 'Kg', 'Lt']
      },
      {
        nombre: 'coste_unidad',
        etiqueta: 'Coste Unidad (€)',
        tipo: 'number',
        required: false,
        step: '0.001',
        min: '0'
      },
      {
        nombre: 'coste_kilo',
        etiqueta: 'Coste Kilo (€/kg)',
        tipo: 'number',
        required: false,
        step: '0.001',
        min: '0'
      },
      {
        nombre: 'peso_neto_envase',
        etiqueta: 'Peso Neto Envase (kg)',
        tipo: 'number',
        required: false,
        step: '0.001',
        min: '0'
      },
      {
        nombre: 'alergenosMulti',
        etiqueta: '⚠️ Alérgenos (14 oficiales)',
        tipo: 'multiCheckbox',
        required: false,
        opciones: [
          { nombre: 'gluten', etiqueta: 'Gluten' },
          { nombre: 'cereales', etiqueta: 'Cereales' },
          { nombre: 'crustaceos', etiqueta: 'Crustáceos' },
          { nombre: 'moluscos', etiqueta: 'Moluscos' },
          { nombre: 'pescado', etiqueta: 'Pescado' },
          { nombre: 'cacahuetes', etiqueta: 'Cacahuetes' },
          { nombre: 'frutos_secos', etiqueta: 'Frutos secos' },
          { nombre: 'soja', etiqueta: 'Soja' },
          { nombre: 'lacteos', etiqueta: 'Lácteos' },
          { nombre: 'ovoproductos', etiqueta: 'Huevo' },
          { nombre: 'apio', etiqueta: 'Apio' },
          { nombre: 'mostaza', etiqueta: 'Mostaza' },
          { nombre: 'sesamo', etiqueta: 'Sésamo' },
          { nombre: 'sulfitos', etiqueta: 'Sulfitos' },
          { nombre: 'altramuces', etiqueta: 'Altramuces' },
          { nombre: 'mariscos', etiqueta: 'Mariscos' },
          { nombre: 'ajo', etiqueta: 'Ajo' }
        ],
        columnas: 3,
        autoDetect: true
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

  // MODAL 11: Escandallo (Receta) - VERSIÓN INDIVIDUAL (mantener por compatibilidad)
  escandallo_simple: {
    titulo: '📋 Agregar Ingrediente al Escandallo',
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
        etiqueta: 'Cantidad',
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
        nombre: 'activa',
        etiqueta: 'Activa',
        tipo: 'checkbox',
        required: false,
        default: true
      }
    ],
    validaciones: [
      { campo: 'plato_id', regla: 'existe', error: 'El plato seleccionado no existe' },
      { campo: 'ingrediente_id', regla: 'existe', error: 'El ingrediente seleccionado no existe' },
      { campo: 'cantidad', regla: 'mayor_cero', error: 'La cantidad debe ser mayor a 0' }
    ]
  },

  // MODAL 11B: Escandallo MÚLTIPLE - Crear receta completa de un plato
  escandallo: {
    titulo: '📖 Crear Receta Completa (Escandallo)',
    hoja_origen: 'Escandallo (fabricación.xlsb)',
    descripcion: 'Agrega todos los ingredientes, pre-elaborados y elaborados que componen este plato',
    campos: [
      {
        nombre: 'plato_id',
        etiqueta: 'Plato',
        tipo: 'select',
        required: true,
        lookup: 'platos',
        lookup_key: 'id',
        lookup_display: 'nombre',
        onChange: 'cargarEscandalloExistente',
        help: 'Selecciona el plato para el que vas a crear la receta'
      },
      {
        nombre: 'ingredientes',
        etiqueta: '🥘 Ingredientes de la Receta',
        tipo: 'array_dinamico',
        required: true,
        min_items: 1,
        item_template: {
          ingrediente_id: {
            etiqueta: 'Ingrediente/Elaborado/Pre-elaborado',
            tipo: 'select',
            required: true,
            lookup: 'ingredientes',
            lookup_key: 'id',
            lookup_display: 'nombre',
            placeholder: 'Buscar ingrediente...',
            width: '40%'
          },
          cantidad: {
            etiqueta: 'Cantidad',
            tipo: 'number',
            required: true,
            min: 0.001,
            step: 0.001,
            placeholder: '0.000',
            width: '20%'
          },
          unidad: {
            etiqueta: 'Unidad',
            tipo: 'select',
            required: true,
            options: ['Kg', 'g', 'L', 'ml', 'Ud', 'Pieza', 'Lt'],
            default: 'Kg',
            width: '15%'
          },
          planning: {
            etiqueta: 'Preparación',
            tipo: 'select',
            required: false,
            options: ['Medir', 'Pesar', 'Contar', 'Troceado', 'Cocido', 'Otro'],
            width: '20%'
          }
        },
        botones: {
          agregar: '➕ Agregar ingrediente',
          eliminar: '🗑️'
        }
      },
      {
        nombre: 'alergenos_seccion',
        etiqueta: '⚠️ Alérgenos - Edición Manual',
        tipo: 'multi-checkbox',
        help: 'Los alérgenos se detectan automáticamente, pero puedes ajustarlos manualmente',
        opciones: [
          { nombre: 'gluten', etiqueta: 'Gluten' },
          { nombre: 'cereales', etiqueta: 'Cereales' },
          { nombre: 'lacteos', etiqueta: 'Lácteos' },
          { nombre: 'huevo', etiqueta: 'Huevo' },
          { nombre: 'pescado', etiqueta: 'Pescado' },
          { nombre: 'mariscos', etiqueta: 'Mariscos' },
          { nombre: 'crustaceos', etiqueta: 'Crustáceos' },
          { nombre: 'moluscos', etiqueta: 'Moluscos' },
          { nombre: 'frutos_secos', etiqueta: 'Frutos secos' },
          { nombre: 'cacahuetes', etiqueta: 'Cacahuetes' },
          { nombre: 'soja', etiqueta: 'Soja' },
          { nombre: 'sesamo', etiqueta: 'Sésamo' },
          { nombre: 'apio', etiqueta: 'Apio' },
          { nombre: 'mostaza', etiqueta: 'Mostaza' },
          { nombre: 'sulfitos', etiqueta: 'Sulfitos' },
          { nombre: 'altramuces', etiqueta: 'Altramuces' }
        ],
        columnas: 3,
        cargarPersonalizados: true // Flag para cargar alérgenos personalizados
      },
      {
        nombre: 'notas_generales',
        etiqueta: '📝 Notas Generales de la Receta',
        tipo: 'textarea',
        required: false,
        rows: 3,
        placeholder: 'Instrucciones generales, mise en place, puntos críticos...'
      }
    ],
    validaciones: [
      { campo: 'plato_id', regla: 'existe', error: 'Debes seleccionar un plato' },
      { campo: 'ingredientes', regla: 'array_no_vacio', error: 'Debes agregar al menos un ingrediente' }
    ],
    onSubmit: 'guardarEscandalloMultiple'
  },

  // MODAL 12: Inventario
  inventario: {
    titulo: '📦 Actualizar Inventario',
    hoja_origen: 'Inventario (fabricación.xlsb)',
    campos: [
      {
        nombre: 'ingrediente_id',
        etiqueta: 'Código Artículo',
        tipo: 'select',
        required: true,
        lookup: 'ingredientes',
        lookup_key: 'id',
        lookup_display: 'nombre',
        onChange: 'autoFillInventarioInfo',
        onInput: 'buscarDuplicadosInventario'
      },
      {
        nombre: 'nombre_articulo',
        etiqueta: 'Nombre Artículo',
        tipo: 'text',
        required: false,
        readonly: true,
        dependsOn: 'ingrediente_id'
      },
      {
        nombre: 'ubicacion',
        etiqueta: 'Ubicación (Partida/Almacén)',
        tipo: 'select',
        required: false,
        options: ['Economato', 'Bodega', 'Carnicería', 'Pescaderías', 'Verduras', 'Frutas', 
                  'Cuarto frio', 'Panaderia', 'Pastelería', 'Caliente', 'Guarniciones', 
                  'Salsas', 'Aperitivos', 'Desayuno', 'OFFICE', 'Precocinado', 
                  'Verduras Cong', 'Frutas Cong', 'Desechable', 'Envases'],
        dependsOn: 'ingrediente_id'
      },
      {
        nombre: 'unidad_economato',
        etiqueta: 'Unidad Economato',
        tipo: 'select',
        required: false,
        options: ['Ud', 'Kg', 'Lt'],
        dependsOn: 'ingrediente_id'
      },
      {
        nombre: 'unidad_escandallo',
        etiqueta: 'Unidad Escandallo',
        tipo: 'select',
        required: false,
        options: ['Ud', 'Kg', 'Lt'],
        dependsOn: 'ingrediente_id'
      },
      {
        nombre: 'cantidad',
        etiqueta: 'Cantidad en Stock',
        tipo: 'number',
        required: true,
        min: 0,
        step: 0.01,
        placeholder: '0.00'
      },
      {
        nombre: 'lote',
        etiqueta: 'Lote',
        tipo: 'text',
        required: false,
        placeholder: 'Ej: 20260124-001',
        autoGenerate: true
      },
      {
        nombre: 'fecha_caducidad',
        etiqueta: 'Fecha Caducidad',
        tipo: 'date',
        required: false
      }
    ],
    validaciones: [
      { campo: 'ingrediente_id', regla: 'existe', error: 'El ingrediente no existe' },
      { campo: 'cantidad', regla: 'mayor_igual_cero', error: 'La cantidad no puede ser negativa' }
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
  try {
    // Buscar trazabilidad por lote usando el endpoint correcto
    const trazabilidad = await fetch(`/api/trazabilidad/lote/${loteProduccion}`).then(r => {
      if (!r.ok) throw new Error('Trazabilidad no encontrada');
      return r.json();
    });
    
    // Si devuelve array, tomar el primero
    const traz = Array.isArray(trazabilidad) ? trazabilidad[0] : trazabilidad;
    
    if (traz) {
      document.querySelector('[name="plato"]').value = traz.codigo_plato || traz.plato_codigo;
      document.querySelector('[name="fecha_produccion"]').value = traz.fecha_produccion;
      
      // Cargar puntos críticos según plato
      const platoId = traz.plato_id;
      if (platoId) {
        const plato = await fetch(`/api/platos/${platoId}`).then(r => r.json());
        cargarPuntosControlSanidad(plato.preparacion || 'Caliente');
      }
    }
  } catch (error) {
    console.error('Error al cargar datos de sanidad:', error);
    // Cargar valores por defecto
    cargarPuntosControlSanidad('Caliente');
  }
}

async function autoFillInventarioInfo(ingredienteId) {
  if (!ingredienteId) return;
  
  try {
    const ingrediente = await fetch(`/api/ingredientes/${ingredienteId}`).then(r => {
      if (!r.ok) throw new Error('Ingrediente no encontrado');
      return r.json();
    });
    
    // Autorrellena campos del modal
    const nombreField = document.querySelector('[name="nombre_articulo"]');
    if (nombreField) nombreField.value = ingrediente.nombre || '';
    
    const ubicacionField = document.querySelector('[name="ubicacion"]');
    if (ubicacionField && ingrediente.partidas_almacen) {
      ubicacionField.value = ingrediente.partidas_almacen;
    }
    
    const unidadEconomatoField = document.querySelector('[name="unidad_economato"]');
    if (unidadEconomatoField && ingrediente.unidad_economato) {
      unidadEconomatoField.value = ingrediente.unidad_economato;
    }
    
    const unidadEscandalloField = document.querySelector('[name="unidad_escandallo"]');
    if (unidadEscandalloField && ingrediente.unidad_escandallo) {
      unidadEscandalloField.value = ingrediente.unidad_escandallo;
    }
    
    // Generar lote automáticamente
    const loteField = document.querySelector('[name="lote"]');
    if (loteField && !loteField.value) {
      loteField.value = generateLote();
    }
  } catch (error) {
    console.error('Error al cargar información del ingrediente:', error);
  }
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
  constructor(nombreConfig, parametros = {}) {
    this.config = MODAL_CONFIGS[nombreConfig];
    this.data = {};
    this.parametros = parametros; // Guardar parámetros adicionales
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

    // Formulario con scroll
    const formContainer = document.createElement('div');
    formContainer.id = 'modalFormContainer';
    formContainer.style.cssText = 'overflow-y: auto; overflow-x: hidden; flex: 1; min-height: 0; padding: 0;';
    
    const form = document.createElement('form');
    form.id = `form-${this.config.titulo.replace(/\s+/g, '-')}`;
    form.className = 'modal-form';

    for (const campo of this.config.campos) {
      const formGroup = this.crearCampo(campo);
      form.appendChild(formGroup);
    }

    formContainer.appendChild(form);
    content.appendChild(formContainer);

    // Si es modo edición, pre-cargar datos
    if (this.parametros.modo === 'editar' && this.parametros.plato) {
      setTimeout(() => {
        const platoSelect = form.querySelector('select[name="plato_id"]');
        if (platoSelect && this.parametros.plato.id) {
          platoSelect.value = this.parametros.plato.id;
          // Disparar el onChange con los parámetros
          if (typeof window.cargarEscandalloExistente === 'function') {
            window.cargarEscandalloExistente(this.parametros.plato.id, this.parametros);
          }
        }
      }, 200);
    }

    // Footer (botones sticky fuera del scroll)
    const footer = document.createElement('div');
    footer.className = 'modal-buttons';
    footer.innerHTML = `
      <button type="button" class="btn-cancel" onclick="cerrarModalDinamico(this)">Cancelar</button>
      <button type="submit" class="btn-primary" id="btn-submit-${this.config.titulo.replace(/\s+/g, '-')}">Guardar</button>
    `;

    content.appendChild(footer);
    modal.appendChild(content);

    // Event listeners
    const submitBtn = footer.querySelector('.btn-primary');
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.guardar(e);
    });
    
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
    
    // Para array_dinamico, no agregamos label aquí porque el componente lo maneja internamente
    if (campo.tipo === 'array_dinamico') {
      const input = this.crearArrayDinamico(campo);
      group.appendChild(input);
      return group;
    }
    
    // Label para campos normales
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
      case 'autocomplete':
        input = this.crearAutocomplete(campo);
        break;
      case 'array_dinamico':
        input = this.crearArrayDinamico(campo);
        break;
      case 'checkbox':
        input = document.createElement('input');
        input.type = 'checkbox';
        if (campo.default) input.checked = true;
        break;
      case 'multi-checkbox':
        input = this.crearMultiCheckbox(campo);
        group.appendChild(input);
        return group; // Retornar directamente porque ya tiene su estructura
      default:
        input = document.createElement('input');
        input.type = 'text';
    }

    input.name = campo.nombre;
    input.id = campo.nombre;
    input.required = campo.required;
    input.readOnly = campo.readonly;
    
    // El array_dinamico no necesita estos atributos porque maneja sus propios inputs internos
    if (campo.tipo === 'array_dinamico') {
      group.appendChild(input);
      return group;
    }
    
    if (campo.placeholder) input.placeholder = campo.placeholder;
    if (campo.min !== undefined) input.min = campo.min;
    if (campo.pattern) input.pattern = campo.pattern;

    // Auto-generar valor inicial si está marcado
    if (campo.autoGenerate && input.type === 'text') {
      input.value = generateLote();
    }

    // Event listeners para auto-relleno
    if (campo.onChange) {
      input.addEventListener('change', () => {
        if (typeof window[campo.onChange] === 'function') {
          // Pasar el valor y los parámetros adicionales del modal
          window[campo.onChange](input.value, this.parametros);
        } else {
          console.warn(`Función ${campo.onChange} no está definida`);
        }
      });
    }

    // Event listener para onBlur (detectar alérgenos, etc)
    if (campo.onBlur) {
      input.addEventListener('blur', () => {
        if (typeof window[campo.onBlur] === 'function') {
          window[campo.onBlur](input.value, this);
        } else {
          console.warn(`Función ${campo.onBlur} no está definida`);
        }
      });
    }

    // Event listener para onInput (búsqueda de duplicados, etc)
    if (campo.onInput) {
      input.addEventListener('input', () => {
        if (typeof window[campo.onInput] === 'function') {
          window[campo.onInput](input.value, this);
        } else {
          console.warn(`Función ${campo.onInput} no está definida`);
        }
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

  crearMultiCheckbox(campo) {
    const container = document.createElement('div');
    container.className = 'multi-checkbox-container';
    container.id = `alergenos-container`;
    container.style.cssText = 'background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;';

    // Título
    const titulo = document.createElement('h4');
    titulo.textContent = campo.etiqueta;
    titulo.style.cssText = 'margin: 0 0 10px 0; color: #333; font-size: 1em; display: flex; align-items: center; gap: 8px;';
    container.appendChild(titulo);

    // Help text
    if (campo.help) {
      const help = document.createElement('small');
      help.textContent = campo.help;
      help.style.cssText = 'display: block; margin-bottom: 15px; color: #666; font-size: 0.85em;';
      container.appendChild(help);
    }

    // Grid de checkboxes
    const grid = document.createElement('div');
    grid.className = 'multi-checkbox-grid';
    const columnas = campo.columnas || 3;
    grid.style.cssText = `display: grid; grid-template-columns: repeat(${columnas}, 1fr); gap: 12px;`;

    // Función para crear un checkbox
    const crearCheckbox = (opcion, icono = '') => {
      const label = document.createElement('label');
      label.style.cssText = 'display: flex; align-items: center; cursor: pointer; padding: 10px; border-radius: 6px; background: white; border: 2px solid #e0e0e0; transition: all 0.2s;';
      label.addEventListener('mouseenter', () => {
        label.style.borderColor = '#2c5f8d';
        label.style.background = '#f0f7ff';
      });
      label.addEventListener('mouseleave', () => {
        const checkbox = label.querySelector('input[type="checkbox"]');
        if (!checkbox.checked) {
          label.style.borderColor = '#e0e0e0';
          label.style.background = 'white';
        }
      });

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = `alergenos_${opcion.nombre}`;
      checkbox.id = `alergeno_${opcion.nombre}`;
      checkbox.value = opcion.nombre;
      checkbox.style.cssText = 'margin-right: 10px; width: 18px; height: 18px; cursor: pointer;';
      
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          label.style.borderColor = '#2c5f8d';
          label.style.background = '#e3f2fd';
        } else {
          label.style.borderColor = '#e0e0e0';
          label.style.background = 'white';
        }
      });

      const texto = document.createElement('span');
      texto.textContent = `${icono} ${opcion.etiqueta}`.trim();
      texto.style.cssText = 'font-size: 0.9em; user-select: none;';

      label.appendChild(checkbox);
      label.appendChild(texto);
      return label;
    };

    // Agregar alérgenos oficiales
    campo.opciones.forEach(opcion => {
      grid.appendChild(crearCheckbox(opcion));
    });

    container.appendChild(grid);

    // Cargar alérgenos personalizados si está habilitado
    if (campo.cargarPersonalizados) {
      fetch('/api/alergenos-personalizados')
        .then(r => r.json())
        .then(datos => {
          const personalizados = datos.data || datos;
          const activos = personalizados.filter(a => a.activo === 1);
          
          if (activos.length > 0) {
            // Separador
            const separador = document.createElement('div');
            separador.style.cssText = 'grid-column: 1 / -1; border-top: 2px dashed #ccc; margin: 10px 0; padding-top: 10px;';
            separador.innerHTML = '<small style="color: #666; font-weight: 600;">✨ Alérgenos Personalizados:</small>';
            grid.appendChild(separador);
            
            // Agregar alérgenos personalizados usando el nombre como ID
            activos.forEach(alergeno => {
              // Convertir nombre a formato de ID: "Chile Picante" → "chile_picante"
              const nombreId = alergeno.nombre.toLowerCase()
                .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e')
                .replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o')
                .replace(/[úùüû]/g, 'u').replace(/ñ/g, 'n')
                .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
              
              const opcion = {
                nombre: nombreId,
                etiqueta: alergeno.nombre
              };
              grid.appendChild(crearCheckbox(opcion, alergeno.icono || ''));
            });
          }
        })
        .catch(err => console.error('Error cargando alérgenos personalizados:', err));
    }

    return container;
    return container;
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

  crearAutocomplete(campo) {
    const container = document.createElement('div');
    container.className = 'autocomplete-container';
    container.style.cssText = 'position: relative;';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'autocomplete-input';
    input.placeholder = campo.placeholder || `Buscar ${campo.etiqueta}...`;
    input.style.cssText = `
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1em;
      font-family: inherit;
    `;

    const dropdown = document.createElement('ul');
    dropdown.className = 'autocomplete-dropdown';
    dropdown.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 6px 6px;
      list-style: none;
      margin: 0;
      padding: 0;
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
      display: none;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;

    const opciones = campo.options || [];

    // Función auxiliar para normalizar texto (sin tildes)
    const normalizarTexto = (texto) => {
      return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    };

    input.addEventListener('input', (e) => {
      const valorNormalizado = normalizarTexto(e.target.value.trim());
      
      dropdown.innerHTML = '';
      
      if (valorNormalizado.length === 0) {
        dropdown.style.display = 'none';
        return;
      }

      // Filtrar opciones que coincidan (sin tildes)
      const coincidencias = opciones.filter(opcion =>
        normalizarTexto(opcion).includes(valorNormalizado)
      );

      if (coincidencias.length === 0) {
        dropdown.style.display = 'none';
        return;
      }

      // Mostrar opciones coincidentes
      coincidencias.forEach(opcion => {
        const li = document.createElement('li');
        li.textContent = opcion;
        li.style.cssText = `
          padding: 10px 12px;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s;
        `;
        
        li.addEventListener('mouseenter', () => {
          li.style.backgroundColor = '#f5f5f5';
        });
        
        li.addEventListener('mouseleave', () => {
          li.style.backgroundColor = 'transparent';
        });
        
        li.addEventListener('click', () => {
          input.value = opcion;
          dropdown.style.display = 'none';
          input.dispatchEvent(new Event('change'));
          input.dispatchEvent(new Event('blur'));
        });
        
        dropdown.appendChild(li);
      });

      dropdown.style.display = 'block';
    });

    // Cerrar dropdown al perder el foco
    input.addEventListener('blur', () => {
      setTimeout(() => {
        dropdown.style.display = 'none';
      }, 200);
    });

    // Mostrar todas las opciones al hacer focus si está vacío
    input.addEventListener('focus', () => {
      if (input.value.length === 0) {
        dropdown.innerHTML = '';
        opciones.forEach(opcion => {
          const li = document.createElement('li');
          li.textContent = opcion;
          li.style.cssText = `
            padding: 10px 12px;
            cursor: pointer;
            border-bottom: 1px solid #f0f0f0;
            transition: background-color 0.2s;
          `;
          
          li.addEventListener('mouseenter', () => {
            li.style.backgroundColor = '#f5f5f5';
          });
          
          li.addEventListener('mouseleave', () => {
            li.style.backgroundColor = 'transparent';
          });
          
          li.addEventListener('click', () => {
            input.value = opcion;
            dropdown.style.display = 'none';
            input.dispatchEvent(new Event('change'));
          });
          
          dropdown.appendChild(li);
        });
        dropdown.style.display = 'block';
      }
    });

    container.appendChild(input);
    container.appendChild(dropdown);
    return container;
  }

  crearArrayDinamico(campo) {
    const container = document.createElement('div');
    container.className = 'dynamic-array-elegant';
    container.style.cssText = 'margin: 20px 0;';

    // Sección de ingredientes agregados (tabla resumen)
    const resumenSection = document.createElement('div');
    resumenSection.style.cssText = 'background: white; border: 2px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 20px;';
    
    const resumenHeader = document.createElement('div');
    resumenHeader.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 15px;';
    resumenHeader.innerHTML = `
      <span style="font-size: 1.1em;">🥘</span>
      <strong style="font-size: 1em; color: #333;">Ingredientes</strong>
      <span id="contador-ingredientes" style="background: #4caf50; color: white; padding: 2px 10px; border-radius: 12px; font-size: 0.85em; font-weight: 600;">0</span>
    `;
    resumenSection.appendChild(resumenHeader);

    // Tabla de ingredientes
    const tablaResumen = document.createElement('table');
    tablaResumen.id = 'tabla-resumen-ingredientes';
    tablaResumen.style.cssText = 'width: 100%; border-collapse: collapse;';
    tablaResumen.innerHTML = `
      <thead>
        <tr style="background: #f8f9fa; border-bottom: 2px solid #e0e0e0;">
          <th style="padding: 10px; text-align: left; font-size: 0.85em; color: #666;">Ingrediente</th>
          <th style="padding: 10px; text-align: center; font-size: 0.85em; color: #666;">Cantidad</th>
          <th style="padding: 10px; text-align: center; font-size: 0.85em; color: #666;">Unit.</th>
          <th style="padding: 10px; text-align: right; font-size: 0.85em; color: #666;">€/Unit</th>
          <th style="padding: 10px; text-align: right; font-size: 0.85em; color: #666;">Total €</th>
          <th style="padding: 10px; text-align: center; font-size: 0.85em; color: #666;"></th>
        </tr>
      </thead>
      <tbody id="tbody-resumen"></tbody>
      <tfoot>
        <tr style="background: #e8f5e9; border-top: 2px solid #4caf50;">
          <td colspan="4" style="padding: 12px; text-align: right; font-weight: 600; color: #2e7d32;">COSTE TOTAL INGREDIENTES:</td>
          <td id="coste-total" style="padding: 12px; text-align: right; font-weight: 700; font-size: 1.1em; color: #2e7d32;">€0.00</td>
          <td></td>
        </tr>
      </tfoot>
    `;
    resumenSection.appendChild(tablaResumen);
    container.appendChild(resumenSection);

    // Sección de edición/agregar
    const edicionSection = document.createElement('div');
    edicionSection.style.cssText = 'background: #f8f9fa; border: 2px solid #e0e0e0; border-radius: 8px; padding: 20px;';
    
    const edicionHeader = document.createElement('div');
    edicionHeader.style.cssText = 'margin-bottom: 15px;';
    edicionHeader.innerHTML = '<strong style="font-size: 0.95em; color: #666;">Editar/Agregar Ingredientes:</strong>';
    edicionSection.appendChild(edicionHeader);

    // Contenedor de filas de edición
    const filasContainer = document.createElement('div');
    filasContainer.id = 'filas-edicion-container';
    filasContainer.style.cssText = 'display: flex; flex-direction: column; gap: 15px;';
    edicionSection.appendChild(filasContainer);

    // Botón agregar
    const btnAgregar = document.createElement('button');
    btnAgregar.type = 'button';
    btnAgregar.id = 'btn-agregar-ingrediente-escandallo'; // ID único para buscarlo después
    btnAgregar.innerHTML = '➕ Agregar otro ingrediente';
    btnAgregar.style.cssText = 'margin-top: 15px; padding: 10px 20px; background: white; border: 2px dashed #9c27b0; color: #9c27b0; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9em; transition: all 0.2s;';
    btnAgregar.addEventListener('mouseenter', () => {
      btnAgregar.style.background = '#f3e5f5';
      btnAgregar.style.borderColor = '#7b1fa2';
    });
    btnAgregar.addEventListener('mouseleave', () => {
      btnAgregar.style.background = 'white';
      btnAgregar.style.borderColor = '#9c27b0';
    });
    edicionSection.appendChild(btnAgregar);
    container.appendChild(edicionSection);

    // Array para almacenar ingredientes
    let ingredientes = [];
    let nextIndex = 0;

    // Función para agregar fila de edición
    const agregarFilaEdicion = () => {
      const index = nextIndex++;
      const fila = document.createElement('div');
      fila.className = 'fila-edicion';
      fila.dataset.index = index;
      fila.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 12px; align-items: end; background: white; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0;';

      // Campo ingrediente (autocomplete)
      const colIngrediente = document.createElement('div');
      const labelIng = document.createElement('label');
      labelIng.textContent = 'Ingrediente/Elaborado/Pre-elaborado';
      labelIng.style.cssText = 'display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.85em; color: #555;';
      colIngrediente.appendChild(labelIng);

      // Input de búsqueda
      const inputBusqueda = document.createElement('input');
      inputBusqueda.type = 'text';
      inputBusqueda.placeholder = '🔍 Escribe para buscar...';
      inputBusqueda.style.cssText = 'width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 0.9em; margin-bottom: 8px;';
      colIngrediente.appendChild(inputBusqueda);

      const selectIng = document.createElement('select');
      selectIng.name = `${campo.nombre}[${index}][ingrediente_id]`;
      selectIng.required = true;
      selectIng.style.cssText = 'width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 0.95em; display: none;'; // Oculto inicialmente
      selectIng.innerHTML = '<option value="">-- Seleccionar --</option>';
      
      // Cargar TODOS los ingredientes (ingrediente, preelaborado, elaborado)
      fetch('/api/ingredientes?incluir_todos=true')
        .then(r => r.json())
        .then(datos => {
          const items = datos.data || datos;
          
          // Agrupar por tipo_entidad
          const ingredientes = items.filter(i => !i.tipo_entidad || i.tipo_entidad === 'ingrediente');
          const preelaborados = items.filter(i => i.tipo_entidad === 'preelaborado');
          const elaborados = items.filter(i => i.tipo_entidad === 'elaborado');
          
          // Crear optgroup para ingredientes
          if (ingredientes.length > 0) {
            const group1 = document.createElement('optgroup');
            group1.label = '🥬 Ingredientes';
            ingredientes.forEach(item => {
              const opt = document.createElement('option');
              opt.value = item.id;
              opt.textContent = item.nombre;
              opt.dataset.coste = item.coste_kilo || item.coste_unidad || 0;
              group1.appendChild(opt);
            });
            selectIng.appendChild(group1);
          }
          
          // Crear optgroup para preelaborados
          if (preelaborados.length > 0) {
            const group2 = document.createElement('optgroup');
            group2.label = '🔪 Pre-elaborados';
            preelaborados.forEach(item => {
              const opt = document.createElement('option');
              opt.value = item.id;
              opt.textContent = item.nombre;
              opt.dataset.coste = item.coste_kilo || item.coste_unidad || 0;
              group2.appendChild(opt);
            });
            selectIng.appendChild(group2);
          }
          
          // Crear optgroup para elaborados
          if (elaborados.length > 0) {
            const group3 = document.createElement('optgroup');
            group3.label = '🍳 Elaborados';
            elaborados.forEach(item => {
              const opt = document.createElement('option');
              opt.value = item.id;
              opt.textContent = item.nombre;
              opt.dataset.coste = item.coste_kilo || item.coste_unidad || 0;
              group3.appendChild(opt);
            });
            selectIng.appendChild(group3);
          }
          
          // Agregar funcionalidad de búsqueda
          let resultadosDiv = document.createElement('div');
          resultadosDiv.style.cssText = 'max-height: 300px; overflow-y: auto; border: 2px solid #e0e0e0; border-radius: 6px; background: white; display: none;';
          colIngrediente.insertBefore(resultadosDiv, selectIng);
          
          inputBusqueda.addEventListener('input', (e) => {
            const busqueda = e.target.value.toLowerCase().trim();
            
            if (busqueda.length < 2) {
              resultadosDiv.style.display = 'none';
              resultadosDiv.innerHTML = '';
              return;
            }
            
            // Buscar coincidencias en todas las opciones del select
            const opciones = Array.from(selectIng.querySelectorAll('option')).filter(opt => opt.value !== '');
            const coincidencias = opciones.filter(opt => 
              opt.textContent.toLowerCase().includes(busqueda)
            ).slice(0, 20); // Máximo 20 resultados
            
            if (coincidencias.length === 0) {
              resultadosDiv.innerHTML = '<div style="padding: 15px; text-align: center; color: #999;">No se encontraron resultados</div>';
              resultadosDiv.style.display = 'block';
              return;
            }
            
            // Mostrar resultados
            resultadosDiv.innerHTML = '';
            coincidencias.forEach(opt => {
              const item = document.createElement('div');
              item.style.cssText = 'padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #f0f0f0; font-size: 0.9em;';
              item.textContent = opt.textContent;
              item.dataset.value = opt.value;
              item.dataset.coste = opt.dataset.coste || '0';
              
              item.addEventListener('mouseenter', () => {
                item.style.background = '#f3e5f5';
              });
              item.addEventListener('mouseleave', () => {
                item.style.background = 'white';
              });
              item.addEventListener('click', () => {
                selectIng.value = item.dataset.value;
                inputBusqueda.value = item.textContent;
                resultadosDiv.style.display = 'none';
                resultadosDiv.innerHTML = '';
                selectIng.dispatchEvent(new Event('change', { bubbles: true }));
              });
              
              resultadosDiv.appendChild(item);
            });
            
            resultadosDiv.style.display = 'block';
          });
          
          // Cerrar resultados al hacer click fuera
          document.addEventListener('click', (e) => {
            if (!colIngrediente.contains(e.target)) {
              resultadosDiv.style.display = 'none';
            }
          });
          
          // Al seleccionar del select oculto
          selectIng.addEventListener('change', () => {
            if (selectIng.value && !inputBusqueda.value) {
              const selectedOption = selectIng.options[selectIng.selectedIndex];
              inputBusqueda.value = selectedOption.textContent;
            }
          });
        });
      
      colIngrediente.appendChild(selectIng);
      fila.appendChild(colIngrediente);

      // Campo cantidad
      const colCantidad = document.createElement('div');
      const labelCant = document.createElement('label');
      labelCant.textContent = 'Cantidad';
      labelCant.style.cssText = 'display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.85em; color: #555;';
      colCantidad.appendChild(labelCant);
      
      const inputCant = document.createElement('input');
      inputCant.type = 'number';
      inputCant.name = `${campo.nombre}[${index}][cantidad]`;
      inputCant.step = '0.001';
      inputCant.min = '0';
      inputCant.required = true;
      inputCant.style.cssText = 'width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 0.95em;';
      colCantidad.appendChild(inputCant);
      fila.appendChild(colCantidad);

      // Campo unidad
      const colUnidad = document.createElement('div');
      const labelUni = document.createElement('label');
      labelUni.textContent = 'Kg';
      labelUni.style.cssText = 'display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.85em; color: #555;';
      colUnidad.appendChild(labelUni);
      
      const selectUni = document.createElement('select');
      selectUni.name = `${campo.nombre}[${index}][unidad]`;
      selectUni.style.cssText = 'width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 0.95em;';
      selectUni.innerHTML = `
        <option value="Kg">Kg</option>
        <option value="g">g</option>
        <option value="L">L</option>
        <option value="ml">ml</option>
        <option value="Ud">Ud</option>
      `;
      colUnidad.appendChild(selectUni);
      fila.appendChild(colUnidad);

      // Costes (calculados)
      const colCostes = document.createElement('div');
      colCostes.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';
      
      const costeLabelDiv = document.createElement('div');
      costeLabelDiv.style.cssText = 'display: flex; justify-content: space-between; font-size: 0.8em; color: #666;';
      costeLabelDiv.innerHTML = '<span>€/Unit</span><span>Total</span>';
      
      const costeValoresDiv = document.createElement('div');
      costeValoresDiv.style.cssText = 'display: flex; justify-content: space-between; font-size: 0.9em; font-weight: 600;';
      costeValoresDiv.innerHTML = '<span class="coste-unitario" style="color: #2196f3;">€0.00</span><span class="coste-total-fila" style="color: #4caf50;">€0.00</span>';
      
      colCostes.appendChild(costeLabelDiv);
      colCostes.appendChild(costeValoresDiv);
      fila.appendChild(colCostes);

      // Botón eliminar
      const colEliminar = document.createElement('div');
      colEliminar.style.cssText = 'padding-top: 24px;';
      const btnEliminar = document.createElement('button');
      btnEliminar.type = 'button';
      btnEliminar.innerHTML = '✕';
      btnEliminar.style.cssText = 'padding: 10px 14px; background: #f44336; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1.1em; font-weight: 700; transition: background 0.2s;';
      btnEliminar.addEventListener('mouseenter', () => btnEliminar.style.background = '#d32f2f');
      btnEliminar.addEventListener('mouseleave', () => btnEliminar.style.background = '#f44336');
      btnEliminar.addEventListener('click', () => {
        fila.remove();
        actualizarResumen();
      });
      colEliminar.appendChild(btnEliminar);
      fila.appendChild(colEliminar);

      // Event listeners para actualizar costes
      [selectIng, inputCant, selectUni].forEach(el => {
        el.addEventListener('change', () => calcularCostesFila(fila));
        el.addEventListener('input', () => calcularCostesFila(fila));
      });

      filasContainer.appendChild(fila);
      actualizarResumen();
    };

    // Calcular costes de una fila
    const calcularCostesFila = (fila) => {
      const select = fila.querySelector('select[name*="ingrediente_id"]');
      const inputCant = fila.querySelector('input[name*="cantidad"]');
      const selectUni = fila.querySelector('select[name*="unidad"]');
      
      // Validar que exista una opción seleccionada
      if (!select || !inputCant || !selectUni || select.selectedIndex < 0) {
        return;
      }
      
      const selectedOption = select.options[select.selectedIndex];
      if (!selectedOption || !selectedOption.value) {
        return;
      }
      
      let costeKilo = parseFloat(selectedOption.dataset.coste) || 0;
      
      // Si no hay coste en dataset, intentar obtenerlo del API
      if (costeKilo === 0 && selectedOption.value) {
        fetch(`/api/ingredientes/${selectedOption.value}`)
          .then(r => r.json())
          .then(data => {
            const ing = data.data || data;
            costeKilo = parseFloat(ing.coste_kilo) || parseFloat(ing.coste_unidad) || 0;
            selectedOption.dataset.coste = costeKilo;
            // Recalcular con el coste obtenido
            finalizarCalculo(fila, costeKilo, inputCant, selectUni);
          })
          .catch(err => console.error('Error obteniendo coste:', err));
        return;
      }
      
      finalizarCalculo(fila, costeKilo, inputCant, selectUni);
    };
    
    const finalizarCalculo = (fila, costeKilo, inputCant, selectUni) => {
      const cantidad = parseFloat(inputCant.value) || 0;
      const unidad = selectUni.value;

      let cantidadKg = cantidad;
      if (unidad === 'g') cantidadKg = cantidad / 1000;
      else if (unidad === 'L') cantidadKg = cantidad;
      else if (unidad === 'ml') cantidadKg = cantidad / 1000;

      const costeTotal = costeKilo * cantidadKg;
      
      const costeUnitarioSpan = fila.querySelector('.coste-unitario');
      const costeTotalSpan = fila.querySelector('.coste-total-fila');
      
      if (costeUnitarioSpan) costeUnitarioSpan.textContent = `€${costeKilo.toFixed(2)}`;
      if (costeTotalSpan) costeTotalSpan.textContent = `€${costeTotal.toFixed(2)}`;
      
      actualizarResumen();
    };

    // Actualizar tabla resumen
    const actualizarResumen = () => {
      const filas = filasContainer.querySelectorAll('.fila-edicion');
      const tbody = document.getElementById('tbody-resumen');
      const contador = document.getElementById('contador-ingredientes');
      const costeTotal = document.getElementById('coste-total');
      
      // Verificar que los elementos existan en el DOM
      if (!tbody || !contador || !costeTotal) {
        return;
      }
      
      tbody.innerHTML = '';
      
      let total = 0;
      let count = 0;

      filas.forEach(fila => {
        const select = fila.querySelector('select[name*="ingrediente_id"]');
        const inputCant = fila.querySelector('input[name*="cantidad"]');
        const selectUni = fila.querySelector('select[name*="unidad"]');
        
        if (select.value && inputCant.value) {
          count++;
          const nombreIng = select.options[select.selectedIndex].text;
          const cantidad = inputCant.value;
          const unidad = selectUni.value;
          const costeUnitario = fila.querySelector('.coste-unitario').textContent;
          const costeTotal = parseFloat(fila.querySelector('.coste-total-fila').textContent.replace('€', ''));
          total += costeTotal;

          const tr = document.createElement('tr');
          tr.style.cssText = 'border-bottom: 1px solid #f0f0f0;';
          tr.innerHTML = `
            <td style="padding: 10px; font-size: 0.9em;">${nombreIng}</td>
            <td style="padding: 10px; text-align: center; font-size: 0.9em;">${cantidad}</td>
            <td style="padding: 10px; text-align: center; font-size: 0.9em;">${unidad}</td>
            <td style="padding: 10px; text-align: right; font-size: 0.9em; color: #2196f3;">${costeUnitario}</td>
            <td style="padding: 10px; text-align: right; font-size: 0.9em; font-weight: 600; color: #4caf50;">€${costeTotal.toFixed(2)}</td>
            <td style="padding: 10px; text-align: center;">⚠️</td>
          `;
          tbody.appendChild(tr);
        }
      });

      contador.textContent = count;
      costeTotal.textContent = `€${total.toFixed(2)}`;
    };

    // Event listener botón agregar
    btnAgregar.addEventListener('click', agregarFilaEdicion);

    // Agregar primera fila automáticamente SOLO si NO estamos en modo edición
    // En modo edición, las filas se cargarán desde cargarEscandalloExistente()
    const esEdicion = this.parametros && this.parametros.modo === 'editar';
    if (campo.min_items && campo.min_items > 0 && !esEdicion) {
      agregarFilaEdicion();
    }

    return container;
  }

  async guardar(event) {
    event.preventDefault();

    // Validar
    if (!this.validar()) return;

    // Recolectar datos
    const form = document.getElementById(`form-${this.config.titulo.replace(/\s+/g, '-')}`);
    const formData = new FormData(form);

    // Verificar si hay un handler personalizado (como para escandallo múltiple)
    if (this.config.onSubmit && typeof window[this.config.onSubmit] === 'function') {
      console.log('📤 Usando handler personalizado:', this.config.onSubmit);
      // Pasar también las opciones (modo, plato, etc.)
      const resultado = await window[this.config.onSubmit](formData, this.parametros);
      
      if (resultado) {
        const modalElement = document.getElementById(`modal-${this.config.titulo.replace(/\s+/g, '-')}`);
        cerrarModalDinamico(modalElement);
        this.recargarDatos();
      }
      return;
    }

    // Guardado estándar
    const data = Object.fromEntries(formData);

    // Guardar en BD
    const endpoint = `/api/${this.getTablaDestino()}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      mostrarNotificacion('✅ Guardado exitosamente', 'success');
      const modalElement = document.getElementById(`modal-${this.config.titulo.replace(/\s+/g, '-')}`);
      cerrarModalDinamico(modalElement);
      // Recargar tabla
      this.recargarDatos();
    } else {
      mostrarNotificacion('❌ Error al guardar', 'error');
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
      'escandallo_simple': 'escandallos',
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

async function abrirModalDinamico(nombreConfig, parametros = {}) {
  const modal = new ModalDinamico(nombreConfig, parametros);
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

// Funciones stub para evitar errores
function calcularTrazabilidad(value) {
  console.log('calcularTrazabilidad:', value);
  // Implementación futura
}

function autoFillEtiquetaData(value) {
  console.log('autoFillEtiquetaData:', value);
  // Implementación futura - auto-rellenar datos de etiqueta
}

// Exports
window.ModalDinamico = ModalDinamico;
window.abrirModalDinamico = abrirModalDinamico;
window.cerrarModalDinamico = cerrarModalDinamico;
window.MODAL_CONFIGS = MODAL_CONFIGS;

// Exportar funciones de auto-fill y cálculo
window.autoFillPlato = autoFillPlato;
window.autoFillPlatoInfo = autoFillPlatoInfo;
window.autoFillSanidadData = autoFillSanidadData;
window.autoFillInventarioInfo = autoFillInventarioInfo;
window.autoFillEtiquetaData = autoFillEtiquetaData;
window.calcularIngredientesNecesarios = calcularIngredientesNecesarios;
window.calcularCostePedido = calcularCostePedido;
window.calcularTrazabilidad = calcularTrazabilidad;
