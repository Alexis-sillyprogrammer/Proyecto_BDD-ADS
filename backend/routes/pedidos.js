const express = require('express');
const router = express.Router();
const Pedido = require('../models/Pedido');
const { requireAuth, requireRol } = require('../middleware/auth');

router.post('/', requireAuth, requireRol('cliente'), async (req, res) => {
    const pedido = new Pedido({
        cliente: req.session.usuarioId,
        producto: req.body.producto,
        cantidad: req.body.cantidad || 1
    });
    await pedido.save();
    res.status(201).json(pedido);
});

router.get('/mios', requireAuth, requireRol('cliente'), async (req, res) => {
    const pedidos = await Pedido.find({ cliente: req.session.usuarioId }).populate('producto');
    res.json(pedidos);
});

router.put('/:id/cancelar', requireAuth, requireRol('cliente'), async (req, res) => {
    const pedido = await Pedido.findOne({ _id: req.params.id, cliente: req.session.usuarioId });
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    pedido.estado = 'cancelado';
    await pedido.save();
    res.json(pedido);
});

router.get('/', requireAuth, requireRol('empleado'), async (req, res) => {
    const pedidos = await Pedido.find().populate('producto cliente');
    res.json(pedidos);
});

module.exports = router;