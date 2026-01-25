-- Crear tabla para alérgenos oficiales (14 de la UE)
CREATE TABLE IF NOT EXISTS alergenos_oficiales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  icono TEXT,
  palabras_clave TEXT,
  orden INTEGER DEFAULT 0,
  activo INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar los 14 alérgenos oficiales de la UE (solo si no existen)
INSERT OR IGNORE INTO alergenos_oficiales (codigo, nombre, descripcion, icono, palabras_clave, orden) VALUES
('gluten', 'Gluten', 'Cereales que contienen gluten (trigo, centeno, cebada, avena, espelta, kamut)', '🌾', 'gluten,trigo,wheat,centeno,cebada,barley,avena,oat,espelta,kamut,harina,flour,pan,bread', 1),
('crustaceos', 'Crustáceos', 'Crustáceos y productos a base de crustáceos', '🦐', 'crustaceos,crustacean,gamba,langostino,prawn,camaron,cangrejo,crab,langosta,lobster,bogavante', 2),
('moluscos', 'Moluscos', 'Moluscos y productos a base de moluscos', '🦪', 'molusco,mollusk,almeja,clam,mejillon,mussel,ostra,oyster,calamar,squid,pulpo,octopus,sepia', 3),
('pescado', 'Pescado', 'Pescado y productos a base de pescado', '🐟', 'pescado,fish,merluza,hake,salmon,atun,tuna,bacalao,cod,anchoa,anchovy,sardina', 4),
('cacahuetes', 'Cacahuetes', 'Cacahuetes y productos a base de cacahuetes', '🥜', 'cacahuete,peanut,cacahuate,mani', 5),
('frutos_secos', 'Frutos Secos', 'Frutos de cáscara: almendras, avellanas, nueces, anacardos, pacanas, nueces de Brasil, pistachos, macadamias', '🌰', 'frutos secos,almendra,almond,avellana,hazelnut,nuez,walnut,anacardo,cashew,pacana,pecan,pistacho,pistachio,macadamia', 6),
('soja', 'Soja', 'Soja y productos a base de soja', '🫘', 'soja,soy,soya,tofu,edamame,miso,salsa de soja,soy sauce', 7),
('lacteos', 'Lácteos', 'Leche y sus derivados (incluida la lactosa)', '🥛', 'lacteos,dairy,leche,milk,queso,cheese,yogur,yogurt,nata,cream,mantequilla,butter,lactosa,lactose', 8),
('ovoproductos', 'Huevo', 'Huevos y productos a base de huevo', '🥚', 'huevo,egg,ovoproducto,clara,yema,mayonesa,mayonnaise', 9),
('apio', 'Apio', 'Apio y productos derivados', '🥬', 'apio,celery', 10),
('mostaza', 'Mostaza', 'Mostaza y productos derivados', '🌭', 'mostaza,mustard', 11),
('sesamo', 'Sésamo', 'Granos de sésamo y productos a base de granos de sésamo', '🫘', 'sesamo,sesame,ajonjoli,tahini', 12),
('sulfitos', 'Sulfitos', 'Dióxido de azufre y sulfitos en concentraciones superiores a 10 mg/kg o 10 mg/litro', '🍷', 'sulfito,sulfite,dioxido de azufre,vino,wine', 13),
('altramuces', 'Altramuces', 'Altramuces y productos a base de altramuces', '🫘', 'altramuz,lupine,lupino', 14);
