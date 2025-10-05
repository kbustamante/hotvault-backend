// server.js
require('dotenv').config();

const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const multer   = require('multer');
const os       = require('os');
const path     = require('path');

// Configuración Cloudinary
const storage = require('./storage'); // Usamos multer-storage-cloudinary
const upload  = multer({ storage });

const Hotwheel       = require('./models/hotwheel');
const carritosRouter = require('./routes/carritos');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (_req, res) => res.send('API HotVault activa 🚀'));

// Crear Hotwheel con imagen en Cloudinary
app.post('/api/hotwheels', upload.single('imagen'), async (req, res) => {
  try {
    const imagenCloudinary = req.file?.path ? {
      public_id: req.file.filename,
      url: req.file.path,
      width: req.file.width,
      height: req.file.height,
      format: req.file.format,
    } : undefined;

    const nuevo = await Hotwheel.create({
      modelo:         req.body.modelo,
      anio:           req.body.anio,
      nombre:         req.body.nombre,
      fechaDeCompra:  req.body.fechaDeCompra,
      codigoDeBarras: req.body.codigoDeBarras,
      imagen:         imagenCloudinary,
    });

    res.status(201).json(nuevo);
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ error: 'Código de barras duplicado' });

    if (err.name === 'ValidationError')
      return res.status(400).json({ error: err.message });

    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
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

// Carritos
app.use('/api/carritos', carritosRouter);

// 404 general
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Iniciar
const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB');
    app.listen(PORT, '0.0.0.0', () => {
      const ifaces = os.networkInterfaces();
      let lan = 'localhost';
      for (const name of Object.keys(ifaces)) {
        for (const net of ifaces[name] || []) {
          if (net.family === 'IPv4' && !net.internal) lan = net.address;
        }
      }
      console.log(`🚀 API disponible en:
  • http://localhost:${PORT}
  • http://${lan}:${PORT} (LAN/móvil)`);
    });
  })
  .catch(err => {
    console.error('❌ Error MongoDB:', err.message);
    process.exit(1);
  });
