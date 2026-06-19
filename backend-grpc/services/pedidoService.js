const grpc = require('@grpc/grpc-js');
const Pedido = require('../../backend/models/Pedido');
const { verificarMetadata, requerirRol, nuevoError } = require('../auth-jwt');

function aProto(doc) {
  const producto = doc.producto && doc.producto.titulo
    ? {
        id: doc.producto._id.toString(),
        titulo: doc.producto.titulo,
        precio: doc.producto.precio,
        img: doc.producto.img || '',
        descripcion: doc.producto.descripcion || '',
        stock: doc.producto.stock || 0,
      }
    : { id: doc.producto?.toString() || '' };

  return {
    id: doc._id.toString(),
    clienteId: doc.cliente?._id ? doc.cliente._id.toString() : doc.cliente?.toString() || '',
    clienteNombre: doc.cliente?.nombre || '',
    producto,
    cantidad: doc.cantidad,
    estado: doc.estado,
  };
}

async function CrearPedido(call, callback) {
  try {
    const payload = verificarMetadata(call);
    requerirRol(payload, 'cliente');

    const pedido = await new Pedido({
      cliente: payload.id,
      producto: call.request.producto,
      cantidad: call.request.cantidad || 1,
    }).save();

    callback(null, aProto(pedido));
  } catch (err) {
    callback(err.code ? err : nuevoError(grpc.status.INTERNAL, err.message));
  }
}

async function ObtenerMisPedidos(call, callback) {
  try {
    const payload = verificarMetadata(call);
    requerirRol(payload, 'cliente');

    const pedidos = await Pedido.find({ cliente: payload.id }).populate('producto');
    callback(null, { pedidos: pedidos.map(aProto) });
  } catch (err) {
    callback(err.code ? err : nuevoError(grpc.status.INTERNAL, err.message));
  }
}

async function CancelarPedido(call, callback) {
  try {
    const payload = verificarMetadata(call);
    requerirRol(payload, 'cliente');

    const pedido = await Pedido.findOne({ _id: call.request.id, cliente: payload.id });
    if (!pedido) return callback(nuevoError(grpc.status.NOT_FOUND, 'Pedido no encontrado'));

    pedido.estado = 'cancelado';
    await pedido.save();
    callback(null, aProto(pedido));
  } catch (err) {
    callback(err.code ? err : nuevoError(grpc.status.INTERNAL, err.message));
  }
}

async function ObtenerTodosPedidos(call, callback) {
  try {
    const payload = verificarMetadata(call);
    requerirRol(payload, 'empleado');

    const pedidos = await Pedido.find().populate('producto cliente');
    callback(null, { pedidos: pedidos.map(aProto) });
  } catch (err) {
    callback(err.code ? err : nuevoError(grpc.status.INTERNAL, err.message));
  }
}

module.exports = { CrearPedido, ObtenerMisPedidos, CancelarPedido, ObtenerTodosPedidos };
