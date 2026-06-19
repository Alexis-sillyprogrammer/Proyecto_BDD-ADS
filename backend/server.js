const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const { ejecutarSeeder } = require('./seeder');
const { MongoStore } = require('connect-mongo');

const app = express();

app.set('trust proxy', 1);

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5500';
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/totalservice';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Conectado a MongoDB:', MONGO_URI);
    await ejecutarSeeder();
  })
  .catch(err => console.error('Error de conexión:', err));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secreto',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 4,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    httpOnly: true
  }
}));

app.use('/auth', require('./routes/auth'));
app.use('/productos', require('./routes/productos'));
app.use('/pedidos', require('./routes/pedidos'));

app.get('/', (req, res) => res.send('Backend de TotalService corriendo'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));