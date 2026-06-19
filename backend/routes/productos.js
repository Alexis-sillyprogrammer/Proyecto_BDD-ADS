const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');
const { requireAuth, requireRol } = require('../middleware/auth');

router.get('/', async (req, res) => {
    try {
        const productos = await Producto.find();
        res.json(productos);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

router.get('/:id', async (req, res) => {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).json({ error: 'No encontrado' });
    res.json(producto);
});

router.post('/', requireAuth, requireRol('empleado'), async (req, res) => {
    try {
        const { titulo, precio, img, descripcion, stock } = req.body;
        
        if (!titulo || !precio) {
            return res.status(400).json({ error: 'El título y el precio son campos obligatorios.' });
        }

        const nuevoProducto = new Producto({
            titulo,
            precio,
            img,
            descripcion,
            stock
        });

        await nuevoProducto.save();
        res.status(201).json(nuevoProducto);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error interno al guardar el producto.' });
    }
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