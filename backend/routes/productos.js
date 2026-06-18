const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');
const { requireAuth, requireRol } = require('../middleware/auth');

router.get('/', async (req, res) => {
    res.json(await Producto.find());
});

router.get('/:id', async (req, res) => {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).json({ error: 'No encontrado' });
    res.json(producto);
});

router.post('/', requireAuth, requireRol('empleado'), async (req, res) => {
    const producto = new Producto(req.body);
    await producto.save();
    res.status(201).json(producto);
});

router.put('/:id', requireAuth, requireRol('empleado'), async (req, res) => {
    const producto = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(producto);
});

router.delete('/:id', requireAuth, requireRol('empleado'), async (req, res) => {
    await Producto.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Producto eliminado' });
});

module.exports = router;