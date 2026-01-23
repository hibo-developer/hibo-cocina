const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Función para analizar archivos Excel
function analizarArchivos() {
  const archivos = ['fabricación.xlsb', 'oferta_c.xlsb'];
  const analisis = {};

  archivos.forEach(archivo => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`ANALIZANDO: ${archivo}`);
    console.log(`${'='.repeat(60)}`);

    try {
      const ruta = path.join(__dirname, archivo);
      const workbook = XLSX.readFile(ruta);

      analisis[archivo] = {
        hojas: {},
        datosGlobales: {}
      };

      console.log(`\nHojas disponibles: ${workbook.SheetNames.join(', ')}\n`);

      // Procesar cada hoja
      workbook.SheetNames.forEach((nombreHoja) => {
        console.log(`\n--- HOJA: ${nombreHoja} ---`);
        const hoja = workbook.Sheets[nombreHoja];

        // Obtener datos como JSON
        const datos = XLSX.utils.sheet_to_json(hoja, { 
          defval: '',
          blankrows: false 
        });

        // Obtener referencias de celdas para obtener la estructura completa
        const datosConFormulas = XLSX.utils.sheet_to_json(hoja, { 
          header: 1,
          defval: ''
        });

        analisis[archivo].hojas[nombreHoja] = {
          filas: datos.length,
          columnas: datosConFormulas.length > 0 ? datosConFormulas[0].length : 0,
          datos: datos,
          datosRaw: datosConFormulas
        };

        console.log(`Filas: ${datos.length}, Columnas: ${datosConFormulas[0]?.length || 0}`);
        
        // Mostrar primeras filas
        if (datos.length > 0) {
          console.log('\nPrimeros 3 registros:');
          console.log(JSON.stringify(datos.slice(0, 3), null, 2));
        }

        // Mostrar encabezados
        if (datos.length > 0) {
          console.log('\nEncabezados (columnas):');
          console.log(Object.keys(datos[0]));
        }
      });

    } catch (error) {
      console.error(`Error al procesar ${archivo}:`, error.message);
    }
  });

  // Guardar análisis completo
  fs.writeFileSync('analisis.json', JSON.stringify(analisis, null, 2));
  console.log('\n\n✓ Análisis completo guardado en analisis.json');

  return analisis;
}

analizarArchivos();
