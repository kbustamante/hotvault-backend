// models/hotwheel.js
const { Schema, model } = require('mongoose');

const HotwheelSchema = new Schema({
  modelo: { type: String, required: true, trim: true },
  anio: { type: Number, required: true, min: 1900, max: 2100 }, // <- renombrado
  nombre: { type: String, required: true, trim: true },
  fechaDeCompra: { type: Date, required: true },
  codigoDeBarras: { type: String, required: true, unique: true, index: true },
  imagen: { type: String, default: null }
}, { timestamps: true });

module.exports = model('Hotwheel', HotwheelSchema);

