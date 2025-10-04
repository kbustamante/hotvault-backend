const express = require('express');
const Carrito = require('../models/carrito');

const r = express.Router();

/* ===================== Carritos ===================== */

/** Crear carrito (vacío o con items iniciales)
 * Body: { usuarioId: string, items?: [{productoId, nombre, precio, cantidad}] }
 */
r.post('/', async (req, res) => {
  try {
    const doc = await Carrito.create(req.body);
    return res.status(201).json(doc);
  } catch (err) {
    if (err.code === 11000)                  return res.status(409).json({ error: 'Ya existe un carrito abierto para este usuario' });
    if (err.name === 'ValidationError')      return res.status(400).json({ error: err.message });
    return res.status(500).json({ error: 'Error creando carrito' });
  }
});

/** Listar carritos (opcional ?usuarioId=u123) */
r.get('/', async (req, res) => {
  const q = req.query.usuarioId ? { usuarioId: req.query.usuarioId } : {};
  const list = await Carrito.find(q).sort({ createdAt: -1 });
  res.json(list);
});

/** Obtener carrito abierto por usuario (lo crea si no existe) */
r.get('/abierto/:usuarioId', async (req, res) => {
  try {
    let c = await Carrito.findOne({ usuarioId: req.params.usuarioId, estado: 'abierto' });
    if (!c) c = await Carrito.create({ usuarioId: req.params.usuarioId, items: [] });
    res.json(c);
  } catch {
    res.status(400).json({ error: 'Solicitud inválida' });
  }
});

/** Obtener carrito por id */
r.get('/:id', async (req, res) => {
  try {
    const doc = await Carrito.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'No encontrado' });
    res.json(doc);
  } catch {
    res.status(400).json({ error: 'ID inválido' });
  }
});

/** Reemplazar carrito completo */
r.put('/:id', async (req, res) => {
  try {
    const c = await Carrito.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'No encontrado' });
    Object.assign(c, req.body);   // Hook pre('save') recalcula total
    await c.save();
    res.json(c);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });
    res.status(400).json({ error: 'Solicitud inválida' });
  }
});

/** Eliminar carrito */
r.delete('/:id', async (req, res) => {
  try {
    const d = await Carrito.findByIdAndDelete(req.params.id);
    if (!d) return res.status(404).json({ error: 'No encontrado' });
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: 'ID inválido' });
  }
});

/* ===================== Items del carrito ===================== */

/** Agregar item (si ya existe el productoId, suma cantidad) */
r.post('/:id/items', async (req, res) => {
  try {
    const { productoId, nombre, precio, cantidad } = req.body;
    const c = await Carrito.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'No encontrado' });
    if (c.estado === 'cerrado') return res.status(409).json({ error: 'Carrito cerrado' });

    const idx = c.items.findIndex(i => i.productoId === productoId);
    if (idx >= 0) {
      c.items[idx].cantidad += (cantidad ?? 1);
      if (precio != null) c.items[idx].precio = precio;   // opcional: actualizar precio
      if (nombre != null) c.items[idx].nombre = nombre;   // opcional: actualizar nombre
    } else {
      c.items.push({ productoId, nombre, precio, cantidad: cantidad ?? 1 });
    }

    await c.save();
    res.json(c);
  } catch {
    res.status(400).json({ error: 'Solicitud inválida' });
  }
});

/** Actualizar item por productoId (cantidad/precio/nombre) */
r.put('/:id/items/:productoId', async (req, res) => {
  try {
    const c = await Carrito.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'No encontrado' });
    const it = c.items.find(i => i.productoId === req.params.productoId);
    if (!it) return res.status(404).json({ error: 'Item no existe' });

    const { cantidad, precio, nombre } = req.body;
    if (cantidad != null) it.cantidad = cantidad;
    if (precio   != null) it.precio   = precio;
    if (nombre   != null) it.nombre   = nombre;

    await c.save();
    res.json(c);
  } catch {
    res.status(400).json({ error: 'Solicitud inválida' });
  }
});

/** Eliminar item por productoId */
r.delete('/:id/items/:productoId', async (req, res) => {
  try {
    const c = await Carrito.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'No encontrado' });
    c.items = c.items.filter(i => i.productoId !== req.params.productoId);
    await c.save();
    res.json(c);
  } catch {
    res.status(400).json({ error: 'Solicitud inválida' });
  }
});

/** Checkout (cierra el carrito) */
r.post('/:id/checkout', async (req, res) => {
  try {
    const c = await Carrito.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'No encontrado' });
    if (c.estado === 'cerrado') return res.status(409).json({ error: 'Carrito ya estaba cerrado' });
    c.estado = 'cerrado';
    await c.save();
    res.json(c);
  } catch {
    res.status(400).json({ error: 'Solicitud inválida' });
  }
});

module.exports = r;
