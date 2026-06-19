const jwt = require('jsonwebtoken');
const grpc = require('@grpc/grpc-js');

const JWT_SECRET = process.env.JWT_SECRET || 'cambia-este-valor-por-uno-realmente-seguro';
const JWT_EXPIRA_EN = '4h';

function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario._id.toString(), rol: usuario.rol, nombre: usuario.nombre },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRA_EN }
  );
}

function verificarMetadata(call) {
  const metadata = call.metadata.get('authorization');
  if (!metadata || metadata.length === 0) {
    throw nuevoError(grpc.status.UNAUTHENTICATED, 'Inicio de sesión requerido');
  }

  const valor = metadata[0];
  const token = valor.startsWith('Bearer ') ? valor.slice(7) : valor;

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw nuevoError(grpc.status.UNAUTHENTICATED, 'Token inválido o expirado');
  }
}

function requerirRol(payload, ...rolesPermitidos) {
  if (!rolesPermitidos.includes(payload.rol)) {
    throw nuevoError(grpc.status.PERMISSION_DENIED, 'No tienes permiso para esta acción');
  }
}

function nuevoError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

module.exports = { firmarToken, verificarMetadata, requerirRol, nuevoError };
