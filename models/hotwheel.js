const { Schema, model } = require('mongoose');

const ImagenSchema = new Schema(
  {
    public_id: { type: String },
    url:       { type: String },
    width:     { type: Number },
    height:    { type: Number },
    format:    { type: String },
  },
  { _id: false, id: false }
);

const HotwheelSchema = new Schema(
  {
    modelo:         { type: String, required: true, trim: true },
    anio:           { type: Number, required: true, min: 1900, max: 2100 },
    nombre:         { type: String, required: true, trim: true },
    fechaDeCompra:  { type: Date, required: true },
    codigoDeBarras: {
      type: String,
      required: true,
      trim: true,
      set: (v) => v ? String(v).replace(/\s+/g, '').toUpperCase() : v,
    },
    imagen: { type: ImagenSchema, default: undefined },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// ✅ Índice único definido correctamente sin duplicar
HotwheelSchema.index({ codigoDeBarras: 1 }, { unique: true });

module.exports = model('Hotwheel', HotwheelSchema);
