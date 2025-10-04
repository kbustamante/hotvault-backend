// server.js
require('dotenv').config();

const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const os       = require('os');

// Modelos / Rutas
const Hotwheel       = require('./models/hotwheel');
const carritosRouter = require('./routes/carritos');

const app = express();

/* ===== Asegurar carpeta /uploads ===== */
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

/* ===== Static /uploads (servir imágenes) ===== */
app.use('/uploads', express.static(uploadsDir));

/* ===== Middlewares globales ===== */
app.use(cors());                                // CORS abierto (ajusta si quieres restringir orígenes)
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // necesario para multipart/form-data

/* ===== Multer (subida de imágenes) ===== */
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) { cb(null, uploadsDir); },
  filename:    function (_req, file, cb) {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${Date.now()}-${file.fieldname}${ext.toLowerCase()}`);
  }
});
const upload = multer({ storage });

/* ===== Healthcheck ===== */
app.get('/', (_req, res) => res.send('API Hotwheels + Carritos lista 🚀'));

/* =======================
 *   ENDPOINTS HOTWHEELS
 * ======================= */

// Crear hotwheel (con imagen)
app.post('/api/hotwheels', upload.single('imagen'), async (req, res) => {
  try {
    const doc = await Hotwheel.create({
      nombre:         req.body.nombre,
      modelo:         req.body.modelo,
      anio:           req.body.anio,           // usar 'anio' (sin ñ)
      fechaDeCompra:  req.body.fechaDeCompra,
      codigoDeBarras: req.body.codigoDeBarras,
      imagen:         req.file?.filename || null
    });
    return res.status(201).json(doc);
  } catch (err) {
    if (err.code === 11000)             return res.status(409).json({ error: 'codigoDeBarras ya existe' });
    if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });
    return res.status(500).json({ error: 'Error creando Hotwheel' });
  }
});

// Listar todos
app.get('/api/hotwheels', async (_req, res) => {
  const list = await Hotwheel.find().sort({ createdAt: -1 });
  res.json(list);
});

// Obtener uno
app.get('/api/hotwheels/:id', async (req, res) => {
  try {
    const doc = await Hotwheel.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'No encontrado' });
    res.json(doc);
  } catch {
    res.status(400).json({ error: 'ID inválido' });
  }
});

// Editar
app.put('/api/hotwheels/:id', async (req, res) => {
  try {
    const doc = await Hotwheel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: 'No encontrado' });
    res.json(doc);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });
    res.status(400).json({ error: 'Solicitud inválida' });
  }
});

// Eliminar
app.delete('/api/hotwheels/:id', async (req, res) => {
  try {
    const doc = await Hotwheel.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'No encontrado' });
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: 'ID inválido' });
  }
});

/* ===== RUTAS CARRITOS ===== */
app.use('/api/carritos', carritosRouter);

/* ===== 404 ===== */
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

/* ===== Conexión y arranque ===== */
const PORT        = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB');

    // Escuchar en todas las interfaces para acceso desde el móvil
    app.listen(PORT, '0.0.0.0', () => {
      // Mostrar también IP local útil en la LAN
      const ifaces = os.networkInterfaces();
      let lan = 'localhost';
      for (const name of Object.keys(ifaces)) {
        for (const net of ifaces[name] || []) {
          if (net.family === 'IPv4' && !net.internal) lan = net.address;
        }
      }
      console.log(`🚀 API en:
  • http://localhost:${PORT}
  • http://${lan}:${PORT}  (LAN/móvil)`);
    });
  })
  .catch((err) => {
    console.error('❌ Error al conectar a MongoDB:', err.message);
    process.exit(1);
  });