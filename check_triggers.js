const db = require('./src/db/database');

console.log('🔍 Buscando triggers en la tabla escandallos...\n');

db.all(`SELECT sql FROM sqlite_master WHERE type='trigger' AND tbl_name='escandallos'`, [], (err, rows) => {
  if (err) {
    console.error('❌ Error:', err);
  } else {
    if (rows.length > 0) {
      console.log(`⚠️ Se encontraron ${rows.length} triggers:`);
      console.log(JSON.stringify(rows, null, 2));
    } else {
      console.log('✅ No hay triggers en la tabla escandallos');
    }
  }
  db.close();
});
