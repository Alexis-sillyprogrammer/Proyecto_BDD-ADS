const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
const { ejecutarSeeder } = require('../backend/seeder');

const authService = require('./services/authService');
const productoService = require('./services/productoService');
const pedidoService = require('./services/pedidoService');

const PROTO_PATH = path.join(__dirname, '../proto/totalservice.proto');

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDef).totalservice;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/totalservice';
const PORT = process.env.PORT || 50051;

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Conectado a MongoDB:', MONGO_URI);
  await ejecutarSeeder();

  const server = new grpc.Server();

  server.addService(proto.AuthService.service, authService);
  server.addService(proto.ProductoService.service, productoService);
  server.addService(proto.PedidoService.service, pedidoService);

  server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), () => {
    console.log(`Servidor gRPC escuchando en el puerto ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Error al iniciar el servidor gRPC:', err);
  process.exit(1);
});
