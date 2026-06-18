const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
    cantidad: { type: Number, default: 1 },
    estado: { type: String, enum: ['pendiente', 'cancelado', 'completado'], default: 'pendiente' }
}, { timestamps: true });

module.exports = mongoose.model('Pedido', pedidoSchema);