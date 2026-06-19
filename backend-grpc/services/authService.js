const bcrypt = require('bcryptjs');
const Usuario = require('../../backend/models/Usuario');
const { firmarToken, verificarMetadata, nuevoError } = require('../auth-jwt');
const grpc = require('@grpc/grpc-js');

async function Registro(call, callback) {
  try {
    const { nombre, email, password, rol } = call.request;
    const hashedPassword = await bcrypt.hash(password, 10);
    const usuario = new Usuario({ nombre, email, password: hashedPassword, rol });
    await usuario.save();
    callback(null, { mensaje: 'Usuario creado', id: usuario._id.toString() });
  } catch (err) {
    callback(nuevoError(grpc.status.INVALID_ARGUMENT, err.message));
  }
}

async function Login(call, callback) {
  try {
    const { email, password } = call.request;
    const usuario = await Usuario.findOne({ email });

    if (!usuario || !(await usuario.compararPassword(password))) {
      return callback(nuevoError(grpc.status.UNAUTHENTICATED, 'Credenciales inválidas'));
    }

    const token = firmarToken(usuario);
    callback(null, { token, rol: usuario.rol, nombre: usuario.nombre });
  } catch (err) {
    callback(nuevoError(grpc.status.INTERNAL, err.message));
  }
}

async function Me(call, callback) {
  try {
    const payload = verificarMetadata(call); // lanza si no hay token válido
    callback(null, { id: payload.id, rol: payload.rol, nombre: payload.nombre });
  } catch (err) {
    callback(err);
  }
}

module.exports = { Registro, Login, Me };
