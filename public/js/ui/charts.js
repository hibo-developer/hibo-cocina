/**
 * Módulo de Gráficos con Chart.js
 * Visualización de datos de producción, inventario y ventas
 */

const ChartsModule = (() => {
  let charts = {};

  /**
   * Crear gráfico de línea para producción por día
   */
  const createProduccionTimeseriesChart = (elementId, datos) => {
    const ctx = document.getElementById(elementId);
    if (!ctx) return null;

    // Destruir gráfico anterior si existe
    if (charts[elementId]) {
      charts[elementId].destroy();
    }

    const últimos30Días = obtenerÚltimos30Días();
    const producciónPorDía = agruparPorFecha(datos, últimos30Días);

    charts[elementId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: últimos30Días.map(d => d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })),
        datasets: [
          {
            label: 'Órdenes Completadas',
            data: últimos30Días.map(d => producciónPorDía[d.toISOString().split('T')[0]] || 0),
            borderColor: '#27ae60',
            backgroundColor: 'rgba(39, 174, 96, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'Producción - Últimos 30 Días'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });

    return charts[elementId];
  };

  /**
   * Crear gráfico de barras para rendimiento por plato
   */
  const createRendimientoChart = (elementId, datos) => {
    const ctx = document.getElementById(elementId);
    if (!ctx) return null;

    if (charts[elementId]) {
      charts[elementId].destroy();
    }

    const top10 = datos.slice(0, 10);

    charts[elementId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: top10.map(d => d.plato_nombre || 'N/A'),
        datasets: [
          {
            label: 'Rendimiento Promedio (%)',
            data: top10.map(d => d.rendimiento_promedio || 0),
            backgroundColor: top10.map(d => {
              const val = d.rendimiento_promedio || 0;
              if (val >= 90) return '#27ae60'; // Verde
              if (val >= 80) return '#f39c12'; // Naranja
              return '#e74c3c'; // Rojo
            }),
            borderColor: '#34495e',
            borderWidth: 1
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'Top 10 - Rendimiento por Plato'
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });

    return charts[elementId];
  };

  /**
   * Crear gráfico de pastel para distribución de estados
   */
  const createEstadosChart = (elementId, datos) => {
    const ctx = document.getElementById(elementId);
    if (!ctx) return null;

    if (charts[elementId]) {
      charts[elementId].destroy();
    }

    const colores = {
      'PENDIENTE': '#95a5a6',
      'EN_PROCESO': '#3498db',
      'COMPLETADA': '#27ae60',
      'CANCELADA': '#e74c3c'
    };

    charts[elementId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(datos),
        datasets: [
          {
            data: Object.values(datos),
            backgroundColor: Object.keys(datos).map(estado => colores[estado] || '#95a5a6'),
            borderColor: '#fff',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Distribución de Estados'
          }
        }
      }
    });

    return charts[elementId];
  };

  /**
   * Crear gráfico de costes
   */
  const createCostesChart = (elementId, datos) => {
    const ctx = document.getElementById(elementId);
    if (!ctx) return null;

    if (charts[elementId]) {
      charts[elementId].destroy();
    }

    const top10 = datos.slice(0, 10);

    charts[elementId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: top10.map(d => d.plato_nombre || 'N/A'),
        datasets: [
          {
            label: 'Coste Total ($)',
            data: top10.map(d => parseFloat(d.coste_total || 0).toFixed(2)),
            backgroundColor: '#e74c3c',
            borderColor: '#c0392b',
            borderWidth: 1
          },
          {
            label: 'Coste Unitario ($)',
            data: top10.map(d => parseFloat(d.coste_unitario || 0).toFixed(2)),
            backgroundColor: '#3498db',
            borderColor: '#2980b9',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'Análisis de Costes'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    return charts[elementId];
  };

  /**
   * Crear gráfico de tendencia de inventario
   */
  const createInventarioChart = (elementId, datos) => {
    const ctx = document.getElementById(elementId);
    if (!ctx) return null;

    if (charts[elementId]) {
      charts[elementId].destroy();
    }

    const alertas = datos.filter(d => d.cantidad < d.cantidad_minima);

    charts[elementId] = new Chart(ctx, {
      type: 'bubble',
      data: {
        datasets: datos.map(d => ({
          label: d.nombre,
          data: [{
            x: d.cantidad,
            y: d.cantidad_minima,
            r: Math.min(d.cantidad / d.cantidad_minima * 10, 30)
          }],
          backgroundColor: d.cantidad < d.cantidad_minima ? 'rgba(231, 76, 60, 0.6)' : 'rgba(39, 174, 96, 0.6)',
          borderColor: d.cantidad < d.cantidad_minima ? '#c0392b' : '#27ae60'
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Estado de Inventario (Cantidad vs Mínimo)'
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Cantidad Actual'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Cantidad Mínima'
            }
          }
        }
      }
    });

    return charts[elementId];
  };

  /**
   * Crear gráfico de radar para comparación de platos
   */
  const createComparativePlatos = (elementId, platos) => {
    const ctx = document.getElementById(elementId);
    if (!ctx) return null;

    if (charts[elementId]) {
      charts[elementId].destroy();
    }

    const top6 = platos.slice(0, 6);

    charts[elementId] = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Precio', 'Rentabilidad', 'Demanda', 'Satisfacción', 'Rendimiento'],
        datasets: top6.map(p => ({
          label: p.nombre || 'Plato',
          data: [
            p.precio || 0,
            p.margen || 0,
            p.demanda || 0,
            p.satisfaccion || 0,
            p.rendimiento || 0
          ],
          borderColor: generarColor(),
          backgroundColor: generarColor(0.2),
          borderWidth: 2
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Comparativa de Platos'
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });

    return charts[elementId];
  };

  /**
   * Utilidades
   */

  const obtenerÚltimos30Días = () => {
    const días = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      días.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    }
    return días;
  };

  const agruparPorFecha = (datos, fechas) => {
    const agrupado = {};
    fechas.forEach(f => {
      agrupado[f.toISOString().split('T')[0]] = 0;
    });
    
    if (Array.isArray(datos)) {
      datos.forEach(d => {
        if (d.fecha_fin) {
          const fecha = new Date(d.fecha_fin).toISOString().split('T')[0];
          if (agrupado[fecha] !== undefined) {
            agrupado[fecha]++;
          }
        }
      });
    }
    
    return agrupado;
  };

  const generarColor = (alpha = 1) => {
    const colores = [
      `rgba(26, 188, 156, ${alpha})`,
      `rgba(52, 152, 219, ${alpha})`,
      `rgba(155, 89, 182, ${alpha})`,
      `rgba(231, 76, 60, ${alpha})`,
      `rgba(241, 196, 15, ${alpha})`,
      `rgba(127, 140, 141, ${alpha})`
    ];
    return colores[Math.floor(Math.random() * colores.length)];
  };

  /**
   * Destruir todos los gráficos
   */
  const destroyAll = () => {
    Object.values(charts).forEach(chart => {
      if (chart) chart.destroy();
    });
    charts = {};
  };

  // API pública
  return {
    createProduccionTimeseriesChart,
    createRendimientoChart,
    createEstadosChart,
    createCostesChart,
    createInventarioChart,
    createComparativePlatos,
    destroyAll
  };
})();

// Exportar globalmente
window.ChartsModule = ChartsModule;

console.log('✅ charts.js cargado');
