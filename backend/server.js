const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();
app.use(cors({ origin: ['http://localhost:5500', 'http://127.0.0.1:5500'], credentials: true })); // cambiar al puerto real del frontend
app.use(express.json());

const MONGO_URI = 'mongodb://localhost:27017/totalservice';

mongoose.connect(MONGO_URI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error de conexión:', err));

app.use(session({
    secret: 'secreto',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 4,
        sameSite: 'lax',
        secure: false,
        httpOnly: true
    }
}));

app.use('/auth', require('./routes/auth'));
app.use('/productos', require('./routes/productos'));
app.use('/pedidos', require('./routes/pedidos'));

app.get('/', (req, res) => res.send('Backend de TotalService corriendo'));

app.listen(3000, () => console.log('Servidor en http://localhost:3000'));