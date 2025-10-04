const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  productoId: { type: String, required: true, trim: true },
  nombre:     { type: String, required: true, trim: true },
  precio:     { type: Number, required: true, min: 0 },
  cantidad:   { type: Number, required: true, min: 1 }
}, { _id: false });

const CarritoSchema = new mongoose.Schema({
  usuarioId: { type: String, required: true, index: true, trim: true },
  estado:    { type: String, enum: ['abierto', 'cerrado'], default: 'abierto', index: true },
  items:     { type: [ItemSchema], default: [] },
  total:     { type: Number, default: 0, min: 0 }
}, { timestamps: true });

// Un solo carrito 'abierto' por usuario
CarritoSchema.index(
  { usuarioId: 1 },
  { unique: true, partialFilterExpression: { estado: 'abierto' } }
);

// Recalcular total en cada save
CarritoSchema.pre('save', function(next) {
  this.total = this.items.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
  next();
});

module.exports = mongoose.model('Carrito', CarritoSchema);
