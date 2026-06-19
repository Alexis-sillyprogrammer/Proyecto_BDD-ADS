const { AuthServiceClient, ProductoServiceClient, PedidoServiceClient } = require('./generated/totalservice_grpc_web_pb.js');
const {
  RegistroRequest, LoginRequest, MeRequest,
  Vacio, ProductoIdRequest, CrearProductoRequest,
  CrearPedidoRequest,
} = require('./generated/totalservice_pb.js');

const GRPC_WEB_URL = window.GRPC_WEB_URL || '/grpc';

const authClient = new AuthServiceClient(GRPC_WEB_URL);
const productoClient = new ProductoServiceClient(GRPC_WEB_URL);
const pedidoClient = new PedidoServiceClient(GRPC_WEB_URL);

let usuarioActual = null;

document.addEventListener('DOMContentLoaded', () => {
  verificarSesion();
  manejarModal();
  manejarModalProducto();
  cargarProductos();
  manejarFormularios();
  configurarHamburguesa();
  suavizarScroll();
  actualizarAño();
});

function obtenerToken() {
  return localStorage.getItem('jwt');
}

function guardarSesion(token, rol, nombre) {
  localStorage.setItem('jwt', token);
  usuarioActual = { rol, nombre };
}

function cerrarSesionLocal() {
  localStorage.removeItem('jwt');
  usuarioActual = null;
}

function metadataConToken() {
  const token = obtenerToken();
  return token ? { authorization: `Bearer ${token}` } : {};
}

function verificarSesion() {
  const token = obtenerToken();
  if (!token) {
    actualizarUIUsuario();
    return;
  }

  authClient.me(new MeRequest(), metadataConToken(), (err, respuesta) => {
    if (err) {
      cerrarSesionLocal();
      actualizarUIUsuario();
      return;
    }
    usuarioActual = { rol: respuesta.getRol(), nombre: respuesta.getNombre() };
    actualizarUIUsuario();
  });
}

function actualizarUIUsuario() {
  const btnLogin = document.getElementById('btnLogin');
  const userInfo = document.getElementById('userInfo');
  const userName = document.getElementById('userName');
  const btnAgregarProducto = document.getElementById('btnAgregarProducto');

  if (usuarioActual) {
    btnLogin.style.display = 'none';
    userInfo.style.display = 'flex';
    userName.textContent = `${usuarioActual.rol === 'empleado' ? '👨‍💼' : '👤'} Usuario`;

    if (usuarioActual.rol === 'empleado' && btnAgregarProducto) {
      btnAgregarProducto.style.display = 'inline-block';
    }
  } else {
    btnLogin.style.display = 'block';
    userInfo.style.display = 'none';
    if (btnAgregarProducto) btnAgregarProducto.style.display = 'none';
  }
}

function manejarModal() {
  const authModal = document.getElementById('authModal');
  const btnLogin = document.getElementById('btnLogin');
  const closeModal = document.getElementById('closeModal');
  const switchToRegister = document.getElementById('switchToRegister');
  const switchToLogin = document.getElementById('switchToLogin');
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');

  btnLogin.addEventListener('click', () => {
    authModal.style.setProperty('display', 'flex', 'important');
  });

  closeModal.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    authModal.style.setProperty('display', 'none', 'important');
  });

  authModal.addEventListener('click', (e) => {
    if (e.target.id === 'authModal') {
      authModal.style.setProperty('display', 'none', 'important');
    }
  });

  switchToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginTab.classList.remove('active');
    registerTab.classList.add('active');
  });

  switchToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
  });
}

function manejarFormularios() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const btnLogout = document.getElementById('btnLogout');

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const req = new LoginRequest();
    req.setEmail(document.getElementById('loginEmail').value);
    req.setPassword(document.getElementById('loginPassword').value);

    authClient.login(req, {}, (err, respuesta) => {
      if (err) {
        alert('Email o contraseña incorrectos');
        return;
      }
      guardarSesion(respuesta.getToken(), respuesta.getRol(), respuesta.getNombre());
      actualizarUIUsuario();
      document.getElementById('authModal').style.display = 'none';
      loginForm.reset();
      alert('¡Bienvenido ' + respuesta.getNombre() + '!');
      cargarProductos();
    });
  });

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const req = new RegistroRequest();
    req.setNombre(document.getElementById('registerNombre').value);
    req.setEmail(document.getElementById('registerEmail').value);
    req.setPassword(document.getElementById('registerPassword').value);
    req.setRol(document.getElementById('registerRol').value);

    authClient.registro(req, {}, (err) => {
      if (err) {
        alert('Error: ' + err.message);
        return;
      }
      alert('¡Cuenta creada! Ahora inicia sesión');
      document.getElementById('registerTab').classList.remove('active');
      document.getElementById('loginTab').classList.add('active');
      registerForm.reset();
    });
  });

  btnLogout.addEventListener('click', () => {
    cerrarSesionLocal();
    actualizarUIUsuario();
    cargarProductos();
    alert('Sesión cerrada');
  });
}

