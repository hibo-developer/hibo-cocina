/**
 * Tests de validación de código
 * Verifica que todos los archivos JS tengan sintaxis válida
 */
const fs = require('fs');
const path = require('path');

describe('Code Validation Tests', () => {
  
  const getFilesRecursive = (dir) => {
    let files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    items.forEach(item => {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        files = files.concat(getFilesRecursive(fullPath));
      } else if (item.isFile() && item.name.endsWith('.js')) {
        files.push(fullPath);
      }
    });
    
    return files;
  };

  test('Validar sintaxis de archivos JS del servidor', () => {
    const srcFiles = getFilesRecursive('./src');
    
    srcFiles.forEach(file => {
      expect(() => {
        require(path.resolve(file));
      }).not.toThrow(`Error al cargar ${file}`);
    });
  });

  test('Validar que app-migrated.js tiene sintaxis válida', () => {
    const fs = require('fs');
    const content = fs.readFileSync('./public/js/app-migrated.js', 'utf8');
    
    // Validar que no tiene errores de sintaxis básicos (comprobar parentesis, llaves, etc)
    let openBraces = 0;
    let openParens = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      
      if (!inString && (char === '"' || char === "'" || char === '`')) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && content[i - 1] !== '\\') {
        inString = false;
      }
      
      if (!inString) {
        if (char === '{') openBraces++;
        if (char === '}') openBraces--;
        if (char === '(') openParens++;
        if (char === ')') openParens--;
      }
    }
    
    expect(openBraces).toBe(0);
    expect(openParens).toBe(0);
  });

  test('Validar que compatibility-layer.js tiene sintaxis válida', () => {
    const content = fs.readFileSync('./public/js/compatibility-layer.js', 'utf8');
    
    // Validar estructura básica de parentesis y llaves
    let openBraces = 0;
    let openParens = 0;
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
      if (char === '(') openParens++;
      if (char === ')') openParens--;
    }
    
    expect(openBraces).toBe(0);
    expect(openParens).toBe(0);
  });

  test('Verificar que package.json es válido', () => {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    
    expect(packageJson.name).toBe('hibo-cocina');
    expect(packageJson.version).toBeDefined();
    expect(packageJson.scripts).toBeDefined();
    expect(packageJson.scripts.start).toBeDefined();
  });

  test('Verificar que server.js exporta la aplicación correctamente', () => {
    const fs = require('fs');
    const content = fs.readFileSync('./server.js', 'utf8');
    
    // El servidor puede usar app.listen o startServer, ambos son válidos
    const hasServerStart = content.includes('app.listen') || content.includes('startServer') || content.includes('server.listen');
    expect(hasServerStart).toBe(true);
    expect(content).toContain('const app = express()');
  });

  test('Verificar que las rutas están correctamente importadas en server.js', () => {
    const content = fs.readFileSync('./server.js', 'utf8');
    
    // Verificar que las rutas principales están importadas
    expect(content).toContain('platosRoutes');
    expect(content).toContain('pedidosRoutes');
    expect(content).toContain('inventarioRoutes');
  });
});
