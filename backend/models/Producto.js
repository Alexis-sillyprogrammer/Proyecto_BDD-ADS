const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    precio: { type: Number, required: true },
    img: String,
    descripcion: String,
    stock: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Producto', productoSchema);