function cargarProductos() {
  const productGrid = document.getElementById('productGrid');

  productoClient.obtenerProductos(new Vacio(), {}, (err, respuesta) => {
    if (err) {
      console.error('Error cargando productos:', err);
      productGrid.innerHTML = '<p style="grid-column:1/-1;color:red;">Error al cargar productos</p>';
      return;
    }

    const productos = respuesta.getProductosList();
    productGrid.innerHTML = '';

    if (productos.length === 0) {
      productGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#999;">No hay productos disponibles</p>';
      return;
    }

    productos.forEach((producto) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <img src="${producto.getImg() || 'img/default.jpg'}" alt="${producto.getTitulo()}" />
        <div class="body">
          <h4>${producto.getTitulo()}</h4>
          <div class="price">$${producto.getPrecio()}</div>
          <p>${producto.getDescripcion() || 'Sin descripción'}</p>
          <div class="tags">
            <span class="tag">Stock: ${producto.getStock()}</span>
          </div>
          ${usuarioActual && usuarioActual.rol === 'cliente' ? `
            <button class="btn btn-primary btn-pedir" data-id="${producto.getId()}" data-titulo="${producto.getTitulo()}">Pedir</button>
          ` : ''}
        </div>
      `;
      productGrid.appendChild(card);
    });

    if (usuarioActual && usuarioActual.rol === 'cliente') {
      document.querySelectorAll('.btn-pedir').forEach((btn) => {
        btn.addEventListener('click', (e) => mostrarFormularioPedido(e.target.dataset.id, e.target.dataset.titulo));
      });
    }
  });
}

function mostrarFormularioPedido(productoId, productoTitulo) {
  if (!usuarioActual) {
    alert('Debes iniciar sesión para hacer un pedido');
    document.getElementById('btnLogin').click();
    return;
  }

  const cantidad = prompt(`¿Cuántas unidades de "${productoTitulo}" deseas pedir?`, '1');

  if (cantidad && parseInt(cantidad) > 0) {
    crearPedido(productoId, parseInt(cantidad));
  }
}

function crearPedido(productoId, cantidad) {
  const req = new CrearPedidoRequest();
  req.setProducto(productoId);
  req.setCantidad(cantidad);

  pedidoClient.crearPedido(req, metadataConToken(), (err, pedido) => {
    if (err) {
      alert('Error: ' + err.message);
      return;
    }
    alert('¡Pedido creado exitosamente! ID: ' + pedido.getId());
  });
}

function configurarHamburguesa() {
  const hamburger = document.getElementById('hamburger');
  const menu = document.getElementById('menu');

  hamburger.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => menu.classList.remove('open'));
  });
}

function sliderAutomatico() {
  const slides = Array.from(document.querySelectorAll('.slide'));
  let idx = 0;
  if (slides.length === 0) return;

  setInterval(() => {
    slides[idx].classList.remove('active');
    idx = (idx + 1) % slides.length;
    slides[idx].classList.add('active');
  }, 4000);
}

function suavizarScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetElement = document.querySelector(this.getAttribute('href'));
      if (targetElement) targetElement.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function actualizarAño() {
  document.getElementById('y').textContent = new Date().getFullYear();
}

function manejarModalProducto() {
  const productModal = document.getElementById('productModal');
  const btnAgregarProducto = document.getElementById('btnAgregarProducto');
  const closeProductModal = document.getElementById('closeProductModal');
  const productForm = document.getElementById('productForm');

  if (!btnAgregarProducto) return;

  btnAgregarProducto.addEventListener('click', () => {
    productModal.style.setProperty('display', 'flex', 'important');
  });

  closeProductModal.addEventListener('click', (e) => {
    e.preventDefault();
    productModal.style.setProperty('display', 'none', 'important');
  });

  productForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const req = new CrearProductoRequest();
    req.setTitulo(document.getElementById('prodTitulo').value);
    req.setPrecio(parseFloat(document.getElementById('prodPrecio').value));
    req.setStock(parseInt(document.getElementById('prodStock').value));
    req.setDescripcion(document.getElementById('prodDesc').value);
    req.setImg(document.getElementById('prodImg').value || 'img/default.jpg');

    productoClient.crearProducto(req, metadataConToken(), (err) => {
      if (err) {
        alert('Error: ' + err.message);
        return;
      }
      alert('¡Producto añadido con éxito!');
      productModal.style.setProperty('display', 'none', 'important');
      productForm.reset();
      cargarProductos();
    });
  });
}

sliderAutomatico();
