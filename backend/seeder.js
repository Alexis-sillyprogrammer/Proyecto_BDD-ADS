const bcrypt = require('bcryptjs');
const Usuario = require('./models/Usuario');
const Producto = require('./models/Producto');
const Pedido = require('./models/Pedido');

async function seedProductos() {
  const productosIniciales = [
    {
      titulo: "Juego de Bujías Iridium",
      precio: 850,
      img: "img/producto_bujias.jpg",
      descripcion: "Encendido eficiente y mayor durabilidad.",
      stock: 25
    },
    {
      titulo: "Kit Balatas + Discos",
      precio: 2150,
      img: "img/producto_frenos.jpg",
      descripcion: "Frenado seguro con compuestos de alto rendimiento.",
      stock: 12
    },
    {
      titulo: "Batería AGM 70Ah",
      precio: 2999,
      img: "img/producto_bateria.jpg",
      descripcion: "Arranque potente y vida útil extendida.",
      stock: 8
    }
  ];

  const cuenta = await Producto.countDocuments();
  if (cuenta === 0) {
    console.log('🌱 Insertando productos iniciales...');
    return await Producto.insertMany(productosIniciales);
  }
  console.log('💡 Los productos ya existen.');
  return await Producto.find();
}

async function seedUsuarios() {
  const cuenta = await Usuario.countDocuments();
  if (cuenta === 0) {
    console.log('👤 Insertando usuarios iniciales (Contraseña por defecto: "password123")...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);

    const usuariosIniciales = [
      {
        nombre: "Alan Empleado",
        email: "empleado@autoservice.com",
        password: hashedPassword,
        rol: "empleado"
      },
      {
        nombre: "Juan Cliente",
        email: "cliente@gmail.com",
        password: hashedPassword,
        rol: "cliente"
      }
    ];

    return await Usuario.insertMany(usuariosIniciales);
  }
  console.log('💡 Los usuarios ya existen.');
  return await Usuario.find();
}

async function seedPedidos(usuarios, productos) {
  const cuenta = await Pedido.countDocuments();
  if (cuenta === 0) {
    console.log('📦 Insertando pedidos de prueba...');
    
    const cliente = usuarios.find(u => u.rol === 'cliente');
    const bujia = productos.find(p => p.titulo.includes('Bujías'));
    const bateria = productos.find(p => p.titulo.includes('Batería'));

    if (!cliente || !bujia) {
      console.log('⚠️ No se pudieron generar pedidos de prueba: falta cliente o productos.');
      return;
    }

    const pedidosIniciales = [
      {
        cliente: cliente._id,
        producto: bujia._id,
        cantidad: 2,
        estado: "pendiente"
      },
      {
        cliente: cliente._id,
        producto: bateria._id,
        cantidad: 1,
        estado: "completado"
      }
    ];

    await Pedido.insertMany(pedidosIniciales);
    console.log('✅ ¡Pedidos iniciales cargados!');
  } else {
    console.log('💡 Los pedidos ya existen.');
  }
}

async function ejecutarSeeder() {
  try {
    const productosDb = await seedProductos();
    const usuariosDb = await seedUsuarios();
    
    await seedPedidos(usuariosDb, productosDb);
    
    console.log('🚀 ¡Proceso de Seeding completado exitosamente!');
  } catch (err) {
    console.error('❌ Error general en el seeder:', err);
  }
}

module.exports = { ejecutarSeeder };