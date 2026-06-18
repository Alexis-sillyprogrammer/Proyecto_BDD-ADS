const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

router.post('/registro', async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const usuario = new Usuario({ 
            nombre, 
            email, 
            password: hashedPassword, 
            rol 
            });
        await usuario.save();
        res.status(201).json({ mensaje: 'Usuario creado', id: usuario._id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario || !(await usuario.compararPassword(password))) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    req.session.usuarioId = usuario._id;
    req.session.rol = usuario.rol;
    res.json({ mensaje: 'Sesión iniciada', rol: usuario.rol, nombre: usuario.nombre });
});

router.post('/logout', (req, res) => {
    req.session.destroy(() => res.json({ mensaje: 'Sesión cerrada' }));
});

router.get('/me', (req, res) => {
    if (!req.session.usuarioId) return res.status(401).json({ error: 'No autenticado' });
    res.json({ id: req.session.usuarioId, rol: req.session.rol });
});

module.exports = router;