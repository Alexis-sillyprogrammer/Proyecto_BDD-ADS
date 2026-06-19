const grpc = require('@grpc/grpc-js');
const Producto = require('../../backend/models/Producto');
const { verificarMetadata, requerirRol, nuevoError } = require('../auth-jwt');

function aProto(doc) {
  return {
    id: doc._id.toString(),
    titulo: doc.titulo,
    precio: doc.precio,
    img: doc.img || '',
    descripcion: doc.descripcion || '',
    stock: doc.stock || 0,
  };
}

async function ObtenerProductos(call, callback) {
  try {
    const productos = await Producto.find();
    callback(null, { productos: productos.map(aProto) });
  } catch (err) {
    callback(nuevoError(grpc.status.INTERNAL, 'Error al obtener productos'));
  }
}

async function ObtenerProducto(call, callback) {
  try {
    const producto = await Producto.findById(call.request.id);
    if (!producto) return callback(nuevoError(grpc.status.NOT_FOUND, 'No encontrado'));
    callback(null, aProto(producto));
  } catch (err) {
    callback(nuevoError(grpc.status.INTERNAL, err.message));
  }
}

async function CrearProducto(call, callback) {
  try {
    const payload = verificarMetadata(call);
    requerirRol(payload, 'empleado');

    const { titulo, precio, img, descripcion, stock } = call.request;
    if (!titulo || !precio) {
      return callback(nuevoError(grpc.status.INVALID_ARGUMENT, 'El título y el precio son obligatorios.'));
    }

    const nuevo = await new Producto({ titulo, precio, img, descripcion, stock }).save();
    callback(null, aProto(nuevo));
  } catch (err) {
    callback(err.code ? err : nuevoError(grpc.status.INTERNAL, 'Error interno al guardar el producto.'));
  }
}

async function ActualizarProducto(call, callback) {
  try {
    const payload = verificarMetadata(call);
    requerirRol(payload, 'empleado');

    const { id, ...resto } = call.request;
    const actualizado = await Producto.findByIdAndUpdate(id, resto, { new: true });
    if (!actualizado) return callback(nuevoError(grpc.status.NOT_FOUND, 'No encontrado'));
    callback(null, aProto(actualizado));
  } catch (err) {
    callback(err.code ? err : nuevoError(grpc.status.INTERNAL, err.message));
  }
}

async function EliminarProducto(call, callback) {
  try {
    const payload = verificarMetadata(call);
    requerirRol(payload, 'empleado');

    await Producto.findByIdAndDelete(call.request.id);
    callback(null, { mensaje: 'Producto eliminado' });
  } catch (err) {
    callback(err.code ? err : nuevoError(grpc.status.INTERNAL, err.message));
  }
}

module.exports = {
  ObtenerProductos,
  ObtenerProducto,
  CrearProducto,
  ActualizarProducto,
  EliminarProducto,
};
