// config/cloudinary.js
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  // CLOUDINARY_URL ya está en process.env y cloudinary lo usa automáticamente.
  // Si quisieras valores separados:
  // cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  // api_key: process.env.CLOUDINARY_API_KEY,
  // api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